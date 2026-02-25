'use strict';

const priceService = require('../services/priceService');
const PriceHistory = require('../models/PriceHistory');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Fetch live mandi prices.
 * Query params: commodity, state, limit
 */
const getCurrentPrices = async (req, res) => {
  const { commodity, state, limit = 50 } = req.query;

  try {
    const prices = await priceService.fetchLiveMandiPrices(
      commodity || null,
      state || null,
      parseInt(limit)
    );

    return sendSuccess(
      res,
      { prices, count: prices.length, fetchedAt: new Date() },
      'Current prices retrieved'
    );
  } catch (err) {
    console.error('[PriceController] getCurrentPrices error:', err);
    return sendError(res, 'Failed to fetch current prices', 500);
  }
};

/**
 * Get historical price data for a commodity.
 * Route params: commodity
 * Query params: market, days (default 30), page, limit
 */
const getPriceHistory = async (req, res) => {
  const { commodity } = req.params;
  const { market, days = 30, page = 1, limit = 30 } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const query = {
      commodity: new RegExp(`^${commodity}$`, 'i'),
      date: { $gte: since },
    };

    if (market) query.market = new RegExp(market, 'i');

    const [history, total] = await Promise.all([
      PriceHistory.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PriceHistory.countDocuments(query),
    ]);

    // If DB has insufficient data, use generated mock history
    let responseHistory = history;
    if (history.length < 5) {
      const mockHistory = await priceService.getHistoricalPrices(commodity, market, parseInt(days));
      responseHistory = mockHistory.map((h) => ({
        commodity,
        market: market || 'National Average',
        price: h.price,
        modalPrice: h.price,
        date: new Date(h.date),
        isMock: true,
      }));
    }

    return sendSuccess(
      res,
      {
        commodity,
        history: responseHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total || responseHistory.length,
        },
      },
      'Price history retrieved'
    );
  } catch (err) {
    console.error('[PriceController] getPriceHistory error:', err);
    return sendError(res, 'Failed to fetch price history', 500);
  }
};

/**
 * Get 7, 15, 30-day price predictions for a commodity.
 * Route params: commodity
 * Query params: market (required)
 */
const getPricePrediction = async (req, res) => {
  const { commodity } = req.params;
  const { market = 'National Average' } = req.query;

  try {
    const prediction = await priceService.getPrediction(commodity, market, [7, 15, 30]);

    return sendSuccess(
      res,
      { prediction },
      'Price prediction retrieved'
    );
  } catch (err) {
    console.error('[PriceController] getPricePrediction error:', err);
    return sendError(res, err.message || 'Failed to generate price prediction', 500);
  }
};

module.exports = { getCurrentPrices, getPriceHistory, getPricePrediction };
