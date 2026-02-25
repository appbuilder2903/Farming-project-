'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

const findOrCreateUser = async (provider, profile) => {
  const oauthId = profile.id;
  const email =
    (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
  const name =
    profile.displayName ||
    (profile.name
      ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim()
      : 'Unknown');
  const avatar =
    (profile.photos && profile.photos[0] && profile.photos[0].value) || null;

  let user = await User.findOne({ oauthProvider: provider, oauthId });

  if (!user && email) {
    user = await User.findOne({ email });
    if (user) {
      user.oauthProvider = provider;
      user.oauthId = oauthId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
      return user;
    }
  }

  if (!user) {
    user = await User.create({
      oauthProvider: provider,
      oauthId,
      name,
      email,
      avatar,
      role: 'farmer',
    });
  }

  user.lastLogin = new Date();
  await user.save();
  return user;
};

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/api/v1/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser('google', profile);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/api/v1/auth/github/callback`,
        scope: ['user:email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser('github', profile);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// Microsoft Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/api/v1/auth/microsoft/callback`,
        scope: ['user.read'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser('microsoft', profile);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// Passport session serialization (not used with JWT but required by passport)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
