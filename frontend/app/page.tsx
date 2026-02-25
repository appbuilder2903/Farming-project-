'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import LoginButton from '@/components/auth/LoginButton';
import { LANGUAGES, TOP_LANGUAGES } from '@/lib/languages';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const FEATURES = [
  { key: 'disease', icon: '🔬', color: 'from-emerald-500 to-green-600' },
  { key: 'prices', icon: '📊', color: 'from-yellow-500 to-amber-600' },
  { key: 'markets', icon: '🏪', color: 'from-blue-500 to-cyan-600' },
  { key: 'dealers', icon: '🤝', color: 'from-purple-500 to-violet-600' },
  { key: 'news', icon: '📰', color: 'from-orange-500 to-red-500' },
  { key: 'satellite', icon: '🛰️', color: 'from-teal-500 to-emerald-600' },
];

const TAGLINES = [
  { lang: 'Hindi', text: 'किसान का साथी, खेत का मार्गदर्शक' },
  { lang: 'Bengali', text: 'কৃষকের সেরা বন্ধু' },
  { lang: 'Tamil', text: 'விவசாயியின் நண்பன்' },
  { lang: 'Telugu', text: 'రైతు మిత్రుడు' },
  { lang: 'Marathi', text: 'शेतकऱ्याचा विश्वासू सोबती' },
  { lang: 'Gujarati', text: 'ખેડૂતનો વિશ્વાસુ સાથી' },
];

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=604800; samesite=lax`;
      toast.success('Login successful! Welcome to KisanSaathi.');
      router.push('/dashboard');
    }
    if (error) {
      toast.error('Login failed. Please try again.');
    }
  }, [searchParams, router]);

  const topLangObjs = TOP_LANGUAGES.map(
    (c) => LANGUAGES.find((l) => l.code === c)!
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-hero-gradient text-white">
      {/* Language selector strip */}
      <div className="bg-primary-950/60 border-b border-primary-800/40 py-2 px-4 flex items-center justify-end gap-2 flex-wrap">
        <span className="text-primary-300 text-xs mr-1">🌐 Language:</span>
        {topLangObjs.slice(0, 8).map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`text-xs px-2.5 py-1 rounded-full transition-all ${
              currentLanguage === lang.code
                ? 'bg-accent-500 text-white font-semibold'
                : 'bg-primary-800/50 text-primary-300 hover:bg-primary-700/50'
            }`}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 text-8xl opacity-10 rotate-12 select-none">🌾</div>
          <div className="absolute top-40 right-20 text-6xl opacity-10 -rotate-12 select-none">🚜</div>
          <div className="absolute bottom-20 left-1/4 text-7xl opacity-10 rotate-6 select-none">🌱</div>
          <div className="absolute top-1/3 right-1/3 text-5xl opacity-10 select-none">☀️</div>
          <div className="absolute bottom-10 right-10 text-6xl opacity-10 -rotate-6 select-none">🏡</div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 text-center">
          {/* Logo & Brand */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-400/20 rounded-full border-2 border-accent-400/40 mb-4 text-5xl">
              🌾
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
              {t('app.name', 'KisanSaathi Bharat')}
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="h-px w-12 bg-accent-400/60" />
              <span className="text-accent-300 text-sm font-medium uppercase tracking-widest">
                {t('app.tagline', 'Agri Intelligence Platform')}
              </span>
              <span className="h-px w-12 bg-accent-400/60" />
            </div>
            <p className="text-primary-200 text-lg">
              {t('app.tagline2', 'Smart Farming for Every Indian Farmer')}
            </p>
          </motion.div>

          {/* Rotating taglines in Indian languages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {TAGLINES.map((item) => (
              <span
                key={item.lang}
                className="text-sm text-primary-300 bg-primary-800/30 px-3 py-1 rounded-full border border-primary-700/40"
              >
                {item.text}
              </span>
            ))}
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-1">
              {t('auth.loginTitle', 'Welcome to KisanSaathi')}
            </h2>
            <p className="text-primary-200 text-sm mb-7">
              {t('auth.loginSubtitle', 'Sign in to access AI-powered farming intelligence')}
            </p>

            <div className="space-y-3">
              <LoginButton
                provider="google"
                href={`${API_URL}/auth/google`}
                label={`${t('auth.loginWith', 'Login with')} ${t('auth.google', 'Google')}`}
              />
              <LoginButton
                provider="github"
                href={`${API_URL}/auth/github`}
                label={`${t('auth.loginWith', 'Login with')} ${t('auth.github', 'GitHub')}`}
              />
              <LoginButton
                provider="microsoft"
                href={`${API_URL}/auth/microsoft`}
                label={`${t('auth.loginWith', 'Login with')} ${t('auth.microsoft', 'Microsoft')}`}
              />
            </div>

            <div className="mt-6 flex items-center gap-2 justify-center text-primary-300 text-xs">
              <span>🔒</span>
              <span>{t('auth.secureLogin', 'Secure OAuth login – no password needed')}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-primary-950/50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-white mb-3"
          >
            Everything a Farmer Needs
          </motion.h2>
          <p className="text-center text-primary-300 mb-12">
            6 powerful AI tools in one platform
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  {feat.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {t(`features.${feat.key}.title`)}
                </h3>
                <p className="text-primary-300 text-sm leading-relaxed">
                  {t(`features.${feat.key}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-accent-600/20 border-y border-accent-500/20 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '7,000+', label: 'Mandis Covered' },
            { value: '121', label: 'Indian Languages' },
            { value: '95%+', label: 'Disease Accuracy' },
            { value: '24/7', label: 'Satellite Updates' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-accent-300">{stat.value}</div>
              <div className="text-primary-300 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-950 py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-2xl">🌾</span>
            <span className="text-white font-bold">KisanSaathi Bharat</span>
          </div>
          <p className="text-primary-400 text-sm mb-4">
            Empowering Indian farmers with AI-powered agricultural intelligence
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-primary-500">
            <span className="bg-primary-800 px-3 py-1 rounded-full">
              🎯 UN SDG 2 – Zero Hunger
            </span>
            <span className="bg-primary-800 px-3 py-1 rounded-full">
              🌱 SDG 8 – Decent Work
            </span>
            <span className="bg-primary-800 px-3 py-1 rounded-full">
              🔬 SDG 9 – Innovation
            </span>
          </div>
          <p className="text-primary-600 text-xs mt-4">
            © {new Date().getFullYear()} KisanSaathi Bharat. Built with ❤️ for Indian Farmers.
          </p>
        </div>
      </footer>
    </div>
  );
}
