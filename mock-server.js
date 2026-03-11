/**
 * Mock API Server for ScamGuard Frontend Development
 * Responds to SMS OTP and auth endpoints for local testing
 */
const http = require('http');
const url = require('url');

const PORT = 3001;

// Mock data storage
const users = new Map();
const otpCache = new Map();

function generateOTP() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

function send(res, status, data) {
  res.writeHead(status, corsHeaders());
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS
  if (req.method === 'OPTIONS') {
    send(res, 200, {});
    return;
  }

  // SMS OTP Request
  if (pathname === '/api/v1/auth/request-sms-otp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, phone, password } = JSON.parse(body);
        const otp = generateOTP();
        otpCache.set(phone, { otp, email, password, timestamp: Date.now() });

        console.log(`✅ SMS OTP for ${phone}: ${otp}`);

        // Mask phone number: +14388313122 -> +14****3122
        const phoneMasked = phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;

        send(res, 200, {
          success: true,
          data: {
            message: `Code envoyé à ${phone}`,
            expires_in: 600,
            phone_masked: phoneMasked,
            otp // For testing - remove in production!
          }
        });
      } catch (err) {
        send(res, 400, { error: 'Invalid request' });
      }
    });
    return;
  }

  // Verify SMS OTP
  if (pathname === '/api/v1/auth/verify-sms-otp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, phone, code, password } = JSON.parse(body);
        const cached = otpCache.get(phone);

        if (!cached) {
          send(res, 400, { error: { message: 'OTP expired or invalid' } });
          return;
        }

        // Check OTP expiration (5 minutes)
        if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
          send(res, 400, { error: { message: 'OTP expired' } });
          return;
        }

        // Accept the stored OTP or Firebase test code (123456) for testing
        if (cached.otp !== code && code !== '123456') {
          send(res, 400, { error: { message: 'Invalid OTP code' } });
          return;
        }

        // Store user
        users.set(email, { email, phone, password });
        otpCache.delete(phone);

        send(res, 200, {
          success: true,
          data: {
            id_token: 'mock-id-token-' + Date.now(),
            access_token: 'mock-access-token-' + Date.now(),
            refresh_token: 'mock-refresh-token-' + Date.now(),
            expires_in: 3600,
            user: { email, phone }
          }
        });
      } catch (err) {
        send(res, 400, { error: 'Invalid request' });
      }
    });
    return;
  }

  // Login
  if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        const user = users.get(email);

        if (!user || user.password !== password) {
          send(res, 401, { error: { message: 'Invalid credentials' } });
          return;
        }

        send(res, 200, {
          success: true,
          data: {
            id_token: 'mock-id-token-' + Date.now(),
            access_token: 'mock-access-token-' + Date.now(),
            refresh_token: 'mock-refresh-token-' + Date.now(),
            expires_in: 3600,
            user: { email, phone: user.phone }
          }
        });
      } catch (err) {
        send(res, 400, { error: 'Invalid request' });
      }
    });
    return;
  }

  // Logout
  if (pathname === '/api/v1/auth/logout' && req.method === 'POST') {
    send(res, 200, { success: true });
    return;
  }

  // Refresh token
  if (pathname === '/api/v1/auth/refresh-token' && req.method === 'POST') {
    send(res, 200, {
      success: true,
      data: {
        id_token: 'mock-id-token-' + Date.now(),
        access_token: 'mock-access-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        expires_in: 3600,
      }
    });
    return;
  }

  // Not found
  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /api/v1/auth/request-sms-otp`);
  console.log(`   POST /api/v1/auth/verify-sms-otp`);
  console.log(`   POST /api/v1/auth/login`);
  console.log(`   POST /api/v1/auth/logout`);
  console.log(`   POST /api/v1/auth/refresh-token`);
  console.log(`\n⚠️  OTP codes logged to console for testing\n`);
});
