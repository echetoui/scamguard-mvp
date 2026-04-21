/**
 * Global Error Handler Middleware
 * Provides consistent error responses across all endpoints
 * Handles:
 * - Validation errors
 * - Authentication errors
 * - Rate limiting errors
 * - Server errors
 * - Unknown routes
 */

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  GATEWAY_ERROR: 'GATEWAY_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

/**
 * Error response structure
 * @typedef {Object} ErrorResponse
 * @property {Object} error
 * @property {string} error.code - Error code
 * @property {string} error.message - User-friendly message
 * @property {Object} error.details - Error details (dev only)
 * @property {string} error.timestamp - ISO timestamp
 * @property {string} error.requestId - Request ID for tracking
 */

/**
 * Format error response
 */
function formatErrorResponse(error, statusCode, requestId, environment) {
  const errorResponse = {
    error: {
      code: error.code || ERROR_CODES.SERVER_ERROR,
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  // Only include details in development
  if (environment === 'development' && error.details) {
    errorResponse.error.details = error.details;
  }

  return errorResponse;
}

/**
 * Error Handler Middleware
 * Must be registered AFTER all other middleware and routes
 */
function middleware({ logger = console, environment = 'development' } = {}) {
  return (err, req, res, next) => {
    // Determine status code and error details
    let statusCode = err.statusCode || 500;
    let errorCode = err.code || ERROR_CODES.SERVER_ERROR;
    let message = err.message || 'Internal server error';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorCode = ERROR_CODES.VALIDATION_ERROR;
      details = err.details;
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      errorCode = ERROR_CODES.UNAUTHORIZED;
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
      errorCode = ERROR_CODES.FORBIDDEN;
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
      errorCode = ERROR_CODES.NOT_FOUND;
    } else if (err.name === 'ConflictError') {
      statusCode = 409;
      errorCode = ERROR_CODES.CONFLICT;
    } else if (err.name === 'RateLimitError') {
      statusCode = 429;
      errorCode = ERROR_CODES.RATE_LIMITED;
    } else if (err instanceof SyntaxError && 'body' in err) {
      statusCode = 400;
      errorCode = ERROR_CODES.VALIDATION_ERROR;
      message = 'Invalid JSON in request body';
    }

    // Log error with context
    const logContext = {
      requestId: req.id || 'unknown',
      method: req.method,
      path: req.path,
      statusCode,
      errorCode,
      message,
      stack: environment === 'development' ? err.stack : undefined
    };

    if (statusCode >= 500) {
      logger.error(`[ERROR] ${req.method} ${req.path}`, logContext);
    } else {
      logger.warn(`[${errorCode}] ${req.method} ${req.path}`, logContext);
    }

    // Check if response was already sent
    if (res.headersSent) {
      logger.error(`[ERROR] Headers already sent for request ${req.id}`);
      return;
    }

    // Send error response
    const errorResponse = formatErrorResponse(
      { code: errorCode, message, details },
      statusCode,
      req.id,
      environment
    );

    res.status(statusCode).json(errorResponse);
  };
}

/**
 * 404 Handler - Must be registered after all routes
 */
function notFoundHandler() {
  return (req, res) => {
    res.status(404).json({
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  };
}

module.exports = {
  middleware,
  notFoundHandler,
  ERROR_CODES,
  formatErrorResponse
};
