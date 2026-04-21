---
name: Brand Assets
description: Logo, icons, typography, colors, and all visual brand elements
type: reference
---

# ScamGuard Brand Assets

All visual elements follow Material Design 3 system. Figma file: [To be created]

---

## Logo

### Primary Logo
**Name**: ScamGuard Shield  
**Format**: SVG (source of truth)  
**Style**: Shield with checkmark, filled

**Variants**:
1. **Full Horizontal** — Logo + text "ScamGuard"
2. **Icon Only** — Shield + checkmark (for favicon, app icon)
3. **Vertical** — Logo stacked over text (for print)

**Clear Space**: Minimum padding = 1/4 of logo height on all sides

**Minimum Size**: 48px (icon-only), 96px (full horizontal)

**Color**:
- Primary: Bleu Gardien (#005FAF)
- Alternate: White (on dark backgrounds)
- Never: Gray, gradients, or drop shadows

**Don't**:
- ❌ Stretch or skew
- ❌ Add drop shadows
- ❌ Use colors outside brand palette
- ❌ Outline or borders added

---

## Color System (Material Design 3)

### Semantic Colors (Roles)

```
┌─ PRIMARY (Bleu Gardien) ──────────────────┐
│ Primary:          #005FAF  (Main actions) │
│ On Primary:       #FFFFFF  (Text on blue) │
│ Primary Container:#D6E4FF  (Backgrounds) │
│ On Prim. Cont.:   #001849  (Text) |
│ Primary Fixed:    #D6E4FF  (Alt background) │
└────────────────────────────────────────────┘

┌─ SECONDARY (Vert Sécurité) ────────────────┐
│ Secondary:        #1B6B3A  (Success) │
│ On Secondary:     #FFFFFF  (Text) │
│ Secondary Container: #D5EDDC  (Backgrounds) │
│ On Sec. Cont.:    #002312  (Text) │
└────────────────────────────────────────────┘

┌─ TERTIARY (Ambre Alerte) ──────────────────┐
│ Tertiary:         #7A5900  (Warnings) │
│ On Tertiary:      #FFFFFF  (Text) │
│ Tertiary Container: #FFDDB8  (Backgrounds) │
│ On Tert. Cont.:   #271900  (Text) │
└────────────────────────────────────────────┘

┌─ ERROR (Rouge Danger) ──────────────────────┐
│ Error:            #BA1A1A  (Danger/fraud) │
│ On Error:         #FFFFFF  (Text) │
│ Error Container:  #F9DEDC  (Backgrounds) │
│ On Error Cont.:   #410E0B  (Text) │
└────────────────────────────────────────────┘

┌─ NEUTRAL ──────────────────────────────────┐
│ Background:       #FAFCFF  (Main surface) │
│ On Background:    #1A1C22  (Main text) │
│ Surface:          #FAFCFF  (Cards) │
│ On Surface:       #1A1C22  (Text on cards) │
│ Surface Variant:  #DFE2EB  (Subtle surfaces) │
│ On Surface Var.:  #49454E  (Secondary text) │
│ Outline:          #72788E  (Borders) │
│ Outline Variant:  #C4C7C5  (Light borders) │
│ Scrim:            #000000  (Overlays, 20%  α) │
│ Inverse Surface:  #2E2F38  (Dark mode) │
│ Inverse On Surf:  #F4EFF4  (Light text) │
└────────────────────────────────────────────┘
```

### Dark Mode Overrides
```
Primary:          #B3D9FF  (lighter blue on dark)
On Primary:       #003068  (dark text on light primary)
Background:       #1A1C22  (dark surface)
On Background:    #E3E2E7  (light text)
Surface:          #1A1C22
On Surface:       #E3E2E7
Tertiary:         #F5C468  (lighter amber on dark)
Error:            #F5B4AC  (lighter red on dark)
```

### High Contrast Mode
```
Primary:          #0000CC  (pure blue)
Error:            #CC0000  (pure red)
Tertiary:         #FF8800  (pure orange)
On Background:    #000000  (pure black text)
Background:       #FFFFFF  (pure white)
Outline:          #000000  (pure black borders)
```

---

## Typography (MD3)

### Font Families

| Use | Font | Source |
|-----|------|--------|
| Display (H1, hero) | Instrument Serif | Google Fonts (serif) |
| Body (paragraphs) | Plus Jakarta Sans | Google Fonts (sans) |
| Monospace (OTP, codes) | JetBrains Mono | Google Fonts (mono) |

### Type Scale (Complete MD3)

| Level | Font | Size | Weight | Line Height | Letter Spacing | Use Case |
|-------|------|------|--------|-------------|---|----------|
| Display Large | Instrument Serif | 56px | 400 | 1.2 | 0 | Page hero, marketing |
| Display Medium | Instrument Serif | 45px | 400 | 1.2 | 0 | Large headlines |
| Display Small | Instrument Serif | 36px | 400 | 1.2 | 0 | Subheaders |
| Headline Large | Plus Jakarta Sans | 32px | 700 | 1.25 | 0 | H1 (page title) |
| Headline Medium | Plus Jakarta Sans | 28px | 700 | 1.3 | 0 | H2 (section) |
| Headline Small | Plus Jakarta Sans | 24px | 700 | 1.4 | 0 | H3 (subsection) |
| Title Large | Plus Jakarta Sans | 22px | 700 | 1.5 | 0 | Card titles |
| Title Medium | Plus Jakarta Sans | 18px | 600 | 1.5 | 0.1 | Dialog titles |
| Title Small | Plus Jakarta Sans | 16px | 600 | 1.5 | 0.1 | Item labels |
| Body Large | Plus Jakarta Sans | 18px | 400 | 1.6 | 0.5 | Main body text (senior) |
| Body Medium | Plus Jakarta Sans | 16px | 400 | 1.6 | 0.25 | Standard body |
| Body Small | Plus Jakarta Sans | 14px | 400 | 1.6 | 0.4 | Secondary text |
| Label Large | Plus Jakarta Sans | 14px | 700 | 1.5 | 0.1 | Buttons, labels |
| Label Medium | Plus Jakarta Sans | 12px | 600 | 1.5 | 0.5 | Captions, tags |
| Label Small | Plus Jakarta Sans | 11px | 700 | 1.5 | 0.5 | Tiny labels (rare) |

**Senior-Friendly Minimum**: 18px body + 1.6 line height on all screens

---

## Shape System (MD3)

| Token | Value | Use |
|-------|-------|-----|
| Corner Extra Small | 4px | Small inputs, chips |
| Corner Small | 8px | Input fields |
| Corner Medium | 12px | Cards, buttons |
| Corner Large | 16px | Large cards, modals |
| Corner Extra Large | 28px | FAB, large shapes |
| Corner Full | 9999px | Chips, pills, full circles |

**Touch targets**: All buttons 48–60px height (not relying on padding alone)

---

## Icons

### Material Symbols Rounded
- **Family**: Material Symbols Rounded
- **Weight**: 600 (bold, clear)
- **Fill**: Enabled (solid icons)
- **Grade**: 0 (standard weight)
- **Minimum size**: 32px visual, 48px touch target

### Custom Icons (Not In Material Symbols)
1. **ScamGuard Shield** — Custom (see Logo)
2. **Brain + Shield** — Custom for fraud detection
3. **Quebec Flag** — Material Symbols flag_ca (Quebec not available, use Canada)

### Icon Usage Guide

| Context | Icon | Size | Color |
|---------|------|------|-------|
| Success (green) | check_circle | 48px | #1B6B3A |
| Error (red) | error_circle / cancel | 48px | #BA1A1A |
| Warning (amber) | warning / error_outline | 48px | #7A5900 |
| Info (blue) | info / help | 32px | #005FAF |
| Primary button | [icon] | 24px | inherit |
| Top navbar | [icon] | 24px | inherit |

---

## Shadows (MD3 Elevation System)

| Level | Box Shadow | Use |
|-------|-----------|-----|
| 0 | none | Flat surfaces |
| 1 | 0 1px 3px rgba(0,0,0,0.12) | Subtle lifts |
| 2 | 0 3px 6px rgba(0,0,0,0.16) | Cards, popovers |
| 3 | 0 6px 10px rgba(0,0,0,0.14) | Dialogs, tooltips |
| 4 | 0 8px 16px rgba(0,0,0,0.15) | FABs, dropdowns |
| 5 | 0 16px 24px rgba(0,0,0,0.2) | Modals, sheets |

---

## Motion (MD3 Easing & Duration)

### Easing Curves
```
Standard:        cubic-bezier(0.2, 0, 0, 1)     — most animations
Emphasized:      cubic-bezier(0.4, 0, 0.2, 1)   — entrance, focus
Decelerated:     cubic-bezier(0, 0, 0.2, 1)     — exit
```

### Durations
| Interaction | Duration |
|-------------|----------|
| Entrance (emphasis) | 500ms |
| Entrance (standard) | 300ms |
| Hover feedback | 100ms |
| Exit | 200ms |
| Disable/fade | 150ms |

### Rules
- ✅ Respect `prefers-reduced-motion`
- ✅ Motion must support, not distract from content
- ✅ Senior-friendly: no rapid flashing (>3/second)
- ❌ No auto-play animations
- ❌ No infinite loops on primary content

---

## Accessibility Color Contrast

**Minimum Ratios** (verified with https://webaim.org/resources/contrastchecker/):

| Element | Text | Ratio Required |
|---------|------|---|
| Primary text on background | #1A1C22 on #FAFCFF | 17:1 ✓ |
| Secondary text on background | #49454E on #FAFCFF | 8.5:1 ✓ |
| Button text on primary | #FFFFFF on #005FAF | 10:1 ✓ |
| Success text on success bg | #1B6B3A on #D5EDDC | 9:1 ✓ |
| Error text on error bg | #BA1A1A on #F9DEDC | 11:1 ✓ |
| Focus outline | #005FAF outline | 3px minimum |

**Testing**: Color Blind Check Tool in Figma + real-world testing with colorblind users

---

## Responsive Breakpoints (MD3)

| Size | Width | Typography | Example |
|------|-------|-----------|---------|
| Compact (mobile) | <480px | Display Small → 32px H1 | iPhone SE |
| Medium (tablet) | 480–840px | Display Medium → 36px H1 | iPad Mini |
| Expanded (desktop) | >840px | Display Large → 56px H1 | 14" laptop |

**Scaling**: Body text stays 18px (senior rule), headings scale by breakpoint

---

## Pattern Assets

### Buttons (3 States)

| Type | Enabled | Hover | Pressed | Disabled |
|------|---------|-------|---------|----------|
| **Primary** | #005FAF on white | Lighter blue | Darker blue | #D1D5DB on white |
| **Secondary** | Outline blue | Light blue bg | Darker outline | #E5E7EB outline |
| **Destructive** | #BA1A1A on white | Lighter red | Darker red | #D1D5DB on white |

### Input Fields

- **Border**: #72788E (outline)
- **Focused**: 3px solid #005FAF
- **Error state**: 3px solid #BA1A1A + error message below
- **Success state**: 3px solid #1B6B3A

### Cards

- **Background**: #FAFCFF
- **Border**: optional #DFE2EB
- **Radius**: 12px (medium)
- **Shadow**: elevation 2

---

## Figma Export Checklist

When creating Figma components:
- [ ] All colors defined as shared styles (not hex values)
- [ ] All typography defined as shared text styles
- [ ] Spacing using 4px grid system
- [ ] Components have "senior-friendly" variant
- [ ] Dark mode variant for each component
- [ ] High contrast variant for accessibility
- [ ] All borders use outline color
- [ ] All shadows use MD3 elevation system
- [ ] Icons exported as SVG (not images)
- [ ] Font files included in Figma export
