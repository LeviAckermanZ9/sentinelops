/**
 * SentinelOps Auth Service — User Routes
 *
 * GET /api/users/me   — Get current user profile (authenticated)
 * GET /api/users      — List all users (admin only)
 */

const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// GET /api/users/me — Current user profile
// ---------------------------------------------------------------------------
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'User not found.',
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch user profile', { error: error.message, userId: req.user.id });
    res.status(500).json({
      error: 'InternalError',
      message: 'Failed to retrieve user profile.',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/users — List all users (admin only)
// ---------------------------------------------------------------------------
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    res.json({
      users: users.map((u) => ({
        id: u._id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to list users', { error: error.message });
    res.status(500).json({
      error: 'InternalError',
      message: 'Failed to retrieve users.',
    });
  }
});

module.exports = router;
