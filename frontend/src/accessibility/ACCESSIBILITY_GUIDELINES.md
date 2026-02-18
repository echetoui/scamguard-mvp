# Accessibility Implementation Guidelines
**Task:** Phase 3.2.1 - Developer Guidelines
**Date:** February 18, 2026
**Version:** 1.0

---

## 📋 Overview

This document provides developers with practical guidelines for implementing accessible components in ScamGuard MVP. All guidelines align with WCAG AAA Level standards and are optimized for senior users.

---

## 🎨 Visual Design Guidelines

### Color & Contrast

**WCAG AAA Requirement:** 7:1 minimum contrast ratio for normal text

**Implementation:**
```css
/* ✅ Good: High contrast text */
.button {
  background-color: #0056B3;    /* Dark blue */
  color: #FFFFFF;               /* White */
  /* Contrast: 8.3:1 ✓ AAA */
}

/* ❌ Bad: Low contrast text */
.button {
  background-color: #0056B3;
  color: #666666;               /* Gray */
  /* Contrast: 3.5:1 ✗ Fails AAA */
}
```

**How to Check:**
1. Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
2. Enter foreground and background colors
3. Verify 7:1 ratio minimum

**Color Palette:**
- Use CSS variables from `design-tokens.css`
- Already tested and documented
- Dark blue primary: #0056B3
- Dark green safe: #2E7D32
- Dark red danger: #D32F2F
- Dark gray text: #1A1A1A

### Focus Indicators

**WCAG AAA Requirement:** Visible focus indicator (minimum 3px outline)

**Implementation:**
```css
button:focus {
  outline: 3px solid #2E7D32;     /* Green outline */
  outline-offset: -3px;            /* Inset outline */
}

input:focus {
  outline: 3px solid #2E7D32;
  outline-offset: 2px;             /* Outset for inputs */
}

/* Alternative: Border + shadow */
button:focus {
  border: 3px solid #2E7D32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.5);
}
```

**Testing:**
1. Use Tab key to navigate
2. Verify outline is 3px
3. Verify color is green (#2E7D32)
4. Verify outline is visible on all backgrounds

### Font Sizes

**WCAG AAA Requirement:** Minimum 16px body text, no text smaller than 11px except captions

**Implementation:**
```css
/* ✅ Good sizes */
body { font-size: 16px; }          /* Body text */
h1 { font-size: 32px; }            /* Heading 1 */
label { font-size: 16px; }         /* Form label */
button { font-size: 18px; }        /* Button text */
small { font-size: 13px; }         /* Small text (ok) */

/* ❌ Too small */
body { font-size: 12px; }          /* Body text too small */
p { font-size: 11px; }             /* Text too small */
```

**Senior-Friendly Defaults:**
- Body text: 18px (not required, but recommended)
- Headings: 24px+
- Buttons: 18px+
- Labels: 16px+

### Line Height & Spacing

**WCAG AAA Requirement:** Readable spacing for seniors

**Implementation:**
```css
/* ✅ Good spacing */
body { line-height: 1.5; }         /* Normal text */
h1 { line-height: 1.2; }           /* Headings (compact) */
.long-text { line-height: 1.75; }  /* Long paragraphs (relaxed) */

/* ✅ Good letter spacing */
body { letter-spacing: 0; }        /* Normal */
button { letter-spacing: 0.5px; }  /* Buttons (readable) */
badge { letter-spacing: 2px; }     /* Badges (wide) */

/* ✅ Good margins between elements */
p { margin: 1em 0; }
button { margin: 10px; }
section { margin: 2em 0; }
```

---

## ⌨️ Keyboard Accessibility

### Tab Order

**WCAG AAA Requirement:** Logical, predictable tab order

**Implementation:**
```jsx
{/* ✅ Good: Natural left-to-right order */}
<button>Back</button>
<button>Next</button>
<button>Done</button>

{/* ❌ Bad: Confusing order */}
<button>Done</button>
<button>Back</button>
<button>Next</button>
```

**Setting Tab Order:**
```jsx
{/* Use tabIndex for non-semantic elements */}
<div tabIndex="0">Focusable div</div>

{/* Positive tabIndex (should be avoided) */}
<button tabIndex="1">First</button>
<button tabIndex="2">Second</button>

{/* Negative tabIndex (remove from tab order) */}
<div tabIndex="-1">Decorative, not focusable</div>
```

### Keyboard Event Handling

**Implementation:**
```jsx
function MyButton() {
  const handleClick = () => {
    console.log('Clicked');
  };

  const handleKeyDown = (e) => {
    // Respond to Enter and Space for buttons
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
    >
      Click me
    </button>
  );
}
```

### Avoid Keyboard Traps

**❌ Bad: User gets stuck in modal**
```jsx
function Modal() {
  return (
    <div role="dialog">
      <input type="text" />
      {/* No way to Tab out! */}
    </div>
  );
}
```

**✅ Good: Always provide exit**
```jsx
function Modal({ onClose }) {
  return (
    <div role="dialog" onKeyDown={(e) => {
      if (e.key === 'Escape') onClose();
    }}>
      <input type="text" />
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### Arrow Key Navigation

For navigable components (tabs, menus, radio groups):

```jsx
function TabList({ tabs, activeTab, onTabChange }) {
  const handleKeyDown = (e) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);

    if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1].id);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1].id);
      e.preventDefault();
    }
  };

  return (
    <div role="tablist" onKeyDown={handleKeyDown}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

---

## ♿ ARIA & Semantic HTML

### Use Semantic HTML First

**✅ Good: Semantic elements**
```jsx
<button onClick={handleClick}>Click me</button>
<a href="/page">Link</a>
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

**❌ Bad: DIVs everywhere**
```jsx
<div onClick={handleClick} role="button">Click me</div>
<div role="link" onClick={goto}>Link</div>
<div>Email</div>
<div id="email"></div>
```

### ARIA Labels

**For elements without visible text:**
```jsx
{/* Icon button - needs aria-label */}
<button aria-label="Close dialog">×</button>

{/* Icon link - needs aria-label */}
<a href="/settings" aria-label="User settings">⚙️</a>
```

**For complex components:**
```jsx
{/* Form with complex structure */}
<form aria-labelledby="form-title">
  <h2 id="form-title">Contact Us</h2>
  {/* Form content */}
</form>
```

### ARIA States

```jsx
{/* Tab list */}
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 'security'}
    aria-controls="security-panel"
  >
    Security
  </button>
  <div
    id="security-panel"
    role="tabpanel"
    aria-labelledby="security-tab"
  >
    Security content
  </div>
</div>

{/* Expandable menu */}
<button
  aria-expanded={isOpen}
  aria-controls="menu"
>
  Menu
</button>
<ul id="menu" hidden={!isOpen}>
  {/* Menu items */}
</ul>

{/* Required form field */}
<input
  type="email"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'error-msg' : undefined}
/>
{hasError && <span id="error-msg">Email is required</span>}
```

### Live Regions

For content that updates without user interaction:

```jsx
{/* Polite: Announce changes when convenient */}
<div aria-live="polite" aria-atomic="true">
  Score updated to 85
</div>

{/* Assertive: Announce immediately */}
<div aria-live="assertive">
  System error: Please try again
</div>

{/* Status updates */}
<div role="status" aria-live="polite">
  5 items added
</div>
```

---

## 📱 Touch & Mobile

### Touch Targets

**WCAG AAA Requirement:** Minimum 60px touch target size

**Implementation:**
```css
/* ✅ Good: Minimum 60px */
button {
  min-height: 60px;
  min-width: 60px;
  padding: 15px 20px;
}

/* ✅ Better: Larger on touch devices */
@media (hover: none) and (pointer: coarse) {
  button {
    min-height: 72px;
    padding: 18px 24px;
  }
}

/* ❌ Bad: Too small for touch */
button {
  padding: 5px 10px;
  font-size: 12px;
}
```

### No Pinch-Zoom Blocking

**✅ Good: Allow pinch zoom**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**❌ Bad: Block zoom**
```html
<!-- NEVER do this -->
<meta name="viewport" content="user-scalable=no">
<meta name="viewport" content="maximum-scale=1">
```

### Touch Feedback

```jsx
function TouchButton() {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        backgroundColor: isPressed ? '#E8E8E8' : '#0056B3',
        transition: 'background-color 150ms',
      }}
    >
      Tap me
    </button>
  );
}
```

---

## 🎬 Animation & Motion

### Respect prefers-reduced-motion

**✅ Good: Check user preference**
```jsx
import { useReducedMotion } from '@/styles/animations';

function MyComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transition: reducedMotion ? 'none' : 'opacity 300ms',
    }}>
      Content
    </div>
  );
}
```

**❌ Bad: Ignore preference**
```jsx
function MyComponent() {
  return (
    <div style={{
      animation: 'fadeIn 300ms',
    }}>
      Content (animates for everyone)
    </div>
  );
}
```

### Animation Durations

**Senior-Friendly:**
- Fast: 150ms (hover feedback only)
- Normal: 300ms (standard animations)
- Slow: 500ms (important transitions)

```jsx
// Responsive to user preference
const duration = prefersReducedMotion ? 0 : 300;

// Longer for seniors
const seniorDuration = prefersReducedMotion ? 0 : 390; // 300 * 1.3
```

### No Flashing Content

**WCAG AAA Requirement:** No content flashes > 3 times per second

```jsx
{/* ❌ Bad: Flashing is harmful */}
<div style={{
  animation: 'flash 100ms infinite', // 10 times/sec - DANGER
}}>
  Content
</div>

{/* ✅ Good: Slow blinking is ok */}
<div style={{
  animation: 'pulse 2000ms infinite', // 0.5 times/sec - Safe
}}>
  Attention
</div>
```

---

## 🎯 Forms & Input

### Label Associated with Input

**✅ Good: Proper association**
```jsx
<label htmlFor="email">Email Address</label>
<input id="email" type="email" required />
```

**❌ Bad: Not associated**
```jsx
<label>Email Address</label>
<input type="email" required />

{/* Nearby label not enough */}
<span>Email Address</span>
<input type="email" required />
```

### Error Messages

**✅ Good: Clear, associated error**
```jsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    Please enter a valid email address
  </span>
)}
```

**❌ Bad: Vague error**
```jsx
<input type="email" />
{hasError && <span style={{color: 'red'}}>Invalid</span>}
```

### Form Validation

**Timing:**
- ✅ Validate on blur (input loses focus)
- ✅ Validate on form submit
- ❌ Don't validate on each keystroke (too chatty)

```jsx
function EmailInput() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleBlur = () => {
    // Validate when user leaves field
    if (!isValidEmail(email)) {
      setError('Invalid email address');
    }
  };

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleBlur}
        aria-invalid={!!error}
        aria-describedby={error ? 'error' : undefined}
      />
      {error && <span id="error">{error}</span>}
    </>
  );
}
```

---

## 🔍 Screen Reader Optimization

### Semantic Structure

```jsx
{/* ✅ Good structure */}
<main>
  <header>
    <h1>Page Title</h1>
  </header>
  <nav>
    {/* Navigation */}
  </nav>
  <article>
    <h2>Section</h2>
    <p>Content</p>
  </article>
  <aside>
    {/* Related content */}
  </aside>
  <footer>
    {/* Footer */}
  </footer>
</main>

{/* ❌ Bad structure */}
<div>
  <div>
    <div>Page Title</div>
  </div>
  <div>
    {/* Navigation */}
  </div>
  <div>
    {/* Content */}
  </div>
</div>
```

### Skip Links

For long navigation:

```jsx
<a href="#main" className="skip-link">
  Skip to main content
</a>

<nav>{/* Navigation */}</nav>

<main id="main">
  {/* Main content */}
</main>

<style>
{`
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0056B3;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
`}
</style>
```

### List Semantics

```jsx
{/* ✅ Good: Proper list */}
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>

{/* ❌ Bad: DIV masquerade */}
<div>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

---

## 🧪 Testing Checklist

Before marking component as accessible:

```
☐ Color contrast 7:1+
☐ Focus indicator visible (3px green)
☐ Font size 16px+ (body text)
☐ Touch targets 60px+
☐ Keyboard navigation works
☐ No keyboard traps
☐ ARIA labels for icon buttons
☐ Form labels associated
☐ Error messages clear
☐ Screen reader tested
☐ Respects reduced motion
☐ Dark mode tested
☐ Zoom 200% tested
☐ Mobile tested
```

---

## 📚 Resources

**Official Standards:**
- WCAG 2.1 Level AAA: https://www.w3.org/WAI/WCAG21/quickref/?showtechniques=off
- MDN Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility

**Testing Tools:**
- WAVE: https://wave.webaim.org/
- axe DevTools: https://www.deque.com/axe/devtools/
- WebAIM Contrast: https://webaim.org/resources/contrastchecker/
- Lighthouse: Chrome DevTools

**Learn More:**
- WebAIM: https://webaim.org/
- Deque: https://www.deque.com/
- A11y Project: https://www.a11yproject.com/

---

**Version:** 1.0
**Last Updated:** February 18, 2026
**Next Review:** February 18, 2027
