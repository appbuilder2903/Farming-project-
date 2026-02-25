'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { eosAPI } from '@/lib/api';
import FieldHealthIndicator from '@/components/dashboard/FieldHealthIndicator';
import type { EOSData, WeatherRisk } from '@/types';
import toast from 'react-hot-toast';

function NDVIGauge({ value }: { value: number }) {
  const pct = ((value + 1) / 2) * 100;
  const color =
    value < 0.1 ? '#ef4444' : value < 0.3 ? '#f59e0b' : value < 0.5 ? '#84cc16' : '#16a34a';

  const getCategory = (v: number) => {
    if (v < 0.1) return 'Bare Soil / Water';
    if (v < 0.3) return 'Sparse Vegetation';
    if (v < 0.5) return 'Moderate Vegetation';
    return 'Dense / Healthy Vegetation';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-primary-500">
        <span>-1 (Water)</span>
        <span>0 (Bare)</span>
        <span>+1 (Dense)</span>
      </div>
      <div className="h-4 bg-gradient-to-r from-blue-400 via-yellow-300 to-green-600 rounded-full relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md transition-all duration-500"
          style={{ left: `calc(${pct}% - 8px)`, borderColor: color }}
        />
      </div>
      <div className="text-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {value.toFixed(3)}
        </span>
        <p className="text-xs text-primary-500 mt-0.5">{getCategory(value)}</p>
      </div>
    </div>
  );
}

const RISK_STYLES: Record<string, string> = {
  low: 'bg-primary-50 border-primary-200 text-primary-800',
  medium: 'bg-accent-50 border-accent-200 text-accent-800',
  high: 'bg-orange-50 border-orange-200 text-orange-800',
  extreme: 'bg-red-50 border-red-200 text-red-800',
};

export default function SatellitePage() {
  const { t } = useTranslation();
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [eosData, setEosData] = useState<EOSData | null>(null);
  const [weatherRisk, setWeatherRisk] = useState<WeatherRisk | null>(null);
  const [locating, setLocating] = useState(false);

  const autoDetect = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success('Location detected!');
      },
      () => {
        toast.error(t('errors.locationDenied'));
        setLocating(false);
      }
    );
  };

  const analyzeField = async () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      toast.error('Please enter valid coordinates');
      return;
    }
    setAnalyzing(true);
    try {
      const [healthRes, weatherRes] = await Promise.all([
        eosAPI.getFieldHealth({ lat: latitude, lng: longitude }),
        eosAPI.getWeatherRisk({ lat: latitude, lng: longitude }),
      ]);
      setEosData(healthRes.data?.data as EOSData);
      setWeatherRisk(weatherRes.data?.data as WeatherRisk);
      toast.success('Satellite analysis complete!');
    } catch {
      toast.error(t('errors.server'));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">{t('satellite.title')}</h1>
        <p className="text-primary-500 text-sm mt-1">{t('satellite.subtitle')}</p>
      </div>

      {/* Coordinate Input */}
      <div className="agri-card space-y-4">
        <h2 className="font-semibold text-primary-900">{t('satellite.enterCoordinates')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-primary-500 font-medium block mb-1">
              {t('satellite.latitude')}
            </label>
            <input
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 28.6139"
              className="agri-input"
            />
          </div>
          <div>
            <label className="text-xs text-primary-500 font-medium block mb-1">
              {t('satellite.longitude')}
            </label>
            <input
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. 77.2090"
              className="agri-input"
            />
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={autoDetect}
            disabled={locating}
            className="agri-btn-secondary flex items-center gap-2"
          >
            {locating ? (
              <div className="w-4 h-4 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
            ) : '📍'}
            {t('satellite.autoDetect')}
          </button>
          <button
            onClick={analyzeField}
            disabled={analyzing || !lat || !lng}
            className="agri-btn-primary flex items-center gap-2"
          >
            {analyzing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : '🛰️'}
            {analyzing ? t('satellite.analyzing') : t('satellite.analyze')}
          </button>
        </div>
      </div>

      {/* Results */}
      {eosData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Field Health Status */}
          <div className="agri-card flex flex-col items-center gap-4">
            <h2 className="font-semibold text-primary-900 self-start">
              {t('satellite.fieldHealth')}
            </h2>
            <FieldHealthIndicator
              status={eosData.fieldHealthStatus}
              score={Math.round(((eosData.ndvi + 1) / 2) * 100)}
              label={eosData.fieldHealthLabel}
              size="lg"
            />
            {eosData.date && (
              <p className="text-xs text-primary-400">
                {t('satellite.lastUpdated')}: {new Date(eosData.date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* NDVI */}
          <div className="agri-card">
            <h2 className="font-semibold text-primary-900 mb-1">{t('satellite.ndvi')}</h2>
            <p className="text-xs text-primary-400 mb-4">{t('satellite.ndviDescription')}</p>
            <NDVIGauge value={eosData.ndvi} />
          </div>

          {/* Soil Moisture */}
          <div className="agri-card">
            <h2 className="font-semibold text-primary-900 mb-4">{t('satellite.soilMoisture')}</h2>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-primary-700">
                {eosData.soilMoisture}%
              </div>
              <div className="flex-1">
                <div className="h-3 bg-primary-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${eosData.soilMoisture}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      eosData.soilMoisture < 30
                        ? 'bg-red-500'
                        : eosData.soilMoisture < 60
                        ? 'bg-accent-500'
                        : 'bg-primary-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-primary-500 mt-1">
                  {eosData.soilMoisture < 30
                    ? '⚠️ Low moisture – irrigation recommended'
                    : eosData.soilMoisture < 60
                    ? '✅ Adequate moisture'
                    : '💧 High moisture – check drainage'}
                </p>
              </div>
            </div>
          </div>

          {/* Cloud Cover */}
          {eosData.cloudCover !== undefined && (
            <div className="agri-card">
              <h2 className="font-semibold text-primary-900 mb-4">{t('satellite.cloudCover')}</h2>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-blue-600">
                  {eosData.cloudCover}%
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${eosData.cloudCover}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-blue-400 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-primary-500 mt-1">
                    {eosData.cloudCover > 70
                      ? '☁️ Heavy cloud cover – satellite data may be limited'
                      : '⛅ Clear enough for analysis'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weather Risk */}
      {weatherRisk && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`agri-card border ${RISK_STYLES[weatherRisk.level] || RISK_STYLES.low}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl flex-shrink-0">
              {weatherRisk.level === 'extreme' ? '🚨' :
               weatherRisk.level === 'high' ? '⚠️' :
               weatherRisk.level === 'medium' ? '🌤️' : '✅'}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{t('satellite.weatherRisk')}</h3>
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/50">
                  {weatherRisk.level}
                </span>
              </div>
              {weatherRisk.alerts.length > 0 && (
                <ul className="space-y-0.5">
                  {weatherRisk.alerts.map((alert, i) => (
                    <li key={i} className="text-sm flex items-start gap-1.5">
                      <span className="mt-0.5">•</span>
                      {alert}
                    </li>
                  ))}
                </ul>
              )}
              {weatherRisk.advice && (
                <p className="text-sm mt-2 font-medium">{weatherRisk.advice}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Explanation */}
      {eosData?.explanation && (
        <div className="agri-card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            🤖 {t('satellite.explanation')}
          </h3>
          <p className="text-blue-700 text-sm leading-relaxed">{eosData.explanation}</p>
        </div>
      )}

      {/* Satellite Imagery Placeholder */}
      {!eosData && (
        <div className="agri-card text-center py-16 text-primary-400">
          <div className="text-7xl mb-4">🛰️</div>
          <p className="font-medium text-primary-600">
            Enter your field coordinates to analyze via EOS satellite
          </p>
          <p className="text-sm mt-1">
            Get NDVI, soil moisture, crop health, and weather risk data
          </p>
        </div>
      )}
    </div>
  );
}
