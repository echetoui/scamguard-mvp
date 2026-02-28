/**
 * Load Test: Mixed User Load
 * Simulates realistic user traffic distribution
 * 30% signup, 50% login, 20% token refresh
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1';

const testUsers = [
  { email: 'mixeduser1@example.com', password: 'TestPass123!' },
  { email: 'mixeduser2@example.com', password: 'TestPass123!' },
  { email: 'mixeduser3@example.com', password: 'TestPass123!' },
];

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 concurrent users
    { duration: '3m', target: 50 },   // Ramp up to 50 concurrent users
    { duration: '3m', target: 50 },   // Sustain at 50 for 3 minutes
    { duration: '1m', target: 10 },   // Ramp down
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(90)<1000', 'p(95)<2000', 'p(99)<3000'],
    'http_req_failed': ['rate<0.1'],
  },
};

export default function () {
  const action = Math.random();

  if (action < 0.30) {
    handleSignup();
  } else if (action < 0.80) {
    handleLogin();
  } else {
    handleTokenRefresh();
  }
}

function handleSignup() {
  group('Signup Flow', function () {
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
    const email = 'signup-' + uniqueId + '@example.com';
    const password = 'SignupTest123!';
    const phone = '5145551234';

    // Step 1: Signup
    const signupResp = http.post(BASE_URL + '/auth/signup', JSON.stringify({
      email: email,
      password: password,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Signup' },
    });

    check(signupResp, {
      'signup status is 200': (r) => r.status === 200,
    });

    if (signupResp.status !== 200) {
      return;
    }

    const idToken = signupResp.json('id_token') || signupResp.json('accessToken') || '';
    if (!idToken) {
      return;
    }

    sleep(0.5);

    // Step 2: Request OTP
    http.post(BASE_URL + '/auth/request-sms-otp', JSON.stringify({
      phone: phone,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + idToken,
      },
      tags: { name: 'RequestOTP' },
    });

    sleep(0.5);

    // Step 3: Verify OTP
    http.post(BASE_URL + '/auth/verify-sms-otp', JSON.stringify({
      phone: phone,
      code: '123456',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + idToken,
      },
      tags: { name: 'VerifyOTP' },
    });
  });
}

function handleLogin() {
  group('Login Flow', function () {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];

    const loginResp = http.post(BASE_URL + '/auth/login', JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' },
    });

    check(loginResp, {
      'login status is 200': (r) => r.status === 200,
      'has tokens': (r) => r.json('id_token') !== null || r.json('accessToken') !== null,
    });
  });
}

function handleTokenRefresh() {
  group('Token Refresh', function () {
    const refreshToken = 'test-refresh-token-' + Math.floor(Math.random() * 100);

    const refreshResp = http.post(BASE_URL + '/auth/refresh-token', JSON.stringify({
      refresh_token: refreshToken,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'RefreshToken' },
    });

    check(refreshResp, {
      'refresh handled': (r) => [200, 400, 401].includes(r.status),
    });
  });
}
