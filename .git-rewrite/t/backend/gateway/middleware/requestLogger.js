/**
 * Request Logging Middleware
 * Logs all API requests with:
 * - Request ID, method, path, status
 * - Request/response times and latency
 * - Request size, response size
 * - Client IP and user-agent
 * - Query parameters and request body (sanitized)
 */

const onFinished = require('on-finished');

/**
 * Log entry structure
 * @typedef {Object} LogEntry
 * @property {string} requestId - Unique request identifier
 * @property {string} method - HTTP method
 * @property {string} path - Request path
 * @property {number} statusCode - Response status code
 * @property {number} latency - Request latency in ms
 * @property {number} requestSize - Request body size
 * @property {number} responseSize - Response body size
 * @property {string} clientIP - Client IP address
 * @property {string} userAgent - User-Agent header
 * @property {string} timestamp - ISO timestamp
 * @property {Object} query - Query parameters
 * @property {string} error - Error message (if any)
 */

function middleware({ logger = console, environment = 'development' } = {}) {
  return (req, res, next) => {
    const startTime = Date.now();
    const startHrTime = process.hrtime();

    // Store request metadata
    req.logMeta = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      query: req.query,
      clientIP: getClientIP(req),
      userAgent: req.get('user-agent') || 'unknown'
    };

    // Capture response
    const originalSend = res.send;
    let responseSize = 0;
    let responseBody = null;

    res.send = function (data) {
      if (data) {
        responseSize = Buffer.byteLength(JSON.stringify(data));
        // Store response body for error logging (only in dev)
        if (environment === 'development' && typeof data === 'object') {
          responseBody = data;
        }
      }
      return originalSend.call(this, data);
    };

    // Store latency in response headers before sending response
    const originalJson = res.json;
    const originalSend2 = res.send;

    res.json = function (data) {
      const hrTime = process.hrtime(startHrTime);
      const latency = hrTime[0] * 1000 + hrTime[1] / 1000000;
      if (!res.headersSent) {
        res.set('X-Response-Time', `${Math.round(latency)}ms`);
      }
      return originalJson.call(this, data);
    };

    res.send = function (data) {
      const hrTime = process.hrtime(startHrTime);
      const latency = hrTime[0] * 1000 + hrTime[1] / 1000000;
      if (!res.headersSent) {
        res.set('X-Response-Time', `${Math.round(latency)}ms`);
      }
      return originalSend2.call(this, data);
    };

    // Track response completion
    onFinished(res, (err, res) => {
      const hrTime = process.hrtime(startHrTime);
      const latency = hrTime[0] * 1000 + hrTime[1] / 1000000; // Convert to ms

      const logEntry = {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        latency: Math.round(latency * 100) / 100, // Round to 2 decimals
        requestSize: Buffer.byteLength(JSON.stringify(req.body || {})),
        responseSize,
        clientIP: req.logMeta.clientIP,
        userAgent: req.logMeta.userAgent,
        timestamp: new Date().toISOString()
      };

      // Include query params if present
      if (Object.keys(req.query).length > 0) {
        logEntry.query = req.query;
      }

      // Log errors with additional context
      if (err) {
        logEntry.error = err.message;
        logger.error(`[${req.method} ${req.path}] ERROR`, logEntry, err);
      } else {
        // Different log levels based on status code
        const logLevel = res.statusCode >= 500 ? 'error' :
                        res.statusCode >= 400 ? 'warn' :
                        res.statusCode >= 200 ? 'info' : 'debug';

        if (logLevel === 'error') {
          logger.error(`[${req.method} ${req.path}] ${res.statusCode}`, logEntry);
        } else if (logLevel === 'warn') {
          logger.warn(`[${req.method} ${req.path}] ${res.statusCode}`, logEntry);
        } else {
          logger.info(`[${req.method} ${req.path}] ${res.statusCode}`, logEntry);
        }
      }
    });

    next();
  };
}

/**
 * Extract client IP from request (handles proxies)
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.socket.remoteAddress ||
         'unknown';
}

module.exports = {
  middleware
};
