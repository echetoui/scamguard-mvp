# SecurityHeartDashboard Refactor Design - Component-Based Architecture

**Date:** 5 avril 2026
**Phase:** 2 - Dashboard Styling with Design System Components
**Target:** Aînés (65+) - Refactor existing dashboard with new design-system components
**Status:** Design approved, ready for implementation

---

## 📋 Overview

Refactor SecurityHeartDashboard to use the new design-system components (Section, Card, Button, Badge, Alert) instead of CSS-only styling. The new architecture will be:
- More maintainable (component-based instead of CSS classes)
- More accessible (leveraging design-system's WCAG AAA specs)
- More flexible (easier to modify, reuse components)

**Current State:** SecurityHeartDashboard.jsx uses CSS classes from SecurityHeartDashboard.css
**New State:** SecurityHeartDashboard.jsx uses Section, Card, Button, Badge, Alert from @/design-system

---

## 🎯 Layout Architecture

### **New Dashboard Structure**
```
┌──────────────────────────────────────┐
│ ALERTS SECTION                       │
│ (Dynamic alerts based on score/stats)│
├──────────────────────────────────────┤
│ SECTION 1: Your Security (Score)     │
│ ├─ Card (elevated)                   │
│ ├─ Heart Icon ❤️ (120px)             │
│ ├─ Score Display (78/100)            │
│ ├─ Status Badge                      │
│ └─ Encouraging Message               │
├──────────────────────────────────────┤
│ SECTION 2: Your Progress             │
│ ├─ Card (outlined)                   │
│ └─ SVG Graph (5-day history)         │
├──────────────────────────────────────┤
│ SECTION 3: This Week                 │
│ ├─ Card (filled) - Scams Blocked     │
│ │  ├─ Icon (🛡️)                      │
│ │  ├─ Label                          │
│ │  └─ Badge (value)                  │
│ ├─ Card (filled) - Quizzes Completed │
│ │  ├─ Icon (✓)                       │
│ │  ├─ Label                          │
│ │  └─ Badge (value)                  │
│ └─ Card (filled) - Guardian Status   │
│    ├─ Icon (👁️)                      │
│    ├─ Label                          │
│    └─ Badge (Active/Inactive)        │
├──────────────────────────────────────┤
│ SECTION 4: Actions                   │
│ ├─ Button (primary, large) CONTINUE  │
│ └─ Button (secondary, large) SETTINGS│
└──────────────────────────────────────┘
```

---

## 🔔 Alerts System (Dynamic)

### **Alert Generation Logic**

Alerts are generated based on real-time score and weekly stats:

#### **Critical Score Alert** (variant="error")
- **Trigger:** securityScore < 30
- **Title:** "Sécurité Critique"
- **Message:** "Votre score est très faible. Nous recommandons une action immédiate."
- **Dismissable:** true

#### **Low Score Alert** (variant="warning")
- **Trigger:** 30 ≤ securityScore < 50
- **Title:** "Score Faible"
- **Message:** "Votre score de sécurité a baissé. Complétez un quiz pour l'améliorer."
- **Dismissable:** true

#### **Quiz Recommendation Alert** (variant="info")
- **Trigger:** quizzesCompleted < 2
- **Title:** "Conseil"
- **Message:** `Vous avez complété ${quizzesCompleted} quiz. Un de plus vous aiderait!`
- **Dismissable:** true

#### **Max 3 alerts** displayed at once (prioritized: error > warning > info)

---

## 🏗️ Component Specifications

### **1. Alerts Section**
**Location:** Top of dashboard
**Implementation:**
```jsx
{alerts.map((alert) => (
  <Alert
    key={alert.id}
    variant={alert.variant}           // "error" | "warning" | "info"
    title={alert.title}               // e.g., "Sécurité Critique"
    message={alert.message}           // e.g., "Votre score..."
    dismissable={true}
    onDismiss={() => dismissAlert(alert.id)}
  />
))}
```

**Props:** All from design-system Alert component
**Accessibility:** ARIA live region, keyboard dismissible

---

### **2. Security Score Section**
**Component:** Section + Card + Badge
**Props:**
```jsx
<Section 
  title="Votre Sécurité"
  subtitle="Protection actuelle"
>
  <Card variant="elevated">
    {/* Heart Icon */}
    <div style={{ fontSize: '120px', marginBottom: '20px' }}>❤️</div>
    
    {/* Score Display */}
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <div style={{ fontSize: '72px', fontWeight: 'bold' }}>
        {securityScore}
      </div>
      <div style={{ fontSize: '20px', color: colors.textSecondary }}>
        /100
      </div>
    </div>
    
    {/* Status Badge */}
    <Badge 
      variant="filled" 
      size="large"
      color={scoreStatus === 'safe' ? 'secondary' : scoreStatus === 'moderate' ? 'tertiary' : 'error'}
    >
      {getStatusText(scoreStatus)}
    </Badge>
    
    {/* Encouraging Message */}
    <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '18px' }}>
      {getStatusMessage(securityScore)}
    </p>
  </Card>
</Section>
```

**Sizing:** 
- Heart icon: 120px (large, easy to see)
- Score number: 72px (bold, prominent)
- Message: 18px (readable)

---

### **3. Progress Section**
**Component:** Section + Card + SVG Graph
**Implementation:**
```jsx
<Section 
  title="Votre Progression"
  subtitle="Derniers 5 jours"
>
  <Card variant="outlined">
    <svg viewBox="0 0 300 100" className="graph-svg">
      {/* Existing SVG implementation - no changes needed */}
      {/* Grid lines, plot line, data points */}
    </svg>
  </Card>
</Section>
```

**Existing Graph:** SVG from current implementation (calculateGraphPoints, calculateDataPoint functions)
**Card Variant:** outlined (less emphasis than score)

---

### **4. Weekly Stats Section**
**Component:** Section + 3× Card (filled) + Badge
**Implementation:**
```jsx
<Section 
  title="Cette Semaine"
  subtitle="Vos activités"
>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
    {/* Scams Blocked Card */}
    <Card variant="filled">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '40px' }}>🛡️</div>
        <div style={{ fontSize: '16px', color: colors.textSecondary }}>
          Arnaques détectées
        </div>
        <Badge variant="filled" size="large" color="secondary">
          {weeklyStats.scamsBlocked}
        </Badge>
      </div>
    </Card>

    {/* Quizzes Completed Card */}
    <Card variant="filled">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '40px' }}>✓</div>
        <div style={{ fontSize: '16px', color: colors.textSecondary }}>
          Quizz réussis
        </div>
        <Badge variant="filled" size="large" color="primary">
          {weeklyStats.quizzesCompleted}
        </Badge>
      </div>
    </Card>

    {/* Guardian Status Card */}
    <Card variant="filled">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '40px' }}>👁️</div>
        <div style={{ fontSize: '16px', color: colors.textSecondary }}>
          Ange gardien
        </div>
        <Badge 
          variant="tonal" 
          size="large" 
          color={weeklyStats.guardianActive ? 'secondary' : 'error'}
        >
          {weeklyStats.guardianActive ? 'Actif' : 'Inactif'}
        </Badge>
      </div>
    </Card>
  </div>
</Section>
```

**Layout:** 3-column grid (responsive: 1 col on mobile, 3 on desktop)
**Cards:** variant="filled" (secondary emphasis)
**Badges:** 
- Scams: secondary (green)
- Quizzes: primary (blue)
- Guardian: secondary if active, error if inactive

---

### **5. Actions Section**
**Component:** Section + 2× Button
**Implementation:**
```jsx
<Section>
  <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
    <Button 
      variant="primary" 
      size="large"
      onClick={() => navigate('/main')}
    >
      CONTINUER
    </Button>
    <Button 
      variant="secondary" 
      size="large"
      onClick={() => setShowSettings(true)}
    >
      PARAMÈTRES
    </Button>
  </div>
</Section>
```

**Button Specs:**
- Primary button: Large (72px height), prominent CTA
- Secondary button: Large (72px height), lower priority
- Both: Full width or side-by-side based on screen width

---

## 🔄 State Management

### **State Variables**
```javascript
const [securityScore, setSecurityScore] = useState(0);           // 0-100
const [scoreStatus, setScoreStatus] = useState('loading');       // 'safe'|'moderate'|'warning'
const [weeklyStats, setWeeklyStats] = useState({                 // Weekly activity
  scamsBlocked: 0,
  quizzesCompleted: 0,
  guardianActive: true
});
const [scoreHistory, setScoreHistory] = useState([]);             // Last 5 days
const [isLoading, setIsLoading] = useState(true);                 // Loading state
const [alerts, setAlerts] = useState([]);                         // Dynamic alerts
```

### **Alert Generation Function**
```javascript
const generateAlerts = (score, stats) => {
  const generatedAlerts = [];
  
  // Critical alert (highest priority)
  if (score < 30) {
    generatedAlerts.push({
      id: 'critical',
      variant: 'error',
      title: 'Sécurité Critique',
      message: 'Votre score est très faible. Nous recommandons une action immédiate.'
    });
  }
  // Low score alert
  else if (score < 50) {
    generatedAlerts.push({
      id: 'low-score',
      variant: 'warning',
      title: 'Score Faible',
      message: 'Votre score de sécurité a baissé. Complétez un quiz pour l\'améliorer.'
    });
  }
  
  // Quiz recommendation (lowest priority)
  if (stats.quizzesCompleted < 2) {
    generatedAlerts.push({
      id: 'quiz-recommend',
      variant: 'info',
      title: 'Conseil',
      message: `Vous avez complété ${stats.quizzesCompleted} quiz. Un de plus vous aiderait!`
    });
  }
  
  // Return max 3 alerts
  return generatedAlerts.slice(0, 3);
};
```

### **Data Fetching**
```javascript
useEffect(() => {
  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Call backend API
      const response = await fetch('/api/security-dashboard');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      // Update state
      setSecurityScore(data.score);
      setScoreHistory(data.history);        // Last 5 days
      setWeeklyStats(data.stats);
      setScoreStatus(getScoreStatus(data.score));
      
      // Generate dynamic alerts
      const generatedAlerts = generateAlerts(data.score, data.stats);
      setAlerts(generatedAlerts);
      
    } catch (error) {
      console.error('Error fetching:', error);
      setAlerts([{
        id: 'error',
        variant: 'error',
        title: 'Erreur de Chargement',
        message: 'Nous n\'avons pas pu charger vos données. Veuillez rafraîchir.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchSecurityData();
  const interval = setInterval(fetchSecurityData, 5 * 60 * 1000); // Refresh every 5 min
  return () => clearInterval(interval);
}, []);
```

### **Loading State**
```javascript
if (isLoading) {
  return (
    <Section title="Chargement...">
      <Card variant="elevated">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', padding: '40px 20px' }}>
          <div className="spinner"></div>  {/* CSS spinner from current impl */}
          <p style={{ fontSize: '18px' }}>Calcul de votre sécurité en cours...</p>
        </div>
      </Card>
    </Section>
  );
}
```

---

## ♿ Accessibility (WCAG AAA)

**Compliance Checklist:**
- ✅ **Touch targets:** All buttons 72px (Button size="large")
- ✅ **Font sizes:** 18px+ for body text (Section titles 24px, Card content 16px+)
- ✅ **Line height:** 1.5+ (from design tokens)
- ✅ **Contrast:** 7:1+ (all colors from MD3 verified tokens)
- ✅ **Focus rings:** 3px blue ring on buttons (from design-system Button)
- ✅ **Keyboard nav:** Tab through alerts, buttons, focus indicators visible
- ✅ **Semantic HTML:** Section, Card, Button, Badge, Alert = semantic elements
- ✅ **ARIA:** Alerts have aria-live="polite", status badges have role="status"
- ✅ **Color + text:** Icons + labels, not just color (🛡️ Arnaques, ✓ Quizz, 👁️ Ange)
- ✅ **Dismissible alerts:** Can close with button or keyboard

---

## 🧪 Testing Requirements

**Unit Tests (Jest + React Testing Library):**
1. Component renders all sections in correct order
2. Renders alerts dynamically based on score
3. Alert dismissal removes alert from display
4. Loading state displays spinner
5. Data fetches on mount and every 5 minutes
6. Button clicks navigate correctly
7. Badge displays correct stat values
8. Focus ring visible on button focus
9. Alerts have ARIA attributes
10. Score number has sufficient contrast

**Integration Tests:**
1. Full dashboard flow: load → display alerts → show sections
2. Alert generation logic: score < 50 triggers warning
3. Responsive layout: 1 col (mobile) → 3 col (desktop)

---

## 📁 File Changes

**Modify:**
- `frontend/src/components/SecurityHeartDashboard.jsx` - Refactor with design-system components
- `frontend/src/components/SecurityHeartDashboard.css` - Simplify (keep animations only)

**No new files needed** (components come from @/design-system)

**Imports in SecurityHeartDashboard.jsx:**
```javascript
import { Section } from '@/design-system';
import { Card } from '@/design-system';
import { Button } from '@/design-system';
import { Badge } from '@/design-system';
import { Alert } from '@/design-system';
import { colors, spacing, typography } from '@/styles/design-tokens';
```

---

## 🎯 Success Criteria

✅ All 5 sections render correctly (Alerts → Score → Progress → Stats → Actions)
✅ Dynamic alerts trigger based on score and stats
✅ All design-system components used (Section, Card, Button, Badge, Alert)
✅ WCAG AAA compliant (touch targets, fonts, contrast, focus rings)
✅ Responsive layout (mobile 1 col → desktop 3 col for stats)
✅ Tests pass (20+ tests covering render, data, interaction, a11y)
✅ Build successful
✅ No CSS class duplication (clean refactor)

---

**Document prepared:** 5 avril 2026
**Version:** 1.0 - Final
**Status:** Ready for implementation planning
