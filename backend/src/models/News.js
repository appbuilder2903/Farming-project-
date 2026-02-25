'use strict';

const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    content: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['policy', 'weather', 'market', 'export', 'technology', 'general'],
      required: true,
      default: 'general',
    },
    source: {
      name: { type: String, trim: true },
      url: { type: String, trim: true },
      logoUrl: { type: String, trim: true },
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    tags: [{ type: String, trim: true }],
    translations: {
      type: Map,
      of: new mongoose.Schema(
        {
          title: String,
          summary: String,
          content: String,
        },
        { _id: false }
      ),
      default: () => new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

newsSchema.index({ category: 1, publishedAt: -1 });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ title: 'text', summary: 'text', tags: 'text' });
newsSchema.index({ isActive: 1 });

module.exports = mongoose.model('News', newsSchema);
