# 🎨 Phase 4.4 Week 2 - Frontend Integration Guide

**Date:** 23 février 2026
**Status:** Frontend Integration Phase
**Branch:** feature/phase-4.4
**Focus:** Integrate SMSAuthScreen into App.jsx

---

## 📋 Integration Tasks

1. Add SMSAuthScreen to App.jsx
2. Update routing/navigation
3. Add authentication context
4. Test component rendering
5. Test OTP input flow
6. Verify token storage
7. Run accessibility audit

---

## 🔧 Step 1: Review Current App Structure

First, check the current App.jsx structure:

```bash
# Check current App.jsx
cat frontend/src/App.jsx | head -50
```

---

## ✅ Step 2: Update App.jsx to Include SMSAuthScreen

Update `frontend/src/App.jsx` to conditionally render SMSAuthScreen for unauthenticated users:

```jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SMSAuthScreen from './components/SMSAuthScreen';
import DashboardStats from './components/DashboardStats';
import SecurityHeartDashboard from './components/SecurityHeartDashboard';
import BottomNavigation from './components/BottomNavigation';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('scamguard_auth');
        const userId = localStorage.getItem('userId');
        setIsAuthenticated(!!authData && !!userId);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('scamguard_auth');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
  };

  // Handle successful SMS OTP authentication
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  // Show auth screen while loading
  if (loading) {
    return (
      <div className="app-loading">
        <p>Chargement...</p>
      </div>
    );
  }

  // Show SMS auth screen if not authenticated
  if (!isAuthenticated) {
    return <SMSAuthScreen onSuccess={handleAuthSuccess} />;
  }

  // Show main app if authenticated
  return (
    <Router>
      <div className="app-container">
        <div className="app-content">
          <Routes>
            <Route path="/" element={<DashboardStats />} />
            <Route path="/dashboard" element={<SecurityHeartDashboard />} />
            <Route path="/profile" element={<div>Profile Page</div>} />
            <Route path="/logout" element={<div>Logging out...</div>} />
          </Routes>
        </div>
        <BottomNavigation onLogout={handleLogout} />
      </div>
    </Router>
  );
}

export default App;
```

---

## ✅ Step 3: Update SMSAuthScreen to Accept onSuccess Callback

Update `frontend/src/components/SMSAuthScreen.jsx` to accept a callback:

```jsx
// At top of component, add prop
export default function SMSAuthScreen({ onSuccess = null }) {
  // ... existing state ...

  // Update success handler to call callback
  const handleOtpSubmit = async (e) => {
    // ... existing code ...

    // After successful token storage:
    setSuccessMessage('✅ Bienvenue! Vous êtes connecté');
    setStep('success');

    // Redirect after 2 seconds
    setTimeout(() => {
      if (onSuccess) {
        onSuccess();  // Call parent callback
      } else {
        window.location.href = '/';  // Fallback redirect
      }
    }, 2000);
  };

  // ... rest of component ...
}
```

---

## ✅ Step 4: Add Loading States to App

Add loading CSS to `frontend/src/App.css`:

```css
/* Add to App.css */

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.app-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 18px;
}

.app-loading p {
  margin: 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## ✅ Step 5: Update BottomNavigation

Ensure BottomNavigation has logout functionality:

```jsx
// In BottomNavigation.jsx

export default function BottomNavigation({ onLogout = null }) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: direct logout
      localStorage.removeItem('scamguard_auth');
      localStorage.removeItem('userId');
      window.location.href = '/';
    }
  };

  return (
    <nav className="bottom-navigation">
      {/* ... existing nav items ... */}

      <button
        className="nav-item logout"
        onClick={handleLogout}
        aria-label="Se déconnecter"
      >
        🚪 Déconnecter
      </button>
    </nav>
  );
}
```

---

## ✅ Step 6: Test Component Rendering

### 6.1 Test No Authentication

```bash
# Clear auth tokens
localStorage.removeItem('scamguard_auth');
localStorage.removeItem('userId');

# Reload page
# Should see SMSAuthScreen
```

### 6.2 Test With Authentication

```javascript
// In browser console
localStorage.setItem('scamguard_auth', JSON.stringify({
  id_token: 'test-token',
  access_token: 'test-access',
  refresh_token: 'test-refresh',
  expires_in: 3600
}));
localStorage.setItem('userId', 'test-user-123');

// Reload page
// Should see DashboardStats
```

---

## ✅ Step 7: Test OTP Input Flow

### 7.1 Manual Testing Steps

1. **Clear auth data**
   ```javascript
   localStorage.removeItem('scamguard_auth');
   localStorage.removeItem('userId');
   ```

2. **Start signup flow**
   - Enter email: `test@example.com`
   - Enter password: `TestPass123!`
   - Click "Continuer"

3. **Verify phone step**
   - Enter phone: `514 555 1234`
   - Should auto-format to: `+1 (514) 555-1234`
   - Click "Envoyer un code par SMS"

4. **Receive SMS**
   - Check phone for SMS
   - Note the 6-digit code

5. **Verify OTP**
   - Enter 6 digits
   - Should auto-advance between inputs
   - Click "Vérifier"

6. **Success**
   - Should see "✅ Bienvenue!"
   - Should redirect to dashboard
   - Check token storage:
     ```javascript
     JSON.parse(localStorage.getItem('scamguard_auth'))
     localStorage.getItem('userId')
     ```

---

## ✅ Step 8: Test Error Handling

### 8.1 Invalid Email

```javascript
// Try signup with invalid email
// Expected: Error message displayed
```

### 8.2 Invalid Phone Format

```javascript
// Try phone with wrong format
// Expected: "Numéro de téléphone invalide"
```

### 8.3 Wrong OTP Code

```javascript
// Enter wrong 6-digit code
// Expected: "Code invalide. 2 attempts remaining."
```

### 8.4 Rate Limiting

```javascript
// Enter 3 wrong codes
// Expected after 3rd: "Too many attempts. Try again in 15 minutes."
```

---

## ✅ Step 9: Test Token Storage

After successful OTP verification, verify tokens in storage:

```javascript
// In browser console
const auth = JSON.parse(localStorage.getItem('scamguard_auth'));
console.log('Auth object:', auth);
console.log('Has id_token:', !!auth.id_token);
console.log('Has access_token:', !!auth.access_token);
console.log('Has refresh_token:', !!auth.refresh_token);
console.log('Expires in:', auth.expires_in, 'seconds');

// Verify userId is also stored
const userId = localStorage.getItem('userId');
console.log('User ID:', userId);
```

---

## ✅ Step 10: Run Accessibility Audit

### 10.1 Use React DevTools Accessibility Audit

```bash
# Install React DevTools if needed
# Open DevTools > Components > Accessibility
# Check for:
# - ✅ All inputs have labels
# - ✅ All buttons have aria-label
# - ✅ Color contrast adequate
# - ✅ Focus states visible
# - ✅ Keyboard navigation works
```

### 10.2 Manual Accessibility Testing

```bash
# Test with keyboard only (no mouse)
# 1. Tab through all form fields
# 2. Enter should submit forms
# 3. Should see focus indicators
# 4. Should hear screen reader labels (if enabled)

# Test font sizes
# - Base font: 18px minimum ✓
# - Labels: 16px+ ✓
# - Buttons: 20px ✓

# Test colors (WCAG AA)
# - Primary: #0056b3 on white
# - Text: #333 on white
# - Use https://webaim.org/resources/contrastchecker/
```

### 10.3 Use axe DevTools Browser Extension

```bash
# Install axe DevTools for Chrome/Firefox
# Run scan while on SMSAuthScreen
# Fix any violations:
# - Missing alt text
# - Missing labels
# - Insufficient color contrast
# - Missing landmarks
```

---

## 📊 Integration Checklist

- [ ] SMSAuthScreen added to App.jsx
- [ ] Authentication context working
- [ ] Unauthenticated users see auth screen
- [ ] Authenticated users see dashboard
- [ ] Loading state working
- [ ] Logout functionality working
- [ ] SMS signup flow working end-to-end
- [ ] OTP input auto-advance working
- [ ] Token storage working
- [ ] Redirect after login working
- [ ] Error messages displaying
- [ ] Rate limiting working
- [ ] WCAG AA accessibility verified
- [ ] Dark mode compatible
- [ ] Mobile responsive tested

---

## 🧪 Component Testing

Create `frontend/src/components/__tests__/SMSAuthScreen.test.jsx`:

```jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SMSAuthScreen from '../SMSAuthScreen';

describe('SMSAuthScreen', () => {
  test('renders email input on mount', () => {
    render(<SMSAuthScreen />);
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
  });

  test('shows phone input after email submission', async () => {
    render(<SMSAuthScreen />);

    const emailInput = screen.getByLabelText(/adresse email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /continuer/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'TestPass123!');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/numéro de téléphone/i)).toBeInTheDocument();
    });
  });

  test('formats phone number correctly', async () => {
    render(<SMSAuthScreen />);

    // First step
    const emailInput = screen.getByLabelText(/adresse email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'TestPass123!');
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }));

    // Phone formatting
    const phoneInput = await screen.findByLabelText(/numéro de téléphone/i);
    await userEvent.type(phoneInput, '5145551234');

    expect(phoneInput.value).toBe('+1 (514) 555-1234');
  });

  test('shows OTP inputs after phone submission', async () => {
    render(<SMSAuthScreen />);

    // ... fill email and password ...
    // ... submit and get to phone step ...
    // ... fill phone and submit ...

    await waitFor(() => {
      const otpInputs = screen.getAllByLabelText(/chiffre \d/i);
      expect(otpInputs.length).toBe(6);
    });
  });
});
```

---

## 🚀 Run Integration Tests

```bash
cd frontend

# Install testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Run tests
npm test SMSAuthScreen.test.jsx

# With coverage
npm test -- --coverage
```

---

## 📝 Environment Setup

Create `.env.local` if not exists:

```bash
cat > frontend/.env.local <<'EOF'
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_ENVIRONMENT=development
EOF
```

For production:

```bash
cat > frontend/.env.production <<'EOF'
REACT_APP_API_URL=https://api.scamguard.ca/api/v1
REACT_APP_ENVIRONMENT=production
EOF
```

---

## 🔍 Debugging

### Check Network Requests

```javascript
// In browser DevTools > Network tab
// Watch requests to:
// POST /api/v1/auth/request-sms-otp
// POST /api/v1/auth/verify-sms-otp

// Check response status codes:
// 200 = Success
// 400 = Invalid input
// 429 = Rate limited
// 500 = Server error
```

### Check Console Logs

```javascript
// Enable debug logging in SMSAuthScreen:
console.log('Step:', step);
console.log('Phone formatted:', phone);
console.log('OTP values:', otp);
console.log('Error:', error);
```

### Check LocalStorage

```javascript
// Verify auth token storage:
localStorage.getItem('scamguard_auth')
localStorage.getItem('userId')
```

---

## 🎯 Mobile Testing

### Test on iPhone/iPad

```bash
# If running local server, test on device:
# 1. Get your machine's IP: ifconfig | grep inet
# 2. On device, visit: http://YOUR_IP:3000
# 3. Test signup flow on mobile
# 4. Test on-screen keyboard behavior
# 5. Test auto-fill for SMS codes (iOS 14+)
```

### Test on Android

```bash
# Android auto-fills OTP codes when:
# - Input type="text"
# - Name contains "otp" or "code"
# - SMS arrives while screen is visible

# Verify auto-fill works:
# 1. Request OTP
# 2. SMS arrives
# 3. Code appears in input automatically
```

---

## 📱 Responsive Testing

Check at these breakpoints:

```css
/* Desktop: > 1024px */
/* Tablet: 768px - 1024px */
/* Mobile: < 768px */
/* Small phone: < 480px */
/* Tiny phone: < 360px */
```

Test at each breakpoint:
- [ ] Buttons large enough (60px min)
- [ ] Text readable
- [ ] Inputs accessible
- [ ] No horizontal scrolling
- [ ] Touch targets proper size

---

## ✨ Polish

### Add Loading Indicators

```jsx
{loading && (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Un instant...</p>
  </div>
)}
```

### Add Success Animation

```jsx
{step === 'success' && (
  <div className="success-animation">
    <div className="checkmark">✓</div>
    <p className="success-text">Connecté avec succès!</p>
  </div>
)}
```

### Add Resend Timer

```jsx
{resendTimer > 0 ? (
  <p className="timer">Renvoyez le code dans {resendTimer}s</p>
) : (
  <button onClick={handleResend}>Renvoyer le code</button>
)}
```

---

## 🔗 Related Files

- `frontend/src/App.jsx` - Main app component
- `frontend/src/components/SMSAuthScreen.jsx` - Auth screen
- `frontend/src/components/SMSAuthScreen.css` - Styling
- `frontend/src/components/BottomNavigation.jsx` - Navigation
- `backend/lambda/sms_otp_handler.py` - Backend API

---

## 📈 Success Criteria

After integration:

- [ ] Users can sign up with SMS OTP
- [ ] Users can log in with existing credentials
- [ ] Tokens stored securely in localStorage
- [ ] Auto-redirect after successful auth
- [ ] Error messages clear and helpful
- [ ] Rate limiting prevents brute force
- [ ] WCAG AA accessibility compliant
- [ ] Mobile responsive on all devices
- [ ] Fast (< 2s signup flow)
- [ ] Senior-friendly UX

---

**Status:** 🎨 Frontend Integration Ready
**Created:** 23 février 2026
**Branch:** feature/phase-4.4

**Next:** Update App.jsx and test integration
