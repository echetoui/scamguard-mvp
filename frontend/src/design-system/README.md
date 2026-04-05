# ScamGuard Design System Components

6 core React components using Material Design 3 tokens, optimized for seniors (65+).

## Features

✅ Material Design 3 tokens (colors, typography, spacing)
✅ Senior-friendly specs (72px touch targets, 18px+ fonts, 1.5+ line height)
✅ WCAG AAA compliance (7:1 contrast ratio)
✅ Fully tested (Jest + React Testing Library)
✅ No external UI libraries (pure React + tokens)

## Components

### Button
```jsx
import { Button } from '@/design-system';

<Button variant="primary" size="large" onClick={handler}>
  Click me
</Button>
```

**Variants:** primary, secondary, tertiary, destructive
**Sizes:** small (48px), medium (60px), large (80px)

---

### Card
```jsx
import { Card } from '@/design-system';

<Card variant="elevated">
  <h2>Title</h2>
  <p>Content here</p>
</Card>
```

**Variants:** elevated, outlined, filled

---

### Input
```jsx
import { Input } from '@/design-system';

<Input
  type="email"
  label="Email"
  placeholder="user@email.com"
  error={errorMsg}
  onChange={handler}
/>
```

**Types:** text, email, password, number

---

### Alert
```jsx
import { Alert } from '@/design-system';

<Alert
  variant="error"
  title="Error"
  message="Something went wrong"
  dismissable={true}
  onDismiss={() => {}}
/>
```

**Variants:** error, warning, success, info

---

### Badge
```jsx
import { Badge } from '@/design-system';

<Badge variant="filled" size="large" color="primary">
  Active
</Badge>
```

**Variants:** filled, outlined, tonal
**Sizes:** small (14px), medium (16px), large (18px)
**Colors:** primary, secondary, error

---

### Section
```jsx
import { Section } from '@/design-system';

<Section title="Security" subtitle="Your protection level">
  <Card>Protected</Card>
</Section>
```

---

## Design Tokens

All components use tokens from '@/styles/design-tokens':

```javascript
import { colors, typography, spacing, shadows, borderRadius, transitions } from '@/styles/design-tokens';
```

## Accessibility

- ✅ Keyboard navigation (Tab, Enter, Space, Escape)
- ✅ Focus indicators (3px ring with focusShadow)
- ✅ ARIA labels on interactive elements
- ✅ Minimum touch target: 60px (recommended: 72px)
- ✅ Minimum font size: 16px
- ✅ Line height: 1.5+ for readability
- ✅ Contrast ratio: 7:1 (WCAG AAA)

## Testing

Run tests:
```bash
npm --prefix frontend run test:unit -- src/design-system
```

All components have unit tests + accessibility checks via React Testing Library.
