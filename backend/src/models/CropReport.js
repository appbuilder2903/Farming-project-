'use strict';

const mongoose = require('mongoose');

const cropReportSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    imageBase64: {
      type: String,
      select: false,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    disease: {
      name: {
        type: String,
        trim: true,
      },
      severity: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe', 'critical'],
        default: 'none',
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      affectedArea: {
        type: Number,
        min: 0,
        max: 100,
        comment: 'Percentage of crop affected',
      },
    },
    cropType: {
      type: String,
      trim: true,
    },
    treatment: {
      type: String,
      trim: true,
    },
    preventions: [
      {
        type: String,
        trim: true,
      },
    ],
    recommendedProducts: [
      {
        name: { type: String, trim: true },
        type: { type: String, enum: ['pesticide', 'fungicide', 'fertilizer', 'organic'] },
        dosage: { type: String, trim: true },
      },
    ],
    language: {
      type: String,
      default: 'en',
    },
    aiProvider: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

cropReportSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('CropReport', cropReportSchema);
