/**
 * Request Validation Middleware
 * Validates all incoming requests against JSON Schema
 * Schema definitions are version-specific and endpoint-specific
 *
 * Validates:
 * - Request body structure
 * - Required fields
 * - Data types
 * - Field formats (email, phone, URL, etc.)
 * - Field constraints (min/max length, patterns, etc.)
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize AJV validator with formats
const ajv = new Ajv({ coerceTypes: true, removeAdditional: 'all' });
addFormats(ajv);

// API endpoint schemas - v1
// NOTE: Path keys should match req.path after the router prefix
// If router is mounted at /api/v1, then req.path would be /auth/request-sms-otp
const schemaV1 = {
  // Auth endpoints
  'POST:/auth/request-sms-otp': {
    type: 'object',
    properties: {
      phone: { type: 'string', minLength: 10, maxLength: 15 },
      phoneNumber: { type: 'string', minLength: 10, maxLength: 15 }
    },
    required: ['phone'],
    additionalProperties: false
  },

  'POST:/auth/verify-sms-otp': {
    type: 'object',
    properties: {
      phone: { type: 'string', minLength: 10, maxLength: 15 },
      phoneNumber: { type: 'string', minLength: 10, maxLength: 15 },
      code: { type: 'string', pattern: '^[0-9]{4}$' }
    },
    required: ['phone', 'code'],
    additionalProperties: false
  },

  'POST:/auth/request-password-reset': {
    type: 'object',
    properties: {
      phone: { type: 'string', minLength: 10, maxLength: 15 }
    },
    required: ['phone'],
    additionalProperties: false
  },

  'POST:/auth/reset-password': {
    type: 'object',
    properties: {
      reset_token: { type: 'string', minLength: 32 },
      new_password: { type: 'string', minLength: 8, maxLength: 128 }
    },
    required: ['reset_token', 'new_password'],
    additionalProperties: false
  },

  'POST:/auth/validate-session': {
    type: 'object',
    properties: {
      session_token: { type: 'string', minLength: 32 }
    },
    required: ['session_token'],
    additionalProperties: false
  },

  'POST:/auth/refresh-session': {
    type: 'object',
    properties: {
      session_token: { type: 'string', minLength: 32 }
    },
    required: ['session_token'],
    additionalProperties: false
  },

  // Family endpoints
  'POST:/family/create': {
    type: 'object',
    properties: {
      familyName: { type: 'string', minLength: 1, maxLength: 100 }
    },
    required: [],
    additionalProperties: false
  },

  'POST:/family/join': {
    type: 'object',
    properties: {
      inviteCode: { type: 'string', pattern: '^[A-Z0-9]{6}$' }
    },
    required: ['inviteCode'],
    additionalProperties: false
  },

  // Scam report endpoint
  'POST:/scam-reports': {
    type: 'object',
    properties: {
      scamType: { type: 'string', enum: ['PHISHING', 'MALWARE', 'FRAUD', 'SOCIAL_ENGINEERING', 'OTHER'] },
      description: { type: 'string', minLength: 10, maxLength: 5000 },
      evidence: { type: 'string', maxLength: 10000 },
      contactInfo: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', pattern: '^[0-9+\\-() ]{10,20}$' }
        },
        additionalProperties: false
      }
    },
    required: ['scamType', 'description'],
    additionalProperties: false
  },

  // Tools endpoints
  'POST:/tools/check-email': {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' }
    },
    required: ['email'],
    additionalProperties: false
  },

  'POST:/tools/check-advisor': {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 100 },
      licenseNumber: { type: 'string', maxLength: 50 },
      firmName: { type: 'string', maxLength: 100 }
    },
    required: [],
    additionalProperties: false
  },

  // Notification endpoints
  'POST:/notifications/preferences': {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false
  },

  'PUT:/notifications/preferences': {
    type: 'object',
    properties: {
      smsAlertsEnabled: { type: 'boolean' },
      emailAlertsEnabled: { type: 'boolean' },
      preferences: { type: 'object', additionalProperties: true }
    },
    required: [],
    additionalProperties: false
  },

  'POST:/notifications/test-sms': {
    type: 'object',
    properties: {
      phoneNumber: { type: 'string', pattern: '^[0-9+\\-() ]{10,20}$' },
      type: { type: 'string', enum: ['THREAT_ALERT', 'DAILY_DIGEST', 'REMINDER', 'DAILY_TIP', 'WEEKLY_REPORT'] }
    },
    required: ['phoneNumber', 'type'],
    additionalProperties: false
  },

  'POST:/notifications/test-email': {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      type: { type: 'string', enum: ['THREAT_ALERT', 'DAILY_DIGEST', 'WEEKLY_REPORT', 'REMINDER'] }
    },
    required: ['email', 'type'],
    additionalProperties: false
  }
};

// Compile schemas
const compiledSchemas = {};
Object.entries(schemaV1).forEach(([key, schema]) => {
  compiledSchemas[key] = ajv.compile(schema);
});

/**
 * Get schema key from request
 */
function getSchemaKey(req) {
  return `${req.method}:${req.path}`;
}

/**
 * Validate request against schema
 */
function validateRequest(req) {
  const schemaKey = getSchemaKey(req);
  const validator = compiledSchemas[schemaKey];

  // No schema defined for this endpoint - skip validation
  if (!validator) {
    return { valid: true, errors: [] };
  }

  // Validate against schema
  const valid = validator(req.body || {});

  if (!valid) {
    return {
      valid: false,
      errors: validator.errors.map(error => ({
        field: error.instancePath || '/',
        message: error.message,
        keyword: error.keyword
      }))
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Request Validator Middleware
 */
function middleware() {
  return (req, res, next) => {
    // Skip validation for GET requests (they don't have bodies)
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') {
      return next();
    }

    // Skip validation for health/webhook endpoints
    if (req.path === '/health' || req.path.startsWith('/webhooks')) {
      return next();
    }

    const validation = validateRequest(req);

    if (!validation.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: validation.errors,
          requestId: req.id,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Store validation result
    req.validated = true;

    next();
  };
}

module.exports = {
  middleware,
  validateRequest,
  getSchemaKey,
  schemas: schemaV1
};
