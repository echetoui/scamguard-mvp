# Screen Reader Testing Guide - Accessibility Validation

**Date:** 6 mars 2026
**Objective:** Validate WCAG 2.1 AA compliance using real screen readers

---

## 📋 Quick Start

### macOS VoiceOver Setup

```bash
# Enable VoiceOver (System Preferences)
System Preferences → Accessibility → VoiceOver → Enable

# OR keyboard shortcut
Cmd + F5

# Start test server
cd frontend
npm run build && npx serve -s build -p 3000

# Open browser
open http://localhost:3000
```

### Windows NVDA Setup

```bash
# Download NVDA
https://www.nvaccess.org/download/

# Install and run NVDA
# Default shortcut: Insert + N (or Capslock + N)

# Test URL
http://localhost:3000
```

---

## 🎯 TEST SUITE 1: Modal Selection Screen

### Expected Elements (Créer un compte / Se connecter mode)

#### Test 1.1: Button Labels
**What to Test:**
- Click "Créer un compte" button
- Click "Se connecter" button

**Expected VoiceOver Announcement:**
```
"Créer un compte, button"  [Activate with Space/Enter]
"Se connecter, button"     [Activate with Space/Enter]
```

**Expected NVDA Announcement:**
```
"Créer un compte, button"
"Se connecter, button"
```

**✅ PASS Criteria:**
- Button text is read correctly
- Button role is announced
- Buttons are navigable with Tab
- Buttons are activatable with Enter/Space

---

#### Test 1.2: Focus Outline Visibility

**What to Test:**
- Tab through buttons
- Look for visual focus indicator

**Expected Visual:**
```
✅ 3px outline around focused button
✅ Outline color: primary blue (#0066cc)
✅ Outline offset: 2px
```

**✅ PASS Criteria:**
- Outline is clearly visible
- Outline doesn't overlap text
- Outline has sufficient contrast

---

### Test 1.3: Keyboard Navigation

**What to Test:**
```
1. Tab key → Navigate through buttons
2. Shift+Tab → Navigate backward
3. Enter key → Activate button
4. Space key → Activate button
```

**Expected Behavior:**
```
✅ Tab order: Signup button → Login button
✅ Enter/Space activates button
✅ Shift+Tab goes backward
✅ No keyboard traps
```

---

## 🎯 TEST SUITE 2: Form Inputs (Email/Password)

### Test 2.1: Input Labels

**What to Test:**
- Navigate to email input
- Navigate to password input

**Expected VoiceOver Announcement:**
```
"Adresse email, edit text"
"Mot de passe, edit text"
```

**Expected NVDA Announcement:**
```
"Adresse email, edit box"
"Mot de passe, edit box"
```

**✅ PASS Criteria:**
- Label is announced before input
- Input type is announced (edit text/box)
- No generic "textbox" announcements

---

### Test 2.2: Error Messages with aria-invalid

**What to Test:**
1. Try submitting empty form
2. Check error message announcement

**Expected VoiceOver Announcement:**
```
"Adresse email, edit text, invalid"
[Error message automatically announces]
"Veuillez remplir tous les champs, alert"
```

**Expected NVDA Announcement:**
```
"Adresse email, invalid, edit box"
"Veuillez remplir tous les champs"
```

**✅ PASS Criteria:**
- `aria-invalid="true"` is announced
- Error message appears in tab order
- Error message has `role="alert"`
- Message is announced immediately

---

### Test 2.3: Focus State on Inputs

**What to Test:**
- Tab to email input
- Verify focus outline

**Expected Visual:**
```
✅ 3px outline around input
✅ Box-shadow: rgba(0, 102, 204, 0.1)
✅ Outline offset: 2px
```

**Expected Behavior:**
```
✅ Focus outline appears on Tab
✅ Focus outline doesn't appear on mouse click
   (This is intentional - :focus-visible behavior)
✅ Outline has sufficient contrast
```

---

## 🎯 TEST SUITE 3: Toast Notifications

### Test 3.1: Toast Announcement (Copy Password)

**What to Test:**
1. Click "Générer un mot de passe sécurisé" button
2. Click "Copier" button
3. Check if toast is announced

**Expected VoiceOver Announcement:**
```
[Toast appears]
"Mot de passe copié dans le presse-papiers!, alert, message"
[Toast auto-dismisses after 3 seconds]
```

**Expected NVDA Announcement:**
```
"Mot de passe copié dans le presse-papiers!"
[No specific announcement as NVDA has different behavior]
```

**✅ PASS Criteria:**
- Toast message is announced
- `role="alert"` causes announcement
- Toast appears in correct position (bottom-right)
- Toast auto-dismisses after 3 seconds
- Emoji is hidden from screen reader (`aria-hidden="true"`)

---

### Test 3.2: Toast Focus Management

**What to Test:**
- Toast appears and dismisses automatically
- Focus returns to previous element

**✅ PASS Criteria:**
- Toast doesn't steal focus (non-blocking)
- User can continue navigating
- Focus returns naturally when toast closes

---

## 🎯 TEST SUITE 4: Reduced Motion

### Test 4.1: Motion Preference (macOS)

**Setup:**
```
System Preferences
  → Accessibility
    → Display
      → Reduce motion: ON
```

**What to Test:**
- Reload page
- Check if animations are disabled

**Expected Behavior:**
```
✅ Animations play instantly (0.01ms)
✅ No slide/fade transitions
✅ No bounce/scale effects
✅ Page content appears immediately
```

**✅ PASS Criteria:**
- All animations are removed
- Page is still usable
- No content is hidden

---

### Test 4.2: Motion Preference (Windows)

**Setup:**
```
Settings
  → Ease of Access
    → Display
      → Show animations: OFF
```

**Expected Behavior:**
```
✅ Same as macOS - instant appearance
✅ No motion effects
```

---

## 🎯 TEST SUITE 5: High Contrast Mode

### Test 5.1: High Contrast (macOS)

**Setup:**
```
System Preferences
  → Accessibility
    → Display
      → Increase contrast: ON
```

**What to Test:**
- Tab through elements
- Check focus outline thickness

**Expected Visual:**
```
✅ Focus outline: 4px (instead of 3px)
✅ Colors are more distinct
✅ Text has better contrast
```

---

### Test 5.2: High Contrast (Windows)

**Setup:**
```
Settings
  → Ease of Access
    → Display
      → High contrast: ON
```

**Expected Behavior:**
```
✅ Same as macOS - thicker outline
✅ Better color distinction
```

---

## 🎯 TEST SUITE 6: Dark Mode

### Test 6.1: Dark Mode (macOS)

**Setup:**
```
System Preferences
  → General
    → Appearance: Dark
```

**What to Test:**
- Page loads in dark theme
- Colors are adjusted

**Expected Visual:**
```
✅ Background: Dark (#1e1e1e or similar)
✅ Text: Light (#e8d4c0 or similar)
✅ Buttons: Warm colors adjusted
✅ Focus outline: Still visible
```

**✅ PASS Criteria:**
- No white flashes
- Text is readable
- Focus indicators still visible
- Contrasts maintained

---

## 📊 Test Results Template

### Test Session Info
```
Date: _______________
Tester: ______________
Screen Reader: ☐ VoiceOver ☐ NVDA
Browser: ☐ Chrome ☐ Firefox ☐ Safari ☐ Edge
OS: ☐ macOS ☐ Windows
```

### Checklist

#### Modal Selection (Créer/Se connecter)
- [ ] Button labels announced correctly
- [ ] Focus outline visible (3px)
- [ ] Tab navigation works
- [ ] Enter/Space activates buttons
- [ ] No keyboard traps

#### Form Inputs
- [ ] Labels associated with inputs
- [ ] Email input announced as "edit text"
- [ ] Password input announced as "edit text"
- [ ] Focus outline visible
- [ ] Inputs are operable with keyboard

#### Error Handling
- [ ] Error message has `role="alert"`
- [ ] Error announced automatically
- [ ] `aria-invalid="true"` announced
- [ ] Error message in logical order

#### Toast Notifications
- [ ] Toast announcement with `role="alert"`
- [ ] Toast doesn't block interaction
- [ ] Toast auto-dismisses
- [ ] Emoji hidden from screen reader

#### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Tab order is logical (left→right, top→bottom)
- [ ] Shift+Tab goes backward
- [ ] No keyboard traps

#### Focus Visibility
- [ ] Focus outline 3px minimum
- [ ] Focus outline visible in all themes
- [ ] Focus outline has sufficient contrast
- [ ] Focus outline doesn't hide content

#### Motion & Animation
- [ ] prefers-reduced-motion respected
- [ ] No animations with motion disabled
- [ ] High contrast outline works (4px)
- [ ] Dark mode colors adjusted

### Issues Found

| Issue | Severity | Element | Notes |
|-------|----------|---------|-------|
| | | | |
| | | | |

### Recommendations

- [ ] Issue 1: ___________
- [ ] Issue 2: ___________
- [ ] Issue 3: ___________

---

## 🧠 Testing Notes

### VoiceOver Navigation (macOS)

```bash
# Start reading
VO (Control+Option) + Space

# Navigate elements
VO + Right Arrow  → Next element
VO + Left Arrow   → Previous element
VO + Down Arrow   → Read all
VO + Up Arrow     → Read from start

# Tab navigation
Tab              → Next focusable
Shift+Tab        → Previous focusable

# Activate
Space or Return  → Click button
Control + Space  → Context menu
```

### NVDA Navigation (Windows)

```bash
# Start reading
NVDA (Insert or Capslock) + Home

# Navigate elements
Down Arrow       → Next element
Up Arrow         → Previous element
NVDA + Down      → Read all

# Tab navigation
Tab              → Next focusable
Shift+Tab        → Previous focusable

# Activate
Space or Return  → Click button
```

---

## ✅ Sign-Off Criteria

All of the following must be true:

- [ ] All button labels announced correctly
- [ ] All form inputs have associated labels
- [ ] Error messages announced with role="alert"
- [ ] Focus outline visible on all interactive elements
- [ ] Keyboard navigation complete (Tab/Shift+Tab)
- [ ] No keyboard traps
- [ ] Toast notifications announced
- [ ] Motion preferences respected
- [ ] High contrast supported
- [ ] Dark mode supported
- [ ] All announcements in French (when applicable)

---

## 📈 Expected Results

### VoiceOver (macOS)
**Target:** 100% of elements properly announced
**Current Status:** ✅ Ready for testing

### NVDA (Windows)
**Target:** 100% of elements properly announced
**Current Status:** ✅ Ready for testing

---

## 🔗 Resources

- [WebAIM: Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: ARIA: alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role)
- [MDN: ARIA: button role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role)

---

## 🎯 Next Steps

1. **Run Test Suite 1-6** with VoiceOver (macOS)
2. **Run Test Suite 1-6** with NVDA (Windows) *optional*
3. **Document Issues** using template above
4. **Create PR** with test results
5. **Deploy** to staging environment

**Estimated Time:** 1-2 hours per screen reader

---

**Status:** ✅ Ready for manual testing
**Last Updated:** 6 mars 2026
