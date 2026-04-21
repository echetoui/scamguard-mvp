/**
 * OpenAPI 3.0 Specification Generator
 * Generates complete API documentation for ScamGuard API
 * Used for Swagger UI integration and API documentation
 */

function createOpenAPISpec(baseUrl = 'http://localhost:8000', environment = 'development') {
  return {
    openapi: '3.0.0',
    info: {
      title: 'ScamGuard API',
      description: 'Central API Gateway for ScamGuard MVP - Fraud Detection & Prevention Platform',
      version: '1.0.0',
      contact: {
        name: 'ScamGuard Team',
        email: 'api@scamguard.app'
      },
      license: {
        name: 'MIT'
      }
    },
    servers: [
      {
        url: baseUrl,
        description: `${environment === 'development' ? 'Development' : 'Production'} Server`
      }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          description: 'Get API Gateway health status',
          responses: {
            '200': {
              description: 'Gateway is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'healthy' },
                      timestamp: { type: 'string', format: 'date-time' },
                      uptime: { type: 'number', example: 1234.56 },
                      environment: { type: 'string', example: 'development' },
                      requestId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/request-sms-otp': {
        post: {
          tags: ['Authentication'],
          summary: 'Request SMS OTP',
          description: 'Request a one-time password via SMS for phone number verification',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    phone: { type: 'string', minLength: 10, example: '5551234567' }
                  },
                  required: ['phone']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'OTP sent successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string' },
                          phone_masked: { type: 'string', example: '***1234' },
                          otp: { type: 'string', description: 'Dev only' },
                          sms_sent: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '429': { $ref: '#/components/responses/RateLimitError' }
          }
        }
      },
      '/api/v1/auth/verify-sms-otp': {
        post: {
          tags: ['Authentication'],
          summary: 'Verify SMS OTP',
          description: 'Verify the OTP code received via SMS',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    phone: { type: 'string', minLength: 10 },
                    code: { type: 'string', pattern: '^[0-9]{4}$' }
                  },
                  required: ['phone', 'code']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'OTP verified, session created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          user_id: { type: 'string' },
                          phone_number: { type: 'string' },
                          token: { type: 'string' },
                          session_token: { type: 'string' },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '429': { $ref: '#/components/responses/RateLimitError' }
          }
        }
      },
      '/api/v1/family/create': {
        post: {
          tags: ['Family'],
          summary: 'Create a new family',
          description: 'Create a new family protection group',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    familyName: { type: 'string', example: 'Smith Family' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Family created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          familyId: { type: 'string' },
                          inviteCode: { type: 'string' },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/v1/scam-reports': {
        post: {
          tags: ['Scam Reports'],
          summary: 'Submit a scam report',
          description: 'Submit a new scam report with details and evidence',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    scamType: {
                      type: 'string',
                      enum: ['PHISHING', 'MALWARE', 'FRAUD', 'SOCIAL_ENGINEERING', 'OTHER']
                    },
                    description: { type: 'string', minLength: 10 },
                    evidence: { type: 'string' },
                    contactInfo: {
                      type: 'object',
                      properties: {
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' }
                      }
                    }
                  },
                  required: ['scamType', 'description']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Scam report submitted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          reportId: { type: 'string' },
                          confirmationNumber: { type: 'string' },
                          status: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/tools/check-email': {
        post: {
          tags: ['Tools'],
          summary: 'Check if email has been breached',
          description: 'Check if an email address appears in known data breaches',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' }
                  },
                  required: ['email']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Breach check completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          email: { type: 'string' },
                          breached: { type: 'boolean' },
                          count: { type: 'integer' },
                          breaches: { type: 'array' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/webhooks/scam-reports': {
        post: {
          tags: ['Webhooks'],
          summary: 'Receive incoming scam report webhook',
          description: 'Endpoint for external systems to submit scam reports via webhook',
          parameters: [
            {
              name: 'X-Webhook-Signature',
              in: 'header',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'X-Webhook-Timestamp',
              in: 'header',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reportId: { type: 'string' },
                    scamType: {
                      type: 'string',
                      enum: ['PHISHING', 'MALWARE', 'FRAUD', 'SOCIAL_ENGINEERING', 'OTHER']
                    },
                    description: { type: 'string' },
                    evidence: { type: 'object' },
                    reportedAt: { type: 'string', format: 'date-time' },
                    source: { type: 'string' }
                  },
                  required: ['reportId', 'scamType', 'description']
                }
              }
            }
          },
          responses: {
            '202': {
              description: 'Webhook accepted and queued for processing',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          eventId: { type: 'string' },
                          reportId: { type: 'string' },
                          status: { type: 'string', example: 'queued' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': {
              description: 'Invalid webhook signature'
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'VALIDATION_ERROR' },
                      message: { type: 'string' },
                      details: { type: 'array' },
                      requestId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        UnauthorizedError: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'UNAUTHORIZED' },
                      message: { type: 'string' },
                      requestId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'RATE_LIMITED' },
                      message: { type: 'string' },
                      requestId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
}

module.exports = {
  createOpenAPISpec
};
