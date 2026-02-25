'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { usePrices } from '@/hooks/usePrices';
import StatsCard from '@/components/dashboard/StatsCard';
import PriceTable from '@/components/dashboard/PriceTable';
import FieldHealthIndicator from '@/components/dashboard/FieldHealthIndicator';

const QUICK_ACTIONS = [
  {
    key: 'detectDisease',
    href: '/dashboard/disease',
    icon: '🔬',
    bg: 'from-emerald-500 to-green-600',
  },
  {
    key: 'checkPrices',
    href: '/dashboard/prices',
    icon: '📊',
    bg: 'from-yellow-500 to-amber-600',
  },
  {
    key: 'findMarket',
    href: '/dashboard/markets',
    icon: '🏪',
    bg: 'from-blue-500 to-cyan-600',
  },
  {
    key: 'viewNews',
    href: '/dashboard/news',
    icon: '📰',
    bg: 'from-orange-500 to-red-500',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { prices, isLoading } = usePrices();

  const topPrice = prices[0];
  const firstName = user?.name?.split(' ')[0] || 'Farmer';

  const stats = [
    {
      title: t('dashboard.todayBestPrice'),
      value: topPrice
        ? `₹${topPrice.modalPrice.toLocaleString('en-IN')}`
        : '—',
      subtitle: topPrice ? `${topPrice.commodity} · ${topPrice.market}` : t('common.loading'),
      icon: '💰',
      trend: topPrice?.changePercent,
      color: 'green' as const,
    },
    {
      title: t('dashboard.fieldHealth'),
      value: t('dashboard.good'),
      subtitle: 'NDVI: 0.72 · Moisture: 68%',
      icon: '🌱',
      color: 'green' as const,
    },
    {
      title: t('dashboard.latestNews'),
      value: '12',
      subtitle: '3 new today',
      icon: '📰',
      color: 'blue' as const,
    },
    {
      title: t('dashboard.activeAlerts'),
      value: '2',
      subtitle: 'Weather + Market',
      icon: '🔔',
      color: 'yellow' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-primary-900">
            {t('dashboard.welcome')},{' '}
            <span className="text-primary-700">{firstName}</span> 👋
          </h1>
          <p className="text-primary-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="agri-badge-green text-sm">
            🌾 {t(`common.${user?.role}`, user?.role || 'Farmer')}
          </span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatsCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Prices */}
        <div className="lg:col-span-2 agri-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-primary-900">
              {t('dashboard.recentPrices')}
            </h2>
            <Link
              href="/dashboard/prices"
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              {t('common.viewAll')} →
            </Link>
          </div>
          <PriceTable prices={prices} loading={isLoading} limit={5} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Field Health */}
          <div className="agri-card">
            <h2 className="font-semibold text-primary-900 mb-4">
              {t('dashboard.fieldHealth')}
            </h2>
            <div className="flex flex-col items-center py-2">
              <FieldHealthIndicator
                status="green"
                score={82}
                label={t('dashboard.good')}
                size="lg"
              />
              <div className="mt-4 w-full grid grid-cols-2 gap-2 text-xs">
                <div className="bg-primary-50 rounded-lg p-2 text-center">
                  <div className="font-bold text-primary-800">0.72</div>
                  <div className="text-primary-500">NDVI Index</div>
                </div>
                <div className="bg-primary-50 rounded-lg p-2 text-center">
                  <div className="font-bold text-primary-800">68%</div>
                  <div className="text-primary-500">Soil Moisture</div>
                </div>
              </div>
              <Link
                href="/dashboard/satellite"
                className="mt-3 text-primary-600 hover:text-primary-800 text-xs font-medium"
              >
                View Satellite Data →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="agri-card">
            <h2 className="font-semibold text-primary-900 mb-4">
              {t('dashboard.quickActions')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.key}
                  href={action.href}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl
                    bg-gradient-to-br ${action.bg}
                    text-white text-xs font-semibold
                    hover:opacity-90 transition-opacity active:scale-95
                  `}
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-center leading-tight">
                    {t(`dashboard.${action.key}`)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Alert Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-accent-50 border border-accent-200 rounded-2xl p-4 flex items-start gap-3"
      >
        <span className="text-2xl flex-shrink-0">⛈️</span>
        <div>
          <p className="font-semibold text-accent-800 text-sm">
            Weather Alert: Moderate rainfall expected in the next 48 hours
          </p>
          <p className="text-accent-600 text-xs mt-0.5">
            Consider harvesting ready crops early. Soil drainage may be required.
          </p>
        </div>
        <Link
          href="/dashboard/satellite"
          className="ml-auto flex-shrink-0 text-xs font-medium text-accent-700 hover:text-accent-900"
        >
          Details →
        </Link>
      </motion.div>
    </div>
  );
}
