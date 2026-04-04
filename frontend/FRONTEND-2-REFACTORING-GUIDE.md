# FRONTEND-2: Design System Refactoring Guide

**Status**: Phase 1 Complete  
**Date**: April 4, 2026  
**Goal**: Replace inline styles with MD3 utility classes

---

## ✅ What's Done

### CSS Infrastructure
- ✅ **design-tokens-m3.css** - Complete MD3 color, typography, spacing system
- ✅ **utility-classes.css** - 100+ utility classes for common patterns
- ✅ **SMSAuthScreen.css** - Migrated to MD3 tokens (no custom :root)
- ✅ App.jsx - Imports utility-classes.css globally

### Components Refactored
- ✅ SMSAuthScreen.jsx - Partial (inline styles partially removed)
- ✅ QuizAcademie.jsx - Basic refactoring
- ✅ ScamReportingSystem.jsx - Basic refactoring

---

## 🔧 How to Refactor Components

### Step 1: Import Utility Classes (Automatic)
No need to import individually - `App.jsx` already imports `utility-classes.css` globally.

### Step 2: Replace Inline Styles

#### Pattern 1: Spacing
**Before:**
```jsx
<div style={{ marginTop: '20px', padding: '16px' }}>
```

**After:**
```jsx
<div className="mt-xl p-lg">
```

#### Pattern 2: Typography
**Before:**
```jsx
<h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>
```

**After:**
```jsx
<h2 className="text-xl font-bold text-center">
```

#### Pattern 3: Colors
**Before:**
```jsx
<button style={{ color: '#1E40AF', backgroundColor: '#E8F5E9' }}>
```

**After:**
```jsx
<button className="text-primary bg-success-light">
```

#### Pattern 4: Layout (Flex/Grid)
**Before:**
```jsx
<div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
```

**After:**
```jsx
<div className="flex gap-sm justify-center">
```

#### Pattern 5: Components (Buttons, Cards, Inputs)
**Before:**
```jsx
<button style={{
  padding: '16px 20px',
  backgroundColor: '#005FAF',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer'
}}>
```

**After:**
```jsx
<button className="btn-base bg-primary rounded-sm">
```

---

## 📚 Utility Classes Reference

### Spacing
| Class | Value |
|-------|-------|
| `.mt-xs` to `.mt-3xl` | margin-top |
| `.mb-xs` to `.mb-2xl` | margin-bottom |
| `.p-xs` to `.p-2xl` | padding |
| `.px-*`, `.py-*` | padding horizontal/vertical |
| `.mx-auto`, `.m-auto` | centering |

### Typography
| Class | Value |
|-------|-------|
| `.text-xs` to `.text-5xl` | font-size (semantic scale) |
| `.font-normal` to `.font-bold` | font-weight |
| `.text-left` / `.text-center` / `.text-right` | text-align |
| `.text-primary`, `.text-error`, `.text-muted` | colors |

### Layout
| Class | Value |
|-------|-------|
| `.flex`, `.flex-col`, `.flex-row` | display + direction |
| `.items-center`, `.justify-center` | alignment |
| `.gap-sm` to `.gap-xl` | gap (flex/grid) |
| `.w-full`, `.max-w-lg` | dimensions |

### Backgrounds & Borders
| Class | Value |
|-------|-------|
| `.bg-white`, `.bg-light`, `.bg-primary` | background-color |
| `.border`, `.border-2`, `.border-primary` | borders |
| `.border-l-4-primary` | left border (4px) |
| `.rounded-sm` to `.rounded-full` | border-radius |

### Components
| Class | Purpose |
|-------|---------|
| `.btn-base` | Base button styles |
| `.btn-link` | Link-style button |
| `.card`, `.card-lg` | Card containers |
| `.input-base` | Input field base |
| `.alert`, `.alert-success` | Alert banners |
| `.form-section` | Form container |

### Advanced Patterns
| Class | Purpose |
|-------|---------|
| `.form-section` | Form background + padding |
| `.quiz-card` | Quiz question container |
| `.stats-container` | Grid for dashboard stats |
| `.divider-line` / `.divider-text` | Divider with text |
| `.input-code` | OTP/code input |
| `.modal-overlay` / `.modal-content` | Modal dialog |

---

## 🎯 High-Priority Components to Refactor

1. **Dashboard.jsx** - Main dashboard view
2. **DashboardStats.jsx** - Stats section
3. **ThreatCard.jsx** - Threat item cards
4. **AccountProfile.jsx** - User profile page
5. **OnboardingWizard.jsx** - Onboarding flow
6. **FamilyDashboard.jsx** - Family protection view
7. **WeeklyDigest.jsx** - Email digest preview
8. **AnalysisHistory.jsx** - Analysis history table
9. **ModernAuthPage.jsx** - Modern auth UI
10. **SecurityHeartDashboard.jsx** - Security dashboard

---

## 🚀 Batch Refactoring Strategy

### For Developers
1. Pick a component from the priority list
2. Find all `style={{ }}` props
3. Replace using patterns above
4. Test locally: `npm test`
5. Commit: `git commit -m "refactor(component): Use MD3 utility classes"`

### Example: Refactoring QuizModule.jsx
```diff
- <div style={{ padding: '20px', backgroundColor: '#E8F5E9' }}>
+ <div className="p-xl bg-success-light">

- <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>
+ <h3 className="text-xl font-bold">

- <button style={{ backgroundColor: '#005FAF', color: 'white' }}>
+ <button className="bg-primary text-white">
```

---

## 🧪 Testing

After refactoring a component:

```bash
# Run tests
npm test

# Check for visual regressions
npm run dev
# Open browser and visually inspect the component
```

All colors, spacing, and typography should match the original exactly.

---

## 📋 Checklist for Each Component

- [ ] Replace all `style={{ }}` with utility classes
- [ ] Verify spacing (padding, margin) matches
- [ ] Verify typography (font-size, weight) matches
- [ ] Verify colors (primary, secondary, error) use tokens
- [ ] Run tests - all pass
- [ ] Visual inspection in browser
- [ ] Commit with clear message

---

## 🎨 Color Token Reference

| Use Case | Token | Hex |
|----------|-------|-----|
| Primary action | `--color-primary` | #005FAF |
| Success/validation | `--color-secondary` | #1B6B3A |
| Warning/caution | `--color-tertiary` | #7A5900 |
| Error/danger | `--color-error` | #BA1A1A |
| Backgrounds | `--color-background` | #FAFCFF |
| Surfaces/cards | `--color-surface` | #FAFCFF |
| Text primary | `--color-on-background` | #1A1C22 |
| Text secondary | `--color-on-surface-variant` | #49454E |
| Borders | `--color-outline` | #72788E |

---

## 📈 Progress Tracking

**Phase 1** (Complete):
- ✅ CSS infrastructure (tokens + utilities)
- ✅ SMSAuthScreen refactored
- ✅ Global imports in place

**Phase 2** (In Progress):
- 🔄 Refactor top 10 components
- 🔄 Batch apply utility classes
- 🔄 Test all components

**Phase 3** (Upcoming):
- ⬜ Refactor remaining 37 components
- ⬜ Remove all inline styles
- ⬜ Final validation + audit

---

## ❓ FAQ

**Q: Do I need to refactor ALL components?**  
A: Start with the 10 priority ones. Others can be refactored later using this guide.

**Q: Can I combine classes?**  
A: Yes! `className="mt-xl mb-lg p-xl bg-success-light rounded-md"` is perfectly valid.

**Q: What if my inline style isn't covered?**  
A: Check `utility-classes.css` - there are 100+ classes. If truly missing, add a new utility class to the file.

**Q: How do I handle dynamic styles?**  
A: Dynamic colors/values should use CSS custom properties (tokens), not inline styles. Example: `style={{ backgroundColor: getRiskColor(score) }}` → convert to token-based approach.

---

## 🔗 Related Files

- `frontend/src/styles/design-tokens-m3.css` - MD3 tokens
- `frontend/src/styles/utility-classes.css` - 100+ utility classes
- `frontend/src/App.css` - Uses MD3 tokens
- `frontend/src/components/SMSAuthScreen.css` - Example of refactored component CSS

---

**Next Step**: Pick a component and refactor!
