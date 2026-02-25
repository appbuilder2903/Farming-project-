'use strict';

const newsService = require('../services/newsService');
const News = require('../models/News');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Get paginated news with optional category filter.
 * Query params: category, page, limit, language
 */
const getNews = async (req, res) => {
  const { category, page = 1, limit = 10, language } = req.query;

  const userLanguage = language || req.user?.preferredLanguage || 'en';

  try {
    const { news, pagination } = await newsService.getNewsByCategory(
      category || null,
      parseInt(page),
      parseInt(limit)
    );

    // Attach translation if user language is not English
    const translatedNews = news.map((article) => {
      if (userLanguage !== 'en' && article.translations?.get) {
        const translation = article.translations.get(userLanguage);
        if (translation) {
          return {
            ...article,
            title: translation.title || article.title,
            summary: translation.summary || article.summary,
          };
        }
      }
      return article;
    });

    return sendSuccess(res, { news: translatedNews, pagination }, 'News retrieved');
  } catch (err) {
    console.error('[NewsController] getNews error:', err);
    return sendError(res, 'Failed to fetch news', 500);
  }
};

/**
 * Get AI-summarized daily briefing in user's language.
 */
const getDailyBriefing = async (req, res) => {
  const language = req.query.language || req.user?.preferredLanguage || 'en';

  try {
    // Refresh news from external API in background
    newsService.fetchAgriNews().catch((err) =>
      console.error('[NewsController] Background news fetch failed:', err.message)
    );

    const briefing = await newsService.generateDailyBriefing(language, req.user?._id);

    return sendSuccess(res, briefing, 'Daily briefing generated');
  } catch (err) {
    console.error('[NewsController] getDailyBriefing error:', err);
    return sendError(res, 'Failed to generate daily briefing', 500);
  }
};

/**
 * Get a specific news article by ID, with optional translation.
 */
const getNewsById = async (req, res) => {
  const language = req.query.language || req.user?.preferredLanguage || 'en';

  try {
    const article = await News.findById(req.params.id).lean();

    if (!article) {
      return sendError(res, 'News article not found', 404);
    }

    // Increment view count
    News.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

    let responseArticle = { ...article };

    if (language !== 'en') {
      const translationMap = article.translations;
      const cachedTranslation = translationMap instanceof Map
        ? translationMap.get(language)
        : translationMap?.[language];

      if (cachedTranslation) {
        responseArticle.title = cachedTranslation.title || article.title;
        responseArticle.summary = cachedTranslation.summary || article.summary;
        responseArticle.content = cachedTranslation.content || article.content;
      } else {
        // Generate and cache translation asynchronously
        newsService.summarizeAndTranslate(article, language, req.user?._id)
          .then(async ({ translatedTitle, summary }) => {
            await News.findByIdAndUpdate(req.params.id, {
              $set: {
                [`translations.${language}`]: {
                  title: translatedTitle,
                  summary,
                },
              },
            });
          })
          .catch((e) => console.error('[NewsController] Translation cache error:', e.message));
      }
    }

    return sendSuccess(res, { article: responseArticle }, 'News article retrieved');
  } catch (err) {
    if (err.name === 'CastError') return sendError(res, 'Invalid news ID', 400);
    console.error('[NewsController] getNewsById error:', err);
    return sendError(res, 'Failed to fetch news article', 500);
  }
};

module.exports = { getNews, getDailyBriefing, getNewsById };
