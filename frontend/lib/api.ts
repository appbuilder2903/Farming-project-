import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – attach JWT token if stored
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor – normalise errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ---- Typed helpers ----

export const authAPI = {
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateLanguage: (language: string) =>
    api.patch('/auth/language', { language }),
};

export const priceAPI = {
  getCurrent: (params?: { commodity?: string; state?: string; market?: string }) =>
    api.get('/prices/current', { params }),
  getHistory: (commodity: string, params?: { market?: string; days?: number }) =>
    api.get(`/prices/history/${commodity}`, { params }),
  getPrediction: (commodity: string, params?: { market?: string; days?: number }) =>
    api.get(`/prices/prediction/${commodity}`, { params }),
};

export const marketAPI = {
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get('/markets/nearby', { params: { lat, lng, radius } }),
  getAll: (params?: { state?: string; page?: number; limit?: number }) =>
    api.get('/markets', { params }),
  getById: (id: string) => api.get(`/markets/${id}`),
  getTopDealers: (params?: { commodity?: string; limit?: number }) =>
    api.get('/markets/dealers/top', { params }),
};

export const aiAPI = {
  analyzeCropDisease: (payload: {
    imageUrl?: string;
    imageBase64?: string;
    language?: string;
    cropType?: string;
  }) => api.post('/ai/crop-disease', payload),
  predictPrice: (payload: {
    commodity: string;
    market: string;
    historicalData?: unknown[];
  }) => api.post('/ai/predict-price', payload),
  chat: (payload: {
    message: string;
    conversationHistory?: unknown[];
    language?: string;
  }) => api.post('/ai/chat', payload),
  translate: (payload: {
    text: string;
    targetLanguage: string;
    sourceLanguage?: string;
  }) => api.post('/ai/translate', payload),
};

export const newsAPI = {
  getAll: (params?: {
    category?: string;
    language?: string;
    page?: number;
    limit?: number;
    q?: string;
  }) => api.get('/news', { params }),
  getDailyBriefing: (params?: { language?: string }) =>
    api.get('/news/briefing', { params }),
  getById: (id: string) => api.get(`/news/${id}`),
};

export const eosAPI = {
  getFieldHealth: (params?: { lat?: number; lng?: number }) =>
    api.get('/eos/field-health', { params }),
  getVegetation: (params?: { lat?: number; lng?: number }) =>
    api.get('/eos/vegetation', { params }),
  getSoilMoisture: (params?: { lat?: number; lng?: number }) =>
    api.get('/eos/soil-moisture', { params }),
  getWeatherRisk: (params?: { lat?: number; lng?: number }) =>
    api.get('/eos/weather-risk', { params }),
};
