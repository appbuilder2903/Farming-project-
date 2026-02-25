'use strict';

const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retries = MAX_RETRIES) => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kisansaathi';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected. Attempting reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[DB] MongoDB connection error:', err);
    });
  } catch (err) {
    console.error(`[DB] Connection failed (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, err.message);

    if (retries > 1) {
      console.log(`[DB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }

    console.error('[DB] All retry attempts exhausted. Exiting.');
    process.exit(1);
  }
};

module.exports = connectDB;
