# Data Processing Agreement - OpenAI

**Document Type:** Legal - Data Processing Agreement
**Between:** ScamGuard Inc. (Data Controller) and OpenAI L.L.C. (Data Processor)
**Effective Date:** February 18, 2026
**Version:** 1.0
**Governing Law:** Quebec (Loi 25) & Canadian Law

---

## 📋 PREAMBLE

WHEREAS, ScamGuard Inc. ("**Controller**") operates a scam detection service for Canadian seniors;

WHEREAS, OpenAI L.L.C. ("**Processor**") provides Large Language Model (LLM) services via the OpenAI API;

WHEREAS, the Controller may transmit personal data to the Processor for analysis purposes;

WHEREAS, this agreement establishes the legal framework for personal data processing in compliance with Loi 25 (Quebec GDPR), PIPEDA, and GDPR;

NOW THEREFORE, the parties agree as follows:

---

## 1. DEFINITIONS

**"Personal Data"** means any information relating to an identified or identifiable natural person.

**"Processing"** means any operation performed on personal data (collection, recording, use, storage, transmission, etc.).

**"Data Subject"** means the individual to whom personal data relates (ScamGuard user).

**"Incident"** means any confirmed or suspected unauthorized access to or disclosure of personal data.

**"Sub-Processor"** means any third party engaged by Processor to process personal data on Processor's behalf.

**"Loi 25"** means Quebec's Law 25 (2021, c.25) - personal information protection law for the private sector.

**"GDPR"** means EU General Data Protection Regulation 2016/679.

---

## 2. SCOPE & DATA PROCESSING DETAILS

### 2.1 Categories of Personal Data

The Processor shall process only the following categories of personal data:

| Category | Description | Examples | Sensitivity |
|----------|---|---|---|
| **User Input Text** | Scam descriptions provided by users | "I received a suspicious call about..." | MEDIUM |
| **Analysis Results** | AI-generated risk assessment | Risk score, red flags | LOW |
| **Anonymized ID** | User identifier (hashed, not reversible) | SHA-256(user_id + salt) | LOW |
| **Interaction Metadata** | Timestamps, session info | Request timestamp, session ID | LOW |

**IMPORTANT:** The following shall NEVER be transmitted to Processor:
- [ ] User email address
- [ ] User age or date of birth
- [ ] User's actual name or contact info
- [ ] Banking information
- [ ] Government ID numbers
- [ ] Medical data
- [ ] Any reverse-identifiable information

### 2.2 Types of Processing

The Processor shall perform the following types of processing:

| Type | Purpose | Duration | Frequency |
|------|---------|----------|-----------|
| **Analysis** | Generate risk assessment using LLM | Per-request | Real-time (user requests) |
| **Temporary Storage** | Store input/output during processing | 30 seconds | Each request |
| **Logging** | Record API usage for billing | 30 days | Continuous |

**Prohibited Processing:**
- [ ] Training data use (see Section 4.2)
- [ ] Data retention beyond 30 days
- [ ] Secondary use or purpose modification
- [ ] Data combination with other sources
- [ ] Profile building or behavioral analysis

### 2.3 Data Subjects & Geographic Scope

**Data Subjects:** Canadian seniors (18+, primarily 55+)

**Geographic Scope:**
- Data controllers: Quebec, Canada
- Data subjects: Canada (primarily Quebec, Ontario)
- Processing location: OpenAI infrastructure (US-based)
- Standard Contractual Clauses apply for data transfer to US (see Section 8)

---

## 3. PROCESSOR OBLIGATIONS

### 3.1 Data Processing Authority

The Processor agrees:

- [ ] To process personal data only on documented instructions from the Controller
- [ ] To process data only for the purposes specified in this agreement
- [ ] To NOT process data for any other purpose without Controller's prior written consent
- [ ] To NOT transfer data to third parties without Controller approval
- [ ] To allow Controller to audit processing activities

**Instructions Limitation:**
- [ ] All processing occurs via OpenAI API integration
- [ ] No additional instructions required (standardized API)
- [ ] Controller retains right to suspend/terminate processing
- [ ] Changes to processing require Controller written approval

### 3.2 Confidentiality

The Processor agrees:

- [ ] Personnel processing data shall be bound by confidentiality obligations
- [ ] Confidentiality continues after employment termination
- [ ] Personnel with access is limited to operational staff only
- [ ] Personnel shall be trained on data protection obligations
- [ ] No disclosure of data except as required by law

**Personnel Access:**
- [ ] OpenAI technical staff: Limited to API operational maintenance
- [ ] OpenAI support staff: Only if user initiates support request
- [ ] OpenAI executives: NO direct access to user data
- [ ] OpenAI researchers: NO access to user data (see Section 4.2)

### 3.3 Security Measures

The Processor shall implement and maintain security controls including:

| Control | Implementation | Verification |
|---------|---|---|
| **Encryption in Transit** | TLS 1.2+ for all data transmission | OpenAI SSL/TLS certificate |
| **Encryption at Rest** | AES-256 encryption of data in storage | OpenAI SOC 2 compliance |
| **Access Control** | Multi-factor authentication, role-based access | OpenAI internal audit |
| **Network Security** | Firewalls, intrusion detection | OpenAI network security |
| **Incident Response** | 24/7 monitoring, breach procedures | OpenAI IR Plan |
| **Business Continuity** | Backup and recovery procedures | Documented in OpenAI BCP |
| **Vendor Management** | Sub-processor screening | OpenAI vendor security |

**Security Standards:**
- [ ] Processor maintains SOC 2 Type II certification (current audit)
- [ ] Processor complies with NIST Cybersecurity Framework
- [ ] Processor performs annual penetration testing
- [ ] Processor maintains cyber liability insurance ($50M+ coverage required)

**Controller Verification Rights:**
- [ ] Controller may request security audit results (annually minimum)
- [ ] Controller may conduct on-site security assessment (with notice)
- [ ] Controller may request proof of compliance (certifications, attestations)
- [ ] Processor shall respond to security requests within 30 days

### 3.4 Data Subject Rights Support

The Processor shall support Controller in fulfilling data subject rights:

| Right | Processor Obligation |
|------|---|
| **Access (SAR)** | Provide data processed for user within 15 days of Controller request |
| **Deletion** | Delete user data within 15 days of Controller request |
| **Portability** | Provide data in structured, machine-readable format within 15 days |
| **Correction** | Not applicable (Processor doesn't modify user data) |
| **Objection** | Not applicable (no profiling or automated decisions) |

**Process:**
1. Controller receives data subject request
2. Controller forwards request to Processor (specifying user ID)
3. Processor locates and retrieves data within 15 days
4. Processor returns data to Controller in agreed format
5. Controller responds to data subject

**Timeline:** Processor shall complete within 15 days; Controller shall respond to data subject within 30 days total (Loi 25 requirement).

### 3.5 Sub-Processors

The Processor shall:

- [ ] NOT engage sub-processors without Controller's prior written consent
- [ ] Provide Controller with list of current sub-processors
- [ ] Notify Controller of any sub-processor changes (30 days notice)
- [ ] Ensure sub-processors are bound by equivalent DPA terms
- [ ] Remain liable to Controller for sub-processor performance

**Current Sub-Processors:**
- [ ] OpenAI infrastructure (AWS): Hosting and storage
- [ ] Stripe/Zuora: Payment processing (for billing only, no personal data)
- [ ] Others: Controller shall be notified

---

## 4. PROHIBITED PROCESSING & USE RESTRICTIONS

### 4.1 Training Data Prohibition

**OpenAI explicitly agrees:**

- [ ] ScamGuard user data shall NOT be used to train or improve OpenAI models
- [ ] User data shall NOT be used for model development or fine-tuning
- [ ] User data shall NOT be retained for model training purposes
- [ ] User data shall NOT be combined with other data for training
- [ ] User data shall NOT be used for performance benchmarking

**Verification:**
- [ ] OpenAI shall provide attestation that training is prohibited (Section 10.3)
- [ ] OpenAI terms of service override any default language
- [ ] This clause takes priority over any other OpenAI terms

**Enforcement:**
- [ ] Breach of this clause triggers immediate termination right
- [ ] Controller may terminate agreement without notice if training occurs
- [ ] Controller may seek damages under Loi 25 Article 2046

### 4.2 Limitation on Use

The Processor shall:

- [ ] Use data ONLY for the specified purpose: LLM-based scam risk analysis
- [ ] NOT use data for:
  - [ ] Training or model improvement
  - [ ] Research or analytics
  - [ ] Profiling or behavioral analysis
  - [ ] Marketing or advertising
  - [ ] Competitor intelligence
  - [ ] Secondary uses not specified here

---

## 5. DATA RETENTION & DELETION

### 5.1 Retention Period

Personal data shall be retained for **MAXIMUM 30 DAYS**:

- [ ] User input: Retained for 30 days then automatically deleted
- [ ] Analysis results: Retained for 30 days then automatically deleted
- [ ] Metadata: Retained for 30 days then automatically deleted
- [ ] Logs: Retained for 30 days then automatically deleted

**After 30 days:** All personal data automatically deleted from Processor systems.

### 5.2 Deletion Procedures

Upon request from Controller, Processor shall:

- [ ] Delete all personal data relating to specified user within 15 days
- [ ] Provide written confirmation of deletion within 15 days
- [ ] Verify deletion was complete (not just marked for deletion)
- [ ] Ensure deletion from all systems (including backups if possible)

**Acceptable Deletion Methods:**
- [ ] Cryptographic erasure (encryption keys destroyed)
- [ ] Secure overwrite (data overwritten with random data)
- [ ] Physical destruction (if storage media destroyed)

**NOT Acceptable:**
- [ ] Data marked for deletion but retained
- [ ] Data compressed/archived instead of deleted
- [ ] Data retained in backups indefinitely

---

## 6. INCIDENT NOTIFICATION

### 6.1 Incident Detection & Notification

Processor shall:

- [ ] Detect incidents through monitoring systems (24/7)
- [ ] Confirm incident is genuine (not false alarm)
- [ ] Notify Controller without undue delay (within 24 hours)
- [ ] Provide detailed incident notice including:
  - [ ] What happened (incident description)
  - [ ] When discovered (date/time)
  - [ ] What data affected (categories, number of users)
  - [ ] Root cause (preliminary assessment)
  - [ ] Remediation actions taken
  - [ ] Contact person for follow-up

**Notification Method:**
- [ ] Email to privacy@scamguard.ca (primary)
- [ ] Phone call to IR Lead if critical (within 4 hours)
- [ ] Escalation to Executive if high-risk breach

### 6.2 Incident Investigation Support

Processor shall:

- [ ] Preserve forensic evidence (do not delete)
- [ ] Conduct preliminary investigation within 24 hours
- [ ] Provide detailed incident report within 72 hours
- [ ] Answer Controller questions about incident
- [ ] Cooperate with Controller's forensic investigation
- [ ] Provide access to logs and evidence (if legally permissible)

### 6.3 User Notification Support

If incident requires user notification, Processor shall:

- [ ] Provide detailed data breach details to Controller within 48 hours
- [ ] Confirm number of users affected
- [ ] Confirm data categories exposed
- [ ] Assess risk to users
- [ ] Support Controller's notification process

---

## 7. AUDIT & COMPLIANCE

### 7.1 Controller Audit Rights

Controller reserves the right to:

- [ ] Request security audit results (annually minimum)
- [ ] Request SOC 2 attestation reports
- [ ] Request proof of compliance (certifications)
- [ ] Conduct on-site security assessment (with 30 days notice)
- [ ] Interview Processor personnel regarding security (with notice)
- [ ] Review incident logs and investigation reports

**Timeline:**
- [ ] Processor shall respond to reasonable requests within 30 days
- [ ] Processor shall provide audit results at no additional cost
- [ ] On-site assessments shall occur during business hours
- [ ] Processor may redact confidential business information

### 7.2 Compliance Verification

Processor shall provide Controller with:

| Document | Frequency | Status |
|----------|-----------|--------|
| SOC 2 Type II Report | Annual | ✅ Required |
| ISO 27001 Certification | Annual | ✅ Required |
| Penetration Test Results | Annual | ✅ Required |
| Security Incident Log | Quarterly | ✅ Required |
| Sub-processor List | Annually + changes | ✅ Required |
| Data Processing Inventory | Upon request | ✅ Required |

### 7.3 Compliance with Laws

Processor represents that:

- [ ] It is in compliance with all applicable data protection laws
- [ ] It has implemented appropriate safeguards per Loi 25, PIPEDA, GDPR
- [ ] It maintains necessary security certifications and insurance
- [ ] It has not been subject to material security breaches
- [ ] It has not been subject to regulatory enforcement actions related to data

---

## 8. DATA TRANSFERS & STANDARD CONTRACTUAL CLAUSES

### 8.1 Cross-Border Data Transfer

**Issue:** OpenAI infrastructure is located in the United States. Data transfers to the US require legal mechanisms.

**Legal Basis for Transfer:**
- [ ] Standard Contractual Clauses (EU Commission Decision 2021/914)
- [ ] Canadian adequacy determination (PIPEDA applies)
- [ ] Loi 25 Article 2019 (transfer restrictions)

### 8.2 Binding Corporate Rules

If Processor uses Standard Contractual Clauses:

- [ ] Processor shall execute SCCs with Controller
- [ ] Processor shall ensure all sub-processors execute equivalent SCCs
- [ ] Processor shall handle adequacy concerns per Schrems II decision
- [ ] Processor shall implement supplementary security measures if required

**Current Status:**
- [ ] OpenAI Standard Contractual Clauses: ✅ In place (per OpenAI Data Processing Terms)
- [ ] Sub-processor SCCs: ✅ Verified (AWS, payment processors)
- [ ] Supplementary measures: ✅ Encryption requirements met

### 8.3 US Data Protection Considerations

Processor acknowledges:

- [ ] US government may compel disclosure of data under FISA, Executive Order
- [ ] Data may be accessible by US law enforcement
- [ ] Controller has agreed to this risk given business necessity
- [ ] Processor shall challenge legal requests where possible
- [ ] Processor shall notify Controller of government data requests (if legally permissible)

**Processor shall:**
- [ ] Minimize data retention in US (30-day deletion)
- [ ] Encrypt data to limit US government accessibility
- [ ] Notify Controller of legal requests (if not prohibited)

---

## 9. LIABILITY & INDEMNIFICATION

### 9.1 Processor Liability

Processor shall be liable for:

- [ ] Breach of data security obligations
- [ ] Unauthorized processing of personal data
- [ ] Failure to support data subject rights
- [ ] Incident notification failures
- [ ] Sub-processor non-compliance

**Liability Limitation:**
- [ ] Processor liability capped at 12 months of fees paid (or $100,000 minimum)
- [ ] Indirect damages and lost profits excluded
- [ ] Cap does not apply to: data breaches, confidentiality breaches, gross negligence

### 9.2 Indemnification

Processor shall indemnify Controller from:

- [ ] Claims arising from Processor's processing of data
- [ ] Claims from Processor's breach of obligations
- [ ] Claims from Processor's violation of laws
- [ ] Claims from sub-processor non-compliance

**Indemnification excludes:**
- [ ] Claims arising from Controller's use of Processor services
- [ ] Claims from Controller's instructions
- [ ] Claims from third-party services (not Processor's responsibility)

### 9.3 Insurance Requirements

Processor shall maintain:

- [ ] Cyber liability insurance: Minimum $50 million coverage
- [ ] Errors & omissions insurance: Minimum $10 million coverage
- [ ] Professional liability insurance: Minimum $10 million coverage
- [ ] Certificates of insurance provided annually to Controller

---

## 10. TERM, TERMINATION & REMEDIES

### 10.1 Term

**Effective Date:** Upon execution of this agreement
**Initial Term:** 2 years (coinciding with business relationship)
**Auto-Renewal:** Month-to-month unless terminated
**Termination Notice:** Either party may terminate with 30 days written notice

### 10.2 Termination Rights

Controller may terminate immediately (without notice) if:

- [ ] Processor breaches Sections 4.1 (training prohibition)
- [ ] Processor breach of security obligations causing incident
- [ ] Processor fails to respond to audit requests
- [ ] Processor loses required security certifications

### 10.3 Data Return/Deletion Upon Termination

Upon termination:

- [ ] Processor shall delete all personal data within 30 days
- [ ] Processor shall provide written deletion confirmation
- [ ] Controller may request data export before deletion (if requested within 30 days)
- [ ] Processor shall retain no copies or backups

**Exception:** Processor may retain data if legally required (e.g., litigation hold) and shall notify Controller.

---

## 11. CONFIDENTIALITY OF AGREEMENT

This agreement is **CONFIDENTIAL** and shall not be disclosed publicly without consent.

**Exceptions:**
- [ ] Disclosure to legal counsel and advisors
- [ ] Disclosure to regulatory authorities (upon request)
- [ ] Disclosure in litigation proceedings
- [ ] Disclosure permitted by law

---

## 12. GOVERNING LAW & DISPUTE RESOLUTION

### 12.1 Governing Law

This agreement shall be governed by:
- **Primary:** Loi 25 (Quebec personal information protection law)
- **Supplementary:** Canadian common law (Quebec civil law where applicable)
- **Reference:** GDPR and PIPEDA principles (to extent compatible)

### 12.2 Jurisdiction

**Exclusive jurisdiction:** Quebec District Courts (Montreal)

**Dispute Resolution Process:**
1. Good faith negotiation (15 days)
2. Escalation to executives (15 days)
3. Mediation (if parties agree)
4. Litigation (as last resort)

---

## 13. GENERAL PROVISIONS

### 13.1 Entire Agreement

This agreement constitutes the entire agreement between parties regarding Processor's handling of personal data. It supersedes all prior understandings and agreements regarding data processing.

**Note:** This DPA supplements OpenAI's Terms of Service. Where conflicts exist, this DPA prevails on data protection matters.

### 13.2 Amendments

Amendments require written agreement by both parties. Neither party may unilaterally modify terms.

### 13.3 Severability

If any provision is found invalid or unenforceable, remaining provisions remain in effect.

### 13.4 Notices

All notices shall be sent to:

**For Controller (ScamGuard):**
```
ScamGuard Inc.
Attention: Data Protection Officer
Email: privacy@scamguard.ca
Mail: [Montreal address - to be added]
```

**For Processor (OpenAI):**
```
OpenAI L.L.C.
Attention: Chief Privacy Officer
Email: dpa@openai.com
Mail: 3180 18th Street, Suite 200, San Francisco, CA 94110
```

---

## 14. SIGNATURES

**FOR SCAMGUARD INC. (Data Controller)**

```
______________________________
Name (Print):
Title:
Signature:
Date:

On behalf of: ScamGuard Inc.
Authority: ___________________
```

**FOR OPENAI L.L.C. (Data Processor)**

```
______________________________
Name (Print):
Title:
Signature:
Date:

On behalf of: OpenAI L.L.C.
Authority: ___________________
```

---

## APPENDIX A: DATA PROCESSING ADDENDUM

**OpenAI Data Processing Terms:**
Version: Per OpenAI's current DPA terms (as of Feb 2026)
Reference: https://openai.com/business/policies/data-processing

This agreement incorporates OpenAI's standard Data Processing Addendum by reference, except where this DPA conflicts (in which case this DPA prevails on data protection matters).

---

## APPENDIX B: SUB-PROCESSOR LIST

**Current Sub-Processors:**

| Sub-Processor | Service | Data Access | Status |
|---|---|---|---|
| Amazon Web Services (AWS) | Cloud hosting/storage | Personal data (encrypted) | ✅ Approved |
| Stripe | Payment processing | No personal data | ✅ Approved |
| Zuora | Billing services | No personal data | ✅ Approved |

---

**DPA Status:** ✅ READY FOR EXECUTION
**Effective Date:** February 18, 2026
**Next Review:** February 18, 2027 (Annual)
