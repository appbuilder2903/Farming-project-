'use strict';

const axios = require('axios');
const PriceHistory = require('../models/PriceHistory');
const Prediction = require('../models/Prediction');

const AGMARKET_API_URL =
  process.env.AGMARKET_API_URL ||
  'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const AGMARKET_API_KEY = process.env.AGMARKET_API_KEY;

// =================== STATISTICAL HELPERS ===================

const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;

const stdDev = (arr) => {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length);
};

/**
 * Simple moving average.
 */
const movingAverage = (prices, window = 7) => {
  if (prices.length < window) return mean(prices);
  const slice = prices.slice(-window);
  return mean(slice);
};

/**
 * Linear regression – returns slope and intercept.
 */
const linearRegression = (prices) => {
  const n = prices.length;
  const xs = prices.map((_, i) => i);
  const sumX = xs.reduce((s, v) => s + v, 0);
  const sumY = prices.reduce((s, v) => s + v, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * prices[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

/**
 * Level 1: Moving average + linear regression extrapolation.
 */
const level1Predict = (prices, days) => {
  const ma7 = movingAverage(prices, 7);
  const ma14 = movingAverage(prices, 14);
  const { slope } = linearRegression(prices.slice(-14));
  const trendPrice = ma7 + slope * days;
  const blended = trendPrice * 0.6 + ma14 * 0.4;
  return Math.max(0, blended);
};

/**
 * Level 2: ARIMA-like calculation (AR + differencing + MA approximation).
 */
const level2Predict = (prices, days) => {
  if (prices.length < 5) return level1Predict(prices, days);

  // First differencing
  const diff = prices.slice(1).map((p, i) => p - prices[i]);
  const diffMean = mean(diff);
  const diffStd = stdDev(diff);

  // Autoregressive (AR-1)
  const lastDiff = diff[diff.length - 1];
  const phi = Math.min(0.8, Math.max(-0.8, diffMean / (diffStd || 1)));

  // Project differences forward
  let projectedDiff = lastDiff;
  let projectedPrice = prices[prices.length - 1];

  for (let i = 0; i < days; i++) {
    projectedDiff = phi * projectedDiff + diffMean * (1 - Math.abs(phi));
    projectedPrice += projectedDiff;
  }

  return Math.max(0, projectedPrice);
};

/**
 * Level 3: Simple LSTM-like time series (exponential smoothing with trend).
 */
const level3Predict = (prices, days) => {
  if (prices.length < 10) return level2Predict(prices, days);

  const alpha = 0.3; // level smoothing
  const beta = 0.1;  // trend smoothing

  let level = prices[0];
  let trend = prices[1] - prices[0];

  for (let i = 1; i < prices.length; i++) {
    const prevLevel = level;
    level = alpha * prices[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const forecast = level + trend * days;
  return Math.max(0, forecast);
};

const computeConfidence = (prices, predictedPrice) => {
  if (prices.length < 5) return 45;
  const sd = stdDev(prices.slice(-14));
  const lastPrice = prices[prices.length - 1];
  const deviation = Math.abs(predictedPrice - lastPrice) / (lastPrice || 1);
  const volatilityFactor = sd / (lastPrice || 1);

  const base = 80;
  const deviationPenalty = deviation * 100;
  const volatilityPenalty = volatilityFactor * 80;

  return Math.round(Math.max(30, Math.min(95, base - deviationPenalty - volatilityPenalty)));
};

const getRiskLevel = (confidence) => {
  if (confidence >= 70) return 'low';
  if (confidence >= 50) return 'medium';
  return 'high';
};

const getTrend = (currentPrice, predictedPrice) => {
  const change = (predictedPrice - currentPrice) / (currentPrice || 1);
  if (change > 0.03) return 'bullish';
  if (change < -0.03) return 'bearish';
  return 'neutral';
};

// =================== PRICE FETCHING ===================

/**
 * Fetch live mandi prices from the government API or generate mock data.
 */
const fetchLiveMandiPrices = async (commodity = null, state = null, limit = 100) => {
  if (!AGMARKET_API_KEY) {
    return generateMockMandiData(commodity, state);
  }

  try {
    const params = {
      'api-key': AGMARKET_API_KEY,
      format: 'json',
      limit,
      offset: 0,
    };

    if (commodity) params['filters[commodity]'] = commodity;
    if (state) params['filters[state]'] = state;

    const response = await axios.get(AGMARKET_API_URL, { params, timeout: 15000 });
    const records = response.data?.records || [];

    return records.map((r) => ({
      commodity: r.commodity || r.Commodity,
      market: r.market || r.Market,
      state: r.state || r.State,
      district: r.district || r.District,
      minPrice: parseFloat(r.min_price || r.MinPrice || 0),
      maxPrice: parseFloat(r.max_price || r.MaxPrice || 0),
      modalPrice: parseFloat(r.modal_price || r.ModalPrice || 0),
      arrivalDate: r.arrival_date || r.ArrivalDate || new Date().toISOString().split('T')[0],
    }));
  } catch (err) {
    console.error('[PriceService] fetchLiveMandiPrices error:', err.message);
    return generateMockMandiData(commodity, state);
  }
};

const MOCK_COMMODITIES = [
  { name: 'Wheat', basePrice: 2200, states: ['Punjab', 'Haryana', 'UP', 'MP'] },
  { name: 'Rice', basePrice: 2800, states: ['Punjab', 'Haryana', 'WB', 'AP'] },
  { name: 'Maize', basePrice: 1800, states: ['Karnataka', 'MP', 'Bihar', 'AP'] },
  { name: 'Cotton', basePrice: 6500, states: ['Gujarat', 'Maharashtra', 'Telangana', 'Punjab'] },
  { name: 'Sugarcane', basePrice: 350, states: ['UP', 'Maharashtra', 'Karnataka', 'Gujarat'] },
  { name: 'Soybean', basePrice: 4800, states: ['MP', 'Maharashtra', 'Rajasthan'] },
  { name: 'Onion', basePrice: 1500, states: ['Maharashtra', 'Karnataka', 'MP', 'AP'] },
  { name: 'Potato', basePrice: 1200, states: ['UP', 'WB', 'Bihar', 'Punjab'] },
  { name: 'Tomato', basePrice: 2000, states: ['AP', 'Karnataka', 'Maharashtra', 'HP'] },
  { name: 'Mustard', basePrice: 5200, states: ['Rajasthan', 'UP', 'Haryana', 'MP'] },
];

const MOCK_MARKETS = ['Azadpur', 'Vashi', 'Lasalgaon', 'Unjha', 'Kurnool', 'Hubli', 'Amritsar', 'Indore'];

const generateMockMandiData = (commodity = null, state = null) => {
  const commodities = commodity
    ? MOCK_COMMODITIES.filter((c) => c.name.toLowerCase() === commodity.toLowerCase())
    : MOCK_COMMODITIES;

  const records = [];
  for (const comm of commodities) {
    const filteredStates = state
      ? comm.states.filter((s) => s.toLowerCase() === state.toLowerCase())
      : comm.states;

    for (const st of filteredStates.slice(0, 2)) {
      const noise = (Math.random() - 0.5) * comm.basePrice * 0.1;
      const modal = Math.round(comm.basePrice + noise);
      records.push({
        commodity: comm.name,
        market: MOCK_MARKETS[Math.floor(Math.random() * MOCK_MARKETS.length)],
        state: st,
        district: `${st} District`,
        minPrice: Math.round(modal * 0.9),
        maxPrice: Math.round(modal * 1.1),
        modalPrice: modal,
        arrivalDate: new Date().toISOString().split('T')[0],
        isMock: true,
      });
    }
  }

  return records;
};

/**
 * Get historical prices for a commodity from DB (falls back to generating mock history).
 */
const getHistoricalPrices = async (commodity, market = null, days = 30) => {
  const query = {
    commodity: new RegExp(`^${commodity}$`, 'i'),
    date: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
  };

  if (market) query.market = new RegExp(`^${market}$`, 'i');

  const history = await PriceHistory.find(query)
    .sort({ date: 1 })
    .limit(days * 3)
    .lean();

  if (history.length >= 5) {
    return history.map((h) => ({
      date: h.date.toISOString().split('T')[0],
      price: h.modalPrice || h.price,
    }));
  }

  // Generate mock historical series
  return generateMockHistory(commodity, days);
};

const generateMockHistory = (commodity, days) => {
  const comm = MOCK_COMMODITIES.find(
    (c) => c.name.toLowerCase() === commodity.toLowerCase()
  ) || { basePrice: 2000 };

  const history = [];
  let price = comm.basePrice;
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today - i * 24 * 60 * 60 * 1000);
    const change = (Math.random() - 0.48) * price * 0.03;
    price = Math.max(100, price + change);
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price),
    });
  }

  return history;
};

// =================== PREDICTION ENGINE ===================

/**
 * Get price prediction using a 3-level ensemble model.
 * @param {string} commodity
 * @param {string} market
 * @param {number[]} daysList e.g. [7, 15, 30]
 */
const getPrediction = async (commodity, market, daysList = [7, 15, 30]) => {
  // Check cache first
  const cached = await Prediction.findOne({
    commodity: new RegExp(`^${commodity}$`, 'i'),
    market: new RegExp(`^${market}$`, 'i'),
    expiresAt: { $gt: new Date() },
  }).lean();

  if (cached) return cached;

  const history = await getHistoricalPrices(commodity, market, 60);
  const prices = history.map((h) => h.price);

  if (prices.length === 0) {
    throw new Error(`No price data available for ${commodity} in ${market}`);
  }

  const currentPrice = prices[prices.length - 1];

  const predictions = daysList.map((days) => {
    const l1 = level1Predict(prices, days);
    const l2 = level2Predict(prices, days);
    const l3 = level3Predict(prices, days);

    // Ensemble: weighted average
    const ensemblePrice = Math.round(l1 * 0.3 + l2 * 0.4 + l3 * 0.3);
    const confidence = computeConfidence(prices, ensemblePrice);
    const sd = stdDev(prices.slice(-14));

    return {
      days,
      price: ensemblePrice,
      lowerBound: Math.max(0, Math.round(ensemblePrice - sd * 1.5)),
      upperBound: Math.round(ensemblePrice + sd * 1.5),
      confidence,
      riskLevel: getRiskLevel(confidence),
      trend: getTrend(currentPrice, ensemblePrice),
    };
  });

  // Determine best model used
  const modelUsed = prices.length >= 30 ? 'lstm' : prices.length >= 14 ? 'arima' : 'moving_average';

  const prediction = await Prediction.create({
    commodity,
    market,
    currentPrice,
    predictions,
    modelUsed,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  });

  return prediction;
};

module.exports = { fetchLiveMandiPrices, getHistoricalPrices, getPrediction, generateMockMandiData };
