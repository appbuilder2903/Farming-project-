'use strict';

const express = require('express');
const { getFieldHealth, getVegetationIndex, getSoilMoisture, getWeatherRiskAlert } = require('../controllers/eosController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/field-health', verifyToken, getFieldHealth);
router.get('/vegetation', verifyToken, getVegetationIndex);
router.get('/soil-moisture', verifyToken, getSoilMoisture);
router.get('/weather-risk', verifyToken, getWeatherRiskAlert);

module.exports = router;
