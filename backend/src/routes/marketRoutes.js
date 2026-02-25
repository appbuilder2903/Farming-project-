'use strict';

const express = require('express');
const { getNearbyMarkets, getMarketById, getAllMarkets, getTopDealers } = require('../controllers/marketController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/nearby', verifyToken, getNearbyMarkets);
router.get('/dealers/top', verifyToken, getTopDealers);
router.get('/', verifyToken, getAllMarkets);
router.get('/:id', verifyToken, getMarketById);

module.exports = router;
