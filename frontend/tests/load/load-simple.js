/**
 * Load Test: Simplified Concurrent Requests
 * Tests basic API endpoint responses under load
 * Focuses on infrastructure capacity (not auth workflow)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1';

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up
    { duration: '3m', target: 100 },  // Sustained load
    { duration: '3m', target: 200 },  // Peak load
    { duration: '2m', target: 50 },   // Ramp down
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.2'],
  },
};

export default function () {
  const payload = {
    email: 'loadtest-' + Date.now() + '@example.com',
    password: 'Test123!',
  };

  const resp = http.post(BASE_URL + '/auth/signup', JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
    tags: { name: 'SignupLoad' },
  });

  check(resp, {
    'status is 200 or 400': (r) => [200, 400].includes(r.status),
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(0.1);
}
