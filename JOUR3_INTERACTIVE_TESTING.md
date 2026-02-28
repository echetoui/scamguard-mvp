# Jour 3 - Interactive Testing Guide

**Phase:** 5E.1
**Day:** 3 / 4
**Focus:** Enhanced Sections Testing

---

## 🧪 Interactive Tests - Do These Now

### Test Group 1: FAQ Category Toggles

**Setup:**
1. Navigate to 📚 Ressources tab
2. Click "❓ FAQ"
3. Scroll to see categories

**Test 1.1: Category Toggle**
```
ACTION:
1. Click on "🛡️ BLOCAGE" header

EXPECTED:
✓ Questions appear below with animation
✓ Arrow ▼ rotates smoothly
✓ Click again hides questions
✓ Smooth collapse animation
```

**Test 1.2: Multiple Categories**
```
ACTION:
1. Open "🛡️ BLOCAGE"
2. Open "🚨 SIGNALEMENT"
3. Open "💳 ARNAQUE"

EXPECTED:
✓ All open simultaneously (no auto-close)
✓ Each has own expanded state
✓ Arrows rotate independently
✓ All content visible
```

**Test 1.3: Search Still Works**
```
ACTION:
1. Open category
2. Type "bloquer" in search box
3. Clear search

EXPECTED:
✓ Categories collapse to show matches only
✓ Clear search → all categories restored
✓ Category toggle still works
✓ No conflicts between features
```

---

### Test Group 2: External Links Category Toggles

**Setup:**
1. Click "🔗 Ressources" tab
2. Scroll past emergency numbers
3. See resource categories

**Test 2.1: Default Expanded Category**
```
ACTION:
1. Load Ressources tab
2. Scroll to "Ressources Externes" section
3. Look at categories

EXPECTED:
✓ "🚨 SIGNALER À LA POLICE" expanded by default
✓ Links visible immediately
✓ Arrow ▼ pointing down
✓ Other categories collapsed
```

**Test 2.2: Toggle Categories**
```
ACTION:
1. Click "💳 RÉCUPÉRATION DE FRAUDE" header
2. Verify expansion
3. Click "🚨 SIGNALER" header
4. Click "💳 RÉCUPÉRATION" again

EXPECTED:
✓ "💳" expands, "🚨" collapses
✓ Only one category open at a time (optional: allows multiple)
✓ Smooth animations
✓ Arrow rotation smooth
✓ Links appear/disappear with animation
```

**Test 2.3: Link Functionality**
```
ACTION:
1. Expand "🚨 SIGNALER À LA POLICE"
2. Click on a country link (e.g., "🇧🇪 Police Fédérale")

EXPECTED:
✓ Link opens in new tab
✓ No blocking or errors
✓ Correct URL (www.police.be/signalement)
✓ External site loads correctly
```

---

### Test Group 3: Animation Quality

**Test 3.1: Smooth Rotations**
```
ACTION:
1. Click FAQ category header
2. Watch arrow rotation
3. Click external links category

EXPECTED:
✓ Arrow rotates smoothly (not snappy)
✓ 0.3s duration feels natural
✓ Bouncy easing (cubic-bezier) smooth
✓ No lag or stuttering
```

**Test 3.2: Content Slide**
```
ACTION:
1. Expand FAQ category
2. Expand External links category
3. Watch content appear

EXPECTED:
✓ Content slides down smoothly
✓ fadeIn animation visible
✓ Items appear one after another? (or all at once?)
✓ No janky rendering
```

**Test 3.3: Hover Effects**
```
ACTION:
1. Hover over category header
2. Hover over link card
3. Watch for transitions

EXPECTED:
✓ Background color changes gradually
✓ Shadow appears smoothly
✓ No abrupt jumps
✓ 0.2s transition feels responsive
```

---

### Test Group 4: Keyboard Navigation

**Test 4.1: Tab Navigation**
```
ACTION:
1. Press Tab repeatedly through page
2. Focus on category headers
3. Focus on link cards

EXPECTED:
✓ All interactive elements focusable
✓ Focus order logical (left-to-right, top-to-bottom)
✓ Focus outline green (#4CAF50)
✓ Outline 3px with 2px offset
✓ Outline visible on category headers
```

**Test 4.2: Enter to Toggle**
```
ACTION:
1. Tab to FAQ category header
2. Press Enter
3. Category should toggle

EXPECTED:
✓ Category expands/collapses
✓ Same as mouse click
✓ Works for all categories
✓ Works for external link categories
```

**Test 4.3: Space to Toggle**
```
ACTION:
1. Tab to category header
2. Press Space bar
3. Should toggle

EXPECTED:
✓ Same behavior as Enter
✓ Works consistently
✓ No page scroll
```

---

### Test Group 5: Responsive Design

**Test 5.1: Mobile (iPhone SE - 375px)**
```
ACTION:
1. DevTools: 375x667 (iPhone SE)
2. Open FAQ tab
3. Click categories
4. Scroll external links

EXPECTED:
✓ Categories full width
✓ Headers readable
✓ Arrow visible
✓ Smooth opening on small screen
✓ No horizontal scroll
✓ Links stack vertically
✓ All touchable (44px+)
```

**Test 5.2: Tablet (768px)**
```
ACTION:
1. DevTools: 768x1024
2. Open both tabs

EXPECTED:
✓ Categories take appropriate width
✓ 2-column link grid visible
✓ Spacing appropriate
✓ All readable
```

**Test 5.3: Desktop (1200px)**
```
ACTION:
1. Full screen desktop browser
2. Open FAQ and External links

EXPECTED:
✓ 3+ column link grid
✓ Plenty of whitespace
✓ Full content visible without scroll
✓ Hover effects smooth
```

---

### Test Group 6: Accessibility

**Test 6.1: Color Contrast**
```
CHECK:
- Category header text vs background: >= 4.5:1
- Link text color vs background: >= 4.5:1
- Focus outline visible against any background

EXPECTED:
✓ All text readable
✓ No low-contrast combinations
✓ Focus indicator always visible
```

**Test 6.2: Touch Targets**
```
MEASURE:
- Category headers: >= 44x44px
- Link cards: >= 44x44px
- Arrow toggle: >= 44x44px (with padding)

EXPECTED:
✓ All targets large enough
✓ No accidental taps
✓ Easy to use on mobile
```

**Test 6.3: Screen Reader (VoiceOver/NVDA)**
```
ACTION (if available):
1. Enable screen reader
2. Navigate to FAQ section
3. Navigate to External links

EXPECTED:
✓ Category headers announced
✓ "expanded" or "collapsed" state announced
✓ Links announced with URL
✓ No skipped content
```

---

### Test Group 7: Browser Compatibility

**Chrome/Edge (Chromium)**
```
✓ All animations smooth
✓ No console errors
✓ All interactions work
✓ Focus outline visible
```

**Safari (Desktop & iOS)**
```
✓ Animations work
✓ CSS transitions smooth
✓ Flexbox layout correct
✓ Touch interactions work on iOS
```

**Firefox**
```
✓ All features working
✓ No layout issues
✓ Animations smooth
```

---

## ✅ Completion Checklist

### FAQ Category Toggles
- [ ] Click to expand/collapse works
- [ ] Arrow rotates smoothly
- [ ] Animation smooth (60fps)
- [ ] Multiple categories can be open
- [ ] Search works with toggles
- [ ] Keyboard (Tab + Enter) works
- [ ] Focus indicator visible

### External Links Toggles
- [ ] Default category (police) expanded
- [ ] Click to toggle works
- [ ] Links appear/disappear smoothly
- [ ] Only one open at a time? (verify behavior)
- [ ] Links open in new tab
- [ ] Keyboard navigation works
- [ ] Mobile layout appropriate

### Animations
- [ ] 60fps smooth (no jank)
- [ ] Easing feels natural (bouncy)
- [ ] Hover transitions smooth
- [ ] Focus transitions smooth
- [ ] Content slide animation works

### Accessibility
- [ ] Color contrast compliant
- [ ] Focus indicators visible
- [ ] Keyboard navigation complete
- [ ] Touch targets >= 44px
- [ ] ARIA attributes present
- [ ] Semantic HTML maintained

### Responsive
- [ ] Mobile (< 480px) looks good
- [ ] Tablet (600-1024px) looks good
- [ ] Desktop (> 1024px) looks good
- [ ] No horizontal scroll
- [ ] All touch targets accessible

### Browsers
- [ ] Chrome/Chromium
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Firefox
- [ ] Edge (Chromium)
- [ ] Chrome Mobile

---

## 🐛 Bug Report Template

If you find issues:

```
### Issue: [Brief title]

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Steps to Reproduce:**
1. Do this
2. Then this
3. Then that

**Browser:**
Chrome / Safari / Firefox / Edge / Mobile

**Platform:**
Desktop / iPhone / Android / iPad

**Screenshots/Videos:**
If possible

**Severity:**
Critical / High / Medium / Low
```

---

## 📝 Testing Notes

**Tester:** ________________
**Date:** ________________
**Browser:** ________________
**Device:** ________________
**Screen Size:** ________________

**Issues Found:**
1. ________________
2. ________________
3. ________________

**Positive Feedback:**
1. ________________
2. ________________

---

## 🎉 All Tests Passing!

Once all tests above pass, you're ready for Day 4: Testing & Deployment.

**Next:** /Jour 4 - Final Testing & Staging Deployment
