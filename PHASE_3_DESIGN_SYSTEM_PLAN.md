# Phase 3 Design System Refresh Plan

**Objective:** Complete a "senior-first" design overhaul to significantly improve user experience for seniors and ensure full WCAG AAA accessibility compliance.

## 1. Core Principles

The refreshed design system will adhere to the following principles:

*   **Clarity First:** All text, icons, and layouts must be clear and immediately understandable. No ambiguity.
*   **High Contrast & Readability:** Default to high-contrast color palettes. Font sizes will be increased, with a minimum of `18px` for body text.
*   **Large Touch Targets:** All interactive elements (buttons, links, form fields) will have a minimum touch target size of `56x56` pixels.
*   **Simplicity:** Reduce visual clutter. Layouts will be clean, with ample white space.
*   **Guided Interaction:** Use visual cues, and later voice guidance, to help users navigate complex tasks.

## 2. Component Redesign Inventory

The following components will be redesigned as part of this phase. This list will be updated as the project progresses.

### Core Components
- [ ] **Buttons:** New design with clear states (default, hover, active, disabled).
- [ ] **Forms:** Larger input fields, clear labels, and improved validation messages.
- [ ] **Modals & Dialogs:** (e.g., `OnboardingWizard.jsx`) - Simplify layout, ensure focus is trapped, and provide clear exit paths.
- [ ] **Navigation:** (e.g., `BottomNavigation.jsx`) - Larger icons and text, clearer active states.
- [ ] **Toasts & Notifications:** (e.g., `Toast.jsx`) - More prominent, with clear icons and text.

### App-Specific Components
- [ ] `AuthScreen.jsx`, `SMSAuthScreen.jsx`, `SSOLogin.jsx`, `ModernAuthPage.jsx`: Unify the authentication experience with a consistent, simple design.
- [ ] `Dashboard.jsx`, `SecurityHeartDashboard.jsx`, `FamilyDashboard.jsx`: Redesign for clarity and focus on key information.
- [ ] `QuizAcademie.jsx`, `QuizModule.jsx`: Improve readability and interaction for quizzes.
- [ ] `AnalysisHistory.jsx`: Enhance the layout of historical data for better scannability.
- [ ] `SMSSimulator.jsx`: Ensure the simulation is easy to understand and interact with.
- [ ] `AccountProfile.jsx`: Simplify the profile management interface.

## 3. Style Guide Refresh

The existing style guide will be updated.

*   **Colors:**
    *   [ ] Define a new primary, secondary, and accent color palette with high-contrast ratios.
    *   [ ] Create a dedicated color palette for dark mode.
    *   [ ] All colors will be stored as CSS variables in a central file.
*   **Typography:**
    *   [ ] Set a new base font size (minimum `18px`).
    *   [ ] Define a clear type scale for headings and paragraphs.
    *   [ ] Choose a font that is highly readable at various sizes.
*   **Spacing & Layout:**
    *   [ ] Define a consistent spacing system (e.g., using a 4px or 8px grid).
    *   [ ] Update layout components to use the new spacing system.

## 4. Dark Mode Implementation

- [ ] A `data-theme="dark"` attribute will be used on the `<html>` or `<body>` tag to toggle dark mode.
- [ ] A new set of CSS variables for dark mode colors will be created.
- [ ] A user-facing toggle will be added to the `AccountProfile.jsx` or a settings page.

## 5. Accessibility (WCAG AAA)

- [ ] **ARIA Roles:** Review and add appropriate ARIA roles to all components.
- [ ] **Focus Management:** Ensure logical focus order and visible focus states for all interactive elements.
- [ ] **Screen Reader Testing:** All new components will be tested with VoiceOver (macOS) and NVDA (Windows).
- [ ] **Keyboard Navigation:** Ensure all functionality is accessible via keyboard only.

## 6. Action Plan

1.  **Sprint 1: Foundation**
    *   [ ] Set up new folder structure: `frontend/src/design-system`.
    *   [ ] Create base components in the new design system: `Button`, `Input`, `Card`.
    *   [ ] Implement the color and typography style guide updates.
    .
2.  **Sprint 2: Dark Mode & Core Components**
    *   [ ] Implement the dark mode toggle and theme.
    *   [ ] Convert `AuthScreen.jsx` and `BottomNavigation.jsx` to use the new design system.
3.  **Sprint 3: Dashboard & Quizzes**
    *   [ ] Redesign `Dashboard.jsx` and `SecurityHeartDashboard.jsx`.
    *   [ ] Redesign `QuizModule.jsx`.
4.  **Sprint 4: Accessibility Testing & Refinements**
    *   [ ] Conduct a full accessibility audit with screen readers.
    *   [ ] Refine components based on testing feedback.
    *   [ ] Performance analysis and optimization.
