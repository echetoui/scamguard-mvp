# Security Analysis - Dependabot Vulnerabilities

**Date:** March 8, 2026
**Status:** 13 vulnerabilities identified (5 high, 6 moderate, 2 low)

## Summary

The ScamGuard MVP has 13 open Dependabot security vulnerabilities, all located in **frontend build-time dependencies**. None are in production code or backend services.

### Vulnerability Breakdown

| Severity | Count | Location | Impact |
|----------|-------|----------|--------|
| HIGH | 5 | Frontend build tools | Build-time only |
| MODERATE | 6 | Frontend build tools | Build-time only |
| LOW | 2 | Frontend build tools | Build-time only |
| **TOTAL** | **13** | **Build tools** | **Not in production** |

## Affected Packages

### HIGH SEVERITY
1. **svgo** (v1.3.2) - DoS via entity expansion in DOCTYPE
   - Used by: `create-react-app` → `@svgr/plugin-svgo`
   - Latest: v2.8.2 (available in newer dependencies)
   - Status: ⚠️ Can't update directly (locked by react-scripts)

2. **underscore** (v1.13.6) - Unlimited recursion DoS in flatten/isEqual
   - Used by: `create-react-app` build tools
   - Status: ⚠️ Can't update directly (locked by react-scripts)

3. **serialize-javascript** (v4.0.0) - RCE via RegExp.flags and Date.prototype.toISOString
   - Used by: `webpack-dev-server`
   - Latest: v6.0.2 (available)
   - Status: ⚠️ Can't update directly (locked by react-scripts)

4. **nth-check** (v1.0.2) - Inefficient regex complexity DoS
   - Used by: `@svgr/plugin-svgo` → `svgo`
   - Latest: v2.1.1 (available in postcss)
   - Status: ⚠️ Can't update directly (locked by react-scripts)

### MODERATE SEVERITY
5. **webpack-dev-server** (v4.15.2) - Source code theft vulnerability
   - Used by: `react-scripts`
   - Impact: Development mode only, not in production
   - Status: ⚠️ Can't update directly (locked by react-scripts)

6. **postcss** (v8.5.8) - Line return parsing error
   - Used by: Multiple build tools
   - Latest: v8.5.8+ or v9.x
   - Status: ⚠️ Can't update directly (locked by build tools)

### LOW SEVERITY
7. **@tootallnate/once** (v1.x) - Incorrect control flow scoping
   - Used by: Transitive dependency
   - Impact: Minor, dev tools only
   - Status: ⚠️ Can't update directly

## Why Can't We Fix These?

### The Core Issue
All 13 vulnerabilities are **transitive dependencies** of **react-scripts@5.0.1**, which is the current (and latest stable) version.

```
react-scripts@5.0.1 (latest stable)
├── webpack-dev-server@4.15.2 (locked, has vulnerabilities)
├── svgo@1.3.2 (locked, deprecated)
├── serialize-javascript@4.0.0 (locked, has RCE)
└── ... many others locked to vulnerable versions
```

### Why Not Upgrade react-scripts?

1. **No newer stable versions available**
   - react-scripts@5.0.1 is the latest stable
   - Next versions are pre-release (5.1.0-next.x)
   - Pre-releases aren't suitable for production

2. **Upgrading creates new risks**
   - Could break the build process
   - Could introduce incompatibilities with React@18.2.0
   - Requires full regression testing
   - Could introduce different vulnerabilities

3. **Direct override attempts fail**
   - npm can't force newer versions without breaking dependencies
   - Attempting `npm audit fix --force` breaks the build (sets react-scripts@0.0.0)
   - Manual `resolutions` field doesn't work with npm@latest

## Impact Assessment

### Production Impact: ✅ MINIMAL
- **Good news:** These vulnerabilities are in **build-time tools only**
- Production bundle does NOT include webpack, svgo, or serialize-javascript
- Frontend bundle size is unaffected (71.27 kB gzipped)
- Runtime performance: No impact

### Development Impact: ⚠️ MODERATE
- These tools run during development and CI/CD
- Vulnerabilities are theoretical (require crafted malicious input during build)
- Development happens in controlled environments (GitHub Actions, local machines)
- Risk: Someone could craft a malicious SVG or config file during build

### CI/CD Impact: ✅ LOW
- GitHub Actions runners are temporary and isolated
- No persistent state at risk
- Build tools don't access sensitive data
- Runner environment is discarded after build

## Mitigation Strategies

### Current (Active)
1. ✅ **Security scanning in CI/CD**
   - Snyk security scanning enabled
   - Bandit for Python code analysis
   - npm audit in CI pipeline

2. ✅ **Code review process**
   - All PRs reviewed before merge
   - Security-focused review checklist
   - No unvetted SVG/config files merged

3. ✅ **Backend separation**
   - Backend Python code is clean (no vulnerabilities detected)
   - Frontend builds don't affect API security
   - AWS Lambda functions isolated from build tools

### Recommended Future Actions
1. **Monitor for react-scripts updates**
   - Check monthly for new stable releases
   - Upgrade immediately when 5.1+ or 6.0 stable released
   - Test thoroughly before merging

2. **Reduce build tool exposure**
   - Consider Vite or other modern alternatives when safe to migrate
   - This is a longer-term strategy (requires significant refactoring)

3. **Implement dependency scanning in GitHub**
   - Already enabled (Dependabot alerts visible)
   - Continue reviewing alerts quarterly
   - Prioritize actual exploitability over alert count

## Official Security Stance

**Status:** ✅ **ACCEPTABLE FOR STAGING DEPLOYMENT**

### Rationale
1. All vulnerabilities are build-time only
2. No impact on production runtime security
3. No impact on user data or API security
4. Requires active exploitation during build process
5. Can be addressed immediately when react-scripts updates
6. Backend code is secure and isolated

### Recommendation
Proceed with staging deployment with the understanding that:
- These build-time vulnerabilities don't affect production security
- Dependabot alerts will be addressed when react-scripts updates
- Continue monitoring for newer versions
- No code changes required

## Tracking

| Alert # | Package | Severity | Status | Fix Timeline |
|---------|---------|----------|--------|--------------|
| 33 | svgo | HIGH | Waiting for react-scripts update | TBD |
| 32 | @tootallnate/once | LOW | Waiting for react-scripts update | TBD |
| 31 | underscore | HIGH | Waiting for react-scripts update | TBD |
| 30 | serialize-javascript | HIGH | Waiting for react-scripts update | TBD |
| 28 | webpack-dev-server | MEDIUM | Waiting for react-scripts update | TBD |
| 27 | webpack-dev-server | MEDIUM | Waiting for react-scripts update | TBD |
| 26 | postcss | MEDIUM | Waiting for react-scripts update | TBD |
| 25 | nth-check | HIGH | Waiting for react-scripts update | TBD |
| 23 | @tootallnate/once | LOW | Waiting for react-scripts update | TBD |
| 21 | serialize-javascript | HIGH | Waiting for react-scripts update | TBD |
| 11 | webpack-dev-server | MEDIUM | Waiting for react-scripts update | TBD |
| 10 | webpack-dev-server | MEDIUM | Waiting for react-scripts update | TBD |
| 9 | postcss | MEDIUM | Waiting for react-scripts update | TBD |

## Next Steps

1. ✅ Document the situation (this file)
2. ✅ Verify backend is clean
3. ✅ Confirm production bundle is unaffected
4. ✅ Proceed with staging deployment
5. 📅 Set quarterly review of Dependabot alerts
6. 📅 Monitor for react-scripts updates
7. 📅 Plan migration to newer tooling in Q4 2026
