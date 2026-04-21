/**
 * Webhook Event Queue
 * Queues and processes incoming webhook events
 * Provides:
 * - Event queuing with retry logic
 * - Dead-letter queue for failed events
 * - Event processing status tracking
 */

// In-memory queue (replace with SQS/RabbitMQ in production)
const eventQueue = [];
const deadLetterQueue = [];
const maxRetries = 3;
const retryDelay = 5000; // 5 seconds

/**
 * Queue a webhook event for processing
 */
async function queueWebhookEvent(event) {
  return new Promise((resolve, reject) => {
    try {
      eventQueue.push({
        ...event,
        queuedAt: new Date().toISOString(),
        nextRetryAt: new Date().toISOString()
      });

      console.log(`[WEBHOOK-QUEUE] Event ${event.id} queued`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Process pending webhook events
 */
async function processPendingEvents() {
  const now = Date.now();
  const processed = [];
  const failed = [];

  for (let i = eventQueue.length - 1; i >= 0; i--) {
    const event = eventQueue[i];

    // Check if event is ready for processing
    const nextRetryTime = new Date(event.nextRetryAt).getTime();
    if (nextRetryTime > now) {
      continue; // Not ready yet
    }

    try {
      // Simulate event processing
      const result = await processWebhookEvent(event);

      if (result.success) {
        event.status = 'processed';
        event.processedAt = new Date().toISOString();
        processed.push(event);
        eventQueue.splice(i, 1);
      } else {
        event.attempts++;
        event.lastError = result.error;

        if (event.attempts >= maxRetries) {
          event.status = 'failed';
          event.failedAt = new Date().toISOString();
          deadLetterQueue.push(event);
          failed.push(event);
          eventQueue.splice(i, 1);

          console.error(`[WEBHOOK-QUEUE] Event ${event.id} moved to DLQ after ${maxRetries} attempts`);
        } else {
          // Schedule retry
          const nextRetry = now + retryDelay * Math.pow(2, event.attempts - 1); // Exponential backoff
          event.nextRetryAt = new Date(nextRetry).toISOString();

          console.warn(`[WEBHOOK-QUEUE] Event ${event.id} scheduled for retry at ${event.nextRetryAt}`);
        }
      }
    } catch (error) {
      console.error(`[WEBHOOK-QUEUE] Error processing event ${event.id}: ${error.message}`);
      failed.push(event);
    }
  }

  return {
    processed: processed.length,
    failed: failed.length,
    pending: eventQueue.length,
    deadLetter: deadLetterQueue.length
  };
}

/**
 * Process a single webhook event
 * In production, this would integrate with the actual scam report processing
 */
async function processWebhookEvent(event) {
  return new Promise((resolve) => {
    try {
      // Simulate processing
      console.log(`[WEBHOOK-PROCESS] Processing event ${event.id}`);

      // In production:
      // 1. Validate event structure
      // 2. Check for duplicate reportIds
      // 3. Process the scam report
      // 4. Update threat intelligence
      // 5. Notify relevant parties
      // 6. Store in database

      // For now, simulate successful processing
      resolve({ success: true });
    } catch (error) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

/**
 * Get queue statistics
 */
function getQueueStats() {
  return {
    pending: eventQueue.length,
    deadLetter: deadLetterQueue.length,
    totalQueued: eventQueue.length + deadLetterQueue.length
  };
}

/**
 * Get pending events
 */
function getPendingEvents(limit = 20) {
  return eventQueue
    .sort((a, b) => new Date(a.nextRetryAt) - new Date(b.nextRetryAt))
    .slice(0, limit);
}

/**
 * Get dead-letter queue events
 */
function getDeadLetterEvents(limit = 20) {
  return deadLetterQueue
    .sort((a, b) => new Date(b.failedAt) - new Date(a.failedAt))
    .slice(0, limit);
}

/**
 * Clear dead-letter queue
 */
function clearDeadLetterQueue() {
  const count = deadLetterQueue.length;
  deadLetterQueue.length = 0;
  return { cleared: count };
}

module.exports = {
  queueWebhookEvent,
  processPendingEvents,
  processWebhookEvent,
  getQueueStats,
  getPendingEvents,
  getDeadLetterEvents,
  clearDeadLetterQueue
};
