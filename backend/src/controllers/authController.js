'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Generate a JWT for a user.
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

/**
 * OAuth callback handler – sets JWT cookie and redirects to frontend.
 * Used by all three OAuth providers.
 */
const handleOAuthCallback = (provider) => (req, res) => {
  if (!req.user) {
    return res.redirect(`${FRONTEND_URL}/auth/error?message=OAuth+authentication+failed`);
  }

  try {
    const token = generateToken(req.user._id);
    res.cookie('token', token, COOKIE_OPTIONS);

    const redirectUrl = `${FRONTEND_URL}/auth/success?provider=${provider}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('[AuthController] handleOAuthCallback error:', err);
    return res.redirect(`${FRONTEND_URL}/auth/error?message=Token+generation+failed`);
  }
};

/**
 * Logout – clears the JWT cookie.
 */
const logout = (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
  return sendSuccess(res, null, 'Logged out successfully');
};

/**
 * Get current authenticated user's profile.
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v').lean();

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, { user }, 'User profile retrieved');
  } catch (err) {
    console.error('[AuthController] getMe error:', err);
    return sendError(res, 'Failed to retrieve profile', 500);
  }
};

/**
 * Update user's preferred language.
 */
const updateLanguage = async (req, res) => {
  const { language } = req.body;

  const SUPPORTED_LANGUAGES = ['en', 'hi', 'pa', 'mr', 'gu', 'te', 'ta', 'kn', 'bn', 'or'];

  if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
    return sendError(
      res,
      `Invalid language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
      400
    );
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredLanguage: language },
      { new: true, runValidators: true }
    ).select('-__v').lean();

    return sendSuccess(res, { user }, 'Language preference updated');
  } catch (err) {
    console.error('[AuthController] updateLanguage error:', err);
    return sendError(res, 'Failed to update language', 500);
  }
};

module.exports = { handleOAuthCallback, logout, getMe, updateLanguage };
