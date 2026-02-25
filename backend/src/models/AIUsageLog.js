'use strict';

const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['openai', 'gemini', 'perplexity', 'openrouter', 'eden-ai', 'longcat', 'oxlo', 'mock'],
      required: true,
    },
    feature: {
      type: String,
      enum: ['crop_disease', 'price_prediction', 'chatbot', 'translation', 'news_summary', 'general'],
      required: true,
    },
    model: {
      type: String,
      trim: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'Cost in USD',
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

aiUsageLogSchema.index({ userId: 1, timestamp: -1 });
aiUsageLogSchema.index({ provider: 1, timestamp: -1 });
aiUsageLogSchema.index({ feature: 1, timestamp: -1 });
// TTL: keep logs for 90 days
aiUsageLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);
