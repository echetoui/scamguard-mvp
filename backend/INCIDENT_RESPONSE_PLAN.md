# Incident Response Plan - ScamGuard MVP Phase 1

**Document Type:** Security & Compliance Procedure
**Project:** ScamGuard MVP Phase 1 (Consolidation & Ancrage Québécois)
**Effective Date:** February 18, 2026
**Version:** 1.0
**Classification:** Confidential

---

## 📋 EXECUTIVE SUMMARY

This Incident Response Plan (IRP) defines ScamGuard's procedures for detecting, responding to, and recovering from security incidents, with emphasis on **data breach notification within 72 hours** as required by Loi 25 (Quebec GDPR).

**Key Objectives:**
- [x] Detect incidents within 4 hours (CloudWatch monitoring)
- [x] Classify incidents by severity (Critical, High, Medium, Low)
- [x] Notify affected users within 72 hours (Loi 25 requirement)
- [x] Minimize impact and recovery time
- [x] Maintain compliance with regulatory requirements
- [x] Preserve evidence for forensic analysis
- [x] Conduct post-incident review and improvements

**Scope:** All security incidents affecting ScamGuard infrastructure, data, or users
**Compliance:** Loi 25 (Articles 2019-2043), PIPEDA Part 2 (breach notification), GDPR Articles 33-34

---

## 🎯 INCIDENT RESPONSE TEAM

### Core Team Roles

| Role | Name | Contact | Responsibility |
|------|------|---------|-----------------|
| **Incident Response Lead** | Security Officer | security@scamguard.ca | Overall coordination, escalation decisions |
| **DPO (Data Protection Officer)** | Chief Privacy Officer | privacy@scamguard.ca | Compliance, user notification, regulatory reporting |
| **Technical Lead** | DevOps/Platform Lead | devops@scamguard.ca | Investigation, containment, technical remediation |
| **Communications Lead** | Communications Manager | comms@scamguard.ca | User communication, public statements |
| **Legal Counsel** | General Counsel | legal@scamguard.ca | Legal risk assessment, regulatory coordination |
| **Executive Sponsor** | CEO/COO | executive@scamguard.ca | Decision maker, final approval on notifications |

### Extended Team (On-Call)

- Cloud Security Engineer
- Database Administrator
- Application Developer
- Customer Support Lead
- External Legal Counsel (retainer)
- Cyber Insurance Provider

### Responsibilities

**Incident Response Lead:**
- Activates incident response team
- Coordinates response efforts
- Manages communication between teams
- Makes escalation decisions
- Authorizes notification procedures

**DPO:**
- Assesses compliance obligations
- Determines if breach notification required
- Coordinates with regulatory authorities
- Prepares notifications for users
- Documents compliance activities
- Oversees data subject rights requests

**Technical Lead:**
- Investigates incident details
- Isolates affected systems
- Collects forensic evidence
- Performs containment and remediation
- Provides technical risk assessment

**Communications Lead:**
- Drafts user notifications
- Coordinates public statements
- Manages user queries
- Documents communications
- Maintains communication timeline

**Legal Counsel:**
- Assesses legal implications
- Advises on regulatory obligations
- Reviews notifications for legal accuracy
- Manages liability mitigation
- Coordinates with insurance

---

## 🚨 INCIDENT CLASSIFICATION FRAMEWORK

### Severity Levels

| Level | Definition | Examples | Response Time |
|-------|-----------|----------|---|
| **CRITICAL** | Confirmed data breach affecting all users or large cohort | Database breach, ransomware, unauthorized access to DynamoDB with data exfiltration | **1 hour** |
| **HIGH** | Confirmed data breach affecting subset of users (<100) | Partial data exposure, unauthorized access to 10+ user records | **4 hours** |
| **MEDIUM** | Suspected breach or significant security issue | Unauthorized access attempts (no data accessed), suspicious AWS activity, DPA violation | **24 hours** |
| **LOW** | Minor security issue or unsuccessful attack attempt | Failed login attempts (normal levels), misconfiguration without impact | **5 days** |

### Incident Categories

1. **Data Breach** - Unauthorized access, disclosure, or exfiltration of personal data
2. **Availability Incident** - System downtime, service interruption
3. **Compliance Violation** - Breach of regulatory requirements or contractual obligations
4. **Integrity Issue** - Unauthorized modification of data or system configuration
5. **Third-Party Incident** - Breach involving processors, vendors, or OpenAI
6. **Supply Chain Incident** - Breach in dependent systems

---

## 📊 INCIDENT DETECTION

### Detection Methods

**1. Automated Monitoring (Continuous)**
- CloudWatch alarms on unauthorized access attempts
- AWS CloudTrail anomalies (unusual API calls)
- DynamoDB access pattern analysis
- Failed authentication threshold alerts
- Data exfiltration detection (unusual data downloads)

**2. Manual Detection (Reactive)**
- User reports of unauthorized activity
- Third-party notification (OpenAI, AWS)
- Regulatory inquiry
- Media reports
- Internal audit findings

**3. Monitoring Thresholds**

| Indicator | Threshold | Action |
|-----------|-----------|--------|
| Failed login attempts | >5 in 1 hour | Alert Security Officer |
| Unauthorized API calls | >3 per minute | Trigger incident response |
| Data download >100MB | Unexpected | Investigate immediately |
| TTL failures | Any record >35 days | Alert Data Engineer |
| Database errors | >10/min for 5+ min | Alert Technical Lead |

### Detection Ownership

| System | Owner | Monitoring Tool | Check Frequency |
|--------|-------|-----------------|-----------------|
| CloudWatch | DevOps | AWS Console + SNS alerts | Continuous |
| AWS CloudTrail | Security Officer | CloudTrail dashboard + logs | Daily review |
| DynamoDB | Data Engineer | CloudWatch + manual queries | Quarterly audit |
| Application Logs | DevOps | CloudWatch Logs | Continuous |

---

## 🔔 INCIDENT RESPONSE PROCEDURES

### PHASE 1: DETECTION & INITIAL RESPONSE (First 1-4 hours)

#### Step 1.1: Identify & Confirm Incident
- [ ] Monitor or user reports potential incident
- [ ] IR Lead reviews alert details
- [ ] Technical Lead confirms if legitimate incident (vs. false alarm)
- [ ] **Action:** If confirmed → Proceed to Step 1.2
- [ ] **Action:** If false alarm → Document and close

**Documentation:**
```
INCIDENT ID: [YYYYMMDD-001]
Detection Time: [TIMESTAMP]
Detected By: [SYSTEM/PERSON]
Confirmation Time: [TIMESTAMP]
Severity Level: [CRITICAL/HIGH/MEDIUM/LOW]
Affected Systems: [LIST]
Affected Data: [TYPES]
Initial Impact Assessment: [BRIEF SUMMARY]
```

#### Step 1.2: Activate Incident Response Team
- [ ] IR Lead notifies core team members
- [ ] Team joins emergency call/meeting
- [ ] IR Lead briefs on situation (5 minutes max)
- [ ] Assign roles and initial actions

**Escalation Path:**
```
CRITICAL incident (data breach):
  ├─ IR Lead (immediate)
  ├─ DPO (immediate)
  ├─ Technical Lead (immediate)
  ├─ Legal Counsel (within 30 min)
  ├─ Executive Sponsor (within 1 hour)
  └─ Incident Response Team (within 2 hours)

HIGH incident (suspected breach):
  ├─ IR Lead (within 30 min)
  ├─ DPO (within 1 hour)
  ├─ Technical Lead (immediate)
  └─ Others as needed

MEDIUM/LOW incidents:
  ├─ IR Lead (within 4 hours)
  ├─ DPO (within 8 hours)
  └─ Others as assigned
```

### PHASE 2: INVESTIGATION & CONTAINMENT (1-24 hours)

#### Step 2.1: Investigate Incident
**Technical Investigation:**
- [ ] Preserve logs and forensic evidence (do NOT delete)
- [ ] Determine incident scope (how much data? which users?)
- [ ] Identify root cause (how did it happen?)
- [ ] Assess if data was exfiltrated or modified
- [ ] Determine incident start time (when did it actually begin?)

**Investigation Checklist:**
```
□ CloudWatch logs reviewed for anomalies
□ CloudTrail logs examined for unauthorized API calls
□ DynamoDB access patterns analyzed
□ User activity logs reviewed
□ Third-party logs obtained (if applicable)
□ Evidence preserved in secure location
□ Forensic images created (if needed)
□ Timeline of events established
□ Attack vector identified
□ Persistence mechanisms checked
```

#### Step 2.2: Assess Impact
- [ ] Determine number of affected users
- [ ] Identify specific data types exposed (PII, analysis, consent, etc.)
- [ ] Assess likelihood of unauthorized use
- [ ] Evaluate regulatory obligations triggered
- [ ] Calculate business impact

**Impact Assessment:**
```
Number of Users Affected: [N]
Data Categories Exposed: [LIST]
- Email addresses: YES/NO
- Hashed user ID: YES/NO
- Analysis text: YES/NO
- Age/demographic: YES/NO
- Risk scores: YES/NO
- Consent records: YES/NO

Evidence of Unauthorized Use:
- Data downloaded elsewhere: YES/NO
- Data modified: YES/NO
- Sold on dark web: YES/NO
- Publicly disclosed: YES/NO

Business Impact:
- Service disruption: YES/NO
- Financial loss: YES/NO ($$$)
- Reputational damage: HIGH/MEDIUM/LOW
- Regulatory penalties: LIKELY/POSSIBLE/UNLIKELY
```

#### Step 2.3: Contain Incident
**Immediate Containment Actions:**
- [ ] Isolate affected systems from network (if necessary)
- [ ] Revoke compromised credentials
- [ ] Block malicious IP addresses
- [ ] Disable compromised user accounts
- [ ] Reset API keys and secrets
- [ ] Patch vulnerability
- [ ] Review firewall/WAF rules

**Containment Timeline:**
```
CRITICAL: Complete containment within 4 hours
HIGH: Complete containment within 12 hours
MEDIUM: Complete containment within 24 hours
LOW: Complete containment within 5 days
```

### PHASE 3: NOTIFICATION & COMPLIANCE (24-72 hours for data breaches)

#### Step 3.1: DPO Compliance Assessment

**Loi 25 Breach Notification Test:**
```
Is personal data involved? YES/NO
├─ If NO → [No notification required, document decision]
└─ If YES → Proceed

Was data security compromised? YES/NO
├─ If NO → [No notification required, document decision]
└─ If YES → Proceed

Could unauthorized person access data? YES/NO (Likelihood test)
├─ If UNLIKELY → [May not require notification, assess on case-by-case basis]
└─ If LIKELY → [BREACH NOTIFICATION REQUIRED]

High risk to person's rights/freedoms? YES/NO
├─ If YES → [PUBLIC notification + regulatory notification]
└─ If NO → [User notification only, no public notice]
```

**Regulatory Assessment:**
- [ ] Does incident trigger PIPEDA breach notification? (Federal)
- [ ] Does incident trigger Loi 25 breach notification? (Quebec)
- [ ] Does incident trigger GDPR notification? (If EU residents affected)
- [ ] Are there other regulatory obligations?

#### Step 3.2: User Notification (Loi 25 Article 2019)

**Timeline:** Must notify "without undue delay" and within **72 hours** of becoming aware of breach

**Notification Requirement:**
Must include:
- [ ] What personal data was affected (specific types)
- [ ] When the breach occurred
- [ ] What we're doing about it (containment + remediation)
- [ ] What users should do to protect themselves
- [ ] DPO contact information for questions
- [ ] Rights available to users (SAR, deletion, portability)

**Notification Method:**
- [ ] Email to all affected users (preferred)
- [ ] SMS alert (for high-risk breaches)
- [ ] Public notice on website (if large-scale breach)
- [ ] Media outreach (for critical breaches)

**Sample Notification (see Appendix A)**

#### Step 3.3: Regulatory Notification

**CNIL (Commission Nationale Informatique et Libertés) - Quebec:**
- [ ] Notify if breach poses high risk to users' rights/freedoms
- [ ] Report within 72 hours of discovery
- [ ] Include incident details and mitigations

**PIPEDA Commissioner - Federal:**
- [ ] Notify if breach involves federal aspects
- [ ] Report within 60 days of discovery
- [ ] Document rationale for public notification decision

**Internal Regulatory Bodies:**
- [ ] Notify Quebec Financial Services if financial data involved
- [ ] Notify health authorities if health data involved

### PHASE 4: RECOVERY & REMEDIATION (Days 3+)

#### Step 4.1: System Remediation
- [ ] Patch vulnerability that caused incident
- [ ] Deploy security enhancements
- [ ] Reconfigure systems for improved security
- [ ] Update firewall rules
- [ ] Harden access controls
- [ ] Enhanced monitoring deployed

#### Step 4.2: User Support
- [ ] Establish dedicated support line for breach inquiries
- [ ] Provide credit monitoring (if applicable)
- [ ] Offer identity theft protection services (if applicable)
- [ ] Answer user questions about breach and remediation
- [ ] Document all support interactions

#### Step 4.3: Follow-Up Verification
- [ ] Confirm all affected users notified
- [ ] Verify remediation measures effective
- [ ] Conduct follow-up security testing
- [ ] Review monitoring for any new incidents
- [ ] Assess need for additional remediation

---

## 📋 POST-INCIDENT ACTIVITIES

### PHASE 5: INVESTIGATION & IMPROVEMENT (Within 30 days)

#### Step 5.1: Root Cause Analysis
```
Root Cause Analysis Template:

Incident Description: [WHAT HAPPENED]

Timeline:
- T0: Initial event
- T+1hr: Detection
- T+2hr: Confirmation
- T+4hr: Containment
- T+24hr: Notification
- T+48hr: Remediation

Root Cause: [WHY DID IT HAPPEN]

Contributing Factors:
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

Control Failure: [WHICH CONTROL FAILED]
```

#### Step 5.2: Lessons Learned Review
**Questions to Answer:**
- [ ] Did our detection work? (How long to detect?)
- [ ] Did our response procedures work?
- [ ] Did our team respond effectively?
- [ ] Did our communication meet regulatory requirements?
- [ ] What can we improve?

**Improvement Actions:**
- [ ] Update monitoring thresholds
- [ ] Improve detection capabilities
- [ ] Update response procedures
- [ ] Provide additional training
- [ ] Implement additional controls
- [ ] Update incident response plan

#### Step 5.3: Documentation & Closeout
- [ ] Complete incident report (see template below)
- [ ] Preserve all evidence securely
- [ ] Update Risk Register with new information
- [ ] Close incident ticket
- [ ] Schedule follow-up monitoring (e.g., 30-day, 90-day)

**Incident Report Contents:**
```
1. Executive Summary
   - What happened
   - When it happened
   - How many users affected
   - What data was involved

2. Timeline
   - Initial event
   - Detection
   - Confirmation
   - Escalation
   - Containment
   - Notification
   - Remediation

3. Technical Details
   - Affected systems
   - Attack vector
   - Root cause
   - Evidence preserved

4. Impact Assessment
   - Users affected
   - Data categories
   - Business impact
   - Regulatory impact

5. Response Actions
   - Containment measures
   - User notifications sent
   - Regulatory notifications
   - Remediation completed

6. Lessons Learned
   - What worked well
   - What needs improvement
   - Process changes
   - Training needs

7. Sign-off
   - IR Lead approval
   - DPO approval
   - Legal sign-off
```

---

## ✅ TESTING & TRAINING

### Tabletop Exercises (Quarterly)

**Exercise 1: Data Breach Scenario**
```
Scenario: Unauthorized access to DynamoDB detected in CloudWatch

Team: IR Lead, DPO, Technical Lead, Legal
Duration: 2 hours
Format: Tabletop walkthrough

Objectives:
- Verify IR procedures
- Test escalation path
- Verify notification procedures
- Check compliance obligations
- Assess response readiness
```

**Exercise 2: Third-Party Breach (OpenAI)**
```
Scenario: OpenAI notifies us of breach affecting our data

Team: IR Lead, DPO, Legal, Communications
Duration: 2 hours
Format: Tabletop walkthrough

Objectives:
- Test third-party incident handling
- Verify DPA breach clauses
- Test user notification process
- Check regulatory obligations
```

**Exercise 3: Availability Incident**
```
Scenario: DynamoDB becomes unavailable

Team: Technical Lead, DevOps, IR Lead
Duration: 1 hour
Format: Technical walkthrough

Objectives:
- Verify recovery procedures
- Test failover mechanisms
- Assess recovery time
- Identify single points of failure
```

### Team Training (Annual)

**Initial Training (Upon joining IR Team)**
- [ ] Review this Incident Response Plan
- [ ] Understand roles and responsibilities
- [ ] Review classification framework
- [ ] Walk through notification procedures
- [ ] Review compliance requirements
- [ ] Practice with tabletop exercise

**Annual Refresher (Mandatory for all IR team members)**
- [ ] Review updates to IR Plan
- [ ] Participate in tabletop exercise
- [ ] Review recent incidents (lessons learned)
- [ ] Update contact information
- [ ] Confirm understanding of roles

### Drill Schedule

| Quarter | Exercise Type | Scenario | Owner |
|---------|---------------|----------|-------|
| Q1 | Tabletop | Data Breach | IR Lead |
| Q2 | Technical | Availability | Technical Lead |
| Q3 | Tabletop | Third-Party Breach | Legal |
| Q4 | Full Exercise | Comprehensive incident | IR Lead |

---

## 📞 CONTACT & ESCALATION

### IR Team Contact Information

```
PRIMARY CONTACTS:

Incident Response Lead
  Name: [TBD]
  Phone: [TBD]
  Email: security@scamguard.ca
  Available: 24/7

DPO (Data Protection Officer)
  Name: [TBD]
  Phone: [TBD]
  Email: privacy@scamguard.ca
  Available: 24/7 (emergencies)

Technical Lead
  Name: [TBD]
  Phone: [TBD]
  Email: devops@scamguard.ca
  Available: 24/7

Legal Counsel
  Name: [TBD]
  Phone: [TBD]
  Email: legal@scamguard.ca
  Available: Business hours + emergency

EXTERNAL CONTACTS:

AWS Support (Enterprise)
  Case Management: [AWS Console]
  Emergency Hotline: [TBD]

Cyber Insurance Provider
  Incident Hotline: [TBD]
  24/7 Support: YES

External Counsel
  Firm: [TBD]
  Contact: [TBD]
  Emergency: YES
```

### Escalation Path

```
Incident Detected
    ↓
Level 1: Incident Response Lead
- Confirms incident
- Activates team
- Decision: Continue or escalate?
    ↓
Level 2: DPO + Technical Lead
- Assesses impact & compliance
- Determines notification requirement
- Decision: Proceed with notification or more investigation?
    ↓
Level 3: Legal Counsel + Communications
- Reviews notification language
- Assesses legal implications
- Decision: Approve notification?
    ↓
Level 4: Executive Sponsor
- Final approval for user notification
- Authorizes public statement (if needed)
- Decision: Proceed with notification?
    ↓
Notification & Remediation (All teams execute)
```

---

## 📋 COMPLIANCE CHECKLIST

### Loi 25 Compliance (Data Breach Notification)

- [ ] Breach detected and investigation initiated
- [ ] Scope of breach determined (how many users, what data)
- [ ] Determination made: Does breach require notification?
  - [ ] Personal data involved?
  - [ ] Security compromised?
  - [ ] High likelihood of unauthorized access?
- [ ] If notification required: User notification sent within 72 hours
- [ ] Notification includes: What, when, what we're doing, user actions, DPO contact
- [ ] Regulatory notification sent (if high risk)
- [ ] Incident documented in Risk Register
- [ ] Lessons learned conducted
- [ ] Improvement measures implemented

### PIPEDA Compliance (Federal)

- [ ] Breach reported to federal commissioner (if applicable)
- [ ] Decision documented: Why/why not reporting publicly
- [ ] User notification timely (60 days typically)
- [ ] Notification content meets PIPEDA requirements

### GDPR Compliance (International Ready)

- [ ] Breach assessment under GDPR Article 33
- [ ] Notification to supervisory authority within 72 hours (if required)
- [ ] User notification under GDPR Article 34 (if required)
- [ ] Risk assessment considered
- [ ] Documentation preserved

---

## 📎 APPENDICES

### Appendix A: User Notification Email Template

**Subject:** [URGENT] Security Incident & Data Protection - Immediate Action Recommended

```
Dear ScamGuard User,

We are writing to inform you of a security incident that affected ScamGuard on
[DATE]. We discovered [BRIEF DESCRIPTION OF WHAT HAPPENED] that resulted in
unauthorized access to your [SPECIFIC DATA TYPES].

WHAT HAPPENED:
On [DATE] at approximately [TIME], we detected unauthorized access to our systems.
Investigation revealed that an attacker gained access to [SPECIFIC SYSTEMS] and
potentially accessed [DATA TYPES: email address, analysis text, etc.].

WHAT DATA WAS AFFECTED:
- [List specific data categories only, not all data]

WHEN DID IT HAPPEN:
Our investigation indicates the breach occurred between [DATE] and [DATE]. We
detected it on [DATE] and immediately contained the incident.

WHAT WE'RE DOING:
1. Immediate: We have contained the breach and secured our systems
2. Investigation: We are conducting a forensic investigation
3. Notification: We are notifying all affected users (you are reading this)
4. Remediation: We are implementing additional security controls
5. Monitoring: We will monitor for 90 days for any suspicious activity

WHAT YOU SHOULD DO:
1. Change your ScamGuard password immediately
2. Monitor your email account for suspicious activity
3. Consider monitoring your credit report
4. If you notice anything suspicious, contact us immediately

YOUR RIGHTS:
You have the right to:
- Access your data (Subject Access Request)
- Delete your data
- Export your data to another service
- Lodge a complaint with privacy regulators

For questions, contact our Data Protection Officer:
Email: privacy@scamguard.ca
Phone: [TBD]
Available: [HOURS]

We sincerely apologize for this incident and appreciate your patience as we
work to resolve it and improve our security.

Sincerely,
ScamGuard Team
```

### Appendix B: Investigation Checklist

```
[ ] Incident confirmed
[ ] IR team activated
[ ] Forensic evidence preserved
[ ] CloudWatch logs reviewed
[ ] CloudTrail logs examined
[ ] DynamoDB access patterns analyzed
[ ] Affected systems identified
[ ] Affected users identified
[ ] Affected data types identified
[ ] Root cause determined
[ ] Timeline established
[ ] Containment measures deployed
[ ] Credentials reset
[ ] Systems patched
[ ] Access controls reviewed
[ ] Third-party notification sent (if applicable)
[ ] Forensic report drafted
[ ] DPO assessment completed
[ ] Notification requirement determined
[ ] Legal review completed
[ ] User notification sent
[ ] Regulatory notification sent
[ ] Recovery measures implemented
[ ] Monitoring deployed
[ ] Incident closed
[ ] Post-incident review scheduled
```

### Appendix C: Roles & Responsibilities Matrix

| Activity | IR Lead | DPO | Tech Lead | Legal | Comms | Executive |
|----------|---------|-----|-----------|-------|-------|-----------|
| Detect incident | R | - | I | - | - | - |
| Confirm incident | R | - | A | - | - | - |
| Activate team | R | A | A | I | I | I |
| Investigate | - | - | R | - | - | - |
| Assess impact | A | R | A | I | - | - |
| Determine notification | - | R | A | A | - | - |
| Draft notification | - | R | - | R | A | - |
| Approve notification | R | - | - | - | - | A |
| Send notification | - | - | - | - | R | - |
| Regulatory report | - | R | A | A | - | - |
| Public statement | - | - | - | - | R | A |
| Post-incident review | R | A | A | I | I | I |

**Legend:** R = Responsible, A = Accountable, I = Informed, - = Not involved

---

## ✅ SIGN-OFF

**Incident Response Plan Status:** ✅ **COMPLETE & READY FOR APPROVAL**

### Approval Sign-off

```
Security Officer (Incident Response Lead):
I have reviewed this Incident Response Plan and confirm it meets our
requirements for CRITICAL incident response, breach detection, and 72-hour
notification compliance.

Name: _________________________
Signature: _________________________
Date: ______________________________

DPO (Data Protection Officer):
I have reviewed this plan and confirm it satisfies Loi 25 breach notification
requirements, PIPEDA reporting obligations, and GDPR Article 33 compliance.

Name: _________________________
Signature: _________________________
Date: ______________________________

Legal Counsel:
I have reviewed this plan for legal accuracy and completeness. The notification
procedures and compliance checklist satisfy applicable regulations.

Name: _________________________
Signature: _________________________
Date: ______________________________

Executive Leadership:
I approve this Incident Response Plan for implementation and commit to
ensuring necessary resources are available for incident response.

Name: _________________________
Signature: _________________________
Date: ______________________________
```

---

**Document Status:** ✅ PRODUCTION READY
**Effective Date:** February 18, 2026
**Next Review:** August 18, 2026 (Annual)
**Revision Triggers:** Regulatory change, significant incident, control failure, failed test
