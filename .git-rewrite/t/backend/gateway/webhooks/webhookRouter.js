/**
 * Webhook Router
 * Handles incoming webhook requests for scam reports
 * Validates webhook signatures, queues events for processing
 * Supports:
 * - Scam report webhooks
 * - Event queue management
 * - Webhook signature verification (HMAC-SHA256)
 */

const express = require('express');
const crypto = require('crypto');
const { validateWebhookSignature } = require('./webhookValidator');
const { queueWebhookEvent } = require('./webhookQueue');

const router = express.Router();

// In-memory store for webhook events (replace with database in production)
const webhookEvents = new Map();
const webhookMetrics = {
  received: 0,
  processed: 0,
  failed: 0,
  lastProcessed: null
};

/**
 * POST /webhooks/scam-reports
 * Receive incoming scam report webhooks from external sources
 *
 * Expected payload:
 * {
 *   "reportId": "external-id",
 *   "scamType": "PHISHING|MALWARE|FRAUD|SOCIAL_ENGINEERING",
 *   "description": "Detailed description",
 *   "evidence": { ... },
 *   "reportedAt": "ISO-8601 timestamp",
 *   "source": "external-system-name"
 * }
 */
router.post('/scam-reports', async (req, res, next) => {
  try {
    const signature = req.get('X-Webhook-Signature');
    const timestamp = req.get('X-Webhook-Timestamp');

    // Validate webhook signature
    if (!validateWebhookSignature(req.body, signature, timestamp)) {
      return res.status(401).json({
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Webhook signature verification failed',
          requestId: req.id
        }
      });
    }

    const { reportId, scamType, description, evidence, reportedAt, source } = req.body;

    // Validate required fields
    if (!reportId || !scamType || !description) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'reportId, scamType, and description are required',
          details: {
            missing: ['reportId', 'scamType', 'description'].filter(
              field => !req.body[field]
            )
          },
          requestId: req.id
        }
      });
    }

    // Validate scam type
    const validScamTypes = ['PHISHING', 'MALWARE', 'FRAUD', 'SOCIAL_ENGINEERING', 'OTHER'];
    if (!validScamTypes.includes(scamType)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SCAM_TYPE',
          message: `scamType must be one of: ${validScamTypes.join(', ')}`,
          requestId: req.id
        }
      });
    }

    // Create webhook event
    const eventId = `webhook_${crypto.randomUUID()}`;
    const webhookEvent = {
      id: eventId,
      requestId: req.id,
      reportId,
      scamType,
      description,
      evidence: evidence || null,
      reportedAt: reportedAt || new Date().toISOString(),
      source: source || 'unknown',
      receivedAt: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
      lastError: null
    };

    // Store event
    webhookEvents.set(eventId, webhookEvent);

    // Queue event for processing
    await queueWebhookEvent(webhookEvent);

    // Update metrics
    webhookMetrics.received++;

    console.log(`[WEBHOOK] Scam report received: ${eventId} from ${source}`);

    res.status(202).json({
      data: {
        eventId,
        reportId,
        status: 'queued',
        message: 'Webhook received and queued for processing'
      }
    });
  } catch (error) {
    webhookMetrics.failed++;
    console.error(`[WEBHOOK] Error processing scam report webhook: ${error.message}`);
    next(error);
  }
});

/**
 * GET /webhooks/events
 * Get webhook event status and metrics (admin/monitoring only)
 */
router.get('/events', (req, res) => {
  try {
    const events = Array.from(webhookEvents.values());

    res.json({
      data: {
        metrics: webhookMetrics,
        totalEvents: events.length,
        events: events
          .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
          .slice(0, 20) // Return last 20 events
      }
    });
  } catch (error) {
    console.error(`[WEBHOOK] Error fetching events: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching webhook events',
        requestId: req.id
      }
    });
  }
});

/**
 * GET /webhooks/events/:eventId
 * Get status of a specific webhook event
 */
router.get('/events/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const event = webhookEvents.get(eventId);

    if (!event) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: `Webhook event ${eventId} not found`,
          requestId: req.id
        }
      });
    }

    res.json({
      data: event
    });
  } catch (error) {
    console.error(`[WEBHOOK] Error fetching event: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching webhook event',
        requestId: req.id
      }
    });
  }
});

/**
 * POST /webhooks/events/:eventId/retry
 * Manually retry processing of a webhook event
 */
router.post('/webhooks/events/:eventId/retry', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = webhookEvents.get(eventId);

    if (!event) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: `Webhook event ${eventId} not found`,
          requestId: req.id
        }
      });
    }

    // Reset status and retry
    event.status = 'pending';
    event.attempts = 0;
    event.lastError = null;
    webhookEvents.set(eventId, event);

    // Queue for processing
    await queueWebhookEvent(event);

    console.log(`[WEBHOOK] Event ${eventId} queued for retry`);

    res.json({
      data: {
        eventId,
        status: 'queued',
        message: 'Event queued for retry'
      }
    });
  } catch (error) {
    console.error(`[WEBHOOK] Error retrying event: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error retrying webhook event',
        requestId: req.id
      }
    });
  }
});

/**
 * POST /webhooks/events/:eventId/acknowledge
 * Mark a webhook event as processed
 */
router.post('/webhooks/events/:eventId/acknowledge', (req, res) => {
  try {
    const { eventId } = req.params;
    const event = webhookEvents.get(eventId);

    if (!event) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: `Webhook event ${eventId} not found`,
          requestId: req.id
        }
      });
    }

    event.status = 'processed';
    event.processedAt = new Date().toISOString();
    webhookEvents.set(eventId, event);

    // Update metrics
    webhookMetrics.processed++;
    webhookMetrics.lastProcessed = event.processedAt;

    console.log(`[WEBHOOK] Event ${eventId} acknowledged`);

    res.json({
      data: {
        eventId,
        status: 'processed',
        message: 'Event acknowledged'
      }
    });
  } catch (error) {
    console.error(`[WEBHOOK] Error acknowledging event: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error acknowledging webhook event',
        requestId: req.id
      }
    });
  }
});

module.exports = router;
