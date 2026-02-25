'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  MdMenu,
  MdNotifications,
  MdLanguage,
  MdArrowDropDown,
  MdLogout,
  MdPerson,
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { LANGUAGES, TOP_LANGUAGES } from '@/lib/languages';

interface NavbarProps {
  onMenuToggle: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/dashboard/disease': 'nav.disease',
  '/dashboard/prices': 'nav.prices',
  '/dashboard/markets': 'nav.markets',
  '/dashboard/dealers': 'nav.dealers',
  '/dashboard/news': 'nav.news',
  '/dashboard/satellite': 'nav.satellite',
  '/dashboard/profile': 'nav.profile',
};

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const pageTitle = t(PAGE_TITLES[pathname] || 'nav.dashboard');

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const topLangs = TOP_LANGUAGES.map((c) => LANGUAGES.find((l) => l.code === c)!).filter(Boolean);
  const currentLangObj = LANGUAGES.find((l) => l.code === currentLanguage);

  return (
    <header className="bg-white border-b border-primary-100 h-16 flex items-center px-4 gap-3 flex-shrink-0 shadow-sm z-10">
      {/* Menu toggle */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors"
        aria-label="Toggle menu"
      >
        <MdMenu size={22} />
      </button>

      {/* Page title */}
      <h1 className="text-primary-900 font-semibold text-lg flex-1 truncate">
        {pageTitle}
      </h1>

      {/* Language selector */}
      <div ref={langMenuRef} className="relative">
        <button
          onClick={() => setLangMenuOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 text-sm font-medium transition-colors"
        >
          <MdLanguage size={16} className="text-primary-500" />
          <span className="hidden sm:inline">
            {currentLangObj?.nativeName || currentLanguage.toUpperCase()}
          </span>
          <MdArrowDropDown size={18} />
        </button>

        <AnimatePresence>
          {langMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-primary-100 py-2 z-50 max-h-80 overflow-y-auto"
            >
              <p className="text-xs text-primary-400 px-4 py-1.5 font-medium uppercase tracking-wider">
                Select Language
              </p>
              {topLangs.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${
                    currentLanguage === lang.code
                      ? 'text-primary-800 font-semibold bg-primary-50'
                      : 'text-primary-700'
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-primary-400">{lang.nativeName}</span>
                </button>
              ))}
              <div className="border-t border-primary-100 mt-1 pt-1">
                <p className="text-xs text-primary-400 px-4 py-1.5">
                  121 Indian languages supported
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors">
        <MdNotifications size={22} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full" />
      </button>

      {/* User menu */}
      <div ref={userMenuRef} className="relative">
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-primary-50 transition-colors"
        >
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-primary-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <MdArrowDropDown size={18} className="text-primary-500 hidden sm:block" />
        </button>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-primary-100 py-2 z-50"
            >
              <div className="px-4 py-3 border-b border-primary-100">
                <p className="text-primary-900 font-semibold text-sm truncate">
                  {user?.name}
                </p>
                <p className="text-primary-400 text-xs truncate">{user?.email}</p>
                <span className="agri-badge-green mt-1">
                  {t(`common.${user?.role}`, user?.role)}
                </span>
              </div>
              <a
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
              >
                <MdPerson size={18} className="text-primary-400" />
                {t('nav.profile')}
              </a>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <MdLogout size={18} />
                {t('nav.logout')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
