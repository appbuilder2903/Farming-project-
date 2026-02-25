'use strict';

const eosService = require('../services/eosService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const extractCoords = (req) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  return { lat, lng };
};

const validateCoords = (lat, lng) => {
  if (isNaN(lat) || isNaN(lng)) return 'lat and lng query parameters are required';
  if (lat < -90 || lat > 90) return 'lat must be between -90 and 90';
  if (lng < -180 || lng > 180) return 'lng must be between -180 and 180';
  return null;
};

/**
 * Get NDVI and overall field health for given coordinates.
 * Query params: lat, lng, fieldId (optional)
 */
const getFieldHealth = async (req, res) => {
  const { lat, lng } = extractCoords(req);
  const validationError = validateCoords(lat, lng);
  if (validationError) return sendError(res, validationError, 400);

  const { fieldId } = req.query;

  try {
    const data = await eosService.getFieldHealth(lat, lng, fieldId || null);
    return sendSuccess(res, data, 'Field health data retrieved');
  } catch (err) {
    console.error('[EOSController] getFieldHealth error:', err);
    return sendError(res, 'Failed to retrieve field health data', 500);
  }
};

/**
 * Get vegetation indices (NDVI, EVI, SAVI) time series.
 * Query params: lat, lng
 */
const getVegetationIndex = async (req, res) => {
  const { lat, lng } = extractCoords(req);
  const validationError = validateCoords(lat, lng);
  if (validationError) return sendError(res, validationError, 400);

  try {
    const data = await eosService.getVegetationIndex(lat, lng);
    return sendSuccess(res, data, 'Vegetation index data retrieved');
  } catch (err) {
    console.error('[EOSController] getVegetationIndex error:', err);
    return sendError(res, 'Failed to retrieve vegetation index data', 500);
  }
};

/**
 * Get soil moisture data.
 * Query params: lat, lng
 */
const getSoilMoisture = async (req, res) => {
  const { lat, lng } = extractCoords(req);
  const validationError = validateCoords(lat, lng);
  if (validationError) return sendError(res, validationError, 400);

  try {
    const data = await eosService.getSoilMoisture(lat, lng);
    return sendSuccess(res, data, 'Soil moisture data retrieved');
  } catch (err) {
    console.error('[EOSController] getSoilMoisture error:', err);
    return sendError(res, 'Failed to retrieve soil moisture data', 500);
  }
};

/**
 * Get weather risk alerts for the next 7 days.
 * Query params: lat, lng
 */
const getWeatherRiskAlert = async (req, res) => {
  const { lat, lng } = extractCoords(req);
  const validationError = validateCoords(lat, lng);
  if (validationError) return sendError(res, validationError, 400);

  try {
    const data = await eosService.getWeatherRiskAlert(lat, lng);
    return sendSuccess(res, data, 'Weather risk data retrieved');
  } catch (err) {
    console.error('[EOSController] getWeatherRiskAlert error:', err);
    return sendError(res, 'Failed to retrieve weather risk data', 500);
  }
};

module.exports = { getFieldHealth, getVegetationIndex, getSoilMoisture, getWeatherRiskAlert };
