/**
 * SentinelOps Auth Service — Auth Middleware
 *
 * JWT verification middleware for protected routes.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches the decoded user to req.user.
 *
 * Also provides a role-based access control helper.
 */

const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Authenticate requests via JWT Bearer token.
 * Attaches decoded token payload to req.user on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token, 'access');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Access token has expired. Please refresh your token.',
      });
    }

    logger.warn('Authentication failed', { error: error.message, ip: req.ip });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or malformed token.',
    });
  }
}

/**
 * Role-based access control middleware factory.
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'user').
 * @returns {Function} Express middleware that checks req.user.role.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization denied', {
        userId: req.user.id,
        requiredRoles: roles,
        userRole: req.user.role,
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.',
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
