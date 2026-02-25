const mongoose = require('mongoose');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

if (process.env.NODE_ENV === 'production' && !process.env.API_ENCRYPTION_KEY) {
  throw new Error(
    '[ApiConfig] API_ENCRYPTION_KEY environment variable is required in production. ' +
    'Set a random 32-character string in your environment.'
  );
}

if (process.env.NODE_ENV !== 'production' && !process.env.API_ENCRYPTION_KEY) {
  console.warn('[ApiConfig] API_ENCRYPTION_KEY is not set. Using insecure default – set this in .env for development.');
}

const KEY = Buffer.from(
  (process.env.API_ENCRYPTION_KEY || 'vivecode_enc_key_32chars_secure!').slice(0, 32)
);

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(payload) {
  const [ivHex, tagHex, encHex] = payload.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}

const ApiConfigSchema = new mongoose.Schema(
  {
    service: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'openai', 'gemini', 'perplexity', 'openrouter',
        'eden-ai', 'longcat', 'oxlo',
        'eos', 'news', 'agmarket',
        'google-oauth', 'github-oauth', 'microsoft-oauth',
      ],
    },
    encryptedKey: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date },
    usageCount: { type: Number, default: 0 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Virtual: never expose raw encrypted value in JSON
ApiConfigSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.encryptedKey;
    return ret;
  },
});

ApiConfigSchema.methods.getKey = function () {
  return decrypt(this.encryptedKey);
};

ApiConfigSchema.statics.setKey = async function (service, rawKey, meta = {}) {
  const encryptedKey = encrypt(rawKey);
  return this.findOneAndUpdate(
    { service },
    { encryptedKey, isActive: true, meta },
    { upsert: true, new: true }
  );
};

ApiConfigSchema.statics.getKey = async function (service) {
  const doc = await this.findOne({ service, isActive: true });
  if (!doc) return null;
  await this.updateOne({ _id: doc._id }, { $inc: { usageCount: 1 }, lastUsed: new Date() });
  return decrypt(doc.encryptedKey);
};

module.exports = mongoose.model('ApiConfig', ApiConfigSchema);
