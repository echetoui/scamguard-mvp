# 💰 AWS Cost Optimization Plan - ScamGuard MVP

**Date:** 10 mars 2026
**Author:** Cost Optimization Initiative
**Status:** 🟢 READY FOR IMPLEMENTATION
**Potential Savings:** 60-70% AWS monthly spend

---

## 📊 Executive Summary

ScamGuard MVP can reduce AWS infrastructure costs from **~$600/month** to **~$180-240/month** through strategic optimizations. This represents **$360-420 in monthly savings** or **$4,320-5,040 annually**.

### Key Metrics
- **Current Monthly Cost:** ~$600
- **Projected Monthly Cost:** $180-240
- **Total Savings:** $360-420/month
- **Annual Savings:** $4,320-5,040
- **Implementation Timeline:** 2-3 weeks
- **ROI Period:** Immediate (savings exceed implementation cost)

---

## 🔴 Phase 1: HIGH ROI OPTIMIZATIONS (P0)

**Timeline:** 1-2 weeks
**Effort:** 5-7 days
**Total Savings:** ~$220/month (60-70% of goal)
**Implementation Status:** Issues #41, #42, #43 created

### 1. DynamoDB Pricing Model Optimization (Issue #41)

**Current Problem:**
- On-Demand pricing: $1.25/1M reads + $0.25/1M writes
- No capacity planning → expensive for unpredictable loads
- Estimated monthly cost: $150

**Solution:**
- Switch to **Provisioned Capacity + Auto-scaling**
- Base provisioned: 100-200 read units, 50-100 write units
- Auto-scale to max 10K units with 70% target utilization

**Expected Outcomes:**
- Provisioned unit cost: $0.47/unit/month
- Auto-scaling efficiency: 70% average utilization
- Monthly savings: **$100/month (67% reduction)**

**Implementation Steps:**
1. Analyze current DynamoDB usage patterns (CloudWatch metrics)
2. Calculate optimal provisioned capacity
3. Configure read/write capacity with auto-scaling
4. Test scaling behavior during peak hours
5. Monitor for throttling and adjust if needed

**Key Metrics to Monitor:**
- Consumed vs Provisioned capacity
- Scaling events and frequency
- Read/write latency
- Throttled requests (should be 0)

---

### 2. AI Cache Layer (Issue #42)

**Current Problem:**
- Every scam analysis calls OpenAI/Gemini API directly
- No caching for similar queries → redundant API calls
- Estimated cost: $200/month in API fees

**Solution:**
- Implement **Redis cache layer** in ElastiCache
- Cache analysis results for 7+ days
- Cache hit rate target: 60-70%

**Architecture:**
```
User Request
    ↓
Check Cache (Redis)
    ├─ Hit (70%) → Return cached result (instant)
    └─ Miss (30%) → Call OpenAI/Gemini → Cache result
```

**Expected Outcomes:**
- API call reduction: 70% (cache hits)
- API cost savings: **$100/month (50% reduction)**
- Infrastructure cost: ~$50/month (Redis cluster)
- Net monthly savings: **$100/month**
- Performance improvement: 3-5x faster responses for cache hits

**Caching Strategy:**
- **Cache Key:** SHA256(message_type + message_content)
- **TTL:** 7 days for scam patterns, 30 days for risk profiles
- **Size:** 5GB Redis cluster (handles 1M+ cached results)
- **Invalidation:** Manual for pattern updates, automatic for TTL

**Implementation Steps:**
1. Setup AWS ElastiCache Redis cluster
2. Implement cache key generation logic
3. Add Redis client to Lambda handlers
4. Update analysis flow: check cache first
5. Monitor cache hit/miss rates
6. Adjust TTL based on performance

---

### 3. Auto-Scaling Architecture (Issue #43)

**Current Problem:**
- Over-provisioned during low-traffic periods
- Under-provisioned during spikes
- No intelligent scaling across all services

**Solution:**
- Implement **comprehensive auto-scaling** across all services
- Auto-scale based on: CPU, memory, request count, duration

**Services to Scale:**
1. **Lambda:** 50 → 1000 concurrent executions
2. **DynamoDB:** Covered in Issue #41
3. **ElastiCache:** Scale cluster based on eviction rate
4. **API Gateway:** Throttling + queuing for overload
5. **RDS:** Standby + read replicas (if added)

**Expected Outcomes:**
- Better resource utilization (70% average vs 90%+ peak)
- Automatic scale-down during low-traffic hours
- Avoid unnecessary over-provisioning
- Monthly savings: **$20/month (30-40% of infrastructure)**

**Scaling Policies:**
```
Lambda:
  Min: 50 concurrent
  Max: 1000 concurrent
  Target: 70% utilization

DynamoDB:
  Min: 100 read / 50 write units
  Max: 10K read / 5K write units
  Target: 70% consumed capacity
```

**Implementation Steps:**
1. Configure Lambda reserved concurrency
2. Setup CloudWatch alarms for scaling events
3. Configure DynamoDB auto-scaling policies
4. Implement API Gateway throttling
5. Load test scaling behavior
6. Document scaling limits and costs

---

## **Total Phase 1 Savings: ~$220/month**

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| DynamoDB | $150 | $50 | $100 |
| API Costs | $200 | $100 | $100 |
| Auto-scaling Efficiency | - | -$20 | $20 |
| **TOTAL** | **$600** | **$380** | **$220** |

---

## 🟡 Phase 2: MEDIUM ROI OPTIMIZATIONS (P1)

**Timeline:** 1 week
**Effort:** 4-5 days
**Total Savings:** ~$46/month (20-40% additional savings)
**Implementation Status:** Issues #44, #45, #46 created

### 1. Lambda Memory Optimization (Issue #44)

**Current Problem:**
- All Lambda handlers: 256 MB (one-size-fits-all)
- Some handlers need less, others need more
- Wasted memory during low-intensity operations

**Solution:**
- **Granular memory allocation** per handler type
- Profile each handler and optimize

**Recommended Configuration:**
```
Auth Handler (login/signup):   128 MB (-50%)
SMS OTP Handler:               128 MB (-50%)
API Handler:                   256 MB (optimal)
LLM Analysis:                  512 MB (keep, vision needs memory)
Data Processing:               256 MB (optimal)
```

**Expected Outcomes:**
- Overall memory reduction: 15-20%
- Monthly savings: **$6/month**
- Performance: No degradation (properly profiled)

---

### 2. CloudWatch Logs Optimization (Issue #45)

**Current Problem:**
- Infinite log retention for all log groups
- No distinction between critical vs debug logs
- Estimated 100 GB/month unnecessary storage

**Solution:**
- **Intelligent retention policies** per log group
- Archive old logs to S3 Glacier

**Recommended Retention:**
```
Production Errors:  30 days (compliance)
API Logs:          14 days (monitoring)
Auth Logs:          7 days (security)
Lambda Logs:        7 days (debugging)
Dev/Test:           3 days (temporary)
```

**Cost Calculation:**
- CloudWatch storage: $0.03/GB/month
- Before: 100 GB × $0.03 = $30/month
- After: 10 GB × $0.03 = $0.30/month
- Monthly savings: **$30/month**

**Additional Savings:**
- S3 Glacier archive: ~$5/month storage
- Reduced ingestion: -$5/month
- **Total savings: $25/month**

---

### 3. S3 & CloudFront Optimization (Issue #46)

**Current Problem:**
- S3 storage: All Standard (expensive for infrequent access)
- CloudFront: No compression optimization
- Images: Not optimized for web

**Solution:**
- **S3 Intelligent-Tiering** + lifecycle policies
- **CloudFront compression** (Gzip + Brotli)
- **Image optimization** to WebP format

**S3 Savings:**
```
Current: 500 GB Standard @ $0.023/GB = $11.50/month
+ 30 days archive → Infrequent @ $0.0125/GB = $6.25/month
Savings: $5.25/month
```

**CloudFront Savings:**
```
Current: 1 TB/month @ $0.085/GB = $85/month
With compression: 70% reduction = $59.50/month
Savings: $25.50/month
```

**Total S3 + CloudFront Savings: $30/month**

---

## **Total Phase 2 Savings: ~$46/month**

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| Lambda Memory | $40 | $34 | $6 |
| CloudWatch | $40 | $10 | $30 |
| S3 + CloudFront | $80 | $50 | $30 |
| **TOTAL P1** | **$160** | **$94** | **$66** |

---

## 🟢 Phase 3: EXTENDED OPTIMIZATIONS (P2)

**Timeline:** Ongoing
**Effort:** Various
**Potential Savings:** $40-80/month
**Status:** Future planning

### Possible Optimizations:
1. **Reserved Instances:** 1-3 year commitments (-30%)
2. **RDS Multi-AZ:** Standby + read replicas
3. **API Gateway Caching:** Cache API responses
4. **S3 Transfer Acceleration:** Only if needed
5. **AWS Savings Plans:** 1-year commitments (-20%)

---

## 💰 TOTAL SAVINGS PROJECTION

### Phase 1 + Phase 2 Combined

**Current AWS Monthly Cost:** $600
**After Optimizations:** $180-240
**Monthly Savings:** $360-420
**Annual Savings:** $4,320-5,040

### Breakdown:
```
Phase 1 (P0 - HIGH ROI):        $220/month (67% of goal)
Phase 2 (P1 - MEDIUM ROI):       $46/month (23% of goal)
Phase 3 (P2 - EXTENDED):         $40/month (10% of goal)
─────────────────────────────────────────────────────
TOTAL POTENTIAL SAVINGS:        $306/month (51% reduction)
```

### ROI Analysis:
- **Implementation Cost:** ~$2,000 (engineering time)
- **First Month Savings:** $220 (Phase 1)
- **Payback Period:** <10 days
- **12-Month ROI:** 2,100%

---

## 📋 Implementation Roadmap

### Week 1: Phase 1 (High ROI)
- **Monday-Tuesday:** DynamoDB Optimization
  - Analysis and capacity planning
  - Switch to provisioned + auto-scaling
  - Testing in staging

- **Wednesday-Thursday:** AI Cache Layer
  - ElastiCache setup
  - Redis integration
  - Cache validation

- **Friday-Weekend:** Auto-Scaling
  - CloudWatch alarms
  - Scaling policy configuration
  - Load testing

### Week 2: Phase 2 (Medium ROI)
- **Monday:** Lambda Memory Optimization
- **Tuesday:** CloudWatch Logs Retention
- **Wednesday-Thursday:** S3 + CloudFront Optimization
- **Friday:** Validation and monitoring

### Week 3+: Continuous Monitoring
- Monitor all metrics daily
- Adjust scaling policies if needed
- Plan Phase 3 optimizations

---

## ✅ Success Criteria

### Phase 1 Completion:
- [ ] DynamoDB: Consuming 70% provisioned capacity
- [ ] AI Cache: 60%+ hit rate achieved
- [ ] Auto-scaling: Successful scale-up/down observed
- [ ] No application errors introduced
- [ ] $220/month savings verified in AWS console

### Phase 2 Completion:
- [ ] Lambda: Memory utilization < 70% on all handlers
- [ ] CloudWatch: Retention policies applied to all log groups
- [ ] S3: Intelligent-Tiering enabled
- [ ] CloudFront: Compression ratios > 60%
- [ ] Additional $46/month savings verified

### Overall Success:
- [ ] Monthly AWS bill reduced to $180-240
- [ ] No performance degradation
- [ ] All monitoring in place
- [ ] Documentation updated

---

## ⚠️ Risk Mitigation

### Potential Risks and Mitigation:

**1. DynamoDB Throttling**
- Risk: Insufficient provisioned capacity
- Mitigation: Start conservative, increase gradually
- Monitoring: Watch for ProvisionedThroughputExceededException

**2. Cache Invalidation Issues**
- Risk: Stale cache data affecting users
- Mitigation: Conservative TTLs, manual invalidation option
- Monitoring: Cache hit rate and accuracy tests

**3. Lambda Performance**
- Risk: Reduced memory causing timeouts
- Mitigation: Profile before reducing, monitor P99 latency
- Monitoring: Lambda duration and timeout metrics

**4. CloudFront Compatibility**
- Risk: Compression issues with specific content
- Mitigation: Test all content types before rollout
- Monitoring: Cache hit ratio and page load times

---

## 📊 Monitoring & Alerts

### CloudWatch Dashboards to Create:
1. **Cost Dashboard:** Daily spend tracking
2. **DynamoDB Dashboard:** Capacity utilization
3. **Cache Dashboard:** Hit rate and performance
4. **Lambda Dashboard:** Memory and duration
5. **API Dashboard:** Response time and errors

### Alerts to Configure:
- DynamoDB: Throttled requests > 0
- ElastiCache: Eviction rate > 5%
- Lambda: Duration > 30s
- CloudFront: Cache hit ratio < 70%
- Cost: Monthly spend increase > 10%

---

## 📖 Documentation

### Update Required:
- [ ] Architecture documentation
- [ ] Operational procedures
- [ ] Disaster recovery plans
- [ ] Scaling guidelines
- [ ] Cost tracking procedures

### Team Training:
- [ ] Operations team: New monitoring procedures
- [ ] Development team: Performance baselines
- [ ] DevOps team: Auto-scaling management

---

## 🚀 Approval Sign-off

### Required Approvals:
- [ ] **Project Lead:** Cost reduction strategy
- [ ] **DevOps Lead:** Infrastructure changes
- [ ] **Finance:** Expected savings validation
- [ ] **Product Lead:** No functionality impact

### Timeline Agreement:
- [ ] Phase 1: 1 week start date: _______
- [ ] Phase 2: 2 weeks after Phase 1: _______
- [ ] Phase 3: Planning for week 4: _______

---

## 📞 Support & Questions

### Implementation Team:
- Lead Engineer: [assign]
- DevOps Engineer: [assign]
- QA Tester: [assign]

### Points of Contact:
- **DynamoDB Issues:** [contact]
- **Cache Issues:** [contact]
- **Auto-scaling Issues:** [contact]

---

## Related GitHub Issues

- **#41:** DynamoDB Optimization (P0)
- **#42:** AI Cache Layer (P0)
- **#43:** Auto-Scaling Architecture (P0)
- **#44:** Lambda Memory Optimization (P1)
- **#45:** CloudWatch Logs Optimization (P1)
- **#46:** S3 CloudFront Optimization (P1)
- **#47:** Cost Optimization Roadmap (Master)

---

**Last Updated:** 10 mars 2026
**Status:** Ready for Implementation
**Next Review:** After Phase 1 completion
