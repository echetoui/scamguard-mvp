# Design System Components - M3 Expressive Senior-Friendly

**Date:** 5 avril 2026
**Phase:** 1 - Foundation Components
**Target:** Aînés (65+) - Confiance, Sécurité, Accessibilité
**Status:** Design approved, ready for implementation

---

## 📋 Overview

Create 6 core React components using Material Design 3 tokens with **senior-friendly specifications**: generous spacing, larger typography, strong contrast, and predictable interactions.

**Scope:**
- 6 components: Button, Card, Input, Alert, Badge, Section
- All components use `design-tokens.js` (MD3 synced from Figma)
- Senior-first approach: 60px+ touch targets, 18px+ base text, 1.5+ line height
- No external component libraries (build from scratch with tokens)

**Location:** `frontend/src/design-system/`

---

## 🎨 Component Specifications

### 1. **Button.jsx**
**Purpose:** Primary & secondary actions with clear visual hierarchy

**Variants:**
- **Primary** - Main CTAs (blue #005FAF)
- **Secondary** - Alternative actions (outlined)
- **Tertiary** - Subtle actions (text-only)
- **Destructive** - Danger actions (red #BA1A1A)

**Sizes:**
- **Large** (72px height) - Default for seniors
- **Medium** (60px height) - Secondary buttons
- **Small** (48px height) - Inline actions only

**States:**
- Default, Hover (darker), Active (pressed), Disabled (gray + 0.5 opacity)

**Senior-Friendly Specs:**
- Minimum 72px touch target height (per `touchTargets.large`)
- 16-20px font size (never smaller)
- 2px+ border/stroke visibility
- Focus ring: 3px offset with focusShadow
- Transition: `transitions.fast` (150ms)

**Props:**
```jsx
<Button 
  variant="primary" // primary|secondary|tertiary|destructive
  size="large"      // large|medium|small
  disabled={false}
  onClick={handler}
>
  Action Text
</Button>
```

---

### 2. **Card.jsx**
**Purpose:** Container for grouped content with clear visual containment

**Variants:**
- **Elevated** - Shadowed card (default)
- **Outlined** - Border-only card (secondary)
- **Filled** - Solid background container

**Senior-Friendly Specs:**
- Minimum padding: 20px (spacing.xl)
- Border radius: 12px (borderRadius.lg)
- Shadow: `shadows.md` (not too harsh, clear separation)
- Gap between cards: 16px (spacing.lg)
- Internal spacing: 16px minimum between sections

**Props:**
```jsx
<Card variant="elevated" style={{ gap: spacing.lg }}>
  <h2>Title</h2>
  <p>Content...</p>
</Card>
```

---

### 3. **Input.jsx**
**Purpose:** Text/email/password/number input with clear feedback

**Types:**
- **text** - Standard input
- **email** - Email validation
- **password** - Masked input with show/hide toggle
- **number** - Numeric only

**Senior-Friendly Specs:**
- Height: 70px (touches comfortably)
- Font size: 20-24px (readable)
- Padding: 20px left/right (internal spacing)
- Border: 2px solid (visible on focus/error)
- Border radius: 12px (lg)
- Label size: 18px+ bold
- Helper text: 16px gray
- Error text: 16px red, clear message

**States:**
- Default: border #DFE2EB
- Focused: border primary + focusShadow
- Error: border red #BA1A1A + error message
- Disabled: gray background + 0.5 opacity

**Props:**
```jsx
<Input
  type="email"
  label="Email Address"
  placeholder="your@email.com"
  error={errorMsg}
  helperText="We'll never share"
  disabled={false}
  onChange={handler}
/>
```

---

### 4. **Alert.jsx**
**Purpose:** Contextual messages (error, warning, success, info)

**Variants:**
- **error** - Red background + icon
- **warning** - Amber background + icon
- **success** - Green background + icon
- **info** - Blue background + icon

**Senior-Friendly Specs:**
- Full width with 16px padding
- Border-left: 4px thick color stripe
- Icon: 32x32px (large, visible)
- Title: 18px bold
- Message: 16px regular, line-height 1.5
- Dismiss button (optional): 60px height

**Props:**
```jsx
<Alert 
  variant="error"
  title="Invalid Code"
  message="The code you entered is incorrect. Try again."
  onDismiss={() => {}}
  dismissable={true}
/>
```

---

### 5. **Badge.jsx**
**Purpose:** Status labels, tags, counts

**Variants:**
- **Filled** - Solid background (primary color)
- **Outlined** - Border only
- **Tonal** - Subtle background (primaryContainer)

**Sizes:**
- **Large** - 18px font (default for seniors)
- **Medium** - 16px font
- **Small** - 14px font (only for secondary info)

**Senior-Friendly Specs:**
- Padding: 8px 12px minimum (not too cramped)
- Border radius: 8px (md)
- Font weight: semibold (500)
- Clear contrast ratio 7:1+ (WCAG AAA)

**Props:**
```jsx
<Badge variant="filled" size="large" color="primary">
  Active
</Badge>
```

---

### 6. **Section.jsx**
**Purpose:** Wrapper for grouping related content with proper spacing

**Senior-Friendly Specs:**
- Padding: 24px (spacing.2xl) - generous internal spacing
- Margin between sections: 32px (spacing.3xl)
- Gap for children: 16px (spacing.lg)
- Optional: title (H2/24px), subtitle, divider

**Props:**
```jsx
<Section title="Security Status" subtitle="Current protection level">
  <Card>Protected</Card>
</Section>
```

---

## 🔗 Design Token Integration

**All components use `design-tokens.js` exports:**

```javascript
import { 
  colors,        // Primary, secondary, error, surface, text colors
  typography,    // fontFamily, fontSize, fontWeight, lineHeight
  spacing,       // xs, sm, md, lg, xl, 2xl, 3xl...
  shadows,       // xs, sm, md, lg, xl
  borderRadius,  // sm, md, lg, xl, full
  transitions,   // fast (150ms), base (300ms), slow (500ms)
  touchTargets   // minimum (60px), recommended (72px), large (80px)
} from '@/styles/design-tokens';
```

**Example Button implementation:**
```jsx
const styles = {
  button: {
    height: `${touchTargets.large}px`,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    fontSize: `${typography.fontSize.h4}px`,
    fontWeight: typography.fontWeight.bold,
    padding: `0 ${spacing.xl}`,
    border: 'none',
    cursor: 'pointer',
    transition: `background-color ${transitions.fast}`,
  }
};
```

---

## ♿ Accessibility Requirements (WCAG AAA)

**All components must meet:**
1. **Contrast ratio:** 7:1 minimum (AAA level)
2. **Touch targets:** 60px minimum, 72px recommended
3. **Font sizes:** 16px minimum (no exceptions for seniors)
4. **Line height:** 1.5 minimum for readability
5. **Focus indicators:** 3px ring with visible color
6. **Keyboard navigation:** Full support (Tab, Enter, Space, Escape)
7. **ARIA labels:** aria-label, aria-describedby, aria-expanded for interactive elements

---

## 📁 File Structure

```
frontend/src/design-system/
├── Button.jsx
├── Card.jsx
├── Input.jsx
├── Alert.jsx
├── Badge.jsx
├── Section.jsx
├── __tests__/
│   ├── Button.test.jsx
│   ├── Card.test.jsx
│   ├── Input.test.jsx
│   ├── Alert.test.jsx
│   ├── Badge.test.jsx
│   └── Section.test.jsx
└── index.js (export all)
```

---

## 🧪 Testing Requirements

**Unit Tests (Jest + React Testing Library):**
- Render each variant correctly
- Props passed correctly
- Event handlers triggered (onClick, onChange)
- Disabled state prevents interaction
- Accessibility: aria labels present, keyboard nav works
- Visual: snapshots for baseline

**Manual Testing (with seniors):**
- Touch target size: Can tap without zooming
- Readability: Text legible at arm's length
- Clarity: Color meanings clear (green=safe, red=danger)
- Interaction: Button feedback obvious, no confusion

---

## 🎯 Success Criteria

✅ All 6 components built and exported from `src/design-system/`
✅ All variants & states working
✅ Props correctly wired to tokens
✅ WCAG AAA compliance verified
✅ Touch targets 60px+ (72px default)
✅ Font sizes 18px+ (body)
✅ Snapshot tests passing
✅ Figma updated (optional Phase 4)

---

## 📚 Related Files

- **Tokens:** `frontend/src/styles/design-tokens.js`
- **CSS Variables:** `frontend/src/styles/design-tokens-m3.css`
- **Usage:** Coming Phase 2 (Dashboard, Cards, etc.)
- **Figma:** Design system file (to be synced after)

---

## 🚀 Next Steps

1. ✅ **This design** - Approved
2. 📝 **Implementation Plan** - Write with writing-plans skill
3. 💻 **Build Components** - Create files, wire tokens
4. 🧪 **Test & Verify** - Unit tests + senior-friendly validation
5. 📊 **Phase 2** - Use in Dashboard, Screens, Ecrans

---

**Document prepared:** 5 avril 2026
**Version:** 1.0 - Final
**Status:** Ready for implementation planning
