# Security Vulnerabilities Report - ScamGuard MVP

**Last Updated:** March 7, 2026
**Status:** 26 npm vulnerabilities identified (9 low, 3 moderate, 14 high)

## Overview

The npm audit detected 26 vulnerabilities in the frontend dependencies, primarily in dev-time dependencies (Jest, Webpack, React-Scripts, PostCSS, etc.). None of these are directly exposed in production builds.

## Vulnerability Summary

### High Severity (14)
1. **nth-check** - Inefficient Regular Expression Complexity (ReDoS)
   - Used by: svgo → @svgr/webpack → react-scripts
   - Impact: Development only
   - Fix: Requires react-scripts major version upgrade

2. **serialize-javascript** - RCE via RegExp.flags
   - Used by: css-minimizer-webpack-plugin, rollup-plugin-terser
   - Impact: Development only
   - Fix: Requires react-scripts major version upgrade

3. **jsonpath** - Arbitrary Code Injection
   - Used by: bfj (transitive)
   - Impact: Build-time only
   - Fix: Update jsonpath to >2.0.0

4. **@tootallnate/once** - Incorrect Control Flow Scoping
   - Used by: http-proxy-agent → jsdom → jest-environment-jsdom
   - Impact: Testing only
   - Fix: Requires Jest upgrade

5. **webpack-dev-server** - Source code theft vulnerabilities
   - Used by: react-scripts (dev dependency)
   - Impact: Development environment only
   - Fix: Requires react-scripts upgrade

6. **underscore** - DoS via unlimited recursion
   - Used by: jsonpath
   - Impact: Build-time only
   - Fix: Update underscore to >1.13.7

7. **postcss** - Line return parsing error
   - Used by: resolve-url-loader (transitive)
   - Impact: Build-time only
   - Fix: Requires react-scripts major version upgrade

### Moderate Severity (3)
1. **postcss-preset-env** - Post CSS vulnerability
2. **browserslist** - Regular Expression DoS
3. **webpack-dev-server** - Additional vulnerability

### Low Severity (9)
- Various transitive dependencies with minimal impact

## Root Cause Analysis

The majority of vulnerabilities stem from:
- **react-scripts 5.0.1** - The CRA (Create React App) builder uses older versions of webpack, postcss, jest
- **Development-only dependencies** - These are not bundled into production builds

## Risk Assessment

**Production Impact:** MINIMAL
- Production builds are static HTML/JS/CSS served from S3/CloudFront
- All vulnerable packages are dev-time only
- No server-side code execution of vulnerable packages

**Development Impact:** LOW to MODERATE
- Dev server (webpack-dev-server) has source code theft vulnerability
- Only affects developers working on the codebase
- Not exposed to end users

## Recommended Solutions

### Option 1: Upgrade React Scripts (Recommended for Long-term)
```bash
npm install react-scripts@5.0.1 --save-dev
# Or migrate to Vite/Next.js
```
- **Pros:** Full security compliance, modernize tooling
- **Cons:** Potential breaking changes, requires testing

### Option 2: Accept Known Vulnerabilities (Short-term)
```bash
# Document acceptable risk for dev-time vulnerabilities
# Continue monitoring via GitHub Dependabot
```
- **Pros:** No immediate changes needed
- **Cons:** Requires security review process

### Option 3: Suppress Development Vulnerabilities
```bash
# Create .npmrc with specific suppression rules
# Or use npm audit exceptions
```

## Current Action

✅ **Committed:** 
- Frontend production build is secure (gzipped assets only)
- All dev dependencies properly isolated in node_modules

⚠️ **Pending:**
- React-scripts major version upgrade (deferred to Phase 6)
- Consider migration to Vite for faster builds and fewer dependencies

## Monitoring

- GitHub Dependabot enabled for automatic vulnerability detection
- npm audit run before each deployment
- Security review in deployment checklist

## Compliance

- ✅ OWASP Top 10: No direct vulnerabilities in production code
- ✅ GDPR: No data exposure vectors identified
- ⚠️ Supply chain security: Monitoring transitive dependencies

---

**Next Review Date:** April 7, 2026
**Owner:** DevOps / Security Team
