'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdPhone, MdStar } from 'react-icons/md';
import { useTranslation } from '@/hooks/useTranslation';
import useSWR from 'swr';
import api from '@/lib/api';
import type { Dealer, APIResponse } from '@/types';

const COMMODITIES = [
  'All', 'Wheat', 'Rice', 'Maize', 'Cotton', 'Soybean',
  'Onion', 'Tomato', 'Potato', 'Mustard',
];

const RANK_COLORS = ['bg-accent-400', 'bg-gray-400', 'bg-amber-700', 'bg-primary-500'];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <MdStar
          key={i}
          size={13}
          className={i < Math.round(rating) ? 'text-accent-400' : 'text-primary-200'}
        />
      ))}
    </div>
  );
}

const fetcher = (url: string) => api.get(url).then((r) => r.data as APIResponse<Dealer[]>);

export default function DealersPage() {
  const { t } = useTranslation();
  const [selectedCommodity, setSelectedCommodity] = useState('All');

  const params = selectedCommodity !== 'All' ? `?commodity=${selectedCommodity}` : '';
  const { data, isLoading } = useSWR<APIResponse<Dealer[]>>(
    `/markets/dealers/top${params}`,
    fetcher,
    { refreshInterval: 120_000 }
  );

  const dealers = data?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">{t('dealers.title')}</h1>
        <p className="text-primary-500 text-sm mt-1">{t('dealers.subtitle')}</p>
      </div>

      {/* Commodity filter */}
      <div className="agri-card py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-primary-500 font-medium flex-shrink-0">
            {t('dealers.filterByCommodity')}:
          </span>
          {COMMODITIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCommodity(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCommodity === c
                  ? 'bg-primary-700 text-white'
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Dealers List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : dealers.length === 0 ? (
        <div className="text-center py-16 text-primary-400">
          <span className="text-6xl block mb-3">🤝</span>
          <p>{t('dealers.noDealers')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dealers.map((dealer, i) => (
            <motion.div
              key={dealer._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="agri-card flex items-center gap-4"
            >
              {/* Rank badge */}
              <div
                className={`w-10 h-10 rounded-full ${
                  RANK_COLORS[i] || 'bg-primary-300'
                } flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow`}
              >
                #{i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-primary-900">{dealer.name}</h3>
                  {i === 0 && (
                    <span className="agri-badge-yellow text-xs">
                      🏆 {t('dealers.topDealer')}
                    </span>
                  )}
                </div>
                <p className="text-primary-500 text-xs mt-0.5">
                  {dealer.commodity} · {dealer.marketName || 'Local Market'}
                </p>
                <StarRating rating={dealer.rating} />
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-primary-800">
                  ₹{dealer.buyingPrice.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-primary-400">{t('prices.perQuintal')}</div>
                {dealer.distance !== undefined && (
                  <div className="text-xs text-primary-500 mt-0.5">
                    📍 {dealer.distance.toFixed(1)} km
                  </div>
                )}
              </div>

              {/* Contact */}
              {dealer.contact && (
                <a
                  href={`tel:${dealer.contact}`}
                  className="flex-shrink-0 w-9 h-9 bg-primary-100 hover:bg-primary-200 rounded-xl flex items-center justify-center text-primary-700 transition-colors"
                >
                  <MdPhone size={18} />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
