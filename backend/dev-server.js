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
const AWS = require('aws-sdk');
const crypto = require('crypto');
const busboy = require('busboy');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 8000;

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});
const sns = new AWS.SNS();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'reports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// SEC.4: Rate limiting and IP blocking middleware for auth endpoints
app.use((req, res, next) => {
  // Check IP blacklist first
  const clientIP = getClientIP(req);

  if (isIPBlacklisted(clientIP)) {
    return res.status(429).json({
      error: { code: 'IP_BLOCKED', message: 'Your IP has been temporarily blocked due to suspicious activity.' }
    });
  }

  // Apply rate limiting to auth endpoints
  if (req.path.startsWith('/api/v1/auth')) {
    const rateLimit = checkRateLimit(clientIP, 10, 60000); // 10 attempts per minute

    res.set('X-RateLimit-Limit', '10');
    res.set('X-RateLimit-Remaining', rateLimit.remaining);

    if (!rateLimit.allowed) {
      blacklistIP(clientIP);
      return res.status(429).json({
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again later.' }
      });
    }
  }

  next();
});

// In-memory stores for development (replace with DynamoDB in production)
const otpStore = new Map(); // phone -> { code, createdAt, attempts }
const userStore = new Map(); // userId -> userProfile
const familyStore = new Map(); // familyId -> { name, inviteCode, members: [], threats: [] }
const userFamilyMap = new Map(); // userId -> familyId
const reportsStore = new Map(); // reportId -> report
const reportRateLimitStore = new Map(); // userId -> { count, resetTime }
const reportAccessLog = new Map(); // reportId -> { uploadedAt, fileSize, userId, accessCount }

// SEC.4: Authentication Hardening stores
const ipWhitelist = new Set(); // Whitelisted IPs
const ipBlacklist = new Set(); // Blacklisted IPs (temporary bans)
const failedAttempts = new Map(); // phone -> { count, lastAttempt, locked }
const passwordResetTokens = new Map(); // token -> { phone, expiresAt, used }
const sessionTokens = new Map(); // token -> { userId, createdAt, lastActivity, expiresAt }
const rateLimitStore = new Map(); // ipAddress -> { count, resetTime }

// SEC.4: Helper functions for authentication hardening

/**
 * Extract client IP from request (handles proxy headers)
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.socket.remoteAddress ||
         'unknown';
}

/**
 * Check if IP is whitelisted
 */
function isIPWhitelisted(ip) {
  return ipWhitelist.has(ip);
}

/**
 * Check if IP is blacklisted
 */
function isIPBlacklisted(ip) {
  const blacklistEntry = ipBlacklist.get(ip);
  if (!blacklistEntry) return false;

  // Check if ban has expired (15 minutes)
  if (Date.now() > blacklistEntry.expiresAt) {
    ipBlacklist.delete(ip);
    return false;
  }
  return true;
}

/**
 * Add IP to blacklist temporarily (15 minutes)
 */
function blacklistIP(ip) {
  ipBlacklist.set(ip, {
    blockedAt: Date.now(),
    expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
  });
}

/**
 * Check and enforce rate limiting per IP
 */
function checkRateLimit(ip, maxAttempts = 10, windowMs = 60000) {
  const now = Date.now();
  let record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  record.count++;

  if (record.count > maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxAttempts - record.count };
}

/**
 * Track failed authentication attempts
 */
function recordFailedAttempt(phone) {
  const record = failedAttempts.get(phone) || { count: 0, lastAttempt: 0, locked: false };
  record.count++;
  record.lastAttempt = Date.now();

  // Lock account after 5 failed attempts for 30 minutes
  if (record.count >= 5) {
    record.locked = true;
    record.lockedUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
  }

  failedAttempts.set(phone, record);
  return record;
}

/**
 * Clear failed attempts for phone
 */
function clearFailedAttempts(phone) {
  failedAttempts.delete(phone);
}

/**
 * Check if account is locked
 */
function isAccountLocked(phone) {
  const record = failedAttempts.get(phone);
  if (!record) return false;

  // Check if lock has expired
  if (record.locked && Date.now() < record.lockedUntil) {
    return true;
  }

  // Unlock if time has passed
  if (record.locked && Date.now() > record.lockedUntil) {
    record.locked = false;
    record.count = 0; // Reset count
    failedAttempts.set(phone, record);
    return false;
  }

  return false;
}

/**
 * Generate secure password reset token
 */
function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create password reset token
 */
function createPasswordResetToken(phone) {
  const token = generatePasswordResetToken();
  const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes

  passwordResetTokens.set(token, {
    phone,
    expiresAt,
    used: false
  });

  return token;
}

/**
 * Validate password reset token
 */
function validatePasswordResetToken(token) {
  const record = passwordResetTokens.get(token);

  if (!record) {
    return { valid: false, error: 'Token not found' };
  }

  if (Date.now() > record.expiresAt) {
    passwordResetTokens.delete(token);
    return { valid: false, error: 'Token expired' };
  }

  if (record.used) {
    return { valid: false, error: 'Token already used' };
  }

  return { valid: true, phone: record.phone };
}

/**
 * Mark reset token as used
 */
function markResetTokenAsUsed(token) {
  const record = passwordResetTokens.get(token);
  if (record) {
    record.used = true;
    passwordResetTokens.set(token, record);
  }
}

/**
 * Generate session token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// DEV.5B.1: Scam Report Helper Functions

/**
 * Valid scam types enum
 */
const VALID_SCAM_TYPES = [
  'phishing',
  'vishing',
  'email',
  'sms',
  'smishing',
  'fake_app',
  'call_spoofing',
  'other'
];

/**
 * Valid MIME types for file uploads
 */
const VALID_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum report description length
 */
const MAX_DESCRIPTION_LENGTH = 2000;

/**
 * Rate limit: max reports per user per day
 */
const MAX_REPORTS_PER_DAY = 10;

/**
 * Rate limit window: 24 hours
 */
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

/**
 * Extract userId from Bearer token
 */
function extractUserIdFromBearer(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload.userId;
  } catch (err) {
    console.error('[REPORT] Error extracting userId:', err.message);
    return null;
  }
}

/**
 * Check rate limit for report submission
 */
function checkReportRateLimit(userId) {
  const now = Date.now();
  let record = reportRateLimitStore.get(userId);

  if (!record || now > record.resetTime) {
    // Create new record
    reportRateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: MAX_REPORTS_PER_DAY - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  record.count++;

  if (record.count > MAX_REPORTS_PER_DAY) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  return { allowed: true, remaining: MAX_REPORTS_PER_DAY - record.count, resetTime: record.resetTime };
}

/**
 * Generate unique report ID
 */
function generateReportId() {
  return 'report_' + crypto.randomBytes(8).toString('hex');
}

/**
 * Generate unique filename for upload
 */
function generateFileName(originalFileName) {
  const ext = path.extname(originalFileName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}_${random}${ext}`;
}

/**
 * Validate MIME type against allowlist
 */
function isValidMimeType(mimeType) {
  return VALID_MIME_TYPES.includes(mimeType);
}

/**
 * Validate scam type
 */
function isValidScamType(scamType) {
  return VALID_SCAM_TYPES.includes(scamType.toLowerCase());
}

/**
 * Log file access
 */
function logFileAccess(reportId, fileSize, userId) {
  if (!reportAccessLog.has(reportId)) {
    reportAccessLog.set(reportId, {
      reportId,
      uploadedAt: new Date().toISOString(),
      fileSize,
      userId,
      accessCount: 1
    });
  } else {
    const log = reportAccessLog.get(reportId);
    log.accessCount++;
    reportAccessLog.set(reportId, log);
  }
}

/**
 * Validate session token
 */
function validateSessionToken(token) {
  const session = sessionTokens.get(token);

  if (!session) {
    return { valid: false };
  }

  // Check expiry
  if (Date.now() > session.expiresAt) {
    sessionTokens.delete(token);
    return { valid: false };
  }

  // Update last activity
  session.lastActivity = Date.now();
  sessionTokens.set(token, session);

  return { valid: true, userId: session.userId };
}

// Original helper functions
function generateOTP() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

function validatePhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digitsOnly = cleaned.replace(/[^\d]/g, '');
  return digitsOnly.length >= 10;
}

/**
 * Send OTP via AWS SNS
 */
async function sendSNSOTP(phoneNumber, otp) {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) {
    console.warn('[SNS] Topic ARN not configured. OTP will not be sent.');
    return false;
  }

  // Convert to E.164 format (+1 country code)
  const e164Phone = '+1' + phoneNumber.replace(/\D/g, '').slice(-10);
  const message = `Your ScamGuard verification code is: ${otp}. This code expires in 5 minutes.`;

  try {
    const params = {
      TopicArn: topicArn,
      Subject: 'ScamGuard Verification Code',
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };

    const result = await sns.publish(params).promise();
    console.log(`[SNS] SMS OTP sent to ${e164Phone} (MessageId: ${result.MessageId})`);
    return true;
  } catch (error) {
    console.error('[SNS] Error sending SMS:', error.message);
    return false;
  }
}

// Routes

/**
 * POST /api/v1/auth/request-sms-otp
 * Request SMS OTP for phone number
 * SEC.4: Includes rate limiting, account lockout, and IP tracking
 */
app.post('/api/v1/auth/request-sms-otp', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    console.log(`[AUTH] Request from IP: ${clientIP}`);

    // Debug: log what we received
    console.log(`[DEBUG] Received body:`, JSON.stringify(req.body));

    // Accept both 'phone' and 'phoneNumber' for backwards compatibility
    const phoneNumber = req.body.phone || req.body.phoneNumber;

    console.log(`[DEBUG] phoneNumber extracted:`, phoneNumber);

    if (!phoneNumber) {
      console.log(`[DEBUG] Missing phoneNumber - rejecting with 400`);
      return res.status(400).json({
        error: { code: 'MISSING_PHONE', message: 'Phone number is required.' }
      });
    }

    if (!validatePhone(phoneNumber)) {
      return res.status(400).json({
        error: { code: 'INVALID_PHONE', message: 'Phone number must have at least 10 digits.' }
      });
    }

    // Clean phone number - extract only digits, then take last 10 (handles country codes)
    const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
    const cleaned = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    // SEC.4: Check if account is locked due to failed attempts
    if (isAccountLocked(cleaned)) {
      return res.status(429).json({
        error: { code: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked due to too many failed attempts. Try again in 30 minutes.' }
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleaned, {
      code: otp,
      createdAt: Date.now(),
      expiresAt: expiryTime,
      attempts: 0,
      requestedIP: clientIP // Track which IP requested this OTP
    });

    console.log(`[DEV] OTP for ${cleaned}: ${otp} (expires in 5 min)`);
    console.log(`[SEC.4] OTP request tracked for IP ${clientIP}`);

    // Try to send via AWS SNS
    const snsSent = await sendSNSOTP(phoneNumber, otp);

    res.json({
      data: {
        message: 'OTP sent to your phone number.',
        phone_masked: `***${cleaned.slice(-4)}`,
        // In development, return OTP for testing (remove in production)
        otp: process.env.NODE_ENV === 'production' ? undefined : otp,
        sms_sent: snsSent
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
 * SEC.4: Includes failed attempt tracking and session token creation
 */
app.post('/api/v1/auth/verify-sms-otp', (req, res) => {
  try {
    const clientIP = getClientIP(req);

    // Accept both 'phone' and 'phoneNumber' for backwards compatibility
    const phoneNumber = req.body.phone || req.body.phoneNumber;
    const { code } = req.body;

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

    // Clean phone number - extract only digits, then take last 10 (handles country codes)
    const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
    const cleaned = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    // SEC.4: Check if account is locked
    if (isAccountLocked(cleaned)) {
      return res.status(429).json({
        error: { code: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked due to too many failed attempts. Try again in 30 minutes.' }
      });
    }

    const otpData = otpStore.get(cleaned);

    if (!otpData) {
      // SEC.4: Record failed attempt
      recordFailedAttempt(cleaned);
      return res.status(400).json({
        error: { code: 'OTP_NOT_FOUND', message: 'OTP expired or not found. Please request a new code.' }
      });
    }

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(cleaned);
      recordFailedAttempt(cleaned);
      return res.status(400).json({
        error: { code: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new code.' }
      });
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      otpStore.delete(cleaned);
      recordFailedAttempt(cleaned);
      return res.status(429).json({
        error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many failed attempts. Please request a new code.' }
      });
    }

    // Verify code (trim both for robustness)
    if (String(otpData.code).trim() !== String(code).trim()) {
      otpData.attempts++;
      recordFailedAttempt(cleaned);
      return res.status(400).json({
        error: { code: 'INVALID_OTP', message: 'Incorrect OTP code.' }
      });
    }

    // OTP verified - create/get user
    otpStore.delete(cleaned);

    // SEC.4: Clear failed attempts on successful authentication
    clearFailedAttempts(cleaned);

    // Simple user ID generation (use UUID in production)
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);

    // Store user (in production, use DynamoDB)
    userStore.set(userId, {
      id: userId,
      phone: cleaned,
      verified: true,
      createdAt: new Date().toISOString(),
      lastLoginIP: clientIP,
      lastLoginTime: new Date().toISOString()
    });

    // SEC.4: Generate secure session token
    const sessionToken = generateSessionToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    sessionTokens.set(sessionToken, {
      userId,
      phone: cleaned,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt,
      ip: clientIP // Track session IP
    });

    // Generate simple token (use JWT in production)
    const token = Buffer.from(JSON.stringify({
      userId,
      phone: cleaned,
      sessionToken,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64');

    console.log(`[DEV] User ${userId} verified with phone ${cleaned}`);
    console.log(`[SEC.4] Session created for ${userId} from IP ${clientIP}`);

    res.json({
      data: {
        user_id: userId,
        phone_number: cleaned,
        token: token,
        session_token: sessionToken,
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

// SEC.4: Authentication Hardening Endpoints

/**
 * POST /api/v1/auth/request-password-reset
 * Request a password reset token (sent via SMS)
 */
app.post('/api/v1/auth/request-password-reset', (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const { phone } = req.body;

    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({
        error: { code: 'INVALID_PHONE', message: 'Valid phone number is required.' }
      });
    }

    const digitsOnly = phone.replace(/[^\d]/g, '');
    const cleaned = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    // Check if account exists
    let userExists = false;
    for (const user of userStore.values()) {
      if (user.phone === cleaned) {
        userExists = true;
        break;
      }
    }

    // Always return success for security (don't reveal if account exists)
    if (!userExists) {
      return res.json({
        data: {
          message: 'If an account with this phone number exists, a password reset link will be sent.',
          phone_masked: `***${cleaned.slice(-4)}`
        }
      });
    }

    // Generate reset token
    const resetToken = createPasswordResetToken(cleaned);

    console.log(`[SEC.4] Password reset token generated for ${cleaned}: ${resetToken}`);
    console.log(`[SEC.4] Reset requested from IP ${clientIP}`);

    // In production, send via SMS
    res.json({
      data: {
        message: 'Password reset link sent to your phone.',
        phone_masked: `***${cleaned.slice(-4)}`,
        // Dev only
        reset_token: process.env.NODE_ENV === 'production' ? undefined : resetToken
      }
    });
  } catch (error) {
    console.error('Error in request-password-reset:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error requesting password reset: ' + error.message }
    });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password using reset token
 */
app.post('/api/v1/auth/reset-password', (req, res) => {
  try {
    const { reset_token, new_password } = req.body;

    if (!reset_token || !new_password) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Reset token and new password are required.' }
      });
    }

    // Validate reset token
    const validation = validatePasswordResetToken(reset_token);

    if (!validation.valid) {
      return res.status(400).json({
        error: { code: 'INVALID_RESET_TOKEN', message: validation.error }
      });
    }

    // Find user by phone
    let targetUser = null;
    let userId = null;
    for (const [uid, user] of userStore.entries()) {
      if (user.phone === validation.phone) {
        targetUser = user;
        userId = uid;
        break;
      }
    }

    if (!targetUser) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
      });
    }

    // Mark token as used (one-time use)
    markResetTokenAsUsed(reset_token);

    // In production, hash the password
    // For dev, store it plaintext (NEVER IN PRODUCTION)
    targetUser.password = new_password;
    targetUser.passwordResetAt = new Date().toISOString();
    userStore.set(userId, targetUser);

    // Clear any failed attempts
    clearFailedAttempts(validation.phone);

    console.log(`[SEC.4] Password reset completed for ${validation.phone}`);

    res.json({
      data: {
        message: 'Password has been reset successfully.',
        user_id: userId
      }
    });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error resetting password: ' + error.message }
    });
  }
});

/**
 * POST /api/v1/auth/validate-session
 * Validate and refresh session token
 */
app.post('/api/v1/auth/validate-session', (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const { session_token } = req.body;

    if (!session_token) {
      return res.status(400).json({
        error: { code: 'MISSING_SESSION_TOKEN', message: 'Session token is required.' }
      });
    }

    // Validate session token
    const validation = validateSessionToken(session_token);

    if (!validation.valid) {
      return res.status(401).json({
        error: { code: 'INVALID_SESSION', message: 'Session is invalid or expired.' }
      });
    }

    const session = sessionTokens.get(session_token);

    // Check IP change (optional: require re-auth if IP changed significantly)
    if (session.ip !== clientIP) {
      console.log(`[SEC.4] Session IP changed from ${session.ip} to ${clientIP} for ${validation.userId}`);
    }

    // Get user data
    const user = userStore.get(validation.userId);

    res.json({
      data: {
        valid: true,
        user_id: validation.userId,
        phone: session.phone,
        last_activity: session.lastActivity,
        expires_at: session.expiresAt,
        user: user || {}
      }
    });
  } catch (error) {
    console.error('Error in validate-session:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error validating session: ' + error.message }
    });
  }
});

/**
 * POST /api/v1/auth/refresh-session
 * Refresh session token expiry
 */
app.post('/api/v1/auth/refresh-session', (req, res) => {
  try {
    const { session_token } = req.body;

    if (!session_token) {
      return res.status(400).json({
        error: { code: 'MISSING_SESSION_TOKEN', message: 'Session token is required.' }
      });
    }

    const session = sessionTokens.get(session_token);

    if (!session) {
      return res.status(401).json({
        error: { code: 'INVALID_SESSION', message: 'Session not found.' }
      });
    }

    // Extend session by 24 hours
    session.expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    sessionTokens.set(session_token, session);

    res.json({
      data: {
        message: 'Session refreshed successfully.',
        expires_at: session.expiresAt
      }
    });
  } catch (error) {
    console.error('Error in refresh-session:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error refreshing session: ' + error.message }
    });
  }
});

/**
 * GET /api/v1/auth/security-status
 * Get security status and IP whitelist info
 * (Development endpoint - remove in production or require admin auth)
 */
app.get('/api/v1/auth/security-status', (req, res) => {
  try {
    const clientIP = getClientIP(req);

    res.json({
      data: {
        client_ip: clientIP,
        is_whitelisted: isIPWhitelisted(clientIP),
        is_blacklisted: isIPBlacklisted(clientIP),
        total_sessions: sessionTokens.size,
        total_failed_attempts: failedAttempts.size,
        message: 'Security status retrieved (development only)'
      }
    });
  } catch (error) {
    console.error('Error in security-status:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// Family Protection Endpoints (Phase 5A)

// Helper: Extract userId from Bearer token
function extractUserIdFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return 'dev-user-' + Math.random().toString(36).substr(2, 9);
  }
  try {
    const token = authHeader.substring(7); // Remove "Bearer "
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload.userId || 'dev-user';
  } catch {
    return 'dev-user-' + Math.random().toString(36).substr(2, 9);
  }
}

// Helper: Generate 6-char alphanumeric invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * GET /api/v1/family/dashboard
 * Fetch family data for authenticated user
 */
app.get('/api/v1/family/dashboard', (req, res) => {
  try {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const familyId = userFamilyMap.get(userId);

    if (!familyId) {
      return res.status(404).json({
        error: { code: 'NO_FAMILY', message: 'User does not belong to a family' }
      });
    }

    const family = familyStore.get(familyId);
    if (!family) {
      return res.status(404).json({
        error: { code: 'FAMILY_NOT_FOUND', message: 'Family not found' }
      });
    }

    const userEmail = userStore.get(userId)?.email || userId + '@example.com';
    const userMember = family.members.find(m => m.userId === userId);

    res.json({
      data: {
        familyName: family.name,
        members: family.members,
        threats: family.threats || [],
        inviteCode: family.inviteCode,
        currentUserRole: userMember?.role || 'senior',
        currentUserEmail: userEmail
      }
    });
  } catch (error) {
    console.error('Error in GET /family/dashboard:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/family/create
 * Create a new family
 */
app.post('/api/v1/family/create', (req, res) => {
  try {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const { familyName } = req.body;

    // Check if user already in a family
    if (userFamilyMap.has(userId)) {
      return res.status(400).json({
        error: { code: 'ALREADY_IN_FAMILY', message: 'User is already in a family' }
      });
    }

    // Generate family ID and invite code
    const familyId = 'family_' + Math.random().toString(36).substr(2, 9);
    const inviteCode = generateInviteCode();

    // Store family
    familyStore.set(familyId, {
      id: familyId,
      name: familyName || 'My Family',
      inviteCode: inviteCode,
      createdBy: userId,
      members: [
        {
          userId: userId,
          email: userStore.get(userId)?.email || userId + '@example.com',
          role: 'family',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }
      ],
      threats: [],
      createdAt: new Date().toISOString()
    });

    // Map user to family
    userFamilyMap.set(userId, familyId);

    console.log(`[FAMILY] Created family ${familyId} by ${userId}`);

    res.status(201).json({
      data: {
        familyId: familyId,
        inviteCode: inviteCode,
        message: 'Family created successfully'
      }
    });
  } catch (error) {
    console.error('Error in POST /family/create:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/family/join
 * Join an existing family with invite code
 */
app.post('/api/v1/family/join', (req, res) => {
  try {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        error: { code: 'MISSING_INVITE_CODE', message: 'Invite code is required' }
      });
    }

    // Check if user already in a family
    if (userFamilyMap.has(userId)) {
      return res.status(400).json({
        error: { code: 'ALREADY_IN_FAMILY', message: 'User is already in a family' }
      });
    }

    // Find family by invite code
    let targetFamily = null;
    let targetFamilyId = null;
    for (const [fid, family] of familyStore.entries()) {
      if (family.inviteCode === inviteCode.toUpperCase()) {
        targetFamily = family;
        targetFamilyId = fid;
        break;
      }
    }

    if (!targetFamily) {
      return res.status(404).json({
        error: { code: 'INVALID_INVITE_CODE', message: 'Invite code not found' }
      });
    }

    // Add user to family as 'senior'
    const userEmail = userStore.get(userId)?.email || userId + '@example.com';
    targetFamily.members.push({
      userId: userId,
      email: userEmail,
      role: 'senior',
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    });

    // Map user to family
    userFamilyMap.set(userId, targetFamilyId);

    console.log(`[FAMILY] User ${userId} joined family ${targetFamilyId}`);

    res.json({
      data: {
        familyId: targetFamilyId,
        message: 'Successfully joined family'
      }
    });
  } catch (error) {
    console.error('Error in POST /family/join:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// Scam Reporting Endpoints (DEV.5B.1 & Phase 5C)

/**
 * POST /api/v1/reports
 * Submit a scam report with optional file upload (multipart/form-data)
 *
 * Body:
 *   - scamType: enum [phishing, vishing, email, sms, smishing, fake_app, call_spoofing, other]
 *   - description: optional, max 2000 chars
 *   - screenshot: optional file, MIME types: image/jpeg, image/png, image/webp, max 5MB
 *
 * Returns:
 *   - success: boolean
 *   - reportId: string
 *   - timestamp: ISO8601 string
 */
app.post('/api/v1/reports', async (req, res) => {
  const clientIP = getClientIP(req);
  let uploadFilePath = null;
  let uploadFileName = null;
  let fileSize = 0;

  try {
    // Extract userId from Bearer token
    const userId = extractUserIdFromBearer(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please provide a valid token.' }
      });
    }

    // Check rate limit
    const rateLimit = checkReportRateLimit(userId);
    res.set('X-RateLimit-Limit', String(MAX_REPORTS_PER_DAY));
    res.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    res.set('X-RateLimit-Reset', String(Math.floor(rateLimit.resetTime / 1000)));

    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime).toISOString();
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Max ${MAX_REPORTS_PER_DAY} reports per day. Try again after ${resetTime}.`,
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        }
      });
    }

    // Parse multipart form data
    const bb = busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE + (1024 * 1024) } });
    const fields = {};
    let fileData = null;
    let fileUploadError = null;

    bb.on('file', (fieldname, file, info) => {
      if (fieldname === 'screenshot') {
        const { filename, mimeType, encoding } = info;

        // Validate MIME type
        if (!isValidMimeType(mimeType)) {
          fileUploadError = `Invalid file type: ${mimeType}. Allowed types: ${VALID_MIME_TYPES.join(', ')}`;
          file.resume();
          return;
        }

        // Generate unique filename
        uploadFileName = generateFileName(filename);
        uploadFilePath = path.join(uploadsDir, uploadFileName);

        // Stream file to disk with size tracking
        const writeStream = fs.createWriteStream(uploadFilePath);
        let uploadedSize = 0;

        file.on('data', (chunk) => {
          uploadedSize += chunk.length;
          if (uploadedSize > MAX_FILE_SIZE) {
            writeStream.destroy();
            file.destroy();
            fileUploadError = `File size exceeds maximum of 5MB. Uploaded: ${Math.round(uploadedSize / 1024 / 1024 * 100) / 100}MB`;
            // Clean up partial file
            fs.unlink(uploadFilePath, (err) => {
              if (err) console.error('[REPORT] Error cleaning up partial file:', err);
            });
            return;
          }
        });

        file.pipe(writeStream);

        writeStream.on('finish', () => {
          fileSize = uploadedSize;
          fileData = {
            filename: uploadFileName,
            originalName: filename,
            mimeType,
            size: fileSize,
            path: uploadFilePath
          };
          console.log(`[REPORT] File uploaded: ${uploadFileName} (${fileSize} bytes, ${mimeType})`);
        });

        writeStream.on('error', (err) => {
          fileUploadError = `File upload failed: ${err.message}`;
          console.error('[REPORT] File write error:', err);
          fs.unlink(uploadFilePath, (e) => {
            if (e) console.error('[REPORT] Error cleaning up failed file:', e);
          });
        });
      }
    });

    bb.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    bb.on('close', async () => {
      try {
        if (fileUploadError) {
          // Clean up if file was partially uploaded
          if (uploadFilePath && fs.existsSync(uploadFilePath)) {
            fs.unlinkSync(uploadFilePath);
          }
          return res.status(413).json({
            error: { code: 'FILE_ERROR', message: fileUploadError }
          });
        }

        // Extract and validate fields
        const scamType = fields.scamType?.toLowerCase().trim();
        let description = fields.description?.trim() || '';

        // Validation: scamType is required
        if (!scamType) {
          if (uploadFilePath && fs.existsSync(uploadFilePath)) {
            fs.unlinkSync(uploadFilePath);
          }
          return res.status(400).json({
            error: { code: 'INVALID_SCAM_TYPE', message: 'scamType is required and must be one of: ' + VALID_SCAM_TYPES.join(', ') }
          });
        }

        // Validation: scamType must be valid enum value
        if (!isValidScamType(scamType)) {
          if (uploadFilePath && fs.existsSync(uploadFilePath)) {
            fs.unlinkSync(uploadFilePath);
          }
          return res.status(400).json({
            error: { code: 'INVALID_SCAM_TYPE', message: `Invalid scamType: "${scamType}". Must be one of: ${VALID_SCAM_TYPES.join(', ')}` }
          });
        }

        // Validation: description is required if no screenshot
        if (!fileData && !description) {
          return res.status(400).json({
            error: { code: 'MISSING_DESCRIPTION', message: 'Either description or screenshot is required.' }
          });
        }

        // Validation: description max length
        if (description && description.length > MAX_DESCRIPTION_LENGTH) {
          if (uploadFilePath && fs.existsSync(uploadFilePath)) {
            fs.unlinkSync(uploadFilePath);
          }
          return res.status(400).json({
            error: {
              code: 'DESCRIPTION_TOO_LONG',
              message: `Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters. Current: ${description.length}`
            }
          });
        }

        // Generate report ID
        const reportId = generateReportId();
        const now = new Date().toISOString();
        const timestamp = Date.now();

        // Get user email from store or use placeholder
        const user = userStore.get(userId);
        const userEmail = user?.email || user?.phone || `${userId}@scamguard.internal`;

        // Create REPORT record for DynamoDB
        const reportRecord = {
          reportId,
          userId,
          email: userEmail,
          scamType,
          description,
          screenshotUrl: fileData ? `/api/v1/reports/${reportId}/screenshot` : null,
          screenshotFileName: fileData ? uploadFileName : null,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          clientIP
        };

        // Store report
        reportsStore.set(reportId, reportRecord);

        // Log file access if file was uploaded
        if (fileData) {
          logFileAccess(reportId, fileSize, userId);
        }

        // Create analytics entry
        const analyticsRecord = {
          reportId,
          userId,
          fileSize: fileData ? fileSize : 0,
          uploadTime: Date.now() - timestamp,
          createdAt: now
        };

        console.log(`[REPORT] Report created: ${reportId}`);
        console.log(`[REPORT] Type: ${scamType}, User: ${userId}, File: ${fileData ? 'yes' : 'no'}`);
        console.log(`[REPORT] Analytics: ${JSON.stringify(analyticsRecord)}`);

        res.status(201).json({
          success: true,
          data: {
            reportId,
            timestamp: now,
            screenshotUrl: reportRecord.screenshotUrl,
            message: 'Scam report submitted successfully'
          }
        });
      } catch (error) {
        // Clean up partial uploads on error
        if (uploadFilePath && fs.existsSync(uploadFilePath)) {
          fs.unlink(uploadFilePath, (err) => {
            if (err) console.error('[REPORT] Error cleaning up file on error:', err);
          });
        }

        console.error('[REPORT] Error processing form:', error);
        res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Error processing report: ' + error.message }
        });
      }
    });

    bb.on('error', (error) => {
      // Clean up partial uploads on error
      if (uploadFilePath && fs.existsSync(uploadFilePath)) {
        fs.unlink(uploadFilePath, (err) => {
          if (err) console.error('[REPORT] Error cleaning up file on bb error:', err);
        });
      }

      console.error('[REPORT] Busboy error:', error);
      res.status(400).json({
        error: { code: 'FORM_PARSE_ERROR', message: 'Error parsing form data: ' + error.message }
      });
    });

    req.pipe(bb);
  } catch (error) {
    // Clean up on unexpected error
    if (uploadFilePath && fs.existsSync(uploadFilePath)) {
      fs.unlink(uploadFilePath, (err) => {
        if (err) console.error('[REPORT] Error cleaning up file on catch:', err);
      });
    }

    console.error('[REPORT] Unexpected error in POST /reports:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error: ' + error.message }
    });
  }
});

/**
 * GET /api/v1/reports/:reportId/screenshot
 * Retrieve uploaded screenshot for a report
 */
app.get('/api/v1/reports/:reportId/screenshot', (req, res) => {
  try {
    const { reportId } = req.params;
    const report = reportsStore.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: { code: 'REPORT_NOT_FOUND', message: `Report ${reportId} not found` }
      });
    }

    if (!report.screenshotFileName) {
      return res.status(404).json({
        error: { code: 'NO_SCREENSHOT', message: 'No screenshot attached to this report' }
      });
    }

    const filePath = path.join(uploadsDir, report.screenshotFileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`[REPORT] File not found: ${filePath}`);
      return res.status(404).json({
        error: { code: 'FILE_NOT_FOUND', message: 'Screenshot file not found' }
      });
    }

    // Log access
    logFileAccess(reportId, fs.statSync(filePath).size, report.userId);

    // Serve file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('[REPORT] Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: { code: 'FILE_SEND_ERROR', message: 'Error retrieving screenshot' }
          });
        }
      }
    });
  } catch (error) {
    console.error('[REPORT] Error in GET /reports/:reportId/screenshot:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/scam-reports
 * Submit a scam report (legacy endpoint, JSON body only)
 */
app.post('/api/v1/scam-reports', (req, res) => {
  try {
    const { scamType, description, evidence, contactInfo } = req.body;

    if (!scamType || !description) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'scamType and description are required' }
      });
    }

    // Generate report ID and confirmation number
    const reportId = 'report_' + Math.random().toString(36).substr(2, 9);
    const confirmationNumber = 'SGR-' + Math.random().toString(36).substr(2, 8).toUpperCase();

    // Store report
    reportsStore.set(reportId, {
      id: reportId,
      confirmationNumber: confirmationNumber,
      scamType: scamType,
      description: description,
      evidence: evidence || null,
      contactInfo: contactInfo || null,
      reportedAt: new Date().toISOString(),
      status: 'received'
    });

    console.log(`[SCAM-REPORT] ${confirmationNumber} - Type: ${scamType}, Status: received`);

    res.status(201).json({
      data: {
        reportId: reportId,
        confirmationNumber: confirmationNumber,
        message: 'Scam report submitted successfully',
        status: 'received'
      }
    });
  } catch (error) {
    console.error('Error in POST /scam-reports:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// Tools Endpoints (Phase 5C)

/**
 * POST /api/v1/tools/check-email
 * Check if email has been breached
 */
app.post('/api/v1/tools/check-email', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: { code: 'MISSING_EMAIL', message: 'Email is required' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: { code: 'INVALID_EMAIL', message: 'Invalid email format' }
      });
    }

    // Simulate breach check - in production, call Have I Been Pwned API
    const emailLower = email.toLowerCase();
    const isBreach = emailLower.includes('test') || emailLower.includes('breach');

    let breaches = [];
    if (isBreach) {
      breaches = [
        {
          name: 'Data Breach 2024',
          date: '2024-01-15',
          description: 'Large-scale credential leak affecting multiple services'
        },
        {
          name: 'Email Service Breach',
          date: '2024-02-20',
          description: 'Email provider security incident'
        }
      ];
    }

    console.log(`[EMAIL-CHECK] ${email} - Breached: ${isBreach}, Count: ${breaches.length}`);

    res.json({
      data: {
        email: email,
        breached: isBreach,
        count: breaches.length,
        breaches: breaches,
        message: isBreach
          ? `Found ${breaches.length} breach(es) associated with this email`
          : 'No breaches found for this email'
      }
    });
  } catch (error) {
    console.error('Error in POST /tools/check-email:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/tools/check-advisor
 * Verify financial advisor credentials with AMF
 */
app.post('/api/v1/tools/check-advisor', (req, res) => {
  try {
    const { name, licenseNumber, firmName } = req.body;

    if (!name && !licenseNumber && !firmName) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'At least one identifier is required' }
      });
    }

    // Simulate advisor verification - in production, query AMF registry
    const searchTerm = (name || licenseNumber || firmName || '').toLowerCase();
    const isVerified = !searchTerm.includes('arnaque') && !searchTerm.includes('fraud');

    const response = {
      verified: isVerified,
      name: name || 'Unknown',
      registrationNumber: isVerified ? 'AMF-' + Math.random().toString(36).substr(2, 6).toUpperCase() : null,
      status: isVerified ? 'REGISTERED' : 'NOT_VERIFIED',
      firm: firmName || null,
      message: isVerified
        ? 'Advisor is registered with AMF'
        : 'Advisor could not be verified - exercise caution'
    };

    console.log(`[ADVISOR-CHECK] ${name || licenseNumber} - Verified: ${isVerified}`);

    res.json({
      data: response
    });
  } catch (error) {
    console.error('Error in POST /tools/check-advisor:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// ARCH.6: Notification Service Endpoints

// Import notification service
const notificationService = require('./services/notificationService');
const emailTemplates = require('./services/emailTemplates');

/**
 * POST /api/v1/notifications/preferences
 * Get user notification preferences
 */
app.post('/api/v1/notifications/preferences', (req, res) => {
  try {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const prefs = notificationService.getUserPreferences(userId);

    res.json({
      data: prefs
    });
  } catch (error) {
    console.error('Error in GET /notifications/preferences:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * PUT /api/v1/notifications/preferences
 * Update user notification preferences
 */
app.put('/api/v1/notifications/preferences', (req, res) => {
  try {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const { smsAlertsEnabled, emailAlertsEnabled, preferences } = req.body;

    const updated = notificationService.updateUserPreferences(userId, {
      smsAlertsEnabled,
      emailAlertsEnabled,
      preferences
    });

    console.log(`[NOTIF] Updated preferences for ${userId}`);

    res.json({
      data: updated,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /notifications/preferences:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/notifications/test-sms
 * Send test SMS notification
 */
app.post('/api/v1/notifications/test-sms', async (req, res) => {
  try {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const { phoneNumber, type } = req.body;

    if (!phoneNumber || !type) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'phoneNumber and type are required' }
      });
    }

    // Check if SMS alerts are enabled globally
    const prefs = notificationService.getUserPreferences(userId);
    if (!prefs.smsAlertsEnabled) {
      return res.status(400).json({
        error: { code: 'DISABLED', message: 'SMS notifications are disabled for your account' }
      });
    }

    let content = '';
    if (type === 'THREAT_ALERT') {
      content = notificationService.createThreatAlertSMS('Phishing', 'High');
    } else if (type === 'DAILY_DIGEST') {
      content = notificationService.createDailyDigestSMS(5);
    } else if (type === 'REMINDER') {
      content = notificationService.createAcademyReminderSMS();
    } else if (type === 'DAILY_TIP') {
      content = notificationService.createDailyTipSMS('Enable 2FA on all accounts');
    } else if (type === 'WEEKLY_REPORT') {
      content = notificationService.createWeeklyReportSMS('https://scamguard.app/reports');
    }

    const result = await notificationService.createAndQueueSMSNotification(userId, type, phoneNumber, content);

    if (!result) {
      return res.status(400).json({
        error: { code: 'DISABLED', message: 'This notification type is disabled in your preferences' }
      });
    }

    console.log(`[NOTIF] Test SMS queued for ${phoneNumber}`);

    res.json({
      data: {
        queueId: result.queueId,
        notificationId: result.notification.id,
        message: 'Test SMS queued for delivery'
      }
    });
  } catch (error) {
    console.error('Error in POST /notifications/test-sms:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/notifications/test-email
 * Send test email notification
 */
app.post('/api/v1/notifications/test-email', async (req, res) => {
  try {
    const userId = extractUserIdFromToken(req.headers.authorization);
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'email and type are required' }
      });
    }

    // Check if email alerts are enabled globally
    const prefs = notificationService.getUserPreferences(userId);
    if (!prefs.emailAlertsEnabled) {
      return res.status(400).json({
        error: { code: 'DISABLED', message: 'Email notifications are disabled for your account' }
      });
    }

    let template = {};
    if (type === 'THREAT_ALERT') {
      template = emailTemplates.threatAlertTemplate('Phishing Attack', 'High', 'A phishing attempt was detected.');
    } else if (type === 'DAILY_DIGEST') {
      template = emailTemplates.dailyDigestTemplate(5, ['Blocked 3 phishing emails', 'Detected 2 suspicious links']);
    } else if (type === 'WEEKLY_REPORT') {
      template = emailTemplates.weeklyReportTemplate(
        { threatsBlocked: 25, phishingAttempts: 8, malwareDetections: 2, academyProgress: '45%' }
      );
    } else if (type === 'REMINDER') {
      template = emailTemplates.academyReminderTemplate('Social Engineering Tactics', 45);
    }

    const result = await notificationService.createAndQueueEmailNotification(
      userId,
      type,
      email,
      template.subject,
      template.html,
      template.text
    );

    if (!result) {
      return res.status(400).json({
        error: { code: 'DISABLED', message: 'This notification type is disabled in your preferences' }
      });
    }

    console.log(`[NOTIF] Test email queued for ${email}`);

    res.json({
      data: {
        queueId: result.queueId,
        notificationId: result.notification.id,
        message: 'Test email queued for delivery'
      }
    });
  } catch (error) {
    console.error('Error in POST /notifications/test-email:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/v1/notifications/queue
 * Get notification queue status (dev/admin only)
 */
app.get('/api/v1/notifications/queue', (req, res) => {
  try {
    const queue = notificationService.getNotificationQueue();
    const pending = notificationService.getPendingQueueItems();

    const stats = {
      total: queue.size,
      pending: pending.length,
      sent: Array.from(queue.values()).filter(q => q.status === 'sent').length,
      failed: Array.from(queue.values()).filter(q => q.status === 'failed').length,
      retrying: Array.from(queue.values()).filter(q => q.status === 'retrying').length
    };

    res.json({
      data: {
        stats,
        items: pending.slice(0, 10) // Return first 10 pending items
      }
    });
  } catch (error) {
    console.error('Error in GET /notifications/queue:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/notifications/process-queue
 * Process pending notifications in queue (should be called by cron/scheduler)
 */
app.post('/api/v1/notifications/process-queue', async (req, res) => {
  try {
    const result = await notificationService.processPendingQueue();

    console.log(`[NOTIF-QUEUE] Processed: ${result.processed}, Successful: ${result.successful}, Pending: ${result.pending}`);

    res.json({
      data: result,
      message: 'Queue processing completed'
    });
  } catch (error) {
    console.error('Error in POST /notifications/process-queue:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/admin/notifications/scam-report
 * Admin notification: scam report received
 */
app.post('/api/v1/admin/notifications/scam-report', async (req, res) => {
  try {
    const { reportId, scamType, adminEmail } = req.body;

    if (!reportId || !scamType || !adminEmail) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'reportId, scamType, and adminEmail are required' }
      });
    }

    const template = emailTemplates.adminScamReportTemplate(reportId, scamType);
    const result = await notificationService.createAndQueueEmailNotification(
      'admin',
      notificationService.NOTIFICATION_TYPES.ADMIN_SCAM_REPORT_RECEIVED,
      adminEmail,
      template.subject,
      template.html,
      template.text
    );

    console.log(`[ADMIN-NOTIF] Scam report notification queued for ${adminEmail}`);

    res.json({
      data: {
        queueId: result.queueId,
        message: 'Admin notification queued'
      }
    });
  } catch (error) {
    console.error('Error in POST /admin/notifications/scam-report:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/admin/notifications/user-flagged
 * Admin notification: user flagged
 */
app.post('/api/v1/admin/notifications/user-flagged', async (req, res) => {
  try {
    const { userId, reason, adminEmail } = req.body;

    if (!userId || !reason || !adminEmail) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'userId, reason, and adminEmail are required' }
      });
    }

    const template = emailTemplates.adminUserFlaggedTemplate(userId, reason);
    const result = await notificationService.createAndQueueEmailNotification(
      'admin',
      notificationService.NOTIFICATION_TYPES.ADMIN_USER_FLAGGED,
      adminEmail,
      template.subject,
      template.html,
      template.text
    );

    console.log(`[ADMIN-NOTIF] User flagged notification queued for ${adminEmail}`);

    res.json({
      data: {
        queueId: result.queueId,
        message: 'Admin notification queued'
      }
    });
  } catch (error) {
    console.error('Error in POST /admin/notifications/user-flagged:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/v1/admin/notifications/system-alert
 * Admin notification: system alert
 */
app.post('/api/v1/admin/notifications/system-alert', async (req, res) => {
  try {
    const { alertType, details, adminEmail } = req.body;

    if (!alertType || !details || !adminEmail) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'alertType, details, and adminEmail are required' }
      });
    }

    const template = emailTemplates.adminSystemAlertTemplate(alertType, details);
    const result = await notificationService.createAndQueueEmailNotification(
      'admin',
      notificationService.NOTIFICATION_TYPES.ADMIN_SYSTEM_ALERT,
      adminEmail,
      template.subject,
      template.html,
      template.text
    );

    console.log(`[ADMIN-NOTIF] System alert notification queued for ${adminEmail}`);

    res.json({
      data: {
        queueId: result.queueId,
        message: 'Admin notification queued'
      }
    });
  } catch (error) {
    console.error('Error in POST /admin/notifications/system-alert:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message }
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

// Start queue processing timer (process notifications every 30 seconds)
setInterval(async () => {
  try {
    await notificationService.processPendingQueue();
  } catch (error) {
    console.error('[QUEUE-TIMER] Error processing queue:', error.message);
  }
}, 30 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ ScamGuard Dev Server running on http://localhost:${PORT}`);
  console.log(`📱 SMS OTP endpoints available:`);
  console.log(`   POST /api/v1/auth/request-sms-otp`);
  console.log(`   POST /api/v1/auth/verify-sms-otp`);
  console.log(`\n📋 DEV.5B.1 Scam Reports (Multipart/Form-Data) endpoints:`);
  console.log(`   POST /api/v1/reports (multipart/form-data with file upload)`);
  console.log(`   GET /api/v1/reports/:reportId/screenshot`);
  console.log(`\n📊 Report Features:`);
  console.log(`   • Multipart form-data support with busboy`);
  console.log(`   • File validation (MIME type, size ≤ 5MB)`);
  console.log(`   • Rate limiting: ${MAX_REPORTS_PER_DAY} reports/day per user`);
  console.log(`   • Scam type validation: ${VALID_SCAM_TYPES.join(', ')}`);
  console.log(`   • Description validation: max ${MAX_DESCRIPTION_LENGTH} chars`);
  console.log(`   • Local disk storage: ${uploadsDir}`);
  console.log(`   • Access logging for uploaded files`);
  console.log(`\n🔔 ARCH.6 Notification Service endpoints available:`);
  console.log(`   POST /api/v1/notifications/preferences`);
  console.log(`   PUT /api/v1/notifications/preferences`);
  console.log(`   POST /api/v1/notifications/test-sms`);
  console.log(`   POST /api/v1/notifications/test-email`);
  console.log(`   GET /api/v1/notifications/queue`);
  console.log(`   POST /api/v1/notifications/process-queue`);
  console.log(`   POST /api/v1/admin/notifications/scam-report`);
  console.log(`   POST /api/v1/admin/notifications/user-flagged`);
  console.log(`   POST /api/v1/admin/notifications/system-alert`);
  console.log(`\n🔗 Frontend proxy configured in Vite (port 5173 → ${PORT})`);
  console.log(`⚠️  Development mode: OTP codes are returned in responses for testing\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});
