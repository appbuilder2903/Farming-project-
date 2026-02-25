'use strict';

const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    skipSuccessfulRequests: false,
  });

// 100 requests per 15 minutes – applied globally
const generalLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests. Please try again later.'
);

// 5 auth attempts per 15 minutes – applied on /auth routes
const authLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// 20 AI requests per minute – applied on /ai routes
const aiLimiter = createLimiter(
  60 * 1000,
  20,
  'AI request limit exceeded. Please wait before making more requests.'
);

module.exports = { generalLimiter, authLimiter, aiLimiter };
