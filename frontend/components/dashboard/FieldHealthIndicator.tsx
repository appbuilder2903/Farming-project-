'use client';

import { motion } from 'framer-motion';

interface FieldHealthIndicatorProps {
  status: 'green' | 'yellow' | 'red';
  score?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  green: {
    ring: 'ring-primary-400',
    bg: 'bg-primary-100',
    dot: 'bg-primary-500',
    text: 'text-primary-700',
    emoji: '✅',
    glow: 'shadow-primary-200',
  },
  yellow: {
    ring: 'ring-accent-400',
    bg: 'bg-accent-100',
    dot: 'bg-accent-500',
    text: 'text-accent-700',
    emoji: '⚠️',
    glow: 'shadow-accent-200',
  },
  red: {
    ring: 'ring-red-400',
    bg: 'bg-red-100',
    dot: 'bg-red-500',
    text: 'text-red-700',
    emoji: '🚨',
    glow: 'shadow-red-200',
  },
};

const sizeMap = {
  sm: { outer: 'w-12 h-12', inner: 'text-xl', ring: 'ring-2' },
  md: { outer: 'w-20 h-20', inner: 'text-3xl', ring: 'ring-4' },
  lg: { outer: 'w-28 h-28', inner: 'text-5xl', ring: 'ring-4' },
};

export default function FieldHealthIndicator({
  status,
  score,
  label,
  size = 'md',
}: FieldHealthIndicatorProps) {
  const config = statusConfig[status];
  const sz = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className={`
          ${sz.outer} ${config.bg} ${sz.ring} ${config.ring}
          rounded-full flex items-center justify-center
          shadow-lg ${config.glow}
        `}
      >
        <span className={sz.inner}>{config.emoji}</span>
      </motion.div>
      {score !== undefined && (
        <div className="text-center">
          <span className={`font-bold text-lg ${config.text}`}>{score}%</span>
        </div>
      )}
      {label && (
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${config.bg} ${config.text}`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${config.dot} mr-1.5`}
          />
          {label}
        </span>
      )}
    </div>
  );
}
