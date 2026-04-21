/**
 * API Gateway - Centralized request/response middleware layer
 * Provides:
 * - Request ID generation & tracking
 * - Request validation & sanitization
 * - Request/response logging
 * - Error handling & standardized responses
 * - CORS configuration
 * - API versioning support
 * - Health checks
 * - Webhook support
 *
 * ARCH.5: API Gateway Setup
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const requestLogger = require('./middleware/requestLogger');
const requestValidator = require('./middleware/requestValidator');
const inputSanitizer = require('./middleware/inputSanitizer');
const errorHandler = require('./middleware/errorHandler');
const corsConfig = require('./middleware/corsConfig');
const webhookRouter = require('./webhooks/webhookRouter');
const { createOpenAPISpec } = require('./openapi/openApiSpec');

/**
 * Initialize the API Gateway
 * @param {Object} options - Gateway configuration
 * @param {string} options.corsOrigin - CORS origin domain
 * @param {string} options.environment - Environment (dev, staging, prod)
 * @param {Object} options.logger - Logger instance
 * @returns {express.Router} - Gateway router
 */
function createAPIGateway(options = {}) {
  const {
    corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173',
    environment = process.env.NODE_ENV || 'development',
    logger = console
  } = options;

  const router = express.Router();

  // Middleware execution order is critical:
  // 1. Request ID injection (must be first)
  // 2. CORS
  // 3. Body parsing (handled by app-level middleware)
  // 4. Input sanitization
  // 5. Request validation
  // 6. Request logging
  // 7. Route handlers
  // 8. Error handling (must be last)

  // 1. Request ID Injection
  router.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.set('X-Request-ID', req.id);
    next();
  });

  // 2. CORS Configuration
  router.use(corsConfig.middleware({ corsOrigin }));

  // 3. Input Sanitization
  router.use(inputSanitizer.middleware());

  // 4. Request Logging (before validation to catch all requests)
  router.use(requestLogger.middleware({ logger, environment }));

  // 5. Health Check Endpoint (before versioning)
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment,
      requestId: req.id
    });
  });

  // 6. Request Validation (version-specific)
  router.use(requestValidator.middleware());

  // 7. Webhook Routes (unversioned, separate from v1/v2)
  router.use('/webhooks', webhookRouter);

  return {
    router,
    errorHandler: errorHandler.middleware({ logger, environment }),
    corsOrigin,
    environment,
    getOpenAPISpec: (baseUrl) => createOpenAPISpec(baseUrl, environment)
  };
}

module.exports = {
  createAPIGateway
};
