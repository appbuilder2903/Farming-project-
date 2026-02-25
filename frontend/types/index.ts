// types/index.ts

export type Role = 'farmer' | 'dealer' | 'admin' | 'researcher';

export interface FarmerProfile {
  landSize?: number;
  landUnit?: string;
  primaryCrops?: string[];
  location?: {
    state?: string;
    district?: string;
    pincode?: string;
    coordinates?: { lat: number; lng: number };
  };
  preferredMarket?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  preferredLanguage: string;
  farmerProfile?: FarmerProfile;
  createdAt: string;
  updatedAt: string;
}

export interface Market {
  _id: string;
  name: string;
  state: string;
  district: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  contact?: string;
  operatingHours?: string;
  rating?: number;
  distance?: number; // km, computed
}

export interface Dealer {
  _id: string;
  name: string;
  marketId: string;
  marketName?: string;
  commodity: string;
  buyingPrice: number;
  sellingPrice?: number;
  rating: number;
  contact?: string;
  distance?: number;
  rank?: number;
  isTopDealer?: boolean;
}

export interface PriceData {
  _id: string;
  commodity: string;
  market: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
  change?: number;
  changePercent?: number;
}

export interface PriceHistory {
  date: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface Prediction {
  commodity: string;
  market: string;
  predictions: Array<{
    date: string;
    predictedPrice: number;
    lowerBound: number;
    upperBound: number;
  }>;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  analysis?: string;
  generatedAt: string;
}

export interface Disease {
  name: string;
  nameLocal?: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  symptoms?: string[];
  treatment?: string[];
  prevention?: string[];
  affectedCrops?: string[];
}

export interface CropReport {
  _id: string;
  userId: string;
  imageUrl?: string;
  cropType?: string;
  language: string;
  result: Disease;
  aiAnalysis?: string;
  createdAt: string;
}

export interface NewsArticle {
  _id: string;
  title: string;
  titleLocal?: string;
  summary: string;
  summaryLocal?: string;
  content?: string;
  source: string;
  category: 'policy' | 'weather' | 'market' | 'export' | 'general';
  imageUrl?: string;
  url?: string;
  publishedAt: string;
  language?: string;
}

export interface DailyBriefing {
  date: string;
  highlights: string[];
  topStory: string;
  weatherSummary?: string;
  marketSummary?: string;
  language: string;
}

export interface EOSData {
  ndvi: number;          // -1 to 1
  ndviCategory: 'poor' | 'fair' | 'good' | 'excellent';
  soilMoisture: number;  // 0-100%
  cloudCover?: number;
  date: string;
  fieldHealthStatus: 'green' | 'yellow' | 'red';
  fieldHealthLabel: string;
  explanation?: string;
  coordinates?: { lat: number; lng: number };
}

export interface WeatherRisk {
  level: 'low' | 'medium' | 'high' | 'extreme';
  alerts: string[];
  temperature?: { min: number; max: number; unit: string };
  humidity?: number;
  rainfall?: number;
  windSpeed?: number;
  forecastDays?: number;
  advice?: string;
}

export interface FieldHealth {
  status: 'green' | 'yellow' | 'red';
  label: string;
  score: number; // 0-100
  lastUpdated: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: Role[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isScheduled: boolean;
}

export interface StatsCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: number;
  trendLabel?: string;
  color?: 'green' | 'yellow' | 'red' | 'blue';
}
