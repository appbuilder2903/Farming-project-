'use strict';

const axios = require('axios');
const ApiConfig = require('../models/ApiConfig');

const EOS_API_URL = process.env.EOS_API_URL || 'https://gate.eos.com/api/gdw';

// Resolve EOS key: DB cache first, then env
const getEosKey = async () => {
  const dbKey = await ApiConfig.getKey('eos').catch(() => null);
  return dbKey || process.env.EOS_API_KEY || null;
};

const makeEosClient = (apiKey) => axios.create({
  baseURL: EOS_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
  },
});

/**
 * Fetch NDVI and field health data for given coordinates.
 */
const getFieldHealth = async (lat, lng, fieldId = null) => {
  const EOS_API_KEY = await getEosKey();
  if (!EOS_API_KEY) {
    return generateMockFieldHealth(lat, lng);
  }
  const eosClient = makeEosClient(EOS_API_KEY);

  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);

    const payload = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      properties: {
        date_start: thirtyDaysAgo.toISOString().split('T')[0],
        date_end: today.toISOString().split('T')[0],
        sensors: [{ name: 'Sentinel2' }],
        indices: ['NDVI', 'EVI', 'NDWI'],
        ...(fieldId && { field_id: fieldId }),
      },
    };

    const response = await eosClient.post('/stats', payload);
    const data = response.data;

    return parseFieldHealthResponse(data, lat, lng);
  } catch (err) {
    console.error('[EOSService] getFieldHealth error:', err.message);
    return generateMockFieldHealth(lat, lng);
  }
};

const parseFieldHealthResponse = (data, lat, lng) => {
  const features = data.features || data.results || [];
  if (!features.length) return generateMockFieldHealth(lat, lng);

  const latest = features[features.length - 1];
  const ndvi = latest.ndvi || latest.properties?.NDVI || 0;

  let healthStatus = 'poor';
  let healthScore = Math.round(ndvi * 100);
  if (ndvi >= 0.6) healthStatus = 'excellent';
  else if (ndvi >= 0.4) healthStatus = 'good';
  else if (ndvi >= 0.2) healthStatus = 'fair';

  return {
    lat,
    lng,
    ndvi: parseFloat(ndvi.toFixed(4)),
    healthScore,
    healthStatus,
    evi: parseFloat((latest.evi || latest.properties?.EVI || ndvi * 0.9).toFixed(4)),
    ndwi: parseFloat((latest.ndwi || latest.properties?.NDWI || 0).toFixed(4)),
    imageDate: latest.date || new Date().toISOString().split('T')[0],
    dataSource: 'Sentinel-2',
  };
};

const generateMockFieldHealth = (lat, lng) => {
  const seed = Math.abs(Math.sin(lat * lng)) * 1000;
  const ndvi = 0.25 + ((seed % 60) / 100);
  const roundNdvi = parseFloat(ndvi.toFixed(4));
  const healthScore = Math.round(roundNdvi * 100);

  let healthStatus = 'poor';
  if (roundNdvi >= 0.6) healthStatus = 'excellent';
  else if (roundNdvi >= 0.4) healthStatus = 'good';
  else if (roundNdvi >= 0.2) healthStatus = 'fair';

  return {
    lat,
    lng,
    ndvi: roundNdvi,
    healthScore,
    healthStatus,
    evi: parseFloat((roundNdvi * 0.88).toFixed(4)),
    ndwi: parseFloat((roundNdvi * 0.3 - 0.1).toFixed(4)),
    imageDate: new Date().toISOString().split('T')[0],
    dataSource: 'mock',
    note: 'Configure EOS_API_KEY for live satellite data.',
  };
};

/**
 * Get vegetation indices (NDVI, EVI, SAVI) time series.
 */
const getVegetationIndex = async (lat, lng) => {
  if (!EOS_API_KEY) {
    return generateMockVegetationIndex(lat, lng);
  }

  try {
    const today = new Date();
    const ninetyDaysAgo = new Date(today - 90 * 24 * 60 * 60 * 1000);

    const payload = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      properties: {
        date_start: ninetyDaysAgo.toISOString().split('T')[0],
        date_end: today.toISOString().split('T')[0],
        sensors: [{ name: 'Sentinel2' }],
        indices: ['NDVI', 'EVI', 'SAVI'],
      },
    };

    const response = await eosClient.post('/stats', payload);
    const timeSeries = (response.data.features || []).map((f) => ({
      date: f.date,
      ndvi: parseFloat((f.ndvi || 0).toFixed(4)),
      evi: parseFloat((f.evi || 0).toFixed(4)),
      savi: parseFloat((f.savi || 0).toFixed(4)),
    }));

    return { lat, lng, timeSeries, dataSource: 'Sentinel-2' };
  } catch (err) {
    console.error('[EOSService] getVegetationIndex error:', err.message);
    return generateMockVegetationIndex(lat, lng);
  }
};

const generateMockVegetationIndex = (lat, lng) => {
  const timeSeries = [];
  const today = new Date();

  for (let i = 30; i >= 0; i -= 5) {
    const date = new Date(today - i * 24 * 60 * 60 * 1000);
    const noise = (Math.random() - 0.5) * 0.1;
    const ndvi = Math.max(0.1, Math.min(0.85, 0.45 + noise));
    timeSeries.push({
      date: date.toISOString().split('T')[0],
      ndvi: parseFloat(ndvi.toFixed(4)),
      evi: parseFloat((ndvi * 0.88).toFixed(4)),
      savi: parseFloat((ndvi * 0.95).toFixed(4)),
    });
  }

  return { lat, lng, timeSeries, dataSource: 'mock', note: 'Configure EOS_API_KEY for live data.' };
};

/**
 * Get soil moisture estimate.
 */
const getSoilMoisture = async (lat, lng) => {
  if (!EOS_API_KEY) {
    return generateMockSoilMoisture(lat, lng);
  }

  try {
    const today = new Date();
    const fourteenDaysAgo = new Date(today - 14 * 24 * 60 * 60 * 1000);

    const payload = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      properties: {
        date_start: fourteenDaysAgo.toISOString().split('T')[0],
        date_end: today.toISOString().split('T')[0],
        sensors: [{ name: 'Sentinel1' }],
        indices: ['SWI', 'NDWI'],
      },
    };

    const response = await eosClient.post('/stats', payload);
    const features = response.data.features || [];
    const latest = features[features.length - 1] || {};

    const moisturePercent = Math.round((latest.swi || 0.4) * 100);
    const moistureLevel = moisturePercent > 60 ? 'high' : moisturePercent > 30 ? 'medium' : 'low';

    return {
      lat,
      lng,
      soilMoisturePercent: moisturePercent,
      moistureLevel,
      swi: parseFloat((latest.swi || 0.4).toFixed(4)),
      ndwi: parseFloat((latest.ndwi || 0.1).toFixed(4)),
      measureDate: latest.date || today.toISOString().split('T')[0],
      dataSource: 'Sentinel-1',
    };
  } catch (err) {
    console.error('[EOSService] getSoilMoisture error:', err.message);
    return generateMockSoilMoisture(lat, lng);
  }
};

const generateMockSoilMoisture = (lat, lng) => {
  const seed = Math.abs(Math.sin(lat * 17.3 + lng * 5.7));
  const moisturePercent = Math.round(20 + seed * 60);
  const moistureLevel = moisturePercent > 60 ? 'high' : moisturePercent > 30 ? 'medium' : 'low';

  return {
    lat,
    lng,
    soilMoisturePercent: moisturePercent,
    moistureLevel,
    swi: parseFloat((moisturePercent / 100).toFixed(4)),
    ndwi: parseFloat((moisturePercent / 100 * 0.3 - 0.05).toFixed(4)),
    measureDate: new Date().toISOString().split('T')[0],
    dataSource: 'mock',
    note: 'Configure EOS_API_KEY for live data.',
  };
};

/**
 * Get weather risk alerts for a location.
 */
const getWeatherRiskAlert = async (lat, lng) => {
  if (!EOS_API_KEY) {
    return generateMockWeatherRisk(lat, lng);
  }

  try {
    const response = await eosClient.get('/weather/risk', {
      params: { lat, lon: lng, days: 7 },
    });

    const data = response.data;
    return {
      lat,
      lng,
      alerts: data.alerts || [],
      riskLevel: data.riskLevel || 'low',
      forecast: data.forecast || [],
      dataSource: 'EOS-Weather',
    };
  } catch (err) {
    console.error('[EOSService] getWeatherRiskAlert error:', err.message);
    return generateMockWeatherRisk(lat, lng);
  }
};

const generateMockWeatherRisk = (lat, lng) => {
  const riskTypes = [
    { type: 'drought', level: 'low', description: 'Low drought risk in the next 7 days.' },
    { type: 'flood', level: 'low', description: 'No flood risk detected.' },
    { type: 'frost', level: 'low', description: 'No frost risk in the forecast period.' },
    { type: 'pest', level: 'medium', description: 'Moderate pest pressure possible due to humidity levels.' },
  ];

  const forecast = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    forecast.push({
      date: date.toISOString().split('T')[0],
      tempMax: Math.round(28 + Math.random() * 10),
      tempMin: Math.round(18 + Math.random() * 5),
      rainfall: Math.round(Math.random() * 15),
      humidity: Math.round(50 + Math.random() * 40),
      windSpeed: Math.round(5 + Math.random() * 20),
    });
  }

  return {
    lat,
    lng,
    alerts: riskTypes.filter((r) => r.level !== 'low'),
    riskLevel: 'low',
    forecast,
    dataSource: 'mock',
    note: 'Configure EOS_API_KEY for live weather risk data.',
  };
};

module.exports = { getFieldHealth, getVegetationIndex, getSoilMoisture, getWeatherRiskAlert };
