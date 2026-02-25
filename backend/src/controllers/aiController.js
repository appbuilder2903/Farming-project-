'use strict';

const aiService = require('../services/aiService');
const CropReport = require('../models/CropReport');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const CROP_DISEASE_SYSTEM_PROMPT = `You are an expert agricultural scientist and plant pathologist specializing in Indian crops. 
Analyze the provided crop image and return a detailed diagnosis in the following JSON format ONLY:
{
  "disease": {
    "name": "<disease name or 'Healthy' if no disease>",
    "severity": "<none|mild|moderate|severe|critical>",
    "confidence": <0-100>,
    "affectedArea": <0-100>
  },
  "cropType": "<identified crop>",
  "diagnosis": "<detailed diagnosis>",
  "treatment": "<specific treatment steps>",
  "preventions": ["<prevention 1>", "<prevention 2>", "<prevention 3>"],
  "recommendedProducts": [
    {"name": "<product>", "type": "<pesticide|fungicide|fertilizer|organic>", "dosage": "<dosage>"}
  ]
}`;

/**
 * Analyze crop disease from image.
 */
const analyzeCropDisease = async (req, res) => {
  const { imageUrl, imageBase64, language = 'en', cropType } = req.body;

  if (!imageUrl && !imageBase64) {
    return sendError(res, 'Either imageUrl or imageBase64 is required', 400);
  }

  try {
    const image = imageBase64 || imageUrl;
    const prompt = `Analyze this ${cropType ? cropType + ' ' : ''}crop image for diseases, pest damage, or nutrient deficiencies. Provide diagnosis in ${language === 'en' ? 'English' : language}.`;

    const result = await aiService.analyzeImage(
      image,
      prompt,
      {
        feature: 'crop_disease',
        systemPrompt: CROP_DISEASE_SYSTEM_PROMPT,
        maxTokens: 1024,
        temperature: 0.2,
      },
      req.user._id
    );

    let parsedDiagnosis = null;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedDiagnosis = JSON.parse(jsonMatch[0]);
    } catch {
      // Non-JSON response — use raw text
    }

    const reportData = {
      farmerId: req.user._id,
      imageUrl: imageUrl || null,
      language,
      aiProvider: aiService.getActiveProvider() || 'mock',
    };

    if (parsedDiagnosis) {
      reportData.diagnosis = parsedDiagnosis.diagnosis;
      reportData.disease = parsedDiagnosis.disease;
      reportData.treatment = parsedDiagnosis.treatment;
      reportData.preventions = parsedDiagnosis.preventions || [];
      reportData.recommendedProducts = parsedDiagnosis.recommendedProducts || [];
      reportData.cropType = parsedDiagnosis.cropType || cropType;
    } else {
      reportData.diagnosis = result.text;
    }

    const report = await CropReport.create(reportData);

    return sendSuccess(
      res,
      { report, rawResponse: parsedDiagnosis || result.text },
      'Crop disease analysis complete'
    );
  } catch (err) {
    console.error('[AIController] analyzeCropDisease error:', err);
    return sendError(res, 'Crop disease analysis failed', 500);
  }
};

/**
 * AI-enhanced price prediction.
 */
const predictPrice = async (req, res) => {
  const { commodity, market, historicalData } = req.body;

  if (!commodity || !market) {
    return sendError(res, 'commodity and market are required', 400);
  }

  try {
    const history = historicalData || [];
    const aiPrediction = await aiService.predictPrice(
      commodity,
      market,
      history,
      { feature: 'price_prediction' },
      req.user._id
    );

    return sendSuccess(res, aiPrediction, 'Price prediction generated');
  } catch (err) {
    console.error('[AIController] predictPrice error:', err);
    return sendError(res, 'Price prediction failed', 500);
  }
};

/**
 * AI chatbot in user's preferred language.
 */
const chatbot = async (req, res) => {
  const { message, conversationHistory = [], language } = req.body;

  if (!message || !message.trim()) {
    return sendError(res, 'message is required', 400);
  }

  const userLanguage = language || req.user.preferredLanguage || 'en';

  const LANGUAGE_NAMES = {
    en: 'English', hi: 'Hindi', pa: 'Punjabi', mr: 'Marathi',
    gu: 'Gujarati', te: 'Telugu', ta: 'Tamil', kn: 'Kannada',
    bn: 'Bengali', or: 'Odia',
  };

  const langName = LANGUAGE_NAMES[userLanguage] || 'English';

  const systemPrompt = `You are Vive Code, an expert agricultural assistant for Indian farmers. 
You help farmers with crop advice, pest management, weather impacts, government schemes, market prices, and best farming practices.
Always respond in ${langName}. Be concise, practical, and use simple language that farmers can understand.
Provide actionable advice specific to Indian agricultural conditions.`;

  try {
    const contextMessages = conversationHistory
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Farmer' : 'Vive Code'}: ${m.content}`)
      .join('\n');

    const fullPrompt = contextMessages
      ? `Previous conversation:\n${contextMessages}\n\nFarmer: ${message}`
      : message;

    const result = await aiService.generateText(
      fullPrompt,
      systemPrompt,
      { feature: 'chatbot', maxTokens: 512, temperature: 0.7 },
      req.user._id
    );

    return sendSuccess(
      res,
      {
        reply: result.text,
        language: userLanguage,
        tokensUsed: result.tokens,
      },
      'Chatbot response generated'
    );
  } catch (err) {
    console.error('[AIController] chatbot error:', err);
    return sendError(res, 'Chatbot request failed', 500);
  }
};

/**
 * Translate text to target language.
 */
const translateText = async (req, res) => {
  const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

  if (!text || !targetLanguage) {
    return sendError(res, 'text and targetLanguage are required', 400);
  }

  try {
    const result = await aiService.translateText(
      text,
      targetLanguage,
      sourceLanguage,
      req.user._id
    );

    return sendSuccess(res, result, 'Translation complete');
  } catch (err) {
    console.error('[AIController] translateText error:', err);
    return sendError(res, 'Translation failed', 500);
  }
};

module.exports = { analyzeCropDisease, predictPrice, chatbot, translateText };
