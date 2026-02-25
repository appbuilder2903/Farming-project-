'use strict';

const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    commodity: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    market: {
      type: String,
      required: true,
      trim: true,
    },
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      sparse: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    minPrice: {
      type: Number,
      min: 0,
    },
    maxPrice: {
      type: Number,
      min: 0,
    },
    modalPrice: {
      type: Number,
      min: 0,
    },
    arrivalQty: {
      type: Number,
      default: 0,
      comment: 'Arrival quantity in tonnes',
    },
    unit: {
      type: String,
      default: 'quintal',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

priceHistorySchema.index({ commodity: 1, market: 1, date: -1 });
priceHistorySchema.index({ state: 1, date: -1 });
priceHistorySchema.index({ date: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
