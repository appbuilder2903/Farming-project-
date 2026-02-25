'use strict';

const express = require('express');
const { getNews, getDailyBriefing, getNewsById } = require('../controllers/newsController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/briefing', verifyToken, getDailyBriefing);
router.get('/', verifyToken, getNews);
router.get('/:id', verifyToken, getNewsById);

module.exports = router;
