# Accessibility Testing Protocol
**Task:** Phase 3.2.1 - Testing & Validation
**Date:** February 18, 2026
**Version:** 1.0

---

## 📋 Pre-Testing Checklist

Before running any accessibility tests, ensure:

- ✅ Application fully built and running
- ✅ All components rendered correctly
- ✅ No console errors
- ✅ Testing on multiple browsers (Chrome, Firefox, Safari, Edge)
- ✅ Testing on multiple devices (desktop, tablet, mobile)
- ✅ Testing both light and dark modes
- ✅ Admin/user accounts set up for testing

---

## 🤖 Automated Testing

### 1. WAVE (WebAIM Accessibility Evaluation Tool)

**Installation:**
- Browser Extension: https://wave.webaim.org/extension/
- Online Tool: https://wave.webaim.org/

**How to Use:**
```
1. Open application in Chrome/Firefox
2. Click WAVE extension icon (top right)
3. Wait for analysis to complete
4. Review results panel (right side)
```

**What to Look For:**
```
✅ Green checks: Accessibility features found
⚠️ Yellow warnings: Potential issues to review
🔴 Red errors: Must fix (contrast, missing alt text, etc.)
❌ 0 errors target
```

**Report Format:**
- Contrast errors: Should be 0
- Missing form labels: Should be 0
- Missing alt text: Should be 0 (emojis should have aria-hidden or alt)
- Empty headings: Should be 0

### 2. axe DevTools

**Installation:**
- Browser: https://www.deque.com/axe/devtools/
- Works on Chrome, Firefox, Edge

**How to Use:**
```
1. Right-click on page → Inspect
2. Click "axe DevTools" tab
3. Click "Scan ALL of my page"
4. Wait for scan to complete
5. Review results
```

**What to Look For:**
```
🔴 Critical: Must fix immediately
⚠️ Serious: Fix before launch
🟡 Moderate: Fix soon
🔵 Minor: Good to fix

Target: 0 Critical, 0 Serious issues
```

**Report Sections:**
- Violations (issues found)
- Passes (things working correctly)
- Incomplete (needs manual review)
- Inapplicable (not relevant to page)

### 3. Lighthouse (Chrome DevTools)

**How to Use:**
```
1. Open Chrome DevTools (F12)
2. Click "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"
5. Review score and recommendations
```

**Scoring:**
```
90-100: Excellent (target)
80-89: Good
50-79: Needs improvement
0-49: Critical issues
```

**Key Metrics:**
- Color contrast
- Tap targets (touch-friendly size)
- Form labels
- ARIA attributes
- Focus indicators

### 4. Color Contrast Checker

**Online Tool:** https://webaim.org/resources/contrastchecker/

**Process:**
```
1. Identify color pair to test
   - Foreground: #0056B3 (primary button)
   - Background: #FFFFFF (default)
2. Enter both hex codes
3. View contrast ratio
4. Target: 7:1 or higher for WCAG AAA
5. Document result
```

**What to Test:**
- All text colors on backgrounds
- Button colors and hover states
- Links and visited links
- Form inputs and placeholders
- Status indicators (success, warning, error)

---

## 🖱️ Manual Testing

### Keyboard Navigation Testing

**Objective:** Ensure all functionality works without a mouse

**Steps:**
```
1. Disable mouse/trackpad (or just don't use it)
2. Use Tab key to navigate
3. Use Enter/Space to activate buttons
4. Use Arrow keys for specific controls (select, radio, tabs)
5. Use Escape to close modals/dropdowns
```

**Test Cases for BottomNavigation:**
```
1. Tab → Focus moves to first tab
2. Tab again → Focus moves to second tab
3. Arrow Right → Focus moves to next tab (alternative)
4. Arrow Left → Focus moves to previous tab
5. Enter → Activates the focused tab
6. Tab while in content → Cycles through all focusable elements
```

**Test Cases for SecurityHeartDashboard:**
```
1. Tab → Focus on Continue button
2. Enter → Button activates/clicks
3. Shift+Tab → Focus moves backwards
4. No keyboard traps → Can Tab out of any element
```

**Expected Results:**
```
✅ Tab order logical (left to right, top to bottom)
✅ All interactive elements focusable
✅ Focus indicator clearly visible
✅ No keyboard traps
✅ Enter/Space activates buttons
✅ Escape closes modals
✅ Arrow keys work for navigable elements
```

### Touch Target Testing

**Objective:** Ensure all buttons/links are large enough for touch

**Procedure:**
```
1. Use mobile device or DevTools mobile emulation
2. Try to tap each button/link
3. Verify easy to tap without error
4. Check minimum size: 60px × 60px
```

**Test Elements:**
- Bottom navigation tabs (should be 70-100px tall)
- Continue buttons (should be 60px+ tall)
- Form inputs (should be 45px+ tall)
- Links (should be 44px+ minimum)

**Tools:**
```
Chrome DevTools:
1. F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Select device (iPhone 12, Galaxy S21, etc.)
3. Try clicking elements
```

### Color Contrast Testing

**Procedure:**
```
1. Take screenshot of page
2. Use color picker to identify colors
3. Use WebAIM contrast checker
4. Document results
5. Target: 7:1 minimum (WCAG AAA)
```

**Elements to Test:**
- All text colors
- Button backgrounds and text
- Links (normal and visited)
- Form labels
- Status messages (success, warning, error)
- Badges and labels
- Disabled states

### Focus Indicator Testing

**Procedure:**
```
1. Use Tab key to navigate
2. Look for visible focus outline
3. Verify outline is 3px and green (#2E7D32)
4. Check outline is visible on all interactive elements
5. Verify outline contrasts with background
```

**Expected Results:**
```
✅ 3px solid green outline
✅ -3px outline offset (outline inside element)
✅ Visible on:
   - Buttons
   - Links
   - Form inputs
   - Tab items
   - Navigation buttons
```

### Form Testing

**Procedure:**
```
1. Tab to form input
2. Type something
3. Tab away (blur)
4. Verify label is associated
5. Test with screen reader
```

**Expected Results:**
```
✅ Label <label> tag with for attribute
✅ Input has matching id attribute
✅ Required fields marked with aria-required
✅ Error messages associated with inputs
✅ Error announced when focus leaves
✅ Validation happens on blur, not input
```

---

## 🔊 Screen Reader Testing

### VoiceOver (macOS/iOS)

**Enable VoiceOver:**
```
macOS:
- System Preferences → Accessibility → VoiceOver → Enable
- Or: Cmd+F5

iOS:
- Settings → Accessibility → VoiceOver → On
```

**Basic Navigation:**
```
VO = Control+Option (or fn+Control+Option if no numeric keypad)

- VO+Right Arrow: Next item
- VO+Left Arrow: Previous item
- VO+Down Arrow: Read current item
- VO+Up Arrow: Read all from top
- VO+Space: Activate (click)
```

**Test Procedure:**
```
1. Enable VoiceOver
2. Navigate app using VO+Arrow keys
3. Listen to announcements
4. Verify logical order
5. Check button labels are descriptive
6. Verify form labels announced
7. Check status updates announced (aria-live)
```

**Expected Announcements:**
```
✅ Button: "Continue button"
✅ Tab: "Security tab, selected"
✅ Status: "Safety score, 78"
✅ Error: "Email required, text input"
✅ Form field: "Email, text input"
```

### NVDA (Windows)

**Installation:**
- Download: https://www.nvaccess.org/
- Run installer and restart

**Enable NVDA:**
```
Start NVDA from Start Menu or Ctrl+Alt+N
```

**Basic Navigation:**
```
- Down Arrow: Next item
- Up Arrow: Previous item
- Enter/Space: Activate
- Tab: Next focusable element
- Shift+Tab: Previous focusable element
- H: Next heading
- B: Next button
- L: Next link
- F: Next form field
```

**Test Procedure:**
```
1. Start NVDA
2. Use Down Arrow to read all content
3. Listen to announcements carefully
4. Note any missing labels
5. Verify button purposes clear
6. Check form field labels
7. Test form submission
```

### JAWS (Windows - Commercial)

**Installation:**
- Download trial: https://www.freedomscientific.com/products/software/jaws/
- 40-minute mode available for testing

**Navigation:**
```
- Arrow keys: Move through content
- Tab: Move to next focusable element
- Enter: Activate links/buttons
- F6: Move to next frame/region
- 1-6: Jump to next heading of that level
```

---

## 📱 Mobile Device Testing

### iOS (iPhone/iPad)

**Accessibility Settings:**
```
Settings → Accessibility
```

**Features to Test:**
1. **VoiceOver** (Screen reader)
   - Enable: Settings → Accessibility → VoiceOver
   - Gesture: Two fingers double-tap to activate

2. **Display & Text Size**
   - Settings → Accessibility → Display & Text Size
   - Increase font size
   - Test at larger sizes

3. **Increase Contrast**
   - Settings → Accessibility → Display & Text Size → Increase Contrast
   - Verify design still works

4. **Reduce Motion**
   - Settings → Accessibility → Motion → Reduce Motion
   - Verify animations disabled

### Android (Samsung, Google Pixel)

**Accessibility Settings:**
```
Settings → Accessibility
```

**Features to Test:**
1. **TalkBack** (Screen reader)
   - Settings → Accessibility → TalkBack → On
   - Gesture: Swipe right to move next, left to move previous

2. **Text Scaling**
   - Settings → Accessibility → Text and Display → Font Size
   - Test at larger sizes

3. **High Contrast Text**
   - Settings → Accessibility → Text and Display → High Contrast Text
   - Verify readability

4. **Remove Animations**
   - Settings → Developer Options → Animation Scale = 0
   - Verify no animations distract

### Testing Procedure

```
1. Install app on mobile device
2. Rotate between portrait and landscape
3. Zoom in 200%
4. Test touch target sizes
5. Test with screen reader
6. Test forms and input
7. Test navigation
8. Check dark mode
9. Test at different font sizes
```

---

## 🌈 Color Blindness Simulation

### Color Oracle (Desktop Application)

**Download:** https://colororaclesoftware.com/

**How to Use:**
```
1. Download and install
2. Launch application
3. Choose color blindness type
4. View entire screen through lens
5. Note any content that becomes indistinguishable
```

**Types to Test:**
```
1. Deuteranopia (green-blind) - Most common
2. Protanopia (red-blind)
3. Tritanopia (blue-yellow blind)
4. Monochromacy (complete - grayscale)
```

**Test Results Should Show:**
```
✅ All status indicators remain distinguishable
✅ Links can be identified (not by color alone)
✅ Buttons clearly visible
✅ Error messages stand out
✅ Form validation clear (icon + text)
✅ Charts/graphs use patterns (not color alone)
```

### Browser DevTools Simulation

**Chrome:**
```
1. DevTools → Rendering tab
2. Scroll to "Emulate CSS media feature prefers-color-scheme"
3. Select color blindness type
```

**Firefox:**
```
1. DevTools → Accessibility Inspector
2. Check for color blindness issues
```

---

## 🎬 Motion Preference Testing

### Enable Reduced Motion

**macOS:**
```
System Preferences → Accessibility → Display → Reduce motion
```

**Windows:**
```
Settings → Ease of Access → Display → Show animations
→ Turn off
```

**iOS:**
```
Settings → Accessibility → Motion → Reduce Motion
```

**Android:**
```
Settings → Developer Options → Animation Scale = Off
```

**Browser DevTools:**
```
Chrome: DevTools → Rendering → Emulate CSS media feature prefers-reduced-motion
Firefox: about:config → ui.prefersReducedMotion = 1
```

### Test Procedure

```
1. Enable reduced motion
2. Perform actions that normally animate:
   - Switch tabs
   - Open modals
   - Hover over buttons
   - Submit forms
3. Verify:
   ✅ All animations disabled
   ✅ State changes instant
   ✅ No distracting motion
   ✅ Content still readable
```

---

## 🔍 Zoom & Magnification Testing

### Browser Zoom

**Steps:**
```
1. Open application in browser
2. Ctrl++ (increase zoom) repeatedly
3. Test at 200% zoom
4. Test at 300% zoom
5. Verify no horizontal scrolling needed
6. Check all buttons still clickable
7. Check text readable
```

**Expected Results:**
```
✅ 200% zoom: No horizontal scroll, readable
✅ 300% zoom: Some scroll okay if content reflows
✅ Layout adapts gracefully
✅ Buttons remain clickable
✅ Text size increases proportionally
```

### Operating System Magnification

**macOS:**
```
System Preferences → Accessibility → Zoom
- Enable Zoom
- Keyboard shortcuts: Cmd+scroll wheel
- Test at 200% and 400% magnification
```

**Windows:**
```
Settings → Ease of Access → Magnifier
- Turn on Magnifier
- Increase zoom level
- Test at 200% magnification
```

---

## 📊 Testing Template

### Component Accessibility Test

```
Component: [Name]
Date: [Date]
Tester: [Name]

VISUAL DESIGN
☐ Color contrast 7:1+: [PASS/FAIL]
  - Text color: [Color hex]
  - Background: [Color hex]
  - Ratio: [Ratio] ✓/✗
☐ Focus indicator visible: [PASS/FAIL]
  - Outline width: 3px
  - Outline color: #2E7D32
  - Visible on: [Elements]
☐ Touch targets 60px+: [PASS/FAIL]
  - Button height: [Size]
  - Button width: [Size]

KEYBOARD NAVIGATION
☐ Tab works: [PASS/FAIL]
☐ Tab order logical: [PASS/FAIL]
☐ Enter activates: [PASS/FAIL]
☐ Escape dismisses: [PASS/FAIL]
☐ No keyboard traps: [PASS/FAIL]

SCREEN READER
☐ Component announced: [PASS/FAIL]
☐ Labels present: [PASS/FAIL]
☐ States announced: [PASS/FAIL]
☐ Errors announced: [PASS/FAIL]

MOBILE
☐ Touch targets large: [PASS/FAIL]
☐ Responsive layout: [PASS/FAIL]
☐ Dark mode works: [PASS/FAIL]
☐ Landscape mode: [PASS/FAIL]

ANIMATIONS
☐ Respects reduced motion: [PASS/FAIL]
☐ Duration 300-500ms: [PASS/FAIL]
☐ No distracting motion: [PASS/FAIL]

ISSUES FOUND
1. [Issue]: [Severity HIGH/MEDIUM/LOW]
   Fix: [Solution]
2. [Issue]: [Severity]
   Fix: [Solution]

OVERALL: [PASS/FAIL]
```

---

## ✅ Sign-Off Checklist

Before marking component as accessible:

```
☐ WAVE: 0 errors
☐ axe DevTools: 0 critical, 0 serious
☐ Lighthouse: 95+ accessibility score
☐ Color contrast: 7:1+ on all text
☐ Keyboard navigation: Fully accessible
☐ Screen reader: Tested on VoiceOver and NVDA
☐ Touch targets: 60px+ minimum
☐ Reduced motion: Animations disabled
☐ Dark mode: Colors adjusted correctly
☐ Zoom 200%: Readable, no horizontal scroll
☐ Color blindness: Content distinguishable
☐ Mobile: Tested on iOS and Android
☐ Documentation: Complete
☐ Team reviewed: Sign-off from accessibility lead
```

---

**Protocol Version:** 1.0
**Last Updated:** February 18, 2026
**Next Review:** February 18, 2027
