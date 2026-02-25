'use strict';

const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    landArea: { type: Number, default: 0 },
    landUnit: { type: String, enum: ['acres', 'hectares', 'bigha'], default: 'acres' },
    location: {
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      village: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    primaryCrops: [{ type: String, trim: true }],
    irrigationType: {
      type: String,
      enum: ['rainfed', 'irrigated', 'mixed'],
      default: 'rainfed',
    },
    soilType: { type: String, trim: true },
    annualIncome: { type: Number },
    phoneNumber: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    oauthProvider: {
      type: String,
      enum: ['google', 'github', 'microsoft'],
      required: true,
    },
    oauthId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    avatar: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['farmer', 'developer', 'government_officer', 'admin'],
      default: 'farmer',
    },
    preferredLanguage: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'pa', 'mr', 'gu', 'te', 'ta', 'kn', 'bn', 'or'],
    },
    farmerProfile: {
      type: farmerProfileSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ oauthProvider: 1, oauthId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
