# ScamGuard - Semantic Design System

## Overview
This design system ("Automne Québécois") targets seniors (65-85+) in Quebec. 
The core focus is **radical accessibility**, large touch targets, and a warm, non-intimidating aesthetic.

## 1. Tokens

### Colors (Automne Québécois)
- **Primary (Action/Protection)**: `#C85A2A` (Terracotta)
- **Secondary (Wisdom/Guidance)**: `#D4A574` (Gold)
- **Accent (Balance/Autonomy)**: `#7A9B7F` (Sage Green)
- **Background (Warmth)**: `#FFF9F3` (Cream)
- **Card Background**: `#FFFFFF`
- **Text Primary**: `#1a0f0a` (Dark Brown - ensuring 9.5:1 AAA contrast)
- **Text Secondary**: `#6B5344`

### Status Colors (Feedback)
- **Safe / Success**: `#2E7D32`
- **Warning / Vigilance**: `#F57C00`
- **Danger / Alert**: `#D32F2F`

## 2. Typography
- **Display Font (Headings)**: `Cormorant Garamond`, serif
- **Body Font (UI/Text)**: `Lora`, serif
- **Base Scale**:
  - H1: `32px` (Bold 700)
  - H2: `26px` (Semi-Bold 600)
  - Body: Minimum `18px` for readability
  - Minimum text size globally: `16px`

## 3. Layout & Spacing
- **The 60px Rule**: ALL interactive elements (buttons, inputs, links, tabs) MUST have `min-height: 60px` to accommodate tremors (Parkinson's/Arthritis).
- **Border Radius**: `12px` to `16px` for main containers, `8px` for internal buttons.
- **Padding**: Generous spacing. Minimum `20px` padding for touch targets.

## 4. Accessibility (WCAG AAA Strict)
- **Contrast**: All text must maintain a contrast ratio of > 7:1 against its background.
- **Focus States**: All interactive elements must have a highly visible focus state for keyboard navigation:
  ```css
  outline: 3px solid #1a0f0a; /* Dark Brown outline */
  outline-offset: 2px;
  ```
- **Visual Validation**: Never rely on color alone. Use Color + Icon + Text (e.g., `🔴 + 🛑 + "Erreur"`).

## 5. Animation
- Use gentle, slow animations (e.g., staggering entrance `0.3s ease-out`).
- Must strictly respect `@media (prefers-reduced-motion: reduce) { transition: none; animation: none; }`.