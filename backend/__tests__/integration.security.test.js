/**
 * SEC.4 - Integration Tests
 * End-to-end tests for authentication hardening flow
 */

const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

const createApp = () => {
  const app = express();
  app.use(express.json());

  // Stores
  const ipBlacklist = new Map();
  const failedAttempts = new Map();
  const passwordResetTokens = new Map();
  const sessionTokens = new Map();
  const rateLimitStore = new Map();
  const userStore = new Map();
  const otpStore = new Map();

  // Helpers
  function getClientIP(req) {
    return req.headers['x-forwarded-for'] || '127.0.0.1';
  }

  function checkRateLimit(ip, max = 10) {
    const now = Date.now();
    let record = rateLimitStore.get(ip);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + 60000 });
      return true;
    }
    record.count++;
    if (record.count > max) {
      ipBlacklist.set(ip, { expiresAt: now + (15 * 60 * 1000) });
      return false;
    }
    return true;
  }

  function recordFailedAttempt(phone) {
    const record = failedAttempts.get(phone) || { count: 0, locked: false };
    record.count++;
    if (record.count >= 5) {
      record.locked = true;
      record.lockedUntil = Date.now() + (30 * 60 * 1000);
    }
    failedAttempts.set(phone, record);
  }

  function isAccountLocked(phone) {
    const record = failedAttempts.get(phone);
    if (!record || !record.locked) return false;
    if (Date.now() > record.lockedUntil) {
      record.locked = false;
      record.count = 0;
      return false;
    }
    return true;
  }

  function clearFailedAttempts(phone) {
    failedAttempts.delete(phone);
  }

  // Rate limit middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/auth')) {
      const ip = getClientIP(req);
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'RATE_LIMIT' });
      }
    }
    next();
  });

  // Routes
  app.post('/auth/request-sms-otp', (req, res) => {
    const { phone } = req.body;
    if (isAccountLocked(phone)) {
      return res.status(429).json({ error: 'ACCOUNT_LOCKED' });
    }
    const otp = '1234';
    otpStore.set(phone, { code: otp, attempts: 0, expiresAt: Date.now() + 300000 });
    res.json({ data: { otp } });
  });

  app.post('/auth/verify-sms-otp', (req, res) => {
    const { phone, code } = req.body;
    if (isAccountLocked(phone)) {
      return res.status(429).json({ error: 'ACCOUNT_LOCKED' });
    }
    const otpData = otpStore.get(phone);
    if (!otpData) {
      recordFailedAttempt(phone);
      return res.status(400).json({ error: 'OTP_NOT_FOUND' });
    }
    if (otpData.code !== code) {
      otpData.attempts++;
      recordFailedAttempt(phone);
      return res.status(400).json({ error: 'INVALID_OTP' });
    }
    clearFailedAttempts(phone);
    otpStore.delete(phone);
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    userStore.set(userId, { phone, verified: true });
    sessionTokens.set(sessionToken, { userId, phone });
    res.json({ data: { user_id: userId, session_token: sessionToken } });
  });

  app.post('/auth/request-password-reset', (req, res) => {
    const { phone } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    passwordResetTokens.set(token, { phone, expiresAt: Date.now() + 900000, used: false });
    res.json({ data: { reset_token: token } });
  });

  app.post('/auth/reset-password', (req, res) => {
    const { reset_token, new_password } = req.body;
    const record = passwordResetTokens.get(reset_token);
    if (!record) return res.status(400).json({ error: 'INVALID_TOKEN' });
    if (record.used) return res.status(400).json({ error: 'TOKEN_USED' });
    record.used = true;
    clearFailedAttempts(record.phone);
    res.json({ data: { message: 'Password reset' } });
  });

  return app;
};

describe('SEC.4 - Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  describe('Complete Authentication Flow', () => {
    it('should complete successful OTP verification flow', async () => {
      const phone = '5551234567';

      // Step 1: Request OTP
      let res = await request(app)
        .post('/auth/request-sms-otp')
        .send({ phone });

      expect(res.status).toBe(200);
      const otp = res.body.data.otp;

      // Step 2: Verify OTP
      res = await request(app)
        .post('/auth/verify-sms-otp')
        .send({ phone, code: otp });

      expect(res.status).toBe(200);
      expect(res.body.data.user_id).toBeDefined();
      expect(res.body.data.session_token).toBeDefined();
    });

    it('should lock account after multiple failed OTP attempts', async () => {
      const phone = '5552345678';

      // Step 1: Request OTP
      let res = await request(app)
        .post('/auth/request-sms-otp')
        .send({ phone });
      expect(res.status).toBe(200);

      // Step 2: Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/verify-sms-otp')
          .send({ phone, code: 'wrong-code' });
      }

      // Step 3: Request new OTP should be blocked
      res = await request(app)
        .post('/auth/request-sms-otp')
        .send({ phone });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset flow', async () => {
      const phone = '5553456789';

      // Step 1: Request password reset
      let res = await request(app)
        .post('/auth/request-password-reset')
        .send({ phone });

      expect(res.status).toBe(200);
      const resetToken = res.body.data.reset_token;

      // Step 2: Reset password
      res = await request(app)
        .post('/auth/reset-password')
        .send({ reset_token: resetToken, new_password: 'newpass123' });

      expect(res.status).toBe(200);

      // Step 3: Reusing token should fail
      res = await request(app)
        .post('/auth/reset-password')
        .send({ reset_token: resetToken, new_password: 'another' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('TOKEN_USED');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits across multiple endpoints', async () => {
      const ip = '192.168.1.100';

      // Make 11 requests
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .post('/auth/request-sms-otp')
          .set('X-Forwarded-For', ip)
          .send({ phone: `555123456${i}` });

        if (i < 10) {
          expect(res.status).toBe(200);
        } else {
          expect(res.status).toBe(429);
          expect(res.body.error).toBe('RATE_LIMIT');
        }
      }
    });
  });

  describe('Account Recovery', () => {
    it('should allow password reset to unlock account', async () => {
      const phone = '5554567890';

      // Step 1: Lock account with 5 failed attempts
      await request(app)
        .post('/auth/request-sms-otp')
        .send({ phone });

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/verify-sms-otp')
          .send({ phone, code: 'wrong' });
      }

      // Verify account is locked
      let res = await request(app)
        .post('/auth/request-sms-otp')
        .send({ phone });
      expect(res.status).toBe(429);

      // Step 2: Reset password (should clear failed attempts)
      res = await request(app)
        .post('/auth/request-password-reset')
        .send({ phone });
      const resetToken = res.body.data.reset_token;

      res = await request(app)
        .post('/auth/reset-password')
        .send({ reset_token: resetToken, new_password: 'newpass' });
      expect(res.status).toBe(200);

      // Step 3: Account should now be accessible
      res = await request(app)
        .post('/auth/request-sms-otp')
        .send({ phone });
      expect(res.status).toBe(200);
    });
  });
});
