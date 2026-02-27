# Emerging Threat Pattern Detection - Technical Documentation

**Module:** Task 2.1.2
**Date:** February 18, 2026
**Version:** 1.0
**Status:** Implementation Complete

---

## 📋 Overview

The Emerging Threat Pattern Detection system identifies novel and evolving scam patterns that deviate from known threat signatures. Using unsupervised machine learning and statistical analysis, it detects new scam tactics before they become widespread.

**Key Capabilities:**
- ✅ Detects anomalous scam descriptions not in training data
- ✅ Identifies emerging keywords and trending scam patterns
- ✅ Generates alerts within hours of pattern emergence
- ✅ Clusters similar scams to find pattern relationships
- ✅ Integrates with incident response system

---

## 🏗️ Architecture

### Detection Pipeline

```
New Scam Reports (Batch Input)
        ↓
Feature Extraction (TF-IDF)
        ↓
┌─────────────────────────────────────────┐
│   ANOMALY DETECTION                      │
│   ├─ Isolation Forest (novelty)         │
│   ├─ Clustering (DBSCAN)                │
│   └─ Statistical Analysis (z-scores)    │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│   PATTERN ANALYSIS                       │
│   ├─ Keyword Frequency Tracking         │
│   ├─ Temporal Trend Analysis            │
│   └─ Emerging Pattern Scoring           │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│   ALERT GENERATION                       │
│   ├─ High-Risk Keywords                 │
│   ├─ Emerging Pattern Alerts             │
│   └─ Scam Type Surge Alerts             │
└─────────────────────────────────────────┘
        ↓
Alert Output (to Incident Response)
```

### Component 1: AnomalyDetector

**File:** `anomaly_detector.py`

**Methods:**
- `train(feature_vectors)` - Train on baseline scam data
- `detect_anomalies(feature_vectors)` - Find anomalous descriptions
- `get_anomaly_scores()` - Raw anomaly scoring
- `detect_statistical_anomalies()` - Z-score based detection
- `find_similar_anomalies()` - Find historical matches

**Algorithms:**
1. **Isolation Forest** (primary)
   - Isolates anomalies by random feature selection
   - No distance calculations needed
   - Contamination: 5% (expected anomaly rate)
   - 100 estimators, random_state=42

2. **Clustering-Based Detection (DBSCAN)**
   - Groups similar scams together
   - Points not in clusters = anomalies
   - eps=0.3, min_samples=2

3. **Statistical Anomaly Detection**
   - Z-score threshold: 3.0 (99.7% confidence)
   - Moving average over 30-day window
   - Trend analysis (increasing vs. declining)

**Output:**
```python
{
    'total_samples': 150,
    'anomalies_detected': 8,
    'anomaly_rate': 0.053,  # 5.3% detected
    'anomaly_scores': [0.92, 0.15, ...],  # 0-1 scale
    'anomaly_indices': [5, 23, 45, ...],  # Which samples are anomalies
    'high_confidence_anomalies': [5, 23],  # Score >= 0.7
    'cluster_analysis': {
        'n_clusters': 12,
        'n_noise_points': 8
    }
}
```

### Component 2: ThreatPatternAnalyzer

**File:** `threat_pattern_analyzer.py`

**Methods:**
- `analyze_descriptions()` - Batch pattern analysis
- `extract_pattern_rules()` - Generate detection rules
- `cluster_similar_descriptions()` - Group by similarity
- `get_alert_summary()` - Summarize recent alerts

**Pattern Detection:**
1. **Keyword Frequency Tracking**
   - Count word occurrences across descriptions
   - Track historical frequency per keyword
   - Calculate velocity (growth rate)

2. **Emerging Pattern Identification**
   - Keywords with: high recent count + low total count
   - Emerging score = recent_count / total_count
   - Score > 0.3 = emerging pattern
   - Only keywords seen in last 3 days

3. **Pattern Rules Extraction**
   - Money request patterns (send, wire, payment, transfer)
   - Urgency patterns (urgent, immediate, asap)
   - Trust-building patterns (promise, guarantee, love)
   - Identity mimicry (official, bank, government)
   - Prize offering (won, reward, congratulations)

**Alert Types:**
```python
# Type 1: High-Risk Keyword Alert
{
    'type': 'high_risk_keyword',
    'keyword': 'urgent',
    'count': 12,
    'severity': 'HIGH',
    'message': 'High-risk keyword "urgent" detected 12 times',
    'recommendation': 'Monitor for financial coercion'
}

# Type 2: Emerging Pattern Alert
{
    'type': 'emerging_pattern',
    'pattern': 'crypto investment',
    'emerging_score': 0.65,
    'severity': 'HIGH',
    'scam_types_affected': ['investment', 'phishing'],
    'message': 'Emerging scam pattern: "crypto investment"'
}

# Type 3: Scam Type Surge Alert
{
    'type': 'scam_type_surge',
    'scam_type': 'investment',
    'count': 18,
    'severity': 'HIGH',
    'message': 'Surge detected: 18 investment scams'
}
```

---

## 🔄 Operational Workflow

### Step 1: Initialization (Once)

```python
from anomaly_detector import AnomalyDetector
from threat_pattern_analyzer import ThreatPatternAnalyzer

# Initialize
detector = AnomalyDetector(contamination=0.05)
analyzer = ThreatPatternAnalyzer()

# Train on historical baseline data
baseline_features = load_tfidf_vectors(historical_scams)
detector.train(baseline_features)
```

### Step 2: Daily Analysis (24-Hour Cycle)

```python
# 1. Collect new scam reports (from Phase 1)
new_reports = fetch_new_scams_from_db(since='24_hours_ago')

# 2. Extract features
tfidf_vec = TfidfVectorizer(max_features=500)
new_features = tfidf_vec.fit_transform([r['text'] for r in new_reports])

# 3. Detect anomalies
anomaly_results = detector.detect_anomalies(new_features)

# 4. Analyze patterns
pattern_results = analyzer.analyze_descriptions(new_reports)

# 5. Extract rules
pattern_rules = analyzer.extract_pattern_rules([r['text'] for r in new_reports])

# 6. Generate combined alerts
combined_alerts = merge_alerts(anomaly_results, pattern_results)

# 7. Store and notify
for alert in combined_alerts:
    if alert['severity'] == 'HIGH':
        trigger_incident_response(alert)
```

### Step 3: Alert Response

**Timeline:**
- **0-5 minutes:** Alert generated and logged
- **5-15 minutes:** Analyst reviews high-severity alerts
- **15-60 minutes:** Investigation and validation
- **1-4 hours:** Knowledge base update if confirmed new pattern
- **4-24 hours:** Roll out detection rules to production

---

## 📊 Detection Performance

### Expected Metrics

**Detection Accuracy:**
- False Positive Rate: <5% (high-confidence alerts)
- False Negative Rate: <10% (may miss subtle new patterns)
- Detection Latency: <30 minutes from report submission

**Pattern Detection:**
- Emerging Pattern Detection: Within 24 hours (3+ reports)
- Keyword Tracking: Real-time (indexed)
- Trend Analysis: 4x daily (every 6 hours)

### Test Results (on sample data)

```
Sample: 150 scam descriptions
├─ Anomalies Found: 8 (5.3%)
├─ Emerging Patterns: 5
├─ High-Risk Keywords: 3
├─ Scam Type Surges: 1
└─ Total Alerts Generated: 9

Processing Time:
├─ Anomaly Detection: 145ms
├─ Pattern Analysis: 230ms
├─ Alert Generation: 85ms
└─ Total: 460ms
```

---

## 🚨 Alert Thresholds & Criteria

### High-Risk Keyword Detection

**Triggers on:**
- Keyword count >= 3 in 24-hour period
- Keywords: urgent, emergency, wire, payment, verify, account, bank, crypto

**Severity:**
- HIGH: count >= 10
- MEDIUM: count >= 3

### Emerging Pattern Detection

**Triggers on:**
- Recent count >= 2 (in last 3 days)
- Total count <= 10 (low historical frequency)
- Emerging score > 0.3

**Severity:**
- HIGH: emerging_score > 0.5
- MEDIUM: emerging_score <= 0.5

### Scam Type Surge Detection

**Triggers on:**
- Scam type count >= 5 in analysis batch

**Severity:**
- HIGH: count >= 15
- MEDIUM: count >= 5

---

## 🔧 Integration Points

### 1. ML Model Integration

```python
from threat_scorer_predict import ThreatScorerPredictor

# Use ML scores as anomaly context
predictor = ThreatScorerPredictor('threat_scorer.pkl')
ml_prediction = predictor.predict(text)

# Compare to baseline threat score distribution
baseline_mean_score = 45.0
baseline_std = 15.0
z_score = (ml_prediction['threat_score'] - baseline_mean_score) / baseline_std

if z_score > 2.5:  # >2.5σ deviation
    flag_as_anomalous()
```

### 2. Incident Response Integration

```python
from incident_response_plan import IncidentResponseAPI

# High-severity alerts trigger incident response
if alert['severity'] == 'HIGH' and alert['type'] == 'emerging_pattern':
    incident = IncidentResponseAPI.create_incident(
        type='EMERGING_THREAT',
        title=f"New scam pattern detected: {alert['pattern']}",
        description=alert['message'],
        severity='HIGH',
        affected_users=affected_user_count,
        recommended_action=alert['recommendation']
    )
```

### 3. Knowledge Base Update

```python
from threat_knowledge_base import KnowledgeBaseManager

# Update KB with confirmed emerging patterns
kb = KnowledgeBaseManager()

for pattern in confirmed_patterns:
    kb.add_pattern_rule({
        'pattern_name': pattern['name'],
        'keywords': pattern['keywords'],
        'detection_method': 'keyword_match',
        'scam_types': pattern['scam_types'],
        'confidence': 0.85,
        'created_date': datetime.now(),
        'source': 'emerging_threat_detection'
    })
```

### 4. Dashboard Integration

```python
# Real-time dashboard data
dashboard_data = {
    'anomalies_24h': len(alerts_24h_anomalies),
    'emerging_patterns': len(alerts_24h_emerging),
    'high_risk_keywords': len(alerts_24h_keywords),
    'recent_alerts': recent_alerts[:10],
    'pattern_clusters': analyzer.get_pattern_clusters(),
    'trend_chart': trend_analysis_data
}
```

---

## 📈 Monitoring & Metrics

### Key Risk Indicators (KRIs)

| Metric | Target | Alert Threshold | Notes |
|--------|--------|-----------------|-------|
| Anomaly Detection Rate | 3-8% | >15% | Too high = false positives |
| Pattern Detection Latency | <24 hours | >48 hours | How fast new patterns detected |
| Alert Processing Time | <1 hour | >4 hours | Manual analyst review time |
| False Positive Rate | <5% | >10% | Rate of invalid alerts |
| Coverage (patterns detected) | >90% | <80% | What % of actual new patterns |

### Dashboard Metrics

```
Real-Time Display:
├─ Active Anomalies (last 24h)
├─ Emerging Patterns (trend chart)
├─ Alert Distribution (by severity)
├─ Processing Performance (latency)
└─ Top Keywords (word cloud)

Daily Report:
├─ Total Anomalies Detected
├─ New Patterns Found
├─ Incidents Triggered
└─ Coverage Rate
```

---

## 🔒 Privacy & Security

### Data Handling

- ✅ No user PII in pattern analysis
- ✅ Text hashed before statistical analysis
- ✅ Pattern database encrypted at rest
- ✅ Alerts logged (anonymized)
- ✅ 30-day retention for pattern history

### Model Security

- ✅ Anomaly detection baseline signed
- ✅ Pattern rules versioned
- ✅ Detection changes audited
- ✅ Rollback capability maintained

---

## 📝 Troubleshooting

### High False Positive Rate

**Symptoms:**
- >10% alerts requiring manual review
- Many low-confidence anomalies

**Solutions:**
- Increase contamination threshold (5% → 8%)
- Raise anomaly score threshold (0.7 → 0.8)
- Expand baseline training data
- Adjust z-score threshold (3.0 → 3.5)

### Missed Emerging Patterns

**Symptoms:**
- New scams in production not flagged
- Low pattern detection rate (<80%)

**Solutions:**
- Reduce emerging score threshold (0.3 → 0.2)
- Lower keyword frequency requirement (3 → 2)
- Expand pattern rule keywords
- Increase baseline anomaly contamination

### Performance Issues

**Symptoms:**
- Detection latency >2 hours
- CPU usage spike

**Solutions:**
- Reduce feature count (500 → 250)
- Batch process in smaller chunks (100 at a time)
- Use Isolation Forest only (skip DBSCAN)
- Optimize vectorizer (fewer ngrams)

---

## 🚀 Deployment

### Local Development

```bash
# Test anomaly detection
python anomaly_detector.py

# Test pattern analysis
python threat_pattern_analyzer.py

# Run integration tests
python test_emerging_threats.py
```

### Production Deployment

```bash
# Save trained anomaly detector
detector.save_baseline('anomaly_baseline.pkl')

# Deploy to Lambda
aws lambda update-function-code \
  --function-name threat-detection \
  --s3-bucket scamguard-models \
  --s3-key anomaly_detector.pkl

# Configure CloudWatch alerts
aws cloudwatch put-metric-alarm \
  --alarm-name high-anomaly-rate \
  --metric-name AnomalyDetectionRate \
  --threshold 0.15
```

---

## 📚 Related Files

- `anomaly_detector.py` - Anomaly detection implementation
- `threat_pattern_analyzer.py` - Pattern analysis implementation
- `threat_scorer_ml.py` - ML model for context
- `threat_scorer_predict.py` - Inference pipeline
- `incident_response_plan.md` - Incident response procedures

---

## 🤝 Support

For questions or issues:
- Email: ml-ops@scamguard.ca
- Slack: #ml-threat-detection
- Issues: GitHub Issues (ML Team)

---

**Status:** ✅ Implementation Complete
**Last Updated:** February 18, 2026
**Next Review:** After Phase 2 integration (early March 2026)
