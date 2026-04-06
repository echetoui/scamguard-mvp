#!/usr/bin/env node

/**
 * Local development server for ScamGuard backend.
 * Wraps Lambda handlers to work locally without AWS deployment.
 * Runs on port 3001 alongside Vite frontend.
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory stores for development (replace with DynamoDB in production)
const otpStore = new Map(); // phone -> { code, createdAt, attempts }
const userStore = new Map(); // userId -> userProfile

// Helper functions
function generateOTP() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

function validatePhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digitsOnly = cleaned.replace(/[^\d]/g, '');
  return digitsOnly.length >= 10;
}

/**
 * Send OTP via Twilio Verify API
 */
async function sendTwilioOTP(phoneNumber, otp) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_ID) {
    console.warn('[TWILIO] Credentials not configured. OTP will not be sent.');
    return false;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceId = process.env.TWILIO_VERIFY_SERVICE_ID;

  // Convert to E.164 format (+1 country code)
  const e164Phone = '+1' + phoneNumber.replace(/\D/g, '').slice(-10);

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const postData = `To=${encodeURIComponent(e164Phone)}&Channel=sms&Code=${otp}`;

  return new Promise((resolve) => {
    const options = {
      hostname: 'verify.twilio.com',
      port: 443,
      path: `/v2/Services/${serviceId}/Verifications`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[TWILIO] SMS OTP sent to ${e164Phone}`);
          resolve(true);
        } else {
          console.error(`[TWILIO] Error: ${res.statusCode} - ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[TWILIO] Request error:', error.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Routes

/**
 * POST /api/v1/auth/request-sms-otp
 * Request SMS OTP for phone number
 */
app.post('/api/v1/auth/request-sms-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        error: { code: 'MISSING_PHONE', message: 'Phone number is required.' }
      });
    }

    if (!validatePhone(phoneNumber)) {
      return res.status(400).json({
        error: { code: 'INVALID_PHONE', message: 'Phone number must have at least 10 digits.' }
      });
    }

    // Clean phone number
    const cleaned = phoneNumber.replace(/[^\d]/g, '').slice(-10);

    // Generate OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleaned, {
      code: otp,
      createdAt: Date.now(),
      expiresAt: expiryTime,
      attempts: 0
    });

    console.log(`[DEV] OTP for ${cleaned}: ${otp} (expires in 5 min)`);

    // Try to send via Twilio if configured
    const twilioSent = await sendTwilioOTP(phoneNumber, otp);

    res.json({
      data: {
        message: 'OTP sent to your phone number.',
        phone_masked: `***${cleaned.slice(-4)}`,
        // In development, return OTP for testing (remove in production)
        otp: process.env.NODE_ENV === 'production' ? undefined : otp,
        twilio_sent: twilioSent
      }
    });
  } catch (error) {
    console.error('Error in request-sms-otp:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error requesting OTP: ' + error.message }
    });
  }
});

/**
 * POST /api/v1/auth/verify-sms-otp
 * Verify SMS OTP code
 */
app.post('/api/v1/auth/verify-sms-otp', (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Phone number and code are required.' }
      });
    }

    if (!validatePhone(phoneNumber)) {
      return res.status(400).json({
        error: { code: 'INVALID_PHONE', message: 'Invalid phone number format.' }
      });
    }

    const cleaned = phoneNumber.replace(/[^\d]/g, '').slice(-10);
    const otpData = otpStore.get(cleaned);

    if (!otpData) {
      return res.status(400).json({
        error: { code: 'OTP_NOT_FOUND', message: 'OTP expired or not found. Please request a new code.' }
      });
    }

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(cleaned);
      return res.status(400).json({
        error: { code: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new code.' }
      });
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      otpStore.delete(cleaned);
      return res.status(429).json({
        error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many failed attempts. Please request a new code.' }
      });
    }

    // Verify code
    if (otpData.code !== code) {
      otpData.attempts++;
      return res.status(400).json({
        error: { code: 'INVALID_OTP', message: 'Incorrect OTP code.' }
      });
    }

    // OTP verified - create/get user
    otpStore.delete(cleaned);

    // Simple user ID generation (use UUID in production)
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);

    // Store user (in production, use DynamoDB)
    userStore.set(userId, {
      id: userId,
      phone: cleaned,
      verified: true,
      createdAt: new Date().toISOString()
    });

    // Generate simple token (use JWT in production)
    const token = Buffer.from(JSON.stringify({
      userId,
      phone: cleaned,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64');

    console.log(`[DEV] User ${userId} verified with phone ${cleaned}`);

    res.json({
      data: {
        user_id: userId,
        phone_number: cleaned,
        token: token,
        message: 'SMS OTP verified successfully.'
      }
    });
  } catch (error) {
    console.error('Error in verify-sms-otp:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error verifying OTP: ' + error.message }
    });
  }
});

// Existing auth endpoints (email-based)
app.post('/api/v1/auth/signup', (req, res) => {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: 'Email signup not implemented in dev server' }
  });
});

app.post('/api/v1/auth/verify-email', (req, res) => {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: 'Email verification not implemented in dev server' }
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: 'Email login not implemented in dev server' }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: 'development' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ ScamGuard Dev Server running on http://localhost:${PORT}`);
  console.log(`📱 SMS OTP endpoints available:`);
  console.log(`   POST /api/v1/auth/request-sms-otp`);
  console.log(`   POST /api/v1/auth/verify-sms-otp`);
  console.log(`\n🔗 Frontend proxy configured in Vite (port 5173 → ${PORT})`);
  console.log(`⚠️  Development mode: OTP codes are returned in responses for testing\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});
