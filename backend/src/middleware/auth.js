'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHelper');

/**
 * Verify JWT from cookie or Authorization: Bearer header.
 * Attaches `req.user` on success.
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      return sendError(res, 'Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_me');

    const user = await User.findById(decoded.id).select('-__v').lean();

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account has been deactivated', 403);
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    return sendError(res, 'Authentication failed', 401);
  }
};

/**
 * Middleware factory for role-based access control.
 * Usage: requireRole('admin', 'government_officer')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}`,
        403
      );
    }

    return next();
  };
};

module.exports = { verifyToken, requireRole };
