/**
 * SentinelOps Auth Service — Express Application Entrypoint
 *
 * Sets up Express with:
 *   - Helmet (security headers)
 *   - CORS (configurable origin)
 *   - Rate limiting
 *   - JSON parsing
 *   - Prometheus metrics endpoint (/metrics)
 *   - Auth and User routes
 *   - MongoDB connection with retry logic
 *   - Graceful shutdown
 */

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const client = require('prom-client');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sentinelops';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ---------------------------------------------------------------------------
// Express App
// ---------------------------------------------------------------------------
const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit body size for security

// Request ID middleware — generate unique ID for each request
app.use((req, _res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request completed', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      requestId: req.requestId,
    });
  });
  next();
});

// Rate limiting
app.use(generalLimiter);

// ---------------------------------------------------------------------------
// Prometheus Metrics
// ---------------------------------------------------------------------------
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom auth metrics
const authRequests = new client.Counter({
  name: 'auth_requests_total',
  help: 'Total authentication requests',
  labelNames: ['endpoint', 'status'],
  registers: [register],
});

const authLatency = new client.Histogram({
  name: 'auth_request_duration_seconds',
  help: 'Auth request duration in seconds',
  labelNames: ['endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

// Metrics middleware to track auth-specific metrics
app.use('/api/auth', (req, res, next) => {
  const end = authLatency.startTimer({ endpoint: req.path });
  res.on('finish', () => {
    end();
    authRequests.labels(req.path, String(res.statusCode)).inc();
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1; // 1 = connected

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'unhealthy',
    service: 'auth-service',
    version: '1.0.0',
    database: isHealthy ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested resource was not found.',
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'InternalError',
    message: 'An unexpected error occurred.',
  });
});

// ---------------------------------------------------------------------------
// MongoDB Connection
// ---------------------------------------------------------------------------
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGO_URI, {
        // Mongoose 8 defaults are good, no need for useNewUrlParser etc.
      });
      logger.info('✅ Connected to MongoDB', { uri: MONGO_URI.replace(/\/\/.*@/, '//***@') });
      return;
    } catch (error) {
      logger.warn(`MongoDB connection attempt ${attempt}/${retries} failed`, {
        error: error.message,
      });
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  logger.error('❌ Failed to connect to MongoDB after all retries');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
let server;

async function start() {
  await connectWithRetry();

  server = app.listen(PORT, () => {
    logger.info(`🚀 Auth Service running on port ${PORT}`);
  });
}

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------
function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close();
        logger.info('✅ MongoDB connection closed');
      } catch (err) {
        logger.error('Error closing MongoDB connection', { error: err.message });
      }
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Only start if this file is run directly (not imported for testing)
if (require.main === module) {
  start();
}

module.exports = app;
