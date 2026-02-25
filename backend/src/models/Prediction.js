'use strict';

const mongoose = require('mongoose');

const predictionEntrySchema = new mongoose.Schema(
  {
    days: {
      type: Number,
      enum: [7, 15, 30],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    lowerBound: {
      type: Number,
      min: 0,
    },
    upperBound: {
      type: Number,
      min: 0,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    trend: {
      type: String,
      enum: ['bullish', 'bearish', 'neutral'],
      default: 'neutral',
    },
  },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
  {
    commodity: {
      type: String,
      required: true,
      trim: true,
    },
    market: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    currentPrice: {
      type: Number,
      min: 0,
    },
    predictions: [predictionEntrySchema],
    modelUsed: {
      type: String,
      enum: ['moving_average', 'arima', 'lstm', 'ai_enhanced'],
      default: 'moving_average',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

predictionSchema.index({ commodity: 1, market: 1, generatedAt: -1 });
predictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Prediction', predictionSchema);
