'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';
import { getPreferredLanguage, setPreferredLanguage } from '@/lib/auth';

type Translations = Record<string, unknown>;

interface LanguageContextValue {
  currentLanguage: string;
  changeLanguage: (code: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  translations: Translations;
}

export const LanguageContext = createContext<LanguageContextValue>({
  currentLanguage: 'en',
  changeLanguage: async () => {},
  t: (k) => k,
  translations: {},
});

async function loadTranslations(lang: string): Promise<Translations> {
  try {
    const mod = await import(`@/lib/translations/${lang}.json`);
    return mod.default as Translations;
  } catch {
    // fallback to English
    try {
      const mod = await import('@/lib/translations/en.json');
      return mod.default as Translations;
    } catch {
      return {};
    }
  }
}

function deepGet(obj: Translations, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

const SUPPORTED_LANGS = [
  'en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'kn', 'ml',
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    getPreferredLanguage()
  );
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    const stored = Cookies.get('preferred_language') || 'en';
    setCurrentLanguage(stored);
    loadTranslations(SUPPORTED_LANGS.includes(stored) ? stored : 'en').then(
      setTranslations
    );
  }, []);

  const changeLanguage = useCallback(async (code: string) => {
    const effectiveLang = SUPPORTED_LANGS.includes(code) ? code : 'en';
    const trans = await loadTranslations(effectiveLang);
    setTranslations(trans);
    setCurrentLanguage(code);
    setPreferredLanguage(code);
    try {
      await authAPI.updateLanguage(code);
    } catch {
      // best-effort: update server if authenticated
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const val = deepGet(translations, key);
      if (val !== undefined) return val;
      return fallback ?? key;
    },
    [translations]
  );

  const value = useMemo(
    () => ({ currentLanguage, changeLanguage, t, translations }),
    [currentLanguage, changeLanguage, t, translations]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
