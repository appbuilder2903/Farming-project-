'use strict';

const mongoose = require('mongoose');

const dealerCommoditySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    pricePerQuintal: { type: Number, required: true, min: 0 },
    minQuantity: { type: Number, default: 1 },
    unit: { type: String, default: 'quintal' },
    quality: {
      type: String,
      enum: ['A', 'B', 'C', 'FAQ'],
      default: 'FAQ',
    },
  },
  { _id: false }
);

const dealerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    marketName: {
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
    commodities: [dealerCommoditySchema],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    transactionVolume: {
      type: Number,
      default: 0,
      comment: 'Total volume in quintals transacted in the last 30 days',
    },
    complaints: {
      type: Number,
      default: 0,
    },
    contact: {
      phone: { type: String, trim: true },
      alternatePhone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rank: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Rank formula:
 *   rank = (avgCommodityPrice * 0.4) + (rating * 20 * 0.3) + (log10(volume+1) * 10 * 0.2) - (complaints * 5 * 0.1)
 */
dealerSchema.methods.computeRank = function () {
  const avgPrice =
    this.commodities.length > 0
      ? this.commodities.reduce((sum, c) => sum + c.pricePerQuintal, 0) /
        this.commodities.length
      : 0;

  const normalizedPrice = Math.min(avgPrice / 100, 100);
  const normalizedRating = this.rating * 20;
  const normalizedVolume = Math.log10(this.transactionVolume + 1) * 10;
  const penaltyComplaints = this.complaints * 5;

  this.rank =
    normalizedPrice * 0.4 +
    normalizedRating * 0.3 +
    normalizedVolume * 0.2 -
    penaltyComplaints * 0.1;

  return this.rank;
};

dealerSchema.pre('save', function (next) {
  this.computeRank();
  next();
});

dealerSchema.index({ state: 1, district: 1 });
dealerSchema.index({ rank: -1 });
dealerSchema.index({ rating: -1 });
dealerSchema.index({ isActive: 1 });
dealerSchema.index({ 'commodities.name': 1 });

module.exports = mongoose.model('Dealer', dealerSchema);
