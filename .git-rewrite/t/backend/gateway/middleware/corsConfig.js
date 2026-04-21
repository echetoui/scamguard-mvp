/**
 * CORS Configuration Middleware
 * Configures Cross-Origin Resource Sharing for API Gateway
 * Different configurations for dev, staging, and production
 */

const cors = require('cors');

/**
 * Get CORS options based on environment
 */
function getCorsOptions(corsOrigin = 'http://localhost:5173') {
  return {
    origin: (origin, callback) => {
      const allowedOrigins = [
        corsOrigin,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8000'
      ];

      // Allow requests with no origin (like mobile apps, cURL requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-API-Key',
      'Accept'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Response-Time',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ],
    maxAge: 86400 // 24 hours
  };
}

/**
 * CORS Middleware
 */
function middleware({ corsOrigin = 'http://localhost:5173' } = {}) {
  const options = getCorsOptions(corsOrigin);
  return cors(options);
}

module.exports = {
  middleware,
  getCorsOptions
};
