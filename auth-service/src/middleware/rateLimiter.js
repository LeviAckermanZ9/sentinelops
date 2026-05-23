/**
 * SentinelOps Auth Service — Rate Limiter Middleware
 *
 * Applies different rate limits to different endpoint groups:
 *   - General API: 100 requests per 15 minutes
 *   - Auth endpoints (login/register): 5 requests per 15 minutes
 */

const rateLimit = require('express-rate-limit');

/**
 * General rate limiter — 100 req / 15 min.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Auth-specific rate limiter — 5 req / 15 min.
 * Applied to /login and /register to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

module.exports = { generalLimiter, authLimiter };
