# ScamGuard Design System - Figma Setup Guide

## Overview
This guide walks you through setting up a **Material Design 3 (MD3) design system** in Figma with 34+ components, organized by type with full state variants (hover, active, disabled).

## What Gets Created

### Pages (6 total)
- **Colors** — 24 MD3 color tokens with primary, secondary, tertiary, error, and neutral variants
- **Typography** — (placeholder, ready for font styles)
- **Layout** — (placeholder, ready for spacing/grid tokens)
- **Components** — 20 base components (buttons, inputs, cards, badges, dialogs)
- **ScamGuard Specific** — 10+ ScamGuard-exclusive components (risk scores, threat cards, security hearts, SMS messages, quiz cards)
- **Documentation** — (placeholder for usage guidelines)

### Components Breakdown

#### Standard Components (20 base)
- **Buttons**: 4 variants (Primary, Secondary, Tertiary, Destructive) × 3 sizes (Small, Medium, Large) = 12 components
- **Inputs**: 4 types (Text, Email, Password, Number)
- **Cards**: 2 variants (Outlined, Elevated)
- **Badges**: 2 variants (Filled, Outlined)
- **Dialog**: 1 component

#### ScamGuard Components (14 specialized)
- **Risk Scores**: 3 levels (Safe, Moderate, Danger)
- **Threat Cards**: 3 severity levels (Low, Medium, Danger)
- **Security Hearts**: 3 status levels (Safe, Moderate, Danger)
- **SMS Messages**: 3 verdicts (Scam, Legitimate, Suspicious)
- **Quiz Cards**: 1 component

### State Variants (3× for each component)
Each component automatically gets:
- `state=hover` — Lightened color, opacity 0.95
- `state=active` — Darkened color
- `state=disabled` — Grayscale, opacity 0.5

---

## Setup Workflow

### Step 1: Create Base Components & Color Tokens
**Script:** `figma-complete-setup.js`

1. Open Figma → Open **Developer Console** (Cmd+Option+I on Mac)
2. Paste entire `figma-complete-setup.js`
3. Press Enter

**Result:** 6 pages, 34 components, 24 color tokens

### Step 2: Apply Color Variables
**Script:** `figma-apply-variables.js`

1. Paste into console
2. Press Enter

**Result:** Components bound to color tokens

### Step 3: Create State Variants
**Script:** `figma-create-variants.js`

1. Paste into console
2. Press Enter

**Result:** ~102 components with hover/active/disabled states

### Step 4: List Components
**Script:** `figma-list-components.js`

View all created components organized by category.

### Step 5: Cleanup (if needed)
**Script:** `figma-cleanup-variants.js`

Remove duplicate components and start over.

---

## Next Steps

- [ ] Export Figma components to CSS/React
- [ ] Create typography styles
- [ ] Add shadow/elevation tokens
- [ ] Document in Storybook
