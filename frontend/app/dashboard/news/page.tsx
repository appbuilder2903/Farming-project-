'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import api, { newsAPI } from '@/lib/api';
import type { NewsArticle, DailyBriefing, APIResponse } from '@/types';

const CATEGORIES = ['all', 'policy', 'weather', 'market', 'export'] as const;

const CATEGORY_ICONS: Record<string, string> = {
  all: '📰',
  policy: '📜',
  weather: '🌦️',
  market: '📈',
  export: '🚢',
};

const fetcher = (url: string) => api.get(url).then((r) => r.data);

function NewsCard({ article, index }: { article: NewsArticle; index: number }) {
  const { t } = useTranslation();
  const categoryColor: Record<string, string> = {
    policy: 'bg-blue-100 text-blue-700',
    weather: 'bg-cyan-100 text-cyan-700',
    market: 'bg-primary-100 text-primary-700',
    export: 'bg-purple-100 text-purple-700',
    general: 'bg-gray-100 text-gray-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="agri-card hover:shadow-md group"
    >
      <div className="flex items-start gap-4">
        {article.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-20 h-16 object-cover rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-20 h-16 bg-primary-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {CATEGORY_ICONS[article.category] || '📰'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                categoryColor[article.category] || categoryColor.general
              }`}
            >
              {CATEGORY_ICONS[article.category]} {article.category}
            </span>
            <span className="text-xs text-primary-400">
              {new Date(article.publishedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
          <h3 className="font-semibold text-primary-900 text-sm leading-snug line-clamp-2">
            {article.titleLocal || article.title}
          </h3>
          <p className="text-primary-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {article.summaryLocal || article.summary}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-primary-400">📡 {article.source}</span>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {t('news.readMore')} →
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NewsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const newsParams = new URLSearchParams();
  if (activeCategory !== 'all') newsParams.set('category', activeCategory);
  if (user?.preferredLanguage) newsParams.set('language', user.preferredLanguage);
  if (search) newsParams.set('q', search);

  const { data: newsData, isLoading } = useSWR<APIResponse<NewsArticle[]>>(
    `/news?${newsParams.toString()}`,
    fetcher,
    { refreshInterval: 300_000 }
  );

  const { data: briefingData } = useSWR<APIResponse<DailyBriefing>>(
    `/news/briefing?language=${user?.preferredLanguage || 'en'}`,
    fetcher
  );

  const articles = newsData?.data ?? [];
  const briefing = briefingData?.data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">{t('news.title')}</h1>
        <p className="text-primary-500 text-sm mt-1">{t('news.subtitle')}</p>
      </div>

      {/* Daily Briefing Card */}
      {briefing && (
        <div className="agri-card bg-gradient-to-r from-primary-800 to-primary-700 text-white border-0">
          <div className="flex items-start gap-3">
            <span className="text-3xl flex-shrink-0">📋</span>
            <div>
              <h2 className="font-bold text-white mb-2">{t('news.dailyBriefing')}</h2>
              {briefing.topStory && (
                <p className="text-primary-100 text-sm mb-2 leading-relaxed">
                  {briefing.topStory}
                </p>
              )}
              {briefing.highlights && briefing.highlights.length > 0 && (
                <ul className="space-y-1">
                  {briefing.highlights.slice(0, 3).map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-primary-200">
                      <span>•</span>
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search + Category Tabs */}
      <div className="agri-card space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('news.search')}
          className="agri-input"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-primary-700 text-white'
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200'
              }`}
            >
              {CATEGORY_ICONS[cat]}
              {t(`news.categories.${cat}`, cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-primary-400">
          <span className="text-5xl block mb-3">📭</span>
          <p>{t('news.noNews')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article, i) => (
            <NewsCard key={article._id} article={article} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
