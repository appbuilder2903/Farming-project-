/**
 * seedApiKeys.js
 * Runs once at server startup to sync env-based API keys into
 * the encrypted ApiConfig collection. Keys stored in DB are
 * AES-256-GCM encrypted. The raw keys NEVER appear in source code.
 */
const ApiConfig = require('../models/ApiConfig');

const KEY_MAP = [
  { service: 'openai',        envVar: 'OPENAI_API_KEY' },
  { service: 'gemini',        envVar: 'GEMINI_API_KEY' },
  { service: 'perplexity',    envVar: 'PERPLEXITY_API_KEY' },
  { service: 'openrouter',    envVar: 'OPENROUTER_API_KEY' },
  { service: 'eden-ai',       envVar: 'EDEN_AI_API_KEY' },
  { service: 'longcat',       envVar: 'LONGCAT_AI_API_KEY' },
  { service: 'oxlo',          envVar: 'OXLO_AI_API_KEY' },
  { service: 'eos',           envVar: 'EOS_API_KEY',     meta: { url: process.env.EOS_API_URL } },
  { service: 'news',          envVar: 'NEWS_API_KEY' },
  { service: 'agmarket',      envVar: 'AGMARKET_API_KEY', meta: { url: process.env.AGMARKET_API_URL } },
  { service: 'google-oauth',  envVar: 'GOOGLE_CLIENT_SECRET', meta: { clientId: process.env.GOOGLE_CLIENT_ID } },
  { service: 'github-oauth',  envVar: 'GITHUB_CLIENT_SECRET', meta: { clientId: process.env.GITHUB_CLIENT_ID } },
  { service: 'microsoft-oauth', envVar: 'MICROSOFT_CLIENT_SECRET', meta: { clientId: process.env.MICROSOFT_CLIENT_ID } },
];

async function seedApiKeys() {
  let seeded = 0;
  for (const { service, envVar, meta = {} } of KEY_MAP) {
    const raw = process.env[envVar];
    if (raw && raw.trim()) {
      await ApiConfig.setKey(service, raw.trim(), meta);
      seeded++;
    }
  }
  if (seeded > 0) {
    console.log(`[ApiConfig] ${seeded} API key(s) encrypted and stored in DB`);
  }
}

module.exports = seedApiKeys;
