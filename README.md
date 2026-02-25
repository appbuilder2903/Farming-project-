# Vive Code – Agri Intelligence Platform

A production-ready national-scale multilingual AI-powered farmer assistance platform.

## Features
- 🔐 Multi-OAuth (Google, GitHub, Microsoft) with RBAC
- 🌾 AI Crop Disease Detection
- 📈 Live Mandi Prices + AI Price Prediction (3-level model)
- 🛰️ EOS Satellite Crop Monitoring (NDVI, Soil Moisture)
- 🗺️ Nearby Market Finder (GPS)
- 🏆 Best Dealer Ranking
- 📰 Farmer News Intelligence (AI-summarized)
- 🌐 121 Indian Language Full-Site Switching

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, PWA
- **Backend**: Node.js, Express, MongoDB (Mongoose), Passport.js
- **AI**: OpenAI, Gemini, Perplexity, OpenRouter, Eden AI, Longcat AI, Oxlo.ai

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env      # Fill in your keys
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Security
- API keys are encrypted with AES-256-GCM and stored in MongoDB via `ApiConfig` model
- Real secrets live only in `.env` files (gitignored — never committed)
- OAuth-only authentication (no passwords)
- HTTP-only JWT cookies, CSRF protection, helmet headers

## Environment Variables
See `backend/.env.example` for all required variables.
