/**
 * Webhook Signature Validator
 * Validates incoming webhook requests using HMAC-SHA256 signatures
 */

const crypto = require('crypto');

// Webhook secret key (should be loaded from environment)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-webhook-secret-change-in-production';

/**
 * Generate webhook signature
 * Signature = base64(HMAC-SHA256(payload, secret))
 *
 * @param {Object} payload - Request body payload
 * @param {string} timestamp - Webhook timestamp
 * @returns {string} - Signature
 */
function generateWebhookSignature(payload, timestamp) {
  const payloadStr = JSON.stringify(payload);
  const message = `${timestamp}.${payloadStr}`;
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(message)
    .digest('base64');

  return signature;
}

/**
 * Validate webhook signature
 * @param {Object} payload - Request body payload
 * @param {string} signature - X-Webhook-Signature header value
 * @param {string} timestamp - X-Webhook-Timestamp header value
 * @returns {boolean} - Whether signature is valid
 */
function validateWebhookSignature(payload, signature, timestamp) {
  // Check for required headers
  if (!signature || !timestamp) {
    console.warn('[WEBHOOK] Missing signature or timestamp header');
    return false;
  }

  // Verify timestamp is recent (within 5 minutes to prevent replay attacks)
  const now = Date.now();
  const webhookTime = parseInt(timestamp) * 1000; // Convert to ms
  const timeDiff = now - webhookTime;

  if (timeDiff < 0 || timeDiff > 5 * 60 * 1000) {
    console.warn(`[WEBHOOK] Timestamp outside acceptable window: ${timeDiff}ms`);
    return false;
  }

  // Generate expected signature
  const expectedBuf = Buffer.from(generateWebhookSignature(payload, timestamp), 'base64');

  // Decode incoming signature — if it's not valid base64 or a different
  // length the timingSafeEqual call would throw, so handle it explicitly.
  let sigBuf;
  try {
    sigBuf = Buffer.from(signature, 'base64');
  } catch (_) {
    return false;
  }

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  // Compare signatures using constant-time comparison
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

module.exports = {
  generateWebhookSignature,
  validateWebhookSignature
};
