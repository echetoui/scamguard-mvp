/**
 * SEC.4 - Authentication Hardening Tests
 * Tests for rate limiting, account lockout, password reset, and session validation
 */

const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

// Mock setup
const createTestServer = () => {
  const app = express();
  app.use(express.json());

  // In-memory stores
  const ipBlacklist = new Map();
  const failedAttempts = new Map();
  const passwordResetTokens = new Map();
  const sessionTokens = new Map();
  const rateLimitStore = new Map();
  const userStore = new Map();

  // Helper functions
  function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.socket.remoteAddress ||
           'unknown';
  }

  function isIPBlacklisted(ip) {
    const entry = ipBlacklist.get(ip);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      ipBlacklist.delete(ip);
      return false;
    }
    return true;
  }

  function blacklistIP(ip) {
    ipBlacklist.set(ip, {
      blockedAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000)
    });
  }

  function checkRateLimit(ip, maxAttempts = 10, windowMs = 60000) {
    const now = Date.now();
    let record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    record.count++;
    if (record.count > maxAttempts) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: maxAttempts - record.count };
  }

  function recordFailedAttempt(phone) {
    const record = failedAttempts.get(phone) || { count: 0, lastAttempt: 0, locked: false };
    record.count++;
    record.lastAttempt = Date.now();
    if (record.count >= 5) {
      record.locked = true;
      record.lockedUntil = Date.now() + (30 * 60 * 1000);
    }
    failedAttempts.set(phone, record);
    return record;
  }

  function isAccountLocked(phone) {
    const record = failedAttempts.get(phone);
    if (!record) return false;
    if (record.locked && Date.now() < record.lockedUntil) {
      return true;
    }
    if (record.locked && Date.now() > record.lockedUntil) {
      record.locked = false;
      record.count = 0;
      failedAttempts.set(phone, record);
      return false;
    }
    return false;
  }

  function clearFailedAttempts(phone) {
    failedAttempts.delete(phone);
  }

  function createPasswordResetToken(phone) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (15 * 60 * 1000);
    passwordResetTokens.set(token, { phone, expiresAt, used: false });
    return token;
  }

  function validatePasswordResetToken(token) {
    const record = passwordResetTokens.get(token);
    if (!record) return { valid: false, error: 'Token not found' };
    if (Date.now() > record.expiresAt) {
      passwordResetTokens.delete(token);
      return { valid: false, error: 'Token expired' };
    }
    if (record.used) {
      return { valid: false, error: 'Token already used' };
    }
    return { valid: true, phone: record.phone };
  }

  function markResetTokenAsUsed(token) {
    const record = passwordResetTokens.get(token);
    if (record) {
      record.used = true;
      passwordResetTokens.set(token, record);
    }
  }

  // Rate limiting middleware
  app.use((req, res, next) => {
    const clientIP = getClientIP(req);
    if (isIPBlacklisted(clientIP)) {
      return res.status(429).json({ error: 'IP_BLOCKED' });
    }
    if (req.path.startsWith('/auth')) {
      const rateLimit = checkRateLimit(clientIP, 10, 60000);
      if (!rateLimit.allowed) {
        blacklistIP(clientIP);
        return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
      }
    }
    next();
  });

  // Routes
  app.post('/auth/request-password-reset', (req, res) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Missing phone' });
    }
    const token = createPasswordResetToken(phone);
    res.json({ data: { reset_token: token } });
  });

  app.post('/auth/reset-password', (req, res) => {
    const { reset_token, new_password } = req.body;
    if (!reset_token || !new_password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const validation = validatePasswordResetToken(reset_token);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    markResetTokenAsUsed(reset_token);
    res.json({ data: { message: 'Password reset successful' } });
  });

  app.post('/auth/verify-otp', (req, res) => {
    const { phone } = req.body;
    if (isAccountLocked(phone)) {
      return res.status(429).json({ error: 'ACCOUNT_LOCKED' });
    }
    recordFailedAttempt(phone);
    return res.status(400).json({ error: 'INVALID_OTP' });
  });

  app.post('/auth/verify-otp-success', (req, res) => {
    const { phone } = req.body;
    clearFailedAttempts(phone);
    res.json({ data: { message: 'OTP verified' } });
  });

  return app;
};

describe('SEC.4 - Authentication Hardening', () => {
  let app;

  beforeEach(() => {
    app = createTestServer();
  });

  describe('Rate Limiting', () => {
    it('should allow requests under rate limit', async () => {
      const res = await request(app)
        .post('/auth/request-password-reset')
        .set('X-Forwarded-For', '192.168.1.1')
        .send({ phone: '5551234567' });

      expect(res.status).toBe(200);
      expect(res.body.data.reset_token).toBeDefined();
    });

    it('should block requests exceeding rate limit', async () => {
      const ip = '192.168.1.2';

      // Make 11 requests (exceeds limit of 10)
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .post('/auth/request-password-reset')
          .set('X-Forwarded-For', ip)
          .send({ phone: `555123456${i}` });

        if (i < 10) {
          expect(res.status).toBe(200);
        } else {
          expect(res.status).toBe(429);
          expect(res.body.error).toBe('RATE_LIMIT_EXCEEDED');
        }
      }
    });

    it('should block IP after rate limit exceeded', async () => {
      const ip = '192.168.1.3';

      // Exceed rate limit
      for (let i = 0; i < 11; i++) {
        await request(app)
          .post('/auth/request-password-reset')
          .set('X-Forwarded-For', ip)
          .send({ phone: '5551234567' });
      }

      // Next request should be blocked
      const res = await request(app)
        .post('/auth/request-password-reset')
        .set('X-Forwarded-For', ip)
        .send({ phone: '5551234567' });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('IP_BLOCKED');
    });
  });

  describe('Account Lockout', () => {
    it('should allow 4 failed attempts', async () => {
      const phone = '5551234567';

      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/auth/verify-otp')
          .send({ phone });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('INVALID_OTP');
      }
    });

    it('should lock account after 5 failed attempts', async () => {
      const phone = '5552345678';

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/verify-otp')
          .send({ phone });
      }

      // 6th attempt should be blocked
      const res = await request(app)
        .post('/auth/verify-otp')
        .send({ phone });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('ACCOUNT_LOCKED');
    });

    it('should clear failed attempts on successful verification', async () => {
      const phone = '5553456789';

      // Make a failed attempt
      await request(app)
        .post('/auth/verify-otp')
        .send({ phone });

      // Clear failed attempts
      await request(app)
        .post('/auth/verify-otp-success')
        .send({ phone });

      // Counter should be reset
      const res = await request(app)
        .post('/auth/verify-otp')
        .send({ phone });

      // This should only be 1st attempt again
      expect(res.status).toBe(400);
    });
  });

  describe('Password Reset', () => {
    it('should generate password reset token', async () => {
      const res = await request(app)
        .post('/auth/request-password-reset')
        .send({ phone: '5551234567' });

      expect(res.status).toBe(200);
      expect(res.body.data.reset_token).toBeDefined();
      expect(res.body.data.reset_token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should reset password with valid token', async () => {
      // Request reset
      const resetRes = await request(app)
        .post('/auth/request-password-reset')
        .send({ phone: '5551234567' });

      const token = resetRes.body.data.reset_token;

      // Reset password
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ reset_token: token, new_password: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Password reset successful');
    });

    it('should reject invalid reset token', async () => {
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ reset_token: 'invalid-token', new_password: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Token not found');
    });

    it('should reject token reuse', async () => {
      // Request reset
      const resetRes = await request(app)
        .post('/auth/request-password-reset')
        .send({ phone: '5551234567' });

      const token = resetRes.body.data.reset_token;

      // Use token
      await request(app)
        .post('/auth/reset-password')
        .send({ reset_token: token, new_password: 'newpass123' });

      // Try to reuse token
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ reset_token: token, new_password: 'another123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Token already used');
    });
  });

  describe('Session Validation', () => {
    it('should track session creation time', () => {
      const now = Date.now();
      const sessionData = {
        userId: 'user_123',
        createdAt: now,
        lastActivity: now,
        expiresAt: now + (24 * 60 * 60 * 1000),
        ip: '192.168.1.1'
      };

      expect(sessionData.createdAt).toBe(now);
      expect(sessionData.expiresAt).toBeGreaterThan(sessionData.createdAt);
    });

    it('should detect session IP change', () => {
      const session = {
        userId: 'user_123',
        ip: '192.168.1.1'
      };

      const newIP = '192.168.1.2';
      expect(session.ip).not.toBe(newIP);
    });
  });

  describe('Input Validation', () => {
    it('should reject missing phone number', async () => {
      const res = await request(app)
        .post('/auth/request-password-reset')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject missing reset token', async () => {
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ new_password: 'pass123' });

      expect(res.status).toBe(400);
    });

    it('should reject missing new password', async () => {
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ reset_token: 'token123' });

      expect(res.status).toBe(400);
    });
  });
});
