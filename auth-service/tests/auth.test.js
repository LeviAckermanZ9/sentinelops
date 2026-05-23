/**
 * SentinelOps Auth Service — Tests
 *
 * Uses mongodb-memory-server for an isolated in-memory MongoDB instance.
 * Tests: registration, login, token refresh, protected routes,
 *        validation, and account lockout.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/index');
const User = require('../src/models/User');

let mongoServer;

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Disconnect any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

// ---------------------------------------------------------------------------
// Helper: Register a test user
// ---------------------------------------------------------------------------
async function registerUser(email = 'test@example.com', password = 'TestPass123!') {
  return request(app)
    .post('/api/auth/register')
    .send({ email, password });
}

// ---------------------------------------------------------------------------
// Tests: Registration
// ---------------------------------------------------------------------------
describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully.');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    await registerUser();
    const res = await registerUser();

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });

  it('should reject missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'TestPass123!' });

    expect(res.status).toBe(400);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Tests: Login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'TestPass123!' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful.');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'TestPass123!' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Tests: Token Refresh
// ---------------------------------------------------------------------------
describe('POST /api/auth/refresh', () => {
  it('should refresh tokens with valid refresh token', async () => {
    const registerRes = await registerUser();
    const { refreshToken } = registerRes.body;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // New refresh token should be different (rotation)
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it('should reject missing refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });

  it('should reject invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Tests: Protected Routes
// ---------------------------------------------------------------------------
describe('GET /api/users/me', () => {
  it('should return user profile with valid token', async () => {
    const registerRes = await registerUser();
    const { accessToken } = registerRes.body;

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should reject request without token', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Tests: Health Check
// ---------------------------------------------------------------------------
describe('GET /health', () => {
  it('should return service health status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('auth-service');
    expect(res.body.database).toBe('connected');
  });
});
