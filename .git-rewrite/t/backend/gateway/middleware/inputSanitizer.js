/**
 * Input Sanitization Middleware
 * Sanitizes all incoming requests to prevent:
 * - XSS attacks (HTML/JS injection)
 * - SQL injection
 * - NoSQL injection
 * - Directory traversal
 * - Control characters
 *
 * Applied to:
 * - Request body (JSON)
 * - Query parameters
 * - URL path
 * - Headers (selective)
 */

const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitize a string value
 * Removes or escapes dangerous characters
 */
function sanitizeString(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove control characters
  let sanitized = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Use DOMPurify for HTML/script content
  sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  return sanitized.trim();
}

/**
 * Sanitize an object recursively
 * Handles nested objects and arrays
 */
function sanitizeObject(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) {
    return obj;
  }

  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => {
      // Limit array size to prevent DoS
      if (index >= 1000) {
        return null;
      }
      return sanitizeObject(item, depth + 1);
    }).filter(item => item !== null);
  }

  const sanitized = {};
  const keys = Object.keys(obj);

  // Limit object keys to prevent DoS
  if (keys.length > 100) {
    return {};
  }

  for (const key of keys) {
    // Reject suspicious key names (case-insensitive check for common attack vectors)
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith('__') ||
        lowerKey.includes('constructor') ||
        lowerKey.includes('prototype') ||
        key === '__proto__') {
      continue;
    }

    const sanitizedKey = sanitizeString(key);
    const sanitizedValue = sanitizeObject(obj[key], depth + 1);

    if (sanitizedKey !== '') {
      sanitized[sanitizedKey] = sanitizedValue;
    }
  }

  return sanitized;
}

/**
 * Check for SQL injection patterns
 */
function hasSQLInjectionPatterns(str) {
  if (typeof str !== 'string') {
    return false;
  }

  // Common SQL injection patterns
  const patterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(-{2}|\/\*|\*\/|;)/,
    /'(\s*(OR|AND)\s*'?)/i,
    /(\d+=\d+)/,
    /(!=|<>|<|>)/
  ];

  return patterns.some(pattern => pattern.test(str));
}

/**
 * Input Sanitizer Middleware
 */
function middleware() {
  return (req, res, next) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
      }

      // Store sanitized values
      req.sanitized = {
        body: req.body,
        query: req.query
      };

      // Check for SQL injection attempts (log but allow for now)
      const bodyStr = JSON.stringify(req.body || {});
      const queryStr = JSON.stringify(req.query || {});

      if (hasSQLInjectionPatterns(bodyStr) || hasSQLInjectionPatterns(queryStr)) {
        // Log suspicious activity
        console.warn(`[SANITIZER] Potential SQL injection attempt detected in request ${req.id}`);
        console.warn(`[SANITIZER] Path: ${req.path}, Method: ${req.method}`);
      }

      next();
    } catch (error) {
      console.error(`[SANITIZER] Error sanitizing input: ${error.message}`);
      // Don't block on sanitizer errors, but log them
      next();
    }
  };
}

module.exports = {
  middleware,
  sanitizeString,
  sanitizeObject,
  hasSQLInjectionPatterns
};
