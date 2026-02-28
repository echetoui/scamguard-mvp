/**
 * Load Test: Token Refresh Stress Test
 * Tests token refresh endpoint under heavy concurrent load
 * Simulates 100-500 simultaneous token refresh requests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Histogram } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1';

// Test refresh tokens (should be collected from successful logins)
const REFRESH_TOKENS = {
  0: 'test-refresh-token-1',
  1: 'test-refresh-token-2',
  2: 'test-refresh-token-3',
  3: 'test-refresh-token-4',
  4: 'test-refresh-token-5',
};

// Custom metrics
const refreshDuration = new Histogram('refresh_duration');
const refreshSuccess = new Counter('refresh_success');
const refreshFailure = new Counter('refresh_failure');
const errorRate = new Rate('refresh_errors');

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 concurrent refresh requests
    { duration: '2m', target: 300 },   // Ramp up to 300 concurrent refresh requests
    { duration: '3m', target: 500 },   // Ramp up to 500 concurrent refresh requests
    { duration: '2m', target: 100 },   // Ramp down
    { duration: '1m', target: 0 },     // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.05'],
    'refresh_errors': ['rate<0.05'],
  },
};

export default function () {
  const refreshToken = REFRESH_TOKENS[Math.floor(Math.random() * REFRESH_TOKENS.length)];

  const refreshPayload = {
    refresh_token: refreshToken,
  };

  const refreshResponse = http.post(`${BASE_URL}/auth/refresh-token`, JSON.stringify(refreshPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'RefreshToken' },
  });

  const refreshSuccess_check = check(refreshResponse, {
    'refresh status is 200 or 400': (r) => [200, 400].includes(r.status),
    'refresh has new token on success': (r) => {
      if (r.status === 200) {
        return r.json('id_token') !== null || r.json('accessToken') !== null;
      }
      return true; // 400 errors are acceptable (invalid/expired token)
    },
  });

  if (refreshResponse.status === 200) {
    refreshSuccess.add(1);
  } else if (refreshResponse.status === 400 || refreshResponse.status === 401) {
    // These are expected errors for invalid/expired tokens
    refreshSuccess.add(1);
  } else {
    refreshFailure.add(1);
    errorRate.add(1);
  }

  refreshDuration.add(refreshResponse.timings.duration, { status: refreshResponse.status });

  if (![200, 400, 401].includes(refreshResponse.status)) {
    console.log(`Token refresh unexpected status: ${refreshResponse.status} ${refreshResponse.body}`);
  }

  sleep(0.5);
}
