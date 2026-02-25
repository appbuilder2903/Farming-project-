import { useContext } from 'react';
import { LanguageContext } from '@/context/LanguageContext';

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  return {
    t: ctx.t,
    currentLanguage: ctx.currentLanguage,
    changeLanguage: ctx.changeLanguage,
  };
}
