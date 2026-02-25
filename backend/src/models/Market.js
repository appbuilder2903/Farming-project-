'use strict';

const mongoose = require('mongoose');

const commoditySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    currentPrice: { type: Number },
    unit: { type: String, default: 'quintal' },
    season: { type: String, trim: true },
  },
  { _id: false }
);

const marketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v) => v.length === 2,
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      website: { type: String, trim: true },
    },
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
    commodities: [commoditySchema],
    operatingHours: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '18:00' },
      days: [{ type: String }],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

marketSchema.index({ location: '2dsphere' });
marketSchema.index({ state: 1, district: 1 });
marketSchema.index({ name: 'text' });
marketSchema.index({ isActive: 1 });

module.exports = mongoose.model('Market', marketSchema);
