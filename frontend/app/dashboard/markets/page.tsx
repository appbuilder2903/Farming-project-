'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdMyLocation, MdPhone, MdStar } from 'react-icons/md';
import { useTranslation } from '@/hooks/useTranslation';
import { useMarkets } from '@/hooks/useMarkets';
import type { Market } from '@/types';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <MdStar
          key={i}
          size={14}
          className={i < Math.round(rating) ? 'text-accent-400' : 'text-primary-200'}
        />
      ))}
      <span className="text-xs text-primary-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function MarketCard({ market, index }: { market: Market; index: number }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="agri-card hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-primary-900 truncate">{market.name}</h3>
          <p className="text-primary-500 text-xs mt-0.5">
            {market.district}, {market.state}
          </p>
          {market.rating && (
            <div className="mt-1">
              <StarRating rating={market.rating} />
            </div>
          )}
        </div>
        {market.distance !== undefined && (
          <div className="flex-shrink-0 text-right">
            <span className="text-lg font-bold text-primary-700">
              {market.distance < 1
                ? `${(market.distance * 1000).toFixed(0)}m`
                : `${market.distance.toFixed(1)}${t('markets.km')}`}
            </span>
            <p className="text-xs text-primary-400">{t('markets.distance')}</p>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-primary-100 flex items-center justify-between gap-3">
        {market.contact ? (
          <a
            href={`tel:${market.contact}`}
            className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 text-xs"
          >
            <MdPhone size={14} />
            {market.contact}
          </a>
        ) : (
          <span className="text-xs text-primary-300">No contact</span>
        )}
        {market.operatingHours && (
          <span className="text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
            🕐 {market.operatingHours}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function MarketsPage() {
  const { t } = useTranslation();
  const { markets, isLoading, locationError, findNearMe, coords } = useMarkets();
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{ markets: Market[]; center: [number, number] }> | null>(null);

  // Dynamically import Leaflet to avoid SSR issues
  useEffect(() => {
    if (coords) {
      import('@/components/markets/MarketMap').then((mod) => {
        setMapComponent(() => mod.default);
      });
    }
  }, [coords]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">{t('markets.title')}</h1>
        <p className="text-primary-500 text-sm mt-1">{t('markets.subtitle')}</p>
      </div>

      {/* Find Near Me Button */}
      <div className="agri-card flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <p className="font-medium text-primary-900">Find markets near your location</p>
          <p className="text-sm text-primary-500">
            We&apos;ll use your GPS to find the closest markets
          </p>
        </div>
        <button
          onClick={findNearMe}
          disabled={isLoading}
          className="agri-btn-primary flex items-center gap-2 flex-shrink-0"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('markets.locating')}
            </>
          ) : (
            <>
              <MdMyLocation size={18} />
              {t('markets.findNearMe')}
            </>
          )}
        </button>
      </div>

      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
          <span>⚠️</span>
          {locationError}
        </div>
      )}

      {/* Map placeholder or Leaflet map */}
      {coords && (
        <div className="agri-card p-0 overflow-hidden" style={{ height: '300px' }}>
          {MapComponent ? (
            <MapComponent
              markets={markets}
              center={[coords.lat, coords.lng]}
            />
          ) : (
            <div className="h-full bg-primary-100 flex items-center justify-center">
              <div className="text-center text-primary-500">
                <div className="text-4xl mb-2">🗺️</div>
                <p>Loading map...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Cards */}
      {!coords && !isLoading && (
        <div className="text-center py-16 text-primary-400">
          <span className="text-6xl block mb-3">🏪</span>
          <p className="font-medium text-primary-600">
            Click &quot;Find Markets Near Me&quot; to discover nearby mandis
          </p>
        </div>
      )}

      {markets.length > 0 && (
        <div>
          <h2 className="font-semibold text-primary-900 mb-3">
            {markets.length} markets found nearby
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {markets.map((market, i) => (
              <MarketCard key={market._id} market={market} index={i} />
            ))}
          </div>
        </div>
      )}

      {coords && markets.length === 0 && !isLoading && (
        <div className="text-center py-10 text-primary-400">
          <span className="text-5xl block mb-2">🔍</span>
          {t('markets.noMarkets')}
        </div>
      )}
    </div>
  );
}
