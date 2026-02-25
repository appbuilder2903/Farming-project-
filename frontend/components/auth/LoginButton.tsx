'use client';

import React from 'react';
import {
  FcGoogle,
} from 'react-icons/fc';
import { FaGithub, FaMicrosoft } from 'react-icons/fa';
import { motion } from 'framer-motion';

type Provider = 'google' | 'github' | 'microsoft';

interface LoginButtonProps {
  provider: Provider;
  href: string;
  label: string;
}

const providerConfig: Record<
  Provider,
  {
    icon: React.ReactNode;
    bg: string;
    text: string;
    border: string;
    hover: string;
  }
> = {
  google: {
    icon: <FcGoogle className="text-xl flex-shrink-0" />,
    bg: 'bg-white',
    text: 'text-gray-700',
    border: 'border border-gray-200',
    hover: 'hover:bg-gray-50',
  },
  github: {
    icon: <FaGithub className="text-xl text-gray-800 flex-shrink-0" />,
    bg: 'bg-gray-900',
    text: 'text-white',
    border: 'border border-gray-700',
    hover: 'hover:bg-gray-800',
  },
  microsoft: {
    icon: <FaMicrosoft className="text-xl text-blue-500 flex-shrink-0" />,
    bg: 'bg-white',
    text: 'text-gray-700',
    border: 'border border-gray-200',
    hover: 'hover:bg-blue-50',
  },
};

export default function LoginButton({ provider, href, label }: LoginButtonProps) {
  const config = providerConfig[provider];

  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-3 w-full px-5 py-3 rounded-xl font-medium text-sm
        transition-all shadow-sm
        ${config.bg} ${config.text} ${config.border} ${config.hover}
      `}
    >
      {config.icon}
      <span className="flex-1 text-center">{label}</span>
    </motion.a>
  );
}
