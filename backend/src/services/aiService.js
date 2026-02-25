'use strict';

const axios = require('axios');
const AIUsageLog = require('../models/AIUsageLog');
const ApiConfig = require('../models/ApiConfig');

// In-memory key cache (refreshed from DB at startup + every 5 min)
const _keyCache = {};

const refreshKeyCache = async () => {
  try {
    const configs = await ApiConfig.find({ isActive: true }).lean();
    for (const cfg of configs) {
      // Re-decrypt each stored key
      const doc = await ApiConfig.findById(cfg._id);
      _keyCache[cfg.service] = doc.getKey();
    }
  } catch (e) {
    // DB not ready yet – env vars will be used directly
  }
};

// Refresh every 5 minutes in production
if (process.env.NODE_ENV !== 'test') {
  setInterval(refreshKeyCache, 5 * 60 * 1000);
  // Initial load (non-blocking)
  setImmediate(refreshKeyCache);
}

// Provider configurations
const PROVIDERS = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
    visionModel: 'gpt-4o',
  },
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnv: 'GEMINI_API_KEY',
    defaultModel: 'gemini-1.5-flash',
    visionModel: 'gemini-1.5-flash',
  },
  perplexity: {
    baseURL: 'https://api.perplexity.ai',
    apiKeyEnv: 'PERPLEXITY_API_KEY',
    defaultModel: 'llama-3.1-sonar-small-128k-online',
    visionModel: 'llama-3.1-sonar-large-128k-online',
  },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    defaultModel: 'openai/gpt-4o-mini',
    visionModel: 'openai/gpt-4o',
  },
  'eden-ai': {
    baseURL: 'https://api.edenai.run/v2',
    apiKeyEnv: 'EDEN_AI_API_KEY',
    defaultModel: 'openai/gpt-4o-mini',
    visionModel: 'openai/gpt-4o',
  },
  longcat: {
    baseURL: 'https://api.longcat.ai/v1',
    apiKeyEnv: 'LONGCAT_AI_API_KEY',
    defaultModel: 'longcat-default',
    visionModel: 'longcat-vision',
  },
  oxlo: {
    baseURL: 'https://api.oxlo.ai/v1',
    apiKeyEnv: 'OXLO_AI_API_KEY',
    defaultModel: 'oxlo-default',
    visionModel: 'oxlo-vision',
  },
};

const getApiKey = (provider) => {
  const cfg = PROVIDERS[provider];
  if (!cfg) return null;
  // DB cache takes priority; fall back to env
  return _keyCache[provider] || process.env[cfg.apiKeyEnv] || null;
};

const getActiveProvider = () => {
  const preferred = process.env.DEFAULT_AI_PROVIDER || 'openai';
  if (getApiKey(preferred)) return preferred;
  // Failover: find first provider with a key
  for (const [name] of Object.entries(PROVIDERS)) {
    if (getApiKey(name)) return name;
  }
  return null;
};

// --- OpenAI-compatible text generation ---
const generateTextOpenAI = async (provider, prompt, systemPrompt, options = {}) => {
  const cfg = PROVIDERS[provider];
  const apiKey = getApiKey(provider);
  const model = options.model || cfg.defaultModel;

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const start = Date.now();
  const response = await axios.post(
    `${cfg.baseURL}/chat/completions`,
    {
      model,
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(provider === 'openrouter' && {
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'Vive Code',
        }),
      },
      timeout: 30000,
    }
  );

  const latency = Date.now() - start;
  const choice = response.data.choices[0];
  const usage = response.data.usage || {};

  return {
    text: choice.message.content.trim(),
    tokens: usage.total_tokens || 0,
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    model,
    latency,
  };
};

// --- Gemini text generation ---
const generateTextGemini = async (prompt, systemPrompt, options = {}) => {
  const apiKey = getApiKey('gemini');
  const cfg = PROVIDERS.gemini;
  const model = options.model || cfg.defaultModel;
  const start = Date.now();

  const contents = [];
  if (systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const response = await axios.post(
    `${cfg.baseURL}/models/${model}:generateContent?key=${apiKey}`,
    {
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 1024,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
      },
    },
    { timeout: 30000 }
  );

  const latency = Date.now() - start;
  const candidate = response.data.candidates[0];
  const text = candidate.content.parts.map((p) => p.text).join('');
  const usage = response.data.usageMetadata || {};

  return {
    text: text.trim(),
    tokens: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
    promptTokens: usage.promptTokenCount || 0,
    completionTokens: usage.candidatesTokenCount || 0,
    model,
    latency,
  };
};

// --- Gemini vision (image analysis) ---
const analyzeImageGemini = async (imageBase64OrUrl, prompt, options = {}) => {
  const apiKey = getApiKey('gemini');
  const cfg = PROVIDERS.gemini;
  const model = options.model || cfg.visionModel;
  const start = Date.now();

  let imagePart;
  if (imageBase64OrUrl.startsWith('http')) {
    // Fetch image and convert
    const imgRes = await axios.get(imageBase64OrUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const mimeType = imgRes.headers['content-type'] || 'image/jpeg';
    const base64 = Buffer.from(imgRes.data).toString('base64');
    imagePart = { inlineData: { data: base64, mimeType } };
  } else {
    const base64 = imageBase64OrUrl.replace(/^data:image\/\w+;base64,/, '');
    imagePart = { inlineData: { data: base64, mimeType: 'image/jpeg' } };
  }

  const response = await axios.post(
    `${cfg.baseURL}/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
      generationConfig: { maxOutputTokens: options.maxTokens || 2048, temperature: 0.3 },
    },
    { timeout: 45000 }
  );

  const latency = Date.now() - start;
  const candidate = response.data.candidates[0];
  const text = candidate.content.parts.map((p) => p.text).join('');

  return { text: text.trim(), tokens: 0, latency, model };
};

// --- OpenAI vision ---
const analyzeImageOpenAI = async (provider, imageBase64OrUrl, prompt, options = {}) => {
  const cfg = PROVIDERS[provider];
  const apiKey = getApiKey(provider);
  const model = options.model || cfg.visionModel;
  const start = Date.now();

  const imageContent = imageBase64OrUrl.startsWith('http')
    ? { type: 'image_url', image_url: { url: imageBase64OrUrl } }
    : {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${imageBase64OrUrl.replace(/^data:image\/\w+;base64,/, '')}` },
      };

  const response = await axios.post(
    `${cfg.baseURL}/chat/completions`,
    {
      model,
      messages: [
        {
          role: 'user',
          content: [imageContent, { type: 'text', text: prompt }],
        },
      ],
      max_tokens: options.maxTokens || 2048,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(provider === 'openrouter' && {
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'Vive Code',
        }),
      },
      timeout: 45000,
    }
  );

  const latency = Date.now() - start;
  const choice = response.data.choices[0];
  const usage = response.data.usage || {};

  return {
    text: choice.message.content.trim(),
    tokens: usage.total_tokens || 0,
    latency,
    model,
  };
};

const logUsage = async (userId, provider, feature, result) => {
  try {
    await AIUsageLog.create({
      userId,
      provider,
      feature,
      model: result.model,
      tokensUsed: result.tokens || 0,
      promptTokens: result.promptTokens || 0,
      completionTokens: result.completionTokens || 0,
      cost: estimateCost(provider, result.tokens || 0),
      latencyMs: result.latency || 0,
      success: true,
    });
  } catch (logErr) {
    console.error('[AIService] Failed to log usage:', logErr.message);
  }
};

const estimateCost = (provider, tokens) => {
  const ratesPer1k = {
    openai: 0.002,
    gemini: 0.000125,
    perplexity: 0.0006,
    openrouter: 0.001,
    'eden-ai': 0.002,
    longcat: 0.001,
    oxlo: 0.001,
  };
  return ((ratesPer1k[provider] || 0.001) * tokens) / 1000;
};

// --- Mock fallback for development without API keys ---
const mockGenerateText = (prompt) => {
  return {
    text: `[Mock AI Response] Processed: "${prompt.substring(0, 50)}..." — Configure AI provider keys in .env for live responses.`,
    tokens: 50,
    promptTokens: 30,
    completionTokens: 20,
    model: 'mock',
    latency: 10,
  };
};

// ====================== PUBLIC API ======================

/**
 * Generate text using the active AI provider with automatic failover.
 */
const generateText = async (prompt, systemPrompt = null, options = {}, userId = null) => {
  const provider = options.provider || getActiveProvider();

  if (!provider) {
    const result = mockGenerateText(prompt);
    return result;
  }

  try {
    let result;
    if (provider === 'gemini') {
      result = await generateTextGemini(prompt, systemPrompt, options);
    } else {
      result = await generateTextOpenAI(provider, prompt, systemPrompt, options);
    }

    if (userId) await logUsage(userId, provider, options.feature || 'general', result);
    return result;
  } catch (err) {
    console.error(`[AIService] Provider ${provider} failed:`, err.message);

    // Failover: try another provider
    for (const [fallback] of Object.entries(PROVIDERS)) {
      if (fallback === provider) continue;
      if (!getApiKey(fallback)) continue;

      try {
        let result;
        if (fallback === 'gemini') {
          result = await generateTextGemini(prompt, systemPrompt, options);
        } else {
          result = await generateTextOpenAI(fallback, prompt, systemPrompt, options);
        }

        if (userId) await logUsage(userId, fallback, options.feature || 'general', result);
        return result;
      } catch (fallbackErr) {
        console.error(`[AIService] Fallback ${fallback} also failed:`, fallbackErr.message);
      }
    }

    return mockGenerateText(prompt);
  }
};

/**
 * Analyze an image (crop disease detection, etc.).
 */
const analyzeImage = async (imageBase64OrUrl, prompt, options = {}, userId = null) => {
  const provider = options.provider || getActiveProvider();

  const visionSupportedProviders = ['gemini', 'openai', 'openrouter'];
  const visionProvider = visionSupportedProviders.find(
    (p) => p === provider && getApiKey(p)
  ) || visionSupportedProviders.find((p) => getApiKey(p));

  if (!visionProvider) {
    return mockGenerateText(prompt);
  }

  try {
    let result;
    if (visionProvider === 'gemini') {
      result = await analyzeImageGemini(imageBase64OrUrl, prompt, options);
    } else {
      result = await analyzeImageOpenAI(visionProvider, imageBase64OrUrl, prompt, options);
    }

    if (userId) await logUsage(userId, visionProvider, options.feature || 'crop_disease', result);
    return result;
  } catch (err) {
    console.error('[AIService] Vision analysis failed:', err.message);
    return mockGenerateText(prompt);
  }
};

/**
 * Predict price using AI-enhanced analysis.
 */
const predictPrice = async (commodity, market, historicalData, options = {}, userId = null) => {
  const systemPrompt = `You are an expert agricultural commodity price analyst for Indian markets. 
Analyze the provided historical price data and predict future prices. 
Return ONLY a valid JSON object with the following structure:
{
  "predictions": [
    {"days": 7, "price": <number>, "confidence": <0-100>, "riskLevel": "<low|medium|high>", "trend": "<bullish|bearish|neutral>"},
    {"days": 15, "price": <number>, "confidence": <0-100>, "riskLevel": "<low|medium|high>", "trend": "<bullish|bearish|neutral>"},
    {"days": 30, "price": <number>, "confidence": <0-100>, "riskLevel": "<low|medium|high>", "trend": "<bullish|bearish|neutral>"}
  ],
  "analysis": "<brief market analysis>"
}`;

  const prompt = `Commodity: ${commodity}
Market: ${market}
Historical prices (last 30 days in INR/quintal):
${historicalData.map((d) => `${d.date}: ₹${d.price}`).join('\n')}

Predict prices for 7, 15, and 30 days ahead. Consider seasonal patterns and market trends.`;

  const result = await generateText(prompt, systemPrompt, { ...options, feature: 'price_prediction', maxTokens: 512, temperature: 0.2 }, userId);

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through to default
  }

  return { predictions: [], analysis: result.text };
};

/**
 * Translate text to a target language.
 */
const translateText = async (text, targetLanguage, sourceLanguage = 'en', userId = null) => {
  const languageNames = {
    en: 'English', hi: 'Hindi', pa: 'Punjabi', mr: 'Marathi',
    gu: 'Gujarati', te: 'Telugu', ta: 'Tamil', kn: 'Kannada',
    bn: 'Bengali', or: 'Odia',
  };

  const targetName = languageNames[targetLanguage] || targetLanguage;
  const sourceName = languageNames[sourceLanguage] || sourceLanguage;

  if (sourceLanguage === targetLanguage) return { translatedText: text };

  const prompt = `Translate the following ${sourceName} text to ${targetName}. Return ONLY the translated text with no explanation or prefix:\n\n${text}`;
  const result = await generateText(prompt, null, { feature: 'translation', maxTokens: 1024, temperature: 0.1 }, userId);

  return { translatedText: result.text, tokensUsed: result.tokens };
};

/**
 * Summarize a news article in the given language.
 */
const summarizeNews = async (article, language = 'en', userId = null) => {
  const languageNames = {
    en: 'English', hi: 'Hindi', pa: 'Punjabi', mr: 'Marathi',
    gu: 'Gujarati', te: 'Telugu', ta: 'Tamil', kn: 'Kannada',
    bn: 'Bengali', or: 'Odia',
  };

  const langName = languageNames[language] || 'English';
  const prompt = `Summarize the following agricultural news article in ${langName} in 2-3 sentences, focusing on what is most relevant for Indian farmers:

Title: ${article.title}
Content: ${article.content || article.summary || ''}

Return ONLY the summary.`;

  const result = await generateText(prompt, null, { feature: 'news_summary', maxTokens: 256, temperature: 0.5 }, userId);

  return { summary: result.text, tokensUsed: result.tokens };
};

module.exports = { generateText, analyzeImage, predictPrice, translateText, summarizeNews, getActiveProvider };
