# User Engagement Analytics - Technical Documentation

**Module:** Task 2.2.2
**Date:** February 18, 2026
**Version:** 1.0
**Status:** Implementation Complete

---

## 📋 Overview

The User Engagement Analytics system provides comprehensive tracking and analysis of user behavior. It tracks 10+ event types, calculates 15+ key metrics, performs cohort analysis, detects anomalies, and generates real-time and historical reports.

**Key Capabilities:**
- ✅ Real-time event tracking (11 event types)
- ✅ Core metrics (DAU, WAU, MAU, new users)
- ✅ Retention analytics (Day 1, 7, 30)
- ✅ Cohort analysis with health scoring
- ✅ Feature adoption tracking (10 features)
- ✅ User journey mapping
- ✅ Anomaly detection with alerts
- ✅ Real-time and batch reports

---

## 🏗️ Architecture

### Analytics Pipeline

```
User Activity Events
    ↓
┌─────────────────────────────────────────┐
│   EVENT TRACKING (UserAnalyticsEngine)   │
│   ├─ Track 11 event types               │
│   ├─ Record feature usage               │
│   ├─ Map user journeys                  │
│   └─ Create sessions                    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│   METRICS CALCULATION                    │
│   ├─ DAU/WAU/MAU (user counts)          │
│   ├─ Retention (day 1/7/30)             │
│   ├─ Churn rate                         │
│   ├─ Engagement score (0-100)           │
│   └─ Feature adoption rates             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│   COHORT ANALYSIS                        │
│   ├─ Group users by signup date         │
│   ├─ Calculate retention per cohort     │
│   ├─ Health scoring                     │
│   └─ Trend analysis                     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│   ANOMALY DETECTION                      │
│   ├─ Check low DAU                      │
│   ├─ Check high churn                   │
│   ├─ Check low retention                │
│   └─ Generate alerts                    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│   DASHBOARD & REPORTS                    │
│   ├─ Real-time dashboard                │
│   ├─ Daily reports                      │
│   ├─ Weekly reports                     │
│   └─ Monthly reports                    │
└─────────────────────────────────────────┘
    ↓
Output: Analytics Data for Decision Making
```

### Component 1: UserAnalyticsEngine

**File:** `user_analytics.py`

**Core Data Structures:**
- `UserEvent` - Individual tracked event
- `UserSession` - Session tracking
- `CohortData` - Cohort grouping

**Key Methods:**
- `track_event()` - Record user activity
- `start_session()` / `end_session()` - Session management
- `register_user()` - Add user to tracking
- `calculate_retention()` - Retention for cohort/day
- `calculate_dau/wau/mau()` - Active user counts
- `calculate_churn_rate()` - Churn calculation
- `get_feature_adoption()` - Feature usage metrics
- `calculate_engagement_score()` - Per-user engagement (0-100)
- `get_user_journey()` - Event sequence
- `get_comprehensive_report()` - Full analytics report

### Component 2: AnalyticsDashboard

**File:** `analytics_dashboard.py`

**Methods:**
- `get_realtime_dashboard()` - Live metrics
- `get_daily_report()` - Daily analysis
- `get_weekly_report()` - Weekly analysis
- `get_monthly_report()` - Monthly analysis
- `check_anomalies()` - Anomaly detection
- `get_active_alerts()` - Active alerts
- `export_for_api()` - API-ready data

**CohortAnalyzer:**
- `analyze_cohort()` - Detailed cohort analysis
- `_get_cohort_health()` - Health status
- `_get_cohort_recommendations()` - Improvement suggestions

---

## 📊 Metrics & KPIs

### Core Metrics (4)

| Metric | Unit | Description | Calculation |
|--------|------|-------------|---|
| DAU | Count | Daily active users | Unique users per day |
| WAU | Count | Weekly active users | Unique users per 7 days |
| MAU | Count | Monthly active users | Unique users per 30 days |
| New Users | Count | New signups | Users with signup event |

### Retention Metrics (3)

| Metric | Target | Alert <  | Description |
|--------|--------|----------|---|
| Day 1 Retention | 60% | 40% | Users active 1 day post-signup |
| Day 7 Retention | 40% | 25% | Users active 7 days post-signup |
| Day 30 Retention | 25% | 15% | Users active 30 days post-signup |

### Engagement Metrics (4)

| Metric | Unit | Target | Description |
|--------|------|--------|---|
| Avg Session Length | Minutes | 8+ | Average time per session |
| Sessions Per User | Number | 20+/month | Session frequency |
| Engagement Score | 0-100 | 50+ | User engagement index |
| Churn Rate | % | <10% | Monthly inactive rate |

### Feature Adoption

Tracks usage of 10 features:
1. Report submission
2. Threat analysis
3. Leaderboards
4. Achievements
5. Education modules
6. Community features
7. Gamification
8. Social sharing
9. Seasonal events
10. User profile

**Metric:** % of users adopting feature (Target: 60%+)

---

## 🔄 Operational Workflow

### Step 1: Event Tracking

```python
from user_analytics import UserAnalyticsEngine

analytics = UserAnalyticsEngine()

# Register new user
analytics.register_user(user_id="user_123")

# Track login
analytics.start_session(user_id="user_123", session_id="sess_456")

# Track report submission
analytics.track_event(
    user_id="user_123",
    event_type="report_submitted",
    feature="report_submission",
    session_id="sess_456",
    metadata={"scam_type": "phishing"}
)

# Track module completion
analytics.track_event(
    user_id="user_123",
    event_type="module_completed",
    feature="education",
    session_id="sess_456",
    metadata={"module": "scam_101"}
)

# End session
analytics.end_session("sess_456")
```

### Step 2: Calculate Metrics

```python
# Get current metrics
dau = analytics.calculate_dau()           # Today's active
wau = analytics.calculate_wau()           # This week's active
mau = analytics.calculate_mau()           # This month's active

# Get retention for cohort
retention_7 = analytics.calculate_retention("2026-02-W1", day=7)

# Get churn
churn = analytics.calculate_churn_rate()

# Get engagement
engagement = analytics.calculate_engagement_score("user_123")
```

### Step 3: Generate Dashboard

```python
from analytics_dashboard import AnalyticsDashboard

dashboard = AnalyticsDashboard(analytics)

# Real-time dashboard
realtime = dashboard.get_realtime_dashboard()
# Returns: {dau, wau, mau, retention, churn, engagement, features, alerts}

# Daily report
daily = dashboard.get_daily_report()

# Weekly report
weekly = dashboard.get_weekly_report()

# Check anomalies
anomalies = dashboard.check_anomalies()
```

### Step 4: Alert & Act

```python
# Get active alerts
alerts = dashboard.get_active_alerts()

# If critical anomaly, create incident
for alert in alerts:
    if alert['severity'] == 'critical':
        create_incident(alert)  # Notify team

# Export for stakeholders
report = dashboard.export_for_api()
send_email(recipients, report)
```

---

## 📊 Example Report Output

### Real-Time Dashboard

```json
{
  "timestamp": "2026-02-18T14:30:00Z",
  "active_users": {
    "dau": 1250,
    "wau": 5430,
    "mau": 8920,
    "status": "healthy"
  },
  "retention": {
    "day1": 0.65,
    "day7": 0.42,
    "day30": 0.28,
    "trend": "strong"
  },
  "churn": {
    "rate": 0.08,
    "status": "acceptable"
  },
  "engagement": {
    "average_score": 58.3,
    "average_session_length_minutes": 8.5,
    "level": "high"
  },
  "features": {
    "top_features": [
      {
        "feature": "report_submission",
        "adoption_rate": 0.89,
        "users": 7940
      }
    ]
  },
  "alerts": []
}
```

### Daily Report

```json
{
  "report_date": "2026-02-18",
  "daily_active_users": {
    "value": 1250,
    "change_percent": 12.5
  },
  "new_users": {
    "value": 145,
    "change_percent": 8.3
  },
  "total_events": {
    "value": 28450,
    "by_type": {
      "report_submitted": 8920,
      "login": 6240,
      "achievement_unlocked": 3450,
      "quiz_completed": 2340,
      "module_completed": 1200
    }
  },
  "feature_usage": {
    "report_submission": 8920,
    "achievements": 4500,
    "leaderboards": 2340
  }
}
```

---

## 🔍 Anomaly Detection

### Anomaly Types & Thresholds

1. **Low DAU** (Alert: 50% below expected)
   - Expected DAU = WAU / 7
   - Alert if: DAU < Expected × 0.5

2. **High Churn** (Alert: >25%)
   - Churn > 0.25 = critical

3. **Low Retention** (Alert: <25% day-7)
   - Retention_7 < 0.25 = critical

4. **Low Engagement** (Alert: <30)
   - Avg engagement score < 30 = warning

5. **Feature Adoption Drop** (Alert: >30% drop)
   - Compare week-over-week adoption

---

## 📈 Cohort Analysis

### Cohort Grouping

- **Period:** Weekly (can be daily/monthly)
- **Cohort ID:** YYYY-MM-W# (e.g., 2026-02-W1)
- **Metrics:** Retention day 1, 7, 14, 30

### Cohort Health Status

```
Excellent: 7-day retention > 50%
Good:      7-day retention 35-50%
Fair:      7-day retention 20-35%
Poor:      7-day retention < 20%
```

### Example Cohort Data

```
Cohort 2026-02-W1 (118 signups):
├─ Day 1 Retention: 65%
├─ Day 7 Retention: 42%
├─ Day 30 Retention: 28%
└─ Health: Good → Recommendations: Monitor weekly, run engagement campaign
```

---

## 🎯 KPI Tracking

### Target KPIs

| KPI | Target | Alert Below | Status |
|-----|--------|------------|--------|
| DAU | 500 | 250 | ✅ Tracking |
| 7-Day Retention | 40% | 25% | ✅ Tracking |
| 30-Day Retention | 25% | 15% | ✅ Tracking |
| Churn Rate | <10% | >25% | ✅ Tracking |
| Avg Engagement | 50 | 30 | ✅ Tracking |
| Feature Adoption | 60% | 40% | ✅ Tracking |

### Monthly Report Review

- Executive summary
- KPI performance vs targets
- Cohort health analysis
- Feature adoption trends
- Recommendations for next month

---

## 🔒 Privacy & Security

### Data Handling

- ✅ Event tracking is anonymized
- ✅ User IDs hashed in reports
- ✅ No personal data in analytics
- ✅ GDPR/Loi 25 compliant
- ✅ User opt-out available
- ✅ 365-day retention for aggregated data

### Tracking Consent

- ✅ Opt-in required at signup
- ✅ Privacy policy disclosure
- ✅ User can disable tracking
- ✅ Data anonymization in transit

---

## 🚀 Deployment

### Local Testing

```bash
python user_analytics.py
python analytics_dashboard.py

# Test with sample data
python test_analytics.py
```

### Production Deployment

```bash
# 1. Create analytics database
CREATE TABLE user_events (
  event_id UUID PRIMARY KEY,
  user_id VARCHAR,
  event_type VARCHAR,
  timestamp TIMESTAMP,
  feature VARCHAR
);

# 2. Deploy analytics service
aws lambda update-function-code \
  --function-name analytics-engine \
  --s3-bucket scamguard-models \
  --s3-key analytics.zip

# 3. Enable dashboard
aws lambda update-function-code \
  --function-name analytics-dashboard-api \
  --s3-bucket scamguard-models \
  --s3-key dashboard.zip

# 4. Schedule reports
aws events put-rule \
  --name daily-analytics-report \
  --schedule-expression 'cron(0 1 * * ? *)'
```

### API Endpoints

```
GET  /analytics/realtime           - Live dashboard
GET  /analytics/daily              - Daily report
GET  /analytics/weekly             - Weekly report
GET  /analytics/monthly            - Monthly report
GET  /analytics/journey/{user_id}  - User journey
GET  /analytics/cohort/{cohort_id} - Cohort analysis
GET  /analytics/anomalies          - Anomaly detection
GET  /analytics/metrics            - All metrics
```

---

## 📁 Files Created

```
backend/
├── user_analytics.py          (600+ lines)
├── analytics_dashboard.py      (500+ lines)
├── analytics_config.json       (400+ lines)
└── USER_ENGAGEMENT_ANALYTICS.md (500+ lines)
```

---

**Status:** ✅ Implementation Complete
**Last Updated:** February 18, 2026
**Next Review:** After first week of analytics collection
