'use strict';

const axios = require('axios');
const News = require('../models/News');
const aiService = require('./aiService');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

const AGRI_KEYWORDS = [
  'agriculture', 'farmer', 'crop', 'mandi', 'kisan', 'farming',
  'MSP', 'minimum support price', 'irrigation', 'fertilizer', 'pesticide',
  'harvest', 'soil', 'agri', 'grain', 'rice', 'wheat', 'cotton', 'sugarcane',
];

const CATEGORY_KEYWORDS = {
  policy: ['policy', 'government', 'scheme', 'budget', 'subsidy', 'regulation', 'ministry', 'MSP', 'law', 'act'],
  weather: ['rainfall', 'drought', 'flood', 'monsoon', 'cyclone', 'temperature', 'weather', 'climate', 'heatwave', 'frost'],
  market: ['price', 'mandi', 'market', 'export', 'import', 'trade', 'commodity', 'demand', 'supply', 'rate'],
  export: ['export', 'import', 'trade', 'global', 'WTO', 'shipment', 'ban', 'duty', 'tariff'],
  technology: ['technology', 'drone', 'AI', 'satellite', 'precision', 'IoT', 'digital', 'app', 'startup'],
};

/**
 * Categorize a news article based on title and summary keywords.
 */
const categorizeNews = (article) => {
  const text = `${article.title} ${article.description || article.summary || ''}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'general';
};

/**
 * Fetch agricultural news from NewsAPI.
 */
const fetchAgriNews = async () => {
  if (!NEWS_API_KEY) {
    return generateMockNews();
  }

  try {
    const query = AGRI_KEYWORDS.slice(0, 5).join(' OR ');
    const response = await axios.get(NEWS_API_URL, {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 30,
        apiKey: NEWS_API_KEY,
      },
      timeout: 15000,
    });

    const articles = response.data.articles || [];

    const saved = [];
    for (const article of articles) {
      if (!article.title || article.title === '[Removed]') continue;

      const category = categorizeNews(article);
      const existingNews = await News.findOne({
        title: article.title,
      }).lean();

      if (existingNews) {
        saved.push(existingNews);
        continue;
      }

      const news = await News.create({
        title: article.title,
        summary: article.description || '',
        content: article.content || article.description || '',
        category,
        source: {
          name: article.source?.name || 'Unknown',
          url: article.url || '',
        },
        imageUrl: article.urlToImage || '',
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
        tags: AGRI_KEYWORDS.filter((kw) =>
          `${article.title} ${article.description || ''}`.toLowerCase().includes(kw.toLowerCase())
        ).slice(0, 5),
      });

      saved.push(news);
    }

    return saved;
  } catch (err) {
    console.error('[NewsService] fetchAgriNews error:', err.message);
    return generateMockNews();
  }
};

/**
 * Summarize and optionally translate a news article using AI.
 */
const summarizeAndTranslate = async (article, language = 'en', userId = null) => {
  const { summary } = await aiService.summarizeNews(article, language, userId);

  let translatedTitle = article.title;
  if (language !== 'en') {
    const titleTranslation = await aiService.translateText(
      article.title,
      language,
      'en',
      userId
    );
    translatedTitle = titleTranslation.translatedText;
  }

  return { translatedTitle, summary };
};

/**
 * Get latest news from DB with optional category filter and pagination.
 */
const getNewsByCategory = async (category = null, page = 1, limit = 10) => {
  const query = { isActive: true };
  if (category && category !== 'all') query.category = category;

  const skip = (page - 1) * limit;
  const [news, total] = await Promise.all([
    News.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
    News.countDocuments(query),
  ]);

  return {
    news,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Generate a daily AI briefing of recent news.
 */
const generateDailyBriefing = async (language = 'en', userId = null) => {
  const recentNews = await News.find({ isActive: true })
    .sort({ publishedAt: -1 })
    .limit(5)
    .lean();

  if (!recentNews.length) {
    return {
      briefing: 'No recent agricultural news available.',
      language,
      generatedAt: new Date(),
    };
  }

  const headlines = recentNews
    .map((n, i) => `${i + 1}. [${n.category.toUpperCase()}] ${n.title}`)
    .join('\n');

  const result = await aiService.generateText(
    `Create a concise daily agricultural news briefing for Indian farmers based on these headlines:\n${headlines}\n\nWrite in ${language === 'en' ? 'English' : language} in 3-4 sentences, highlighting what's most relevant for farmers today.`,
    'You are an agricultural news anchor summarizing the day\'s key farming news for Indian farmers in a friendly, helpful tone.',
    { feature: 'news_summary', maxTokens: 300, temperature: 0.6 },
    userId
  );

  return {
    briefing: result.text,
    language,
    headlines: recentNews.map((n) => ({ id: n._id, title: n.title, category: n.category })),
    generatedAt: new Date(),
  };
};

const generateMockNews = () => {
  const mockArticles = [
    {
      title: 'Government Increases MSP for Rabi Crops by 5%',
      summary: 'The Union Cabinet approved an increase in Minimum Support Price for wheat and mustard ahead of the rabi season.',
      category: 'policy',
      source: { name: 'AgriNews India', url: 'https://example.com' },
      publishedAt: new Date(),
      isActive: true,
    },
    {
      title: 'IMD Predicts Above-Normal Monsoon for 2024',
      summary: 'India Meteorological Department forecasts above-normal rainfall which could boost kharif crop production.',
      category: 'weather',
      source: { name: 'Weather India', url: 'https://example.com' },
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: 'Onion Prices Surge 30% at Major Mandis',
      summary: 'Retail onion prices have surged due to lower arrivals at Nasik and Pune mandis following unseasonal rains.',
      category: 'market',
      source: { name: 'Commodity Insights', url: 'https://example.com' },
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: 'India Bans Wheat Export to Control Domestic Prices',
      summary: 'Government has imposed an export ban on wheat citing food security concerns and rising domestic prices.',
      category: 'export',
      source: { name: 'Trade India', url: 'https://example.com' },
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: 'PM Kisan 17th Installment Released to 9 Crore Farmers',
      summary: 'Prime Minister released the 17th installment of PM-KISAN scheme, transferring ₹2000 to eligible farmers.',
      category: 'policy',
      source: { name: 'PIB India', url: 'https://example.com' },
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ];

  return mockArticles;
};

module.exports = { fetchAgriNews, categorizeNews, summarizeAndTranslate, getNewsByCategory, generateDailyBriefing };
