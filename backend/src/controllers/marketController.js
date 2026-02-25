'use strict';

const Market = require('../models/Market');
const Dealer = require('../models/Dealer');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Find nearby markets using geospatial query.
 * Query params: lat, lng, radius (km, default 50)
 */
const getNearbyMarkets = async (req, res) => {
  const { lat, lng, radius = 50, commodity } = req.query;

  if (!lat || !lng) {
    return sendError(res, 'lat and lng query parameters are required', 400);
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return sendError(res, 'lat and lng must be valid numbers', 400);
  }

  try {
    const query = {
      isActive: true,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: parseFloat(radius) * 1000, // convert km to metres
        },
      },
    };

    if (commodity) {
      query['commodities.name'] = new RegExp(commodity, 'i');
    }

    const markets = await Market.find(query).limit(20).lean();

    // Annotate with distance (approximate)
    const marketsWithDistance = markets.map((m) => {
      const [mLng, mLat] = m.location.coordinates;
      const distanceKm = calculateDistance(latitude, longitude, mLat, mLng);
      return { ...m, distanceKm: parseFloat(distanceKm.toFixed(2)) };
    });

    return sendSuccess(res, { markets: marketsWithDistance, total: marketsWithDistance.length }, 'Nearby markets retrieved');
  } catch (err) {
    console.error('[MarketController] getNearbyMarkets error:', err);
    return sendError(res, 'Failed to fetch nearby markets', 500);
  }
};

/**
 * Haversine formula for distance in km.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Get a single market by ID.
 */
const getMarketById = async (req, res) => {
  try {
    const market = await Market.findById(req.params.id).lean();

    if (!market) {
      return sendError(res, 'Market not found', 404);
    }

    return sendSuccess(res, { market }, 'Market retrieved');
  } catch (err) {
    if (err.name === 'CastError') return sendError(res, 'Invalid market ID', 400);
    console.error('[MarketController] getMarketById error:', err);
    return sendError(res, 'Failed to fetch market', 500);
  }
};

/**
 * Get all markets with pagination, optional state/district filter.
 */
const getAllMarkets = async (req, res) => {
  const { page = 1, limit = 20, state, district, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { isActive: true };

  if (state) query.state = new RegExp(state, 'i');
  if (district) query.district = new RegExp(district, 'i');
  if (search) query.$text = { $search: search };

  try {
    const [markets, total] = await Promise.all([
      Market.find(query).sort({ rating: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Market.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        markets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Markets retrieved'
    );
  } catch (err) {
    console.error('[MarketController] getAllMarkets error:', err);
    return sendError(res, 'Failed to fetch markets', 500);
  }
};

/**
 * Get top dealers sorted by rank (highest price + best rating + volume - complaints).
 */
const getTopDealers = async (req, res) => {
  const { commodity, state, limit = 10 } = req.query;

  const query = { isActive: true };

  if (state) query.state = new RegExp(state, 'i');
  if (commodity) query['commodities.name'] = new RegExp(commodity, 'i');

  try {
    const dealers = await Dealer.find(query)
      .sort({ rank: -1, rating: -1 })
      .limit(parseInt(limit))
      .lean();

    return sendSuccess(res, { dealers, total: dealers.length }, 'Top dealers retrieved');
  } catch (err) {
    console.error('[MarketController] getTopDealers error:', err);
    return sendError(res, 'Failed to fetch dealers', 500);
  }
};

module.exports = { getNearbyMarkets, getMarketById, getAllMarkets, getTopDealers };
