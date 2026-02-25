'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { usePrices } from '@/hooks/usePrices';
import PriceTable from '@/components/dashboard/PriceTable';
import PredictionChart from '@/components/prices/PredictionChart';
import { priceAPI } from '@/lib/api';
import type { Prediction, PriceHistory } from '@/types';
import toast from 'react-hot-toast';

const COMMODITIES = [
  'Wheat', 'Rice', 'Maize', 'Cotton', 'Soybean', 'Mustard', 'Onion',
  'Tomato', 'Potato', 'Sugarcane', 'Gram', 'Arhar (Tur)', 'Moong',
];

const STATES = [
  'All States', 'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana',
  'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const RISK_COLORS: Record<string, string> = {
  low: 'agri-badge-green',
  medium: 'agri-badge-yellow',
  high: 'agri-badge-red',
};

const PREDICTION_DAYS = [7, 15, 30];

export default function PricesPage() {
  const { t } = useTranslation();
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [predDays, setPredDays] = useState(7);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [predLoading, setPredLoading] = useState(false);

  const { prices, isLoading } = usePrices({
    commodity: selectedCommodity || undefined,
    state: selectedState && selectedState !== 'All States' ? selectedState : undefined,
  });

  const fetchPrediction = async (commodity: string) => {
    if (!commodity) return;
    setPredLoading(true);
    try {
      const [predRes, histRes] = await Promise.all([
        priceAPI.getPrediction(commodity, { days: predDays }),
        priceAPI.getHistory(commodity, { days: 30 }),
      ]);
      setPrediction(predRes.data?.data as Prediction);
      setHistory((histRes.data?.data as PriceHistory[]) || []);
    } catch {
      toast.error('Failed to fetch prediction');
    } finally {
      setPredLoading(false);
    }
  };

  const handleCommodityChange = (c: string) => {
    setSelectedCommodity(c);
    if (c) fetchPrediction(c);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">{t('prices.title')}</h1>
        <p className="text-primary-500 text-sm mt-1">{t('prices.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="agri-card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <label className="text-xs text-primary-500 font-medium block mb-1">
              {t('prices.commodity')}
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => handleCommodityChange(e.target.value)}
              className="agri-input"
            >
              <option value="">{t('prices.selectCommodity')}</option>
              {COMMODITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="text-xs text-primary-500 font-medium block mb-1">
              {t('prices.state')}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="agri-input"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setSelectedCommodity(''); setSelectedState(''); setPrediction(null); }}
            className="agri-btn-secondary"
          >
            {t('common.reset')}
          </button>
        </div>
      </div>

      {/* Live Prices Table */}
      <div className="agri-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-primary-900">{t('prices.title')}</h2>
          <span className="flex items-center gap-1.5 text-xs text-primary-500">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <PriceTable prices={prices} loading={isLoading} limit={20} />
      </div>

      {/* Prediction Section */}
      {selectedCommodity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="agri-card"
        >
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-primary-900">
                {t('prices.prediction')} – {selectedCommodity}
              </h2>
              <p className="text-xs text-primary-500">AI-powered price forecast</p>
            </div>
            {/* Day tabs */}
            <div className="flex gap-1 bg-primary-50 rounded-xl p-1">
              {PREDICTION_DAYS.map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    setPredDays(days);
                    fetchPrediction(selectedCommodity);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    predDays === days
                      ? 'bg-white text-primary-800 shadow-sm'
                      : 'text-primary-500 hover:text-primary-700'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {predLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl animate-bounce mb-2">📊</div>
                <p className="text-primary-500">Generating AI prediction...</p>
              </div>
            </div>
          ) : prediction ? (
            <div className="space-y-4">
              {/* Confidence + Risk */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary-600">
                    {t('prices.confidenceScore')}:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 h-2 bg-primary-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-primary-800">
                      {prediction.confidence}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary-600">
                    {t('prices.riskLevel')}:
                  </span>
                  <span className={RISK_COLORS[prediction.riskLevel] || 'agri-badge-green'}>
                    {t(`prices.${prediction.riskLevel}`, prediction.riskLevel)}
                  </span>
                </div>
              </div>

              {/* Chart */}
              <PredictionChart prediction={prediction} historyData={history} />

              {/* AI Analysis */}
              {prediction.analysis && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">
                    🤖 {t('prices.analysis')}
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {prediction.analysis}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-primary-400">
              Select a commodity to see predictions
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
