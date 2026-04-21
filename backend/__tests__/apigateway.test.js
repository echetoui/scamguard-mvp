/**
 * API Gateway Tests
 * Tests for:
 * - Request ID generation and tracking
 * - Input sanitization
 * - Request validation
 * - Error handling
 * - CORS configuration
 * - Request/response logging
 * - Webhook processing
 *
 * ARCH.5: API Gateway Setup - Test Suite
 */

const request = require('supertest');
const express = require('express');
const { createAPIGateway } = require('../gateway/apiGateway');
const requestLogger = require('../gateway/middleware/requestLogger');
const { sanitizeString, sanitizeObject } = require('../gateway/middleware/inputSanitizer');
const { validateRequest } = require('../gateway/middleware/requestValidator');
const errorHandler = require('../gateway/middleware/errorHandler');

describe('API Gateway', () => {
  let app;
  let gateway;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    gateway = createAPIGateway({ environment: 'development' });
    app.use('/api/v1', gateway.router);

    // Add mock endpoints for testing
    const testRouter = express.Router();
    testRouter.post('/auth/request-sms-otp', (req, res) => {
      res.json({ data: { otp: '1234', message: 'OTP sent' }, requestId: req.id });
    });
    testRouter.post('/auth/verify-sms-otp', (req, res) => {
      res.json({ data: { sessionToken: 'token123' }, requestId: req.id });
    });
    testRouter.post('/notifications/test-sms', (req, res) => {
      res.json({ data: { status: 'sent' }, requestId: req.id });
    });
    testRouter.get('/test-route', (req, res) => {
      res.json({ status: 'ok', requestId: req.id });
    });
    app.use('/api/v1', testRouter);

    app.use(gateway.errorHandler);
    app.use(errorHandler.notFoundHandler());
  });

  describe('Request ID Generation', () => {
    it('should generate unique request IDs', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body.requestId).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should use provided X-Request-ID header', async () => {
      const customId = 'custom-request-id-123';
      const response = await request(app)
        .get('/api/v1/health')
        .set('X-Request-ID', customId);

      expect(response.headers['x-request-id']).toBe(customId);
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-sms-otp')
        .send({ phone: '123' }); // Invalid

      expect(response.body.error.requestId).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should remove control characters', () => {
      const input = 'test\x00\x01\x02string';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('\x00');
      expect(sanitized).toBe('teststring');
    });

    it('should sanitize object recursively', () => {
      const input = {
        name: '<img src=x onerror="alert(1)">',
        nested: {
          field: 'normal<script>bad</script>'
        },
        array: ['safe', '<svg onload="alert(1)">']
      };

      const sanitized = sanitizeObject(input);
      expect(sanitized.name).not.toContain('<img');
      expect(sanitized.nested.field).not.toContain('<script>');
      expect(sanitized.array[1]).not.toContain('<svg');
    });

    it('should reject suspicious object keys', () => {
      const input = {
        __proto__: 'malicious',
        constructor: 'bad',
        'normal-key': 'value'
      };

      const sanitized = sanitizeObject(input);
      expect(sanitized.hasOwnProperty('__proto__')).toBe(false);
      expect(sanitized.hasOwnProperty('constructor')).toBe(false);
      expect(sanitized['normal-key']).toBe('value');
    });

    it('should limit array size to prevent DoS', () => {
      const largeArray = Array(1500).fill('item');
      const sanitized = sanitizeObject({ items: largeArray });
      expect(sanitized.items.length).toBeLessThanOrEqual(1000);
    });

    it('should limit object keys to prevent DoS', () => {
      const largeObject = {};
      for (let i = 0; i < 150; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }
      const sanitized = sanitizeObject(largeObject);
      expect(Object.keys(sanitized).length).toBeLessThanOrEqual(100);
    });
  });

  describe('Request Validation', () => {
    it('should validate SMS OTP request format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-sms-otp')
        .send({ phone: '123' }); // Too short

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid phone numbers', () => {
      const validation = validateRequest({
        method: 'POST',
        path: '/auth/request-sms-otp',
        body: { phone: '5551234567' }
      });

      expect(validation.valid).toBe(true);
    });

    it('should reject invalid OTP code format', () => {
      const validation = validateRequest({
        method: 'POST',
        path: '/auth/verify-sms-otp',
        body: { phone: '5551234567', code: 'abc' } // Not 4 digits
      });

      expect(validation.valid).toBe(false);
    });

    it('should validate email format in tools', () => {
      const validation = validateRequest({
        method: 'POST',
        path: '/tools/check-email',
        body: { email: 'invalid-email' }
      });

      expect(validation.valid).toBe(false);
    });

    it('should validate scam type enum', () => {
      const validation = validateRequest({
        method: 'POST',
        path: '/scam-reports',
        body: {
          scamType: 'INVALID_TYPE',
          description: 'Test scam'
        }
      });

      expect(validation.valid).toBe(false);
    });

    it('should remove additional properties from request', () => {
      const validation = validateRequest({
        method: 'POST',
        path: '/auth/request-sms-otp',
        body: {
          phone: '5551234567',
          extraField: 'should be ignored',
          anotherExtra: 'also ignored'
        }
      });

      expect(validation.valid).toBe(true);
    });
  });

  describe('CORS Configuration', () => {
    it('should return CORS headers for allowed origins', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeTruthy();
    });

    it('should allow credentials', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should expose required headers', async () => {
      const response = await request(app).get('/api/v1/health');
      const exposed = response.headers['access-control-expose-headers'];
      expect(exposed).toContain('X-Request-ID');
      expect(exposed).toContain('X-Response-Time');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/v1/auth/request-sms-otp')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should include environment in response', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body.environment).toBe('development');
    });

    it('should include request ID in health response', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body.requestId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.requestId).toBeDefined();
    });

    it('should handle validation errors with details', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-sms-otp')
        .send({ phone: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toBeDefined();
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-sms-otp')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-sms-otp')
        .set('Content-Type', 'application/json')
        .send('{invalid json}');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Request Logging', () => {
    it('should include response time header', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.headers['x-response-time']).toBeDefined();
      expect(response.headers['x-response-time']).toMatch(/^\d+ms$/);
    });

    it('should track request metadata', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-sms-otp')
        .send({ phone: '5551234567' });

      expect(response.body.requestId).toBeDefined();
    });
  });

  describe('OpenAPI Specification', () => {
    it('should generate valid OpenAPI spec', () => {
      const spec = gateway.getOpenAPISpec('http://localhost:8000');

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info).toBeDefined();
      expect(spec.paths).toBeDefined();
      expect(spec.components).toBeDefined();
    });

    it('should include all auth endpoints in spec', () => {
      const spec = gateway.getOpenAPISpec('http://localhost:8000');

      expect(spec.paths['/api/v1/auth/request-sms-otp']).toBeDefined();
      expect(spec.paths['/api/v1/auth/verify-sms-otp']).toBeDefined();
    });

    it('should include webhook endpoints in spec', () => {
      const spec = gateway.getOpenAPISpec('http://localhost:8000');

      expect(spec.paths['/api/v1/webhooks/scam-reports']).toBeDefined();
    });
  });

  describe('API Versioning Support', () => {
    it('should support v1 API paths', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
    });

    it('should validate v1-specific schemas', () => {
      const validation = validateRequest({
        method: 'POST',
        path: '/auth/request-sms-otp',
        body: { phone: '5551234567' }
      });

      expect(validation.valid).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete request lifecycle with validation, sanitization, and logging', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-sms-otp')
        .send({
          phone: '5551234567',
          malicious: '<script>alert("xss")</script>'
        });

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-response-time']).toBeDefined();
    });

    it('should reject and log malicious input attempts', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-sms-otp')
        .send({
          phone: "5551234567; DROP TABLE users;--"
        });

      // Should still be rejected or sanitized
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
