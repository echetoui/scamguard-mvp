# Incident Response Procedures - Step-by-Step Workflows

**Document Type:** Operational Procedures
**Project:** ScamGuard MVP Phase 1
**Effective Date:** February 18, 2026
**Version:** 1.0

---

## 📋 QUICK REFERENCE GUIDE

### Incident Response Flowchart

```
┌─────────────────────────┐
│   Incident Detected     │
│  (Alert or Report)      │
└──────────────┬──────────┘
               │
        ┌──────▼──────┐
        │  Step 1:    │
        │  Confirm?   │
        └──┬───────┬──┘
           │       │
        YES│       │NO
           │       └──────→ [Close Alert, Document]
      ┌────▼────┐
      │ Step 2: │
      │Activate │
      │ Team    │
      └────┬────┘
           │
      ┌────▼──────────┐
      │   Step 3:     │
      │ Investigate   │
      │ & Assess      │
      └────┬──────────┘
           │
      ┌────▼────────┐
      │ Step 4:     │
      │ Contain &   │
      │ Remediate   │
      └────┬────────┘
           │
      ┌────▼──────────┐
      │ Step 5:       │
      │ Notification? │
      └──┬──────────┬─┘
         │          │
      YES│          │NO
         │          └──→ [Document, Close]
    ┌────▼─────┐
    │ Step 6:  │
    │Notify    │
    │Users &   │
    │Regulators│
    └────┬─────┘
         │
    ┌────▼──────────┐
    │ Step 7:       │
    │ Remediate &   │
    │ Recover       │
    └────┬──────────┘
         │
    ┌────▼────────────┐
    │  Step 8:        │
    │  Post-Incident  │
    │  Review         │
    └─────────────────┘
```

---

## 🔴 CRITICAL INCIDENT (Data Breach) - TIMELINE: 1 HOUR

### ⏰ MINUTE 0-5: CONFIRM & ACTIVATE

**Your Actions:**
1. Open your INCIDENT_RESPONSE_PLAN.md (this document)
2. Review incident alert details:
   - [ ] What triggered the alert?
   - [ ] Which system detected it?
   - [ ] What is the evidence?
3. Call IR Lead immediately: [PHONE]
4. Report: "I detected [INCIDENT]. Evidence: [BRIEF DESCRIPTION]"

**IR Lead Actions (Next 5 minutes):**
1. [ ] Contacts Technical Lead
2. [ ] Asks: "Is this a real breach or false alarm?"
3. [ ] Technical Lead responds within 5 minutes
4. [ ] If YES → Go to Step 2
5. [ ] If NO → Close alert, document why

**Do NOT delay reporting. It's better to report and confirm it's false than to delay a real incident.**

### ⏰ MINUTE 5-15: GATHER TEAM

**IR Lead:**
1. [ ] Activates incident response team
2. [ ] Sends message: "CRITICAL INCIDENT: [TYPE]. Incident ID: [YYYY-MM-DD-001]. Join call immediately."
3. [ ] Calls/messages: DPO, Technical Lead, Legal Counsel
4. [ ] Emergency meeting: [CONFERENCE CALL OR ZOOM LINK]
5. [ ] Waits for all key people to join (max 10 minutes)

**Your Actions (if you're NOT IR Lead):**
1. [ ] Receive alert notification
2. [ ] Join call/meeting immediately
3. [ ] Confirm availability to participate fully
4. [ ] No other meetings/work until incident resolved (if critical)

### ⏰ MINUTE 15-30: BRIEFING & INVESTIGATION START

**Agenda (Max 15 minutes for briefing):**

**IR Lead (1 minute):**
"At [TIME], we detected [INCIDENT TYPE]. Initial scope: [BRIEF]. Possible impact: [BRIEF]. Starting investigation now."

**Technical Lead (2 minutes):**
"I'm starting forensic investigation. Will have preliminary findings in [TIMEFRAME]. First steps: [ACTIONS]."

**DPO (2 minutes):**
"I'm assessing regulatory obligation. Will determine if Loi 25 breach notification required within 1 hour."

**Legal Counsel (1 minute):**
"I'm on standby to review any user notifications. Will be ready within 2 hours."

**Communications (1 minute):**
"I'm monitoring. Will prepare statement if needed."

**Assignments:**
- [ ] Technical Lead: Investigate incident (detailed findings within 4 hours)
- [ ] DPO: Assess breach notification obligation (decision within 4 hours)
- [ ] Legal Counsel: Standby for notification review (within 4 hours)
- [ ] IR Lead: Coordinate and escalate as needed

**Exit from briefing:** Everyone knows what they're doing. No more meetings unless escalation needed.

### ⏰ HOUR 1-4: INVESTIGATION & ASSESSMENT

**Technical Lead Investigation Checklist:**
```
FORENSIC EVIDENCE:
[ ] CloudWatch logs preserved (don't delete)
[ ] CloudTrail logs exported
[ ] DynamoDB access logs collected
[ ] Application logs gathered
[ ] Server logs archived

SCOPE DETERMINATION:
[ ] Affected systems identified
[ ] Affected user IDs identified
[ ] Affected data types identified
[ ] Number of users determined: ___________
[ ] Data categories exposed: ___________

EVIDENCE OF EXFILTRATION:
[ ] Was data downloaded? YES / NO
[ ] To where? [LOCATION]
[ ] Data size: __________ MB
[ ] Proof of unauthorized use? YES / NO

ROOT CAUSE:
[ ] Attack vector identified: ___________
[ ] Vulnerability exploited: ___________
[ ] Attacker identity: Unknown / [IDENTITY]
[ ] Entry point: ___________
[ ] Time of incident: ___________
```

**DPO Compliance Assessment (within 4 hours):**
```
LAUTRELLE 25 BREACH NOTIFICATION REQUIREMENT:

[ ] Personal data involved? YES / NO
    └─→ If NO: No notification required. Document decision.

[ ] Data security compromised? YES / NO
    └─→ If NO: No notification required. Document decision.

[ ] Likely unauthorized access? YES / NO (Assess likelihood)
    └─→ LIKELY: Proceed to notification
    └─→ UNLIKELY: Case-by-case assessment, consult Legal

[ ] High risk to person's rights/freedoms?
    └─→ YES: Public notification + regulatory notification
    └─→ NO: User notification + possible regulatory notification

NOTIFICATION DECISION:
[ ] Breach notification REQUIRED (attach reasoning)
[ ] Breach notification NOT REQUIRED (attach reasoning)
[ ] Further assessment needed (timeline: ___________)

DPO SIGN-OFF: ___________  Date: ___________
```

**Containment Actions (immediate):**
```
NETWORK ISOLATION:
[ ] Compromised system isolated from network?
[ ] Credentials revoked?
[ ] Malicious IP addresses blocked?

VULNERABILITY REMEDIATION:
[ ] Patch available?
[ ] Patch deployed to production?
[ ] Patch tested?

ACCESS CONTROL HARDENING:
[ ] IAM roles reviewed?
[ ] Unnecessary permissions revoked?
[ ] MFA enforced?
[ ] API keys rotated?

MONITORING ENHANCEMENT:
[ ] Enhanced logging enabled?
[ ] Additional alerts configured?
[ ] Continuous monitoring deployed?

CONTAINMENT COMPLETE TIME: ___________
```

### ⏰ HOUR 4: DECISION POINT

**IR Lead Escalation Decision:**

```
Decision Tree:

Has breach notification been determined?
├─ YES, NOT REQUIRED
│  ├─ [ ] Document decision
│  ├─ [ ] Close incident
│  └─ [ ] Schedule post-incident review (30 days)
│
├─ YES, REQUIRED (72-hour deadline)
│  ├─ [ ] Proceed to PHASE 3: NOTIFICATION
│  ├─ [ ] If containment incomplete, continue in parallel
│  └─ [ ] Timeline: User notification by [72 HOURS FROM NOW]
│
└─ FURTHER ASSESSMENT NEEDED
   ├─ [ ] Extend investigation timeline
   ├─ [ ] Reassess in [4-12 HOURS]
   └─ [ ] Update team status
```

---

## 🟠 HIGH INCIDENT (Confirmed Breach, <100 Users) - TIMELINE: 4 HOURS

### Similar to CRITICAL but with extended timelines:
- Investigation: 4 hours → 12 hours
- Notification: 72 hours (same)
- Activation: Within 4 hours (vs. 1 hour)

---

## 🟡 MEDIUM INCIDENT (Suspected Breach) - TIMELINE: 24 HOURS

### Simplified Process:
1. [ ] IR Lead notified (within 4 hours)
2. [ ] Team activated (within 8 hours)
3. [ ] Investigation conducted (by 24 hours)
4. [ ] Breach notification decision made (by 24 hours)
5. [ ] If notification required: Send within 72 hours total

---

## 🟢 LOW INCIDENT (Failed Attack Attempt) - TIMELINE: 5 DAYS

### Minimal Process:
1. [ ] IR Lead notified
2. [ ] Technical review conducted
3. [ ] No team activation unless escalated
4. [ ] Documentation only

---

## 📝 NOTIFICATION PROCEDURE (For Confirmed Breaches)

### HOUR 0-24: PREPARATION

**Step 1: Draft User Notification (DPO/Communications)**
```
Use template from INCIDENT_RESPONSE_PLAN.md Appendix A

Customize:
[ ] What specifically happened: [CLEAR LANGUAGE]
[ ] When it happened: [DATE/TIME RANGE]
[ ] What data was affected: [SPECIFIC TYPES]
[ ] What we're doing: [ACTIONS]
[ ] What user should do: [SPECIFIC STEPS]
[ ] Rights available: [SAR, DELETION, PORTABILITY]
[ ] DPO contact: privacy@scamguard.ca

Review for:
[ ] Accuracy
[ ] Regulatory compliance
[ ] Plain language (not legal jargon)
[ ] Completeness (all required elements)
[ ] No misleading language
```

**Step 2: Legal Review (Legal Counsel)**
```
[ ] Read draft notification
[ ] Check for legal accuracy
[ ] Check for regulatory compliance
[ ] Check for potential liability issues
[ ] Approve or request changes
[ ] Sign-off within 4 hours
```

**Step 3: Executive Approval (CEO/COO)**
```
[ ] Review final notification
[ ] Approve sending to users
[ ] Authorize any public statement
[ ] Confirm resource availability for user support
[ ] Sign-off before 72-hour deadline
```

### HOUR 24-72: SEND NOTIFICATIONS

**Step 4: User Notification Execution (Communications)**
```
WITHIN 72 HOURS OF INCIDENT DISCOVERY:

[ ] Email sent to all affected users
[ ] SMS sent (if high-risk breach)
[ ] Update website with incident notice
[ ] Prepare FAQ for support team

METHOD:
- Primary: Email (documented delivery)
- Secondary: SMS or phone (high-risk)
- Tertiary: Website notice + press release

VERIFICATION:
[ ] Email delivery confirmed
[ ] Bounced emails identified and remediated
[ ] User support team briefed
[ ] FAQ prepared for common questions

TIME SENT: ___________
VERIFIED BY: ___________
```

**Step 5: Regulatory Notification (DPO)**
```
IF HIGH RISK to user rights/freedoms:

CNIL (Quebec):
[ ] Prepare regulatory notification
[ ] Include: What, when, evidence, impact, remediation
[ ] Notify within 72 hours of incident discovery
[ ] Documentation preserved

IF FEDERAL INVOLVEMENT:

PIPEDA Commissioner:
[ ] Prepare federal notification
[ ] Determine public notification needed
[ ] Report within 60 days of discovery
```

**Step 6: Communication to Stakeholders (IR Lead)**
```
[ ] Internal staff briefing (first 24 hours)
[ ] Board notification (within 48 hours)
[ ] Major customers notified (within 72 hours)
[ ] Insurance provider notified (within 24 hours)
[ ] Media inquiry response prepared (if applicable)
```

---

## 🔄 RECOVERY PROCEDURES

### PHASE 4A: System Recovery (Parallel with notification)

**Technical Lead - System Hardening:**
```
VULNERABILITY REMEDIATION:
[ ] Patch deployed to production
[ ] Patch tested in non-prod environment first
[ ] Rollback plan prepared
[ ] Deployment completed and verified
[ ] Testing confirms vulnerability fixed

SECURITY ENHANCEMENTS:
[ ] Additional monitoring deployed
[ ] Firewall rules updated
[ ] WAF rules enhanced
[ ] IAM policies tightened
[ ] DynamoDB encryption verified
[ ] TLS certificates checked

VERIFICATION:
[ ] Penetration test confirms fix
[ ] Monitoring shows no continued exploitation
[ ] System performance normal
[ ] No new vulnerabilities introduced
```

### PHASE 4B: User Support (Days 3-30)

**Communications/Support Team:**
```
DEDICATED SUPPORT:
[ ] Support email for breach questions
[ ] Phone hotline established
[ ] FAQ published on website
[ ] Credit monitoring offered (if applicable)
[ ] Identity theft protection offered (if applicable)

MONITORING & FOLLOW-UP:
[ ] Monitor for suspicious user reports
[ ] Track support ticket volume
[ ] Follow up at 7 days: "Any issues?"
[ ] Follow up at 30 days: "Any concerns?"
[ ] Provide ongoing support for 90 days

DOCUMENTATION:
[ ] Log all user inquiries
[ ] Track remediation requests
[ ] Document any new issues reported
```

---

## 📊 POST-INCIDENT REVIEW (Within 30 days)

### Meeting Preparation (Day 7)

**IR Lead Schedule Meeting:**
```
[ ] Schedule with all IR team members
[ ] Set date: Within 30 days of incident
[ ] Allocate 3-4 hours for meeting
[ ] Agenda: What worked, what didn't, improvements
[ ] Send pre-meeting survey (optional)
```

**Technical Lead Prepares:**
```
[ ] Complete forensic investigation
[ ] Write technical summary
[ ] Document all evidence
[ ] Identify all vulnerabilities exploited
[ ] List all systems affected
[ ] Timeline finalized
```

**DPO Prepares:**
```
[ ] Confirm all notifications sent
[ ] Verify compliance with timelines
[ ] Document regulatory submissions
[ ] Assess no additional penalties/inquiries
[ ] Update Risk Register
```

### Review Meeting (Day 15-30)

**Agenda:**
```
1. Incident Timeline (10 min)
   - When detected
   - When escalated
   - When contained
   - When notified

2. What Worked Well (15 min)
   - Rapid detection?
   - Effective team activation?
   - Good communication?
   - Quick containment?
   - Accurate assessment?

3. What Needs Improvement (20 min)
   - Detection delays
   - Communication issues
   - Response gaps
   - Process breakdowns
   - Technical failures

4. Action Items (15 min)
   - Specific improvements
   - Owner assignments
   - Timeline for implementation
   - Success metrics

5. Documentation & Close (5 min)
   - Update IR Plan
   - Update Risk Register
   - Incident officially closed
```

**Action Item Template:**
```
Action: [WHAT NEEDS TO IMPROVE]
Reason: [WHY IT'S IMPORTANT]
Owner: [WHO WILL DO IT]
Timeline: [WHEN WILL IT BE DONE]
Success Metric: [HOW WILL WE KNOW IT'S DONE]
Budget/Resources: [WHAT'S NEEDED]
```

### Documentation & Closeout

**Incident Report:**
```
File: INCIDENT_[YYYY-MM-DD-001]_REPORT.md

Sections:
1. Executive Summary (1 page)
2. Timeline (detailed)
3. Root Cause Analysis
4. Impact Assessment
5. Response Effectiveness
6. Lessons Learned
7. Improvement Actions
8. Sign-offs

Storage: Secure location (encrypted)
Access: IR team + Legal + DPO only
Retention: 7 years
```

**Risk Register Update:**
```
[ ] Risk R-001 (Unauthorized Access) reassessed
[ ] Mitigation effectiveness evaluated
[ ] Residual risk updated
[ ] New risk factors identified
[ ] Monitoring procedures enhanced
[ ] Timeline for improvements documented
[ ] Sign-off from Risk Owner
```

**IR Plan Updates:**
```
[ ] Notification procedures updated (if needed)
[ ] Detection methods enhanced
[ ] Escalation path refined
[ ] Contact information verified
[ ] Training materials updated
[ ] Version incremented
[ ] All changes documented in change log
```

---

## ✅ INCIDENT RESPONSE CHECKLIST

### Pre-Incident (Right Now)

```
PREPARATION:
[ ] This document downloaded and accessible offline
[ ] INCIDENT_RESPONSE_PLAN.md accessible offline
[ ] Contact list printed and posted
[ ] IR team members briefed
[ ] Tabletop exercise completed
[ ] Essential tools identified and access confirmed
[ ] CloudWatch monitoring configured
[ ] CloudTrail enabled and monitored
[ ] DynamoDB access logging enabled
[ ] Backup procedures tested
```

### During Incident (Phase by Phase)

```
DETECTION & CONFIRMATION (Hour 0-1):
[ ] Alert received
[ ] Alert reviewed
[ ] IR Lead contacted
[ ] Incident confirmed (not false alarm)
[ ] Incident classified (CRITICAL/HIGH/MEDIUM/LOW)
[ ] Incident ID assigned

TEAM ACTIVATION (Hour 0-2):
[ ] IR team activated
[ ] Team members joined call
[ ] Roles assigned
[ ] Investigation started
[ ] Containment actions initiated

INVESTIGATION (Hour 0-4):
[ ] Evidence preserved
[ ] Scope determined
[ ] Root cause identified
[ ] Impact assessed
[ ] Containment verified

NOTIFICATION DECISION (Hour 0-4):
[ ] DPO assessed breach notification obligation
[ ] Legal reviewed notification requirement
[ ] Decision made: Notify or not?
[ ] If notify: Procedures followed per 72-hour deadline
[ ] If not: Decision documented

NOTIFICATION EXECUTION (Hour 0-72):
[ ] Notification drafted
[ ] Legal reviewed notification
[ ] Executive approved
[ ] Users notified within 72 hours
[ ] Regulators notified (if required)

RECOVERY (Day 2-30):
[ ] Vulnerability patched
[ ] System hardened
[ ] Monitoring enhanced
[ ] User support established
[ ] Follow-up monitoring deployed

POST-INCIDENT (Day 7-30):
[ ] Investigation completed
[ ] Forensic report written
[ ] Team review meeting held
[ ] Lessons learned documented
[ ] Risk Register updated
[ ] IR Plan updated
[ ] Incident officially closed
```

---

## 🎯 KEY METRICS & SUCCESS FACTORS

### Incident Response Effectiveness

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Detection Time** | <4 hours | Time from incident start to detection |
| **Confirmation Time** | <1 hour | Time from alert to confirmed breach |
| **Team Activation** | <2 hours | Time to all key team members joined |
| **Investigation Complete** | <4 hours | Time to scope/impact determined |
| **Notification Decision** | <4 hours | Time to DPO breach determination |
| **User Notification** | <72 hours | Time to notification sent (Loi 25 requirement) |
| **Regulatory Notification** | <72 hours | Time to regulator notification (if required) |
| **Containment Complete** | <4 hours (critical) | Time to breach isolated/secured |
| **System Recovery** | <24 hours | Time to production systems back online |
| **Post-Incident Review** | <30 days | Time to lessons learned meeting |

### Team Performance

```
Team Activation Speed: _____ minutes
Investigation Effectiveness: [Found root cause YES/NO]
Communication Clarity: [All understood actions YES/NO]
Notification Compliance: [Met 72-hour deadline YES/NO]
User Satisfaction: [Support feedback positive YES/NO]
Process Gaps Identified: [List] _______________
```

---

**Procedures Status:** ✅ READY FOR USE
**Last Updated:** February 18, 2026
**Next Review:** August 18, 2026
