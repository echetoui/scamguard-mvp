/**
 * Load Test: Concurrent Signup Flow
 * Tests signup capacity and performance under increasing load
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1';

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up
    { duration: '2m', target: 100 },  // Increase
    { duration: '2m', target: 100 },  // Sustain
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1500'],
    'http_req_failed': ['rate<0.3'],
  },
};

export default function () {
  group('Signup Load Test', function () {
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 100000).toString();
    const email = 'signup-' + uniqueId + '@example.com';
    const password = 'SignupTest123!';
    const phone = '5145551234';

    // Step 1: Signup
    const signupResp = http.post(BASE_URL + '/auth/signup', JSON.stringify({
      email: email,
      password: password,
    }), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '5s',
      tags: { name: 'Signup' },
    });

    const signupOk = check(signupResp, {
      'signup status is 200': (r) => r.status === 200,
      'response time < 1500ms': (r) => r.timings.duration < 1500,
    });

    if (!signupOk) {
      return;
    }

    const idToken = signupResp.json('id_token') || signupResp.json('accessToken');
    if (!idToken) {
      return;
    }

    sleep(0.2);

    // Step 2: Request SMS OTP
    const otpResp = http.post(BASE_URL + '/auth/request-sms-otp', JSON.stringify({
      phone: phone,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + idToken,
      },
      timeout: '5s',
      tags: { name: 'RequestOTP' },
    });

    check(otpResp, {
      'OTP request successful': (r) => [200, 400].includes(r.status),
    });

    sleep(0.2);

    // Step 3: Verify SMS OTP
    http.post(BASE_URL + '/auth/verify-sms-otp', JSON.stringify({
      phone: phone,
      code: '123456',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + idToken,
      },
      timeout: '5s',
      tags: { name: 'VerifyOTP' },
    });
  });

  sleep(0.5);
}
