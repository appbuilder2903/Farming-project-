'use client';

import { motion } from 'framer-motion';
import type { StatsCardData } from '@/types';

interface StatsCardProps extends StatsCardData {
  index?: number;
}

const colorMap = {
  green: {
    bg: 'bg-primary-50 border-primary-200',
    icon: 'bg-primary-100 text-primary-700',
    trend: 'text-primary-600',
    value: 'text-primary-900',
  },
  yellow: {
    bg: 'bg-accent-50 border-accent-200',
    icon: 'bg-accent-100 text-accent-700',
    trend: 'text-accent-600',
    value: 'text-accent-900',
  },
  red: {
    bg: 'bg-red-50 border-red-200',
    icon: 'bg-red-100 text-red-600',
    trend: 'text-red-600',
    value: 'text-red-900',
  },
  blue: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600',
    value: 'text-blue-900',
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = 'green',
  index = 0,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`agri-card border ${colors.bg}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${colors.icon}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend >= 0
                ? 'bg-primary-100 text-primary-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-primary-500 text-xs font-medium uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className={`text-2xl font-bold ${colors.value} leading-tight`}>
        {value}
      </p>
      {(subtitle || trendLabel) && (
        <p className="text-primary-400 text-xs mt-1">
          {subtitle || trendLabel}
        </p>
      )}
    </motion.div>
  );
}
