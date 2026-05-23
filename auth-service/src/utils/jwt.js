/**
 * SentinelOps Auth Service — JWT Utilities
 *
 * Helpers for signing and verifying access and refresh tokens.
 * Access tokens: 15 minute expiry.
 * Refresh tokens: 7 day expiry.
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-dev-refresh-secret-change-me';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Sign an access token.
 * @param {Object} payload - User data to encode (id, email, role).
 * @returns {string} Signed JWT access token.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Sign a refresh token.
 * @param {Object} payload - User data to encode (id).
 * @returns {string} Signed JWT refresh token.
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verify a token (access or refresh).
 * @param {string} token - The JWT string to verify.
 * @param {'access'|'refresh'} type - Token type to select the correct secret.
 * @returns {Object} Decoded token payload.
 * @throws {JsonWebTokenError|TokenExpiredError} If verification fails.
 */
function verifyToken(token, type = 'access') {
  const secret = type === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET;
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.warn('Token verification failed', { type, error: error.message });
    throw error;
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
