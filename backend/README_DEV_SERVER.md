# ScamGuard Backend - Development Server

## Quick Start

The development server provides local API endpoints for testing without AWS deployment.

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd backend
npm install
```

### Running the Dev Server

```bash
npm run dev
```

This starts the server on **http://localhost:8000**.

### Features

✅ **SMS OTP Authentication**
- `POST /api/v1/auth/request-sms-otp` - Request OTP code
- `POST /api/v1/auth/verify-sms-otp` - Verify OTP code

✅ **Development Mode**
- OTP codes returned in API response for easy testing
- In-memory storage (no database required)
- CORS enabled for frontend requests

### Frontend Integration

The Vite frontend (port 5173) is configured with a proxy that forwards all `/api/v1` requests to the dev server:

```javascript
// vite.config.js
proxy: {
  '/api/v1': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

**To use the frontend with the dev server:**

1. Start the dev server:
   ```bash
   npm run dev  # in backend/
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm run dev  # in frontend/
   ```

3. Open http://localhost:5173 in your browser

### Testing SMS OTP Flow

**Request OTP:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/request-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "514-123-4567"}'
```

Response includes the OTP in development mode:
```json
{
  "data": {
    "message": "OTP sent to your phone number.",
    "phone_masked": "***4567",
    "otp": "1234"
  }
}
```

**Verify OTP:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "514-123-4567", "code": "1234"}'
```

Response on success:
```json
{
  "data": {
    "user_id": "user_xyz123",
    "phone_number": "5141234567",
    "token": "eyJ...",
    "message": "SMS OTP verified successfully."
  }
}
```

### Phone Number Format

Accepts phone numbers with:
- Spaces, hyphens, parentheses (automatically cleaned)
- Minimum 10 digits required
- Examples: `514 123 4567`, `(514) 123-4567`, `5141234567`

### OTP Rules

- **4-digit code** - Auto-generated on each request
- **5-minute expiry** - Code expires after 5 minutes
- **3 attempt limit** - Maximum 3 failed verification attempts before expiry
- **Development mode** - Code returned in response for testing

### Environment Variables

```bash
PORT=8000  # Default port (optional)
```

### Production Deployment

For AWS Lambda deployment:
1. Use the Python handler in `lambda_/auth_handler.py`
2. Configure AWS Pinpoint or Twilio for actual SMS delivery
3. Use RDS/DynamoDB for persistent storage
4. Set environment variables for AWS credentials

### Troubleshooting

**Port already in use:**
```bash
PORT=8001 npm run dev  # Use a different port
```

**CORS errors:**
- Dev server has CORS enabled by default
- Frontend proxy in Vite handles CORS automatically

**OTP not generating:**
- Check that phone number has at least 10 digits
- Verify request format is `{ "phoneNumber": "..." }`

## Development Notes

- Uses in-memory storage (data lost on server restart)
- OTP codes logged to console for debugging
- All endpoints return JSON responses
- CORS headers included in all responses
