'use client';

import type { PriceData } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface PriceTableProps {
  prices: PriceData[];
  loading?: boolean;
  limit?: number;
}

export default function PriceTable({ prices, loading = false, limit = 10 }: PriceTableProps) {
  const { t } = useTranslation();
  const displayPrices = prices.slice(0, limit);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (displayPrices.length === 0) {
    return (
      <div className="text-center py-10 text-primary-400">
        <span className="text-4xl block mb-2">📦</span>
        {t('prices.noData', 'No price data available')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-primary-100">
            <th className="text-left py-3 px-3 text-primary-500 font-medium text-xs uppercase tracking-wide">
              {t('prices.commodity')}
            </th>
            <th className="text-left py-3 px-3 text-primary-500 font-medium text-xs uppercase tracking-wide hidden md:table-cell">
              {t('prices.market')}
            </th>
            <th className="text-right py-3 px-3 text-primary-500 font-medium text-xs uppercase tracking-wide">
              {t('prices.modalPrice')}
            </th>
            <th className="text-right py-3 px-3 text-primary-500 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">
              {t('prices.minPrice')}
            </th>
            <th className="text-right py-3 px-3 text-primary-500 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">
              {t('prices.maxPrice')}
            </th>
            <th className="text-right py-3 px-3 text-primary-500 font-medium text-xs uppercase tracking-wide">
              {t('prices.change')}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayPrices.map((price, i) => (
            <tr
              key={price._id || i}
              className="border-b border-primary-50 hover:bg-primary-50/50 transition-colors"
            >
              <td className="py-3 px-3">
                <div className="font-semibold text-primary-900">{price.commodity}</div>
                <div className="text-primary-400 text-xs hidden sm:block">{price.state}</div>
              </td>
              <td className="py-3 px-3 text-primary-600 hidden md:table-cell truncate max-w-[150px]">
                {price.market}
              </td>
              <td className="py-3 px-3 text-right">
                <span className="font-bold text-primary-900">
                  ₹{price.modalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-primary-400 text-xs block">{price.unit}</span>
              </td>
              <td className="py-3 px-3 text-right text-primary-600 hidden sm:table-cell">
                ₹{price.minPrice.toLocaleString('en-IN')}
              </td>
              <td className="py-3 px-3 text-right text-primary-600 hidden sm:table-cell">
                ₹{price.maxPrice.toLocaleString('en-IN')}
              </td>
              <td className="py-3 px-3 text-right">
                {price.changePercent !== undefined ? (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      price.changePercent >= 0
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {price.changePercent >= 0 ? '↑' : '↓'}
                    {Math.abs(price.changePercent).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-primary-300 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
