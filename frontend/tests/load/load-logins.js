/**
 * Load Test: Concurrent Login Flow
 * Tests login capacity and performance under load
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1';

// Test email/password combinations
const testLogins = [
  { email: 'test@example.com', password: 'TestPass123!' },
  { email: 'user@test.com', password: 'UserPass123!' },
  { email: 'load@test.com', password: 'LoadTest123!' },
];

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up
    { duration: '2m', target: 100 },  // Increase load
    { duration: '2m', target: 100 },  // Sustain
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.3'],
  },
};

export default function () {
  group('Login Load Test', function () {
    const loginCredential = testLogins[Math.floor(Math.random() * testLogins.length)];

    const loginResp = http.post(BASE_URL + '/auth/login', JSON.stringify({
      email: loginCredential.email,
      password: loginCredential.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '5s',
      tags: { name: 'Login' },
    });

    check(loginResp, {
      'login response received': (r) => [200, 401, 400].includes(r.status),
      'response time < 2000ms': (r) => r.timings.duration < 2000,
    });
  });

  sleep(0.5);
}
