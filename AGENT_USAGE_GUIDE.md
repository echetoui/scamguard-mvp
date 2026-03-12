# Agent Usage Guide - ScamGuard

**11 Agents Now Deployed** ✅

---

## New Agents (Just Implemented)

### 1. 👤 User Researcher
**File:** `backend/cdk/agents/user_researcher.py`

**When to use:**
- Analyzing user feedback on SMS OTP UX
- Identifying senior user pain points
- Synthesizing support ticket patterns
- Validating feature assumptions with data

**Example invocation:**
```python
event = {
    "research_type": "feedback",  # feedback|interviews|support_tickets|survey
    "data": [
        {
            "text": "The OTP verification is confusing",
            "count": 5,
            "user_type": "senior"
        }
    ],
    "focus_area": "authentication"
}
```

**Output includes:**
- Pain point ranking (by frequency + severity)
- User segment breakdown
- Jobs-to-be-Done analysis
- Product recommendations
- Research gaps

**Real use case (SMS OTP):**
```python
event = {
    "research_type": "feedback",
    "data": [
        {"text": "Code entry is slow", "count": 3},
        {"text": "300ms redirect too fast", "count": 2},
        {"text": "SMS code not received", "count": 8}
    ],
    "focus_area": "authentication"
}

# Output: Identifies SMS delivery as #1 pain point (8 mentions)
# Recommends: Verify Firebase delivery, add retry logic, improve UX
```

---

### 2. 🔧 Engineer
**File:** `backend/cdk/agents/engineer.py`

**When to use:**
- Reviewing PRD before development starts
- Assessing technical feasibility of features
- Identifying implementation complexity & risks
- Validating architecture decisions

**Example invocation:**
```python
event = {
    "review_type": "feature_spec",  # feature_spec|architecture|prd|implementation
    "component": "auth",  # auth|family|tools|general
    "spec": {
        "type": "jwt_token_generation",
        "description": "Generate JWT tokens for SMS OTP auth",
        "constraints": {
            "security_level": "high",
            "performance_sla": "< 100ms"
        }
    }
}
```

**Output includes:**
- ✅ Feasible? (yes/no)
- 📊 Complexity: low|medium|high
- ⏱️ Effort estimate (design/dev/test days)
- ⚠️ Risks & challenges
- 💡 Technical recommendations
- ❓ Clarification questions

**Real use case (SMS OTP JWT tokens):**
```python
event = {
    "review_type": "feature_spec",
    "component": "auth",
    "spec": {
        "type": "jwt_token_generation",
        "description": "Generate JWT tokens after OTP verification",
        "dependencies": ["Firebase"]
    }
}

# Output:
# - ⚠️ Risk: Mock JWT signature not production-ready
# - 💡 Recommendation: Use RS256 with key rotation
# - ❓ Question: How will key rotation be handled?
```

---

### 3. 👔 Executive
**File:** `backend/cdk/agents/executive.py`

**When to use:**
- Creating executive summary of completed work
- Building business case for new features
- Framing technical proposals for investors
- Risk assessment for leadership

**Example invocation:**
```python
event = {
    "communication_type": "update",  # update|proposal|business_case|risk_brief
    "audience": "leadership",  # investors|board|leadership|stakeholders
    "work": {
        "title": "Firebase SMS OTP Migration",
        "description": "Migrate from AWS Pinpoint to Firebase",
        "user_value": "Improves SMS delivery reliability",
        "timeline": "2 weeks"
    },
    "context": {
        "company_priorities": ["Security", "Reliability"],
        "okrs": ["Improve user trust", "Reduce churn"]
    }
}
```

**Output includes:**
- 📋 Executive summary (3 bullets)
- 💰 Business impact (ROI, cost savings)
- 🎯 Strategic alignment (OKRs, company goals)
- ⚠️ Risks & mitigation
- 📊 Resource requirements
- ✅ Decision needed
- 🚀 Next steps

**Real use case (Firebase migration):**
```python
event = {
    "communication_type": "business_case",
    "audience": "investors",
    "work": {
        "title": "Firebase SMS Migration",
        "revenue_impact": "$0",  # Cost savings, not revenue
        "cost_impact": "-$20K/month",  # Pinpoint savings
        "cost_savings": "$240K/year",
        "technical_risk": "Low",
        "timeline": "2 weeks"
    }
}

# Output:
# Executive Summary: Firebase migration delivers $240K annual savings
# ROI: 1.2x (payback period: 2 months)
# Strategic Fit: Improves reliability, meets SOC2 compliance
# Recommendation: APPROVE
```

---

## Agent Workflow Integration

### Project Unit Workflow (Feature Development)
```
┌─────────────┐
│ ProjectOwner│  ← "What are we building and why?"
└──────┬──────┘
       ↓
┌──────────────────┐
│ UserResearcher   │  ← "What do users really need?"
└──────┬───────────┘
       ↓
┌──────────────────┐
│  Architect       │  ← "How should we design this?"
└──────┬───────────┘
       ↓
┌──────────────────┐
│   Engineer       │  ← "Is this feasible? What are the risks?"
└──────┬───────────┘
       ↓
┌──────────────────┐
│   Developer      │  ← "Build it"
└──────┬───────────┘
       ↓
┌──────────────────┐
│  QA_Engineer     │  ← "Test it"
└──────┬───────────┘
       ↓
┌──────────────────┐
│   Executive      │  ← "Frame it for stakeholders"
└──────────────────┘
       ↓
    SHIPPED + COMMUNICATED
```

### Product Unit Workflow (Threat Analysis)
```
┌──────────────┐
│ TriageAgent  │  ← "Categorize the threat"
└──────┬───────┘
       ↓
┌──────────────────┐
│ UserResearcher   │  ← "How does this impact users?"
└──────┬───────────┘
       ↓
┌──────────────────┐
│ ThreatAnalyst    │  ← "Deep dive analysis"
└──────┬───────────┘
       ↓
┌──────────────────┐
│  CriticAgent     │  ← "Quality assurance"
└──────────────────┘
```

---

## API Invocation Examples

### Call User Researcher via AWS Step Functions
```bash
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:ACCOUNT:stateMachine:product-unit-workflow \
  --input '{
    "research_type": "support_tickets",
    "focus_area": "authentication",
    "data": [...]
  }'
```

### Call Engineer via AWS Lambda
```bash
aws lambda invoke \
  --function-name EngineerLambda \
  --payload '{
    "review_type": "feature_spec",
    "component": "auth",
    "spec": {...}
  }' \
  response.json
```

### Call Executive via Step Functions
```bash
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:ACCOUNT:stateMachine:project-unit-workflow \
  --input '{
    "communication_type": "business_case",
    "audience": "investors",
    "work": {...}
  }'
```

---

## Success Metrics

After deploying the 3 new agents, track:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Rework reduction** | 40% less | Defects found in pre-production review |
| **Exec alignment** | 60% faster | Time to decision vs. previous baseline |
| **User satisfaction** | +30% | Post-launch satisfaction surveys |
| **Feature quality** | +50% | Bugs in first week post-launch |
| **Team velocity** | Stable/improved | Sprint completion rate |

---

## Next Steps

### Immediate (This Week)
1. ✅ Agents deployed to AWS Lambda
2. ✅ Workflows updated in Step Functions
3. [ ] Test UserResearcher with SMS OTP feedback data
4. [ ] Test Engineer with Phase 6 test coverage spec

### Short Term (Next 2 Weeks)
1. [ ] Run all Phase 6 feature requests through Engineer first
2. [ ] Gather user feedback on SMS OTP and pass to UserResearcher
3. [ ] Create exec summary of Firebase migration with Executive agent
4. [ ] Measure impact on quality/alignment

### Medium Term (Month 1-2)
1. [ ] Refine agent prompts based on feedback
2. [ ] Document best practices for invoking each agent
3. [ ] Train team on using agents in development process
4. [ ] Measure success metrics and ROI

---

## Troubleshooting

### Agent not responding
- Check Lambda function has IAM permissions to DynamoDB
- Verify TABLE_NAME environment variable is set
- Check CloudWatch logs for errors

### Output format unexpected
- Agents return JSON responses, parse `.body` field
- Some agents may have different output structures based on input type
- See agent code for expected output schema

### Workflow timeout
- Increased timeouts from 30 min (old) to 60 min (new workflows)
- If still timing out, check individual agent latency in CloudWatch
- Consider async invocation for slow agents

---

## Agent Capabilities Matrix

| Agent | Pain Points | Complexity | Risks | Recommendations | Business Case |
|-------|-------------|------------|-------|-----------------|---------------|
| **UserResearcher** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Engineer** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Executive** | ❌ | ❌ | ✅ | ✅ | ✅ |

Use all three together for complete feature development cycle! 🚀

---

## Example: Full SMS OTP Feature Lifecycle

### Day 1: Project Planning
1. **ProjectOwner** frames initiative
2. **UserResearcher** gathers requirements from past SMS UX feedback
3. **Architect** designs solution

### Day 2-3: Pre-Development Review
4. **Engineer** reviews spec: "Mock JWT signature needs fixing"
5. **UserResearcher** validates: "Seniors struggle with code entry time"
6. **Developer** updates spec based on feedback

### Day 4-5: Development
7. **Developer** implements with Engineer recommendations

### Day 6: Quality Review
8. **QA_Engineer** tests thoroughly
9. **Engineer** reviews implementation code

### Day 7: Executive Communication
10. **Executive** creates business case for stakeholders
11. **UserResearcher** identifies UX improvements for Phase 7

### Result: 🎉
- ✅ Production-ready implementation
- ✅ No major rework needed
- ✅ Stakeholders understand value
- ✅ Next phase insights already captured
