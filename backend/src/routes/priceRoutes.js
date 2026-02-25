'use strict';

const express = require('express');
const { getCurrentPrices, getPriceHistory, getPricePrediction } = require('../controllers/priceController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/current', verifyToken, getCurrentPrices);
router.get('/history/:commodity', verifyToken, getPriceHistory);
router.get('/prediction/:commodity', verifyToken, getPricePrediction);

module.exports = router;
