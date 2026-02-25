'use strict';

const express = require('express');
const { body } = require('express-validator');
const { analyzeCropDisease, predictPrice, chatbot, translateText } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply AI rate limiter to all AI routes
router.use(aiLimiter);

router.post(
  '/crop-disease',
  verifyToken,
  [
    body('imageUrl').optional().isURL().withMessage('imageUrl must be a valid URL'),
    body('imageBase64').optional().isString(),
    body('language').optional().isLength({ min: 2, max: 5 }),
    body('cropType').optional().isString().trim(),
  ],
  analyzeCropDisease
);

router.post(
  '/predict-price',
  verifyToken,
  [
    body('commodity').notEmpty().withMessage('commodity is required'),
    body('market').notEmpty().withMessage('market is required'),
    body('historicalData').optional().isArray(),
  ],
  predictPrice
);

router.post(
  '/chat',
  verifyToken,
  [
    body('message').notEmpty().trim().withMessage('message is required'),
    body('conversationHistory').optional().isArray(),
    body('language').optional().isLength({ min: 2, max: 5 }),
  ],
  chatbot
);

router.post(
  '/translate',
  verifyToken,
  [
    body('text').notEmpty().withMessage('text is required'),
    body('targetLanguage').notEmpty().withMessage('targetLanguage is required'),
    body('sourceLanguage').optional().isLength({ min: 2, max: 5 }),
  ],
  translateText
);

module.exports = router;
