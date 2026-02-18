# Dashboard Component Implementation Guide

**Component Name:** Dashboard
**File Location:** `/frontend/src/components/Dashboard.jsx`
**Styles Location:** `/frontend/src/components/DashboardStyles.css`
**Created:** February 18, 2026

---

## 📋 Overview

The Dashboard component is the main user interface after login, providing a comprehensive view of:
- User statistics (analyses performed, fraud blocked, level, XP)
- Gamification progress (level, XP bar, badges)
- Recent scam analyses with risk scores
- Quick access to main features
- Privacy controls and data management options

---

## 🎯 Features

### 1. User Greeting & Status
- Personalized welcome message with user email
- Protection status indicator (active/inactive)
- Animated status indicator

### 2. Quick Stats Grid
- Analyses performed count
- Fraud attempts blocked count
- Current user level
- Experience points total
- Hover effects for better UX

### 3. Gamification System
- Progress bar to next level
- Badge display (collectable achievements)
- XP points tracking
- Visual level indication

### 4. Recent Analyses Display
- List of recent scam analyses
- Risk score visualization (color-coded)
- Expandable details for each analysis
- Risk assessment recommendations
- Status indicators (blocked, suspicious, low-risk)

### 5. Quick Actions
- Analyze scam (primary action)
- Settings access
- Privacy policy link
- Help & FAQ access

### 6. Privacy Information
- Data protection summary
- Data access procedures
- Data deletion information
- Privacy settings management button

### 7. Responsive Design
- Mobile-optimized layout
- Tablet-friendly interface
- Desktop enhanced experience
- Dark mode support
- Accessibility features

---

## 💻 Implementation

### Basic Usage

```jsx
import Dashboard from './components/Dashboard';

function App() {
  const handleAnalyzeClick = () => {
    // Navigate to analysis page
    window.location.href = '/analyze';
  };

  const handleSettingsClick = () => {
    // Navigate to settings
    window.location.href = '/settings';
  };

  return (
    <Dashboard
      userEmail="user@example.com"
      userId="user123"
      onAnalyzeClick={handleAnalyzeClick}
      onSettingsClick={handleSettingsClick}
    />
  );
}
```

### Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userEmail` | string | Yes | User's email address for personalization |
| `userId` | string | Yes | User ID for data fetching |
| `onAnalyzeClick` | function | Yes | Callback when "Analyze" button clicked |
| `onSettingsClick` | function | Yes | Callback when "Settings" button clicked |

---

## 🔄 State Management

The component uses React hooks for state management:

```javascript
// User statistics state
const [userStats, setUserStats] = useState({
  analysesCount: 0,
  fraudBlockedCount: 0,
  xpPoints: 0,
  level: 1,
  badges: [],
  recentAnalyses: [],
  protectionStatus: 'active'
});

// Loading state
const [isLoading, setIsLoading] = useState(true);

// Selected analysis for details
const [selectedAnalysis, setSelectedAnalysis] = useState(null);
```

---

## 📡 Data Fetching

### Backend Integration

The component includes a `fetchUserStats()` function that should be connected to your backend API:

```javascript
const fetchUserStats = async () => {
  try {
    setIsLoading(true);

    // Replace with actual API call
    const response = await fetch(`/api/users/${userId}/stats`);
    const data = await response.json();

    setUserStats(data);
  } catch (error) {
    console.error('Error fetching user stats:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### Expected API Response Format

```json
{
  "analysesCount": 12,
  "fraudBlockedCount": 3,
  "xpPoints": 450,
  "level": 2,
  "badges": ["first_analysis", "fraud_fighter", "trusted_user"],
  "recentAnalyses": [
    {
      "id": 1,
      "date": "2026-02-18",
      "type": "Romance Scam",
      "riskScore": 92,
      "status": "blocked"
    }
  ],
  "protectionStatus": "active"
}
```

---

## 🎨 Styling

The component uses CSS Grid, Flexbox, and modern CSS features:

### Key CSS Classes

- `.dashboard` - Main container
- `.dashboard__header` - Header section
- `.dashboard__stats-grid` - Stats grid layout
- `.dashboard__section` - Main sections
- `.stat-card` - Individual stat card
- `.analysis-card` - Analysis item
- `.btn` - Button styling
- `.quick-actions` - Quick action buttons

### Color Scheme

| Element | Color | Purpose |
|---------|-------|---------|
| Primary | `#667eea` | Main interactive elements |
| Success | `#388e3c` | Low-risk indicators |
| Warning | `#f57c00` | Medium-risk indicators |
| Danger | `#d32f2f` | High-risk indicators |
| Light | `#f5f7fa` | Light backgrounds |
| Dark | `#1a1a1a` | Text and dark elements |

---

## 📱 Responsive Breakpoints

The component is responsive at these breakpoints:

- **Desktop:** > 768px (full layout)
- **Tablet:** 480px - 768px (adjusted grid)
- **Mobile:** < 480px (single column layout)

---

## ♿ Accessibility Features

The component includes:
- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast colors
- Dark mode support (`prefers-color-scheme`)
- Reduced motion support (`prefers-reduced-motion`)
- Screen reader friendly text

---

## 🔧 Customization

### Modify Badges

Edit the `getBadgeName()` function to add custom badges:

```javascript
const getBadgeName = (badgeId) => {
  const badgeMap = {
    'first_analysis': { name: 'First Step', icon: '🎯', color: '#2196F3' },
    'custom_badge': { name: 'Custom', icon: '🎖️', color: '#9C27B0' }
  };
  return badgeMap[badgeId] || { name: 'Badge', icon: '🏆', color: '#757575' };
};
```

### Modify Risk Colors

Edit the `getRiskColor()` function to customize risk visualization:

```javascript
const getRiskColor = (score) => {
  if (score >= 80) return '#d32f2f'; // High risk - RED
  if (score >= 50) return '#f57c00'; // Medium risk - ORANGE
  return '#388e3c'; // Low risk - GREEN
};
```

### Modify Progress Calculation

Adjust XP to next level calculation:

```javascript
const calculateProgress = () => {
  const nextLevelXP = userStats.level * 500; // Modify multiplier here
  return Math.min((userStats.xpPoints % 500) / 500 * 100, 100);
};
```

---

## 🧪 Testing

### Unit Test Example

```javascript
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

test('renders dashboard with user greeting', () => {
  render(
    <Dashboard
      userEmail="test@example.com"
      userId="123"
      onAnalyzeClick={() => {}}
      onSettingsClick={() => {}}
    />
  );

  expect(screen.getByText(/Welcome, test/i)).toBeInTheDocument();
});

test('displays user stats correctly', () => {
  render(
    <Dashboard
      userEmail="test@example.com"
      userId="123"
      onAnalyzeClick={() => {}}
      onSettingsClick={() => {}}
    />
  );

  expect(screen.getByText(/Analyses Performed/i)).toBeInTheDocument();
  expect(screen.getByText(/Fraud Attempts Blocked/i)).toBeInTheDocument();
});
```

---

## 🔄 Integration Checklist

- [ ] Import Dashboard component in main App
- [ ] Connect backend API for user stats
- [ ] Replace mock data with real API calls
- [ ] Implement onAnalyzeClick handler
- [ ] Implement onSettingsClick handler
- [ ] Test on mobile devices
- [ ] Test with screen readers
- [ ] Verify dark mode rendering
- [ ] Load and test with real user data
- [ ] Verify analytics integration
- [ ] Test error handling for API failures

---

## 🐛 Known Limitations (MVP)

- Uses mock data (replace with API)
- Limited to recent analyses (5 max)
- No pagination for long lists
- No advanced filtering options
- No export functionality yet

---

## 🚀 Future Enhancements (Phase 2)

- [ ] Real-time stats updates
- [ ] Advanced filtering of analyses
- [ ] Data export functionality
- [ ] Achievement notifications
- [ ] Leaderboards
- [ ] Custom badge creation
- [ ] Analytics dashboard
- [ ] Detailed threat analysis
- [ ] User preference storage
- [ ] Theme customization

---

## 📞 Support

For questions or issues with the Dashboard component:
- Email: dev@scamguard.ca
- Issues: [GitHub Issues]
- Documentation: [Internal Wiki]

---

**Component Version:** 1.0
**Last Updated:** February 18, 2026
**Status:** ✅ Production Ready
