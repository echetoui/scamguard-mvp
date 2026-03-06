# Web Design Guidelines - Audit Fixes

**Date:** 6 mars 2026
**Status:** 🔴 CRITICAL FIXES PENDING
**Overall Score:** 72/100

---

## 🔴 CRITICAL FIXES (DO IMMEDIATELY)

### 1. Add Labels to Form Inputs

**Problem:** Inputs in SMSAuthScreen.jsx and AuthScreen.jsx are missing `<label>` elements.
This breaks accessibility for screen readers.

**Files:**
- `frontend/src/components/SMSAuthScreen.jsx`
- `frontend/src/components/AuthScreen.jsx`

**Fix - SMSAuthScreen.jsx (Phone Input)**

```jsx
// BEFORE:
<input
  type="tel"
  placeholder="Numéro de téléphone"
  value={phone}
  onChange={(e) => setPhone(formatPhone(e.target.value))}
/>

// AFTER:
<div className="form-group">
  <label htmlFor="phone-input">Numéro de téléphone</label>
  <input
    id="phone-input"
    type="tel"
    placeholder="Numéro de téléphone"
    value={phone}
    onChange={(e) => setPhone(formatPhone(e.target.value))}
    aria-label="Numéro de téléphone au format E.164"
    aria-invalid={error ? "true" : "false"}
  />
  {error && <span className="error-message" role="alert">{error}</span>}
</div>
```

**Fix - SMSAuthScreen.jsx (Email Input)**

```jsx
// BEFORE:
<input
  type="email"
  placeholder="Adresse email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// AFTER:
<div className="form-group">
  <label htmlFor="email-input">Adresse email</label>
  <input
    id="email-input"
    type="email"
    placeholder="Adresse email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    aria-label="Votre adresse email"
    aria-invalid={error ? "true" : "false"}
  />
</div>
```

**Fix - SMSAuthScreen.jsx (Password Input)**

```jsx
// BEFORE:
<input
  type="password"
  placeholder="Mot de passe"
  value={password}
/>

// AFTER:
<div className="form-group">
  <label htmlFor="password-input">
    Mot de passe
    <span className="requirement-hint">(min. 16 caractères)</span>
  </label>
  <input
    id="password-input"
    type="password"
    placeholder="Mot de passe sécurisé"
    value={password}
    aria-label="Mot de passe - minimum 16 caractères avec majuscules, minuscules, chiffres et symboles"
    aria-invalid={error ? "true" : "false"}
    aria-describedby="password-requirements"
  />
  <span id="password-requirements" className="password-requirements">
    ✓ 16+ caractères | Majuscules | Minuscules | Chiffres | Symboles
  </span>
</div>
```

**Fix - SMSAuthScreen.jsx (OTP Inputs)**

```jsx
// BEFORE:
{otp.map((digit, index) => (
  <input
    key={index}
    type="text"
    maxLength="1"
    value={digit}
    onChange={(e) => handleOtpChange(index, e.target.value)}
    inputMode="numeric"
  />
))}

// AFTER:
<div className="otp-inputs-group" role="group" aria-label="Code de vérification à 6 chiffres">
  {otp.map((digit, index) => (
    <input
      key={index}
      ref={(el) => (otpRefs.current[index] = el)}
      id={`otp-digit-${index}`}
      type="text"
      maxLength="1"
      value={digit}
      onChange={(e) => handleOtpChange(index, e.target.value)}
      inputMode="numeric"
      aria-label={`Chiffre ${index + 1} du code de vérification`}
      aria-describedby="otp-instructions"
    />
  ))}
</div>
<p id="otp-instructions" className="otp-instructions">
  Entrez le code à 6 chiffres reçu par SMS
</p>
```

---

### 2. Replace alert() with Toast Component

**Problem:** Using browser `alert()` is not accessible. Should use ARIA alertdialog or toast.

**Location:** `frontend/src/components/SMSAuthScreen.jsx` line 65

**Current Code:**
```javascript
const handleCopyPassword = () => {
  navigator.clipboard.writeText(password);
  alert('✅ Mot de passe copié dans le presse-papiers!'); // ❌ BAD
};
```

**Solution: Create Toast Component**

Create: `frontend/src/components/Toast.jsx`

```jsx
/**
 * Accessible Toast Component
 * Uses role="alert" for announcements without interrupting user
 */
import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose, autoClose = 3000 }) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="toast-icon">
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'info' && 'ℹ️'}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  );
}
```

Create: `frontend/src/components/Toast.css`

```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  border-radius: 8px;
  padding: 16px 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: toastSlideIn 300ms ease-out;
  z-index: 9999;
  max-width: 400px;
}

.toast-success {
  border-left: 4px solid #2e7d32;
}

.toast-error {
  border-left: 4px solid #c62828;
}

.toast-info {
  border-left: 4px solid #0066cc;
}

.toast-icon {
  font-size: 20px;
  min-width: 24px;
}

.toast-message {
  font-size: 14px;
  color: #1a1a1a;
  line-height: 1.4;
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: none;
  }
}

@media (max-width: 640px) {
  .toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
}
```

**Update SMSAuthScreen.jsx:**

```jsx
import Toast from './Toast';

// ... inside component
const [showToast, setShowToast] = useState(false);
const [toastMessage, setToastMessage] = useState('');

const handleCopyPassword = () => {
  navigator.clipboard.writeText(password);
  setToastMessage('✅ Mot de passe copié dans le presse-papiers!');
  setShowToast(true);
};

// ... in return JSX
{showToast && (
  <Toast
    message={toastMessage}
    type="success"
    onClose={() => setShowToast(false)}
  />
)}
```

---

### 3. Add aria-label to Buttons Without Text

**Problem:** Buttons with only emojis (e.g., "ℹ️ En savoir plus") need proper labels for screen readers.

**Location:** `frontend/src/components/ModernAuthPage.jsx` lines 27-32, 59

**Fix 1: Secondary Button (NavBar)**

```jsx
// BEFORE:
<button
  className="navbar-btn navbar-btn-secondary"
  onClick={() => setShowAuth(true)}
>
  Se connecter
</button>

// AFTER:
<button
  className="navbar-btn navbar-btn-secondary"
  onClick={() => setShowAuth(true)}
  aria-label="Accéder à la page de connexion"
>
  Se connecter
</button>
```

**Fix 2: CTA Secondary Button (Hero Section)**

```jsx
// BEFORE:
<button className="cta-secondary">
  ℹ️ En savoir plus
</button>

// AFTER:
<button
  className="cta-secondary"
  aria-label="En savoir plus sur ScamGuard - détails de protection"
>
  <span aria-hidden="true">ℹ️</span> En savoir plus
</button>
```

**Why `aria-hidden="true"` on emoji?**
- Screen readers would say "information symbol" + text is redundant
- Emojis are decorative, text is meaningful

**Fix 3: CTA Primary Button**

```jsx
// BEFORE:
<button
  className="cta-primary"
  onClick={() => setShowAuth(true)}
>
  Commencer maintenant
  <span className="cta-arrow">→</span>
</button>

// AFTER:
<button
  className="cta-primary"
  onClick={() => setShowAuth(true)}
  aria-label="Commencer maintenant avec ScamGuard - créer un compte ou se connecter"
>
  Commencer maintenant
  <span className="cta-arrow" aria-hidden="true">→</span>
</button>
```

---

### 4. Fix Focus States with Visible Outline

**Problem:** Inputs need visible `:focus-visible` outline for keyboard navigation.

**Add to:** `frontend/src/components/AuthScreen.css` and `SMSAuthScreen.css`

```css
/* Focus States - Visible for Keyboard Navigation */

input:focus-visible,
textarea:focus-visible,
button:focus-visible,
select:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}

/* Optional: Ring style instead of outline */
input:focus-visible,
textarea:focus-visible {
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

/* Remove outline on mouse users (not keyboard) */
input:focus:not(:focus-visible),
textarea:focus:not(:focus-visible),
button:focus:not(:focus-visible) {
  outline: none;
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  input:focus-visible,
  textarea:focus-visible,
  button:focus-visible {
    outline: 4px solid #000;
  }
}
```

---

## 📋 CHECKLIST - Implementation Order

### Week 1 (CRITICAL):
- [ ] Add `<label>` elements to all inputs in SMSAuthScreen.jsx
- [ ] Add `<label>` elements to all inputs in AuthScreen.jsx
- [ ] Add `aria-label` to buttons without semantic text
- [ ] Create and integrate Toast component (replace alert)
- [ ] Add focus-visible outlines to all inputs

### Week 2 (IMPORTANT):
- [ ] Implement dark mode support (prefers-color-scheme)
- [ ] Add `touch-action: manipulation` to buttons
- [ ] Add ARIA attributes to OTP inputs
- [ ] Test with keyboard navigation (Tab, Enter, Escape)
- [ ] Test with screen reader (VoiceOver, NVDA)

### Week 3 (NICE-TO-HAVE):
- [ ] Implement deep-linking for URL state sync
- [ ] Add i18n with Intl APIs
- [ ] Improve error messages with context
- [ ] Add password strength indicator

---

## 🧪 Testing Commands

### Keyboard Navigation Test:
```bash
# Tab through all inputs
# Check: Focus outline is visible
# Check: Tab order makes sense (left→right, top→bottom)
```

### Screen Reader Test (macOS VoiceOver):
```bash
# Cmd+F5 to enable VoiceOver
# Check: All labels are read
# Check: Error messages are announced
# Check: Toast notifications are announced with role="alert"
```

### Accessibility Audit:
```bash
# Run axe DevTools in Chrome
# Target: 0 critical/serious issues
```

---

## 📊 Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Accessibility Score | 60/100 | 85/100 |
| Focus Score | 65/100 | 90/100 |
| Forms Score | 55/100 | 90/100 |
| **Overall** | **72/100** | **88/100** |

---

## 🔗 References

- [W3C ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Focus Visible CSS](https://drafts.csswg.org/selectors/#focus-visible)
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [Toast Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
