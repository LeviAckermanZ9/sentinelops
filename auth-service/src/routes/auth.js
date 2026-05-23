/**
 * SentinelOps Auth Service — Auth Routes
 *
 * POST /api/auth/register  — Create new user account
 * POST /api/auth/login     — Authenticate and receive tokens
 * POST /api/auth/refresh   — Rotate refresh token, get new access token
 * POST /api/auth/logout    — Invalidate refresh token
 */

const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Email and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Password must be at least 8 characters.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password is hashed by pre-save hook)
    const user = new User({ email, password });
    await user.save();

    // Generate tokens
    const accessToken = signAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    logger.info('User registered', { email: user.email, userId: user._id });

    res.status(201).json({
      message: 'User registered successfully.',
      user: { id: user._id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({
      error: 'InternalError',
      message: 'Registration failed. Please try again.',
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Email and password are required.',
      });
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      logger.warn('Login attempt on locked account', { email });
      return res.status(423).json({
        error: 'AccountLocked',
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedAttempts();
      logger.warn('Failed login attempt', { email, attempts: user.failedLoginAttempts + 1 });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // Successful login — reset failed attempts
    await user.resetFailedAttempts();

    // Generate new tokens
    const accessToken = signAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Store new refresh token (rotation)
    user.refreshToken = refreshToken;
    await user.save();

    logger.info('User logged in', { email: user.email, userId: user._id });

    res.json({
      message: 'Login successful.',
      user: { id: user._id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(500).json({
      error: 'InternalError',
      message: 'Login failed. Please try again.',
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Refresh token is required.',
      });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken, 'refresh');
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token.',
      });
    }

    // Find user and check that the stored refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      logger.warn('Refresh token mismatch or user not found', { userId: decoded.id });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid refresh token. Please login again.',
      });
    }

    // Rotate: generate new tokens
    const newAccessToken = signAccessToken({ id: user._id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id });

    // Store the new refresh token (old one is now invalid)
    user.refreshToken = newRefreshToken;
    await user.save();

    logger.info('Token refreshed', { userId: user._id });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(500).json({
      error: 'InternalError',
      message: 'Token refresh failed. Please try again.',
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Clear the stored refresh token
    await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: 1 } });

    logger.info('User logged out', { userId: req.user.id });

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    res.status(500).json({
      error: 'InternalError',
      message: 'Logout failed. Please try again.',
    });
  }
});

module.exports = router;
