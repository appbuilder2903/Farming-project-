'use strict';

const express = require('express');
const passport = require('passport');
const { handleOAuthCallback, logout, getMe, updateLanguage } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

// --- Google OAuth ---
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error` }),
  handleOAuthCallback('google')
);

// --- GitHub OAuth ---
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error` }),
  handleOAuthCallback('github')
);

// --- Microsoft OAuth ---
router.get(
  '/microsoft',
  passport.authenticate('microsoft', { session: false })
);

router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error` }),
  handleOAuthCallback('microsoft')
);

// --- Authenticated user routes ---
router.get('/me', verifyToken, getMe);
router.post('/logout', logout);
router.patch('/language', verifyToken, updateLanguage);

module.exports = router;
