# ScamGuard Performance Optimization Implementation Guide

**Quick Reference for developers implementing performance improvements**

---

## 1. CloudFront Cache Optimization (30 min)

### Current Issue
Cache headers not explicitly configured, using CloudFront defaults.

### Solution: Update Behavior

```bash
# 1. Get current distribution config
aws cloudfront get-distribution-config \
  --id E1C54UEBEPD83U \
  --output json > dist-config.json

# 2. Modify cache settings in dist-config.json
# Find the "CacheBehaviors" section and update:
{
  "PathPattern": "assets/*",
  "ViewerProtocolPolicy": "https-only",
  "AllowedMethods": ["GET", "HEAD"],
  "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f5",  # Managed-CachingOptimized
  "Compress": true
}

# 3. For index.html (no-cache):
{
  "PathPattern": "index.html",
  "ViewerProtocolPolicy": "https-only",
  "AllowedMethods": ["GET", "HEAD"],
  "CachePolicyId": "4135ea3d-c35d-46eb-81d7-redf4b215fa0"  # Managed-CachingDisabled
}

# 4. Update distribution
aws cloudfront update-distribution \
  --id E1C54UEBEPD83U \
  --distribution-config file://dist-config.json
```

### CDK Alternative (Better for future)

```python
# In backend/cdk/stacks/scamguard_stack.py
distribution = cloudfront.Distribution(self, 'FrontendDistribution',
    default_behavior=cloudfront.BehaviorOptions(
        origin=s3_origin,
        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,  # ← Add this
        compress=True,
    ),
    additional_behaviors={
        'index.html': cloudfront.BehaviorOptions(
            origin=s3_origin,
            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,  # ← Add this
        ),
        'assets/*': cloudfront.BehaviorOptions(
            origin=s3_origin,
            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
        ),
    }
)
```

### Verify
```bash
# Check cache headers
curl -I https://dv04w7vjfnkg5.cloudfront.net/assets/index-CMCB8NkZ.js | grep -i cache-control
# Should return: cache-control: public, max-age=31536000, immutable

curl -I https://dv04w7vjfnkg5.cloudfront.net/index.html | grep -i cache-control
# Should return: cache-control: no-cache, no-store, must-revalidate
```

---

## 2. Critical CSS Inlining (1-2 hours)

### Step 1: Extract Critical Path CSS

```bash
# Install critical path CSS extraction tool
npm install --save-dev critical

# Create script in package.json:
"build:critical": "vite build && critical build/index.html --base ./ --inline --minify"
```

### Step 2: Modify vite.config.js

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    // Add performance budgets
    rollupOptions: {
      output: {
        manualChunks: {
          'resources': ['./src/components/Resources/ResourcesTab.jsx'],
          'tools': ['./src/components/ToolsTab.jsx'],
          'family': ['./src/components/FamilyDashboard.jsx'],
        }
      }
    }
  },
  // ... rest of config
})
```

### Step 3: Create Critical CSS Extractor

```javascript
// frontend/scripts/extract-critical-css.js
import critical from 'critical';

critical.generate({
  base: 'build/',
  src: 'index.html',
  dest: 'index.html',
  inline: true,
  minify: true,
  dimensions: [
    { height: 800, width: 375 },   // Mobile
    { height: 1024, width: 768 },  // Tablet
    { height: 1080, width: 1920 }, // Desktop
  ]
}).then(() => {
  console.log('Critical CSS extracted and inlined');
});
```

### Before/After
```
BEFORE: FCP ~1000ms (wait for CSS)
AFTER:  FCP ~750ms  (critical CSS inline, defer non-critical)
```

---

## 3. Font Optimization (1 hour)

### Step 1: Add Preload Links

```html
<!-- In frontend/src/index.html or vite's entry point -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ScamGuard - Fraud Detection & Scam Reporting</title>

    <!-- ⭐ PRELOAD CRITICAL FONTS -->
    <link rel="preload"
          href="/fonts/cormorant-garamond-regular.woff2"
          as="font"
          type="font/woff2"
          crossorigin>
    <link rel="preload"
          href="/fonts/lora-regular.woff2"
          as="font"
          type="font/woff2"
          crossorigin>

    <!-- PREFETCH ADDITIONAL WEIGHTS -->
    <link rel="prefetch"
          href="/fonts/cormorant-garamond-bold.woff2"
          as="font"
          type="font/woff2"
          crossorigin>

    <script type="module" crossorigin src="/assets/index-CMCB8NkZ.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-CbmGErOh.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### Step 2: Ensure font-display: swap in CSS

```css
/* In frontend/src/styles/design-tokens.css */
@font-face {
  font-family: 'Cormorant Garamond';
  src: url('/fonts/cormorant-garamond-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;  /* ← IMPORTANT: Shows fallback while loading */
}

@font-face {
  font-family: 'Lora';
  src: url('/fonts/lora-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### Step 3: Verify Fonts Are WOFF2

```bash
# Check current font format
file frontend/src/fonts/*

# Convert to WOFF2 if needed
npm install -g woff2
woff2_compress font.ttf
```

### Impact
```
LCP Improvement: 200-300ms faster
Reasoning: Defers render of serif fonts, uses system font temporarily
```

---

## 4. Bundle Analysis & Lazy Loading (2-3 hours)

### Step 1: Analyze Bundle

```bash
# Install rollup plugin for analysis
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.js:
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
    }),
  ],
  // ... rest of config
})

# Run build
npm run build
# Opens stats.html in browser showing breakdown
```

### Step 2: Identify Non-Critical Components

Looking at App.jsx, these components are **lazy-loadable**:
- ✅ ResourcesTab (already lazy)
- ✅ ToolsTab (already lazy)
- ✅ FamilyDashboard (already lazy)
- ⚠️ CreditSystem (currently eager, ~3-5 kB)
- ⚠️ DashboardStats (currently eager, ~2-3 kB)
- ⚠️ AnalysisHistory (currently eager, ~2-3 kB)

### Step 3: Convert to Lazy Loading

```javascript
// frontend/src/App.jsx - BEFORE
import CreditSystem from './components/CreditSystem';
import DashboardStats from './components/DashboardStats';

// AFTER
const CreditSystem = lazy(() => import('./components/CreditSystem'));
const DashboardStats = lazy(() => import('./components/DashboardStats'));

// Usage remains the same:
{activeTab === 'credits' && (
  <Suspense fallback={<LoadingPlaceholder />}>
    <CreditSystem {...props} />
  </Suspense>
)}
```

### Expected Result
```
Main Bundle: 63.32 kB → 55-58 kB gzip (-8-10%)
TTI Improvement: 150-250ms faster
```

---

## 5. Performance Monitoring Setup (2-3 hours)

### Step 1: Install Web Vitals

```bash
npm install web-vitals
```

### Step 2: Create Analytics Service

```javascript
// frontend/src/services/performanceAnalytics.js
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';
import { analysisAPI } from './api';

export function initializePerformanceMonitoring() {
  // FCP - When first content appears
  getFCP((metric) => {
    console.log('FCP:', metric.value);
    sendMetric('fcp', metric.value);
  });

  // LCP - When largest content is painted
  getLCP((metric) => {
    console.log('LCP:', metric.value);
    sendMetric('lcp', metric.value);
  });

  // CLS - Cumulative layout shift
  getCLS((metric) => {
    console.log('CLS:', metric.value);
    sendMetric('cls', metric.value);
  });

  // Monitor input delay (INP replacement for FID)
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.processingStart) {
          const inputDelay = entry.processingStart - entry.startTime;
          console.log('Input Delay:', inputDelay);
          sendMetric('input-delay', inputDelay);
        }
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  }

  // TTB - Time to First Byte
  getTTFB((metric) => {
    console.log('TTFB:', metric.value);
    sendMetric('ttfb', metric.value);
  });
}

async function sendMetric(name, value) {
  try {
    // Optional: Send to your analytics backend
    // await analysisAPI.post('/metrics', { name, value, timestamp: Date.now() });
  } catch (error) {
    console.error('Failed to send metric:', error);
  }
}
```

### Step 3: Initialize in App.jsx

```javascript
// frontend/src/App.jsx
import { useEffect } from 'react';
import { initializePerformanceMonitoring } from './services/performanceAnalytics';

export default function App() {
  useEffect(() => {
    initializePerformanceMonitoring();
  }, []);

  // ... rest of component
}
```

### Step 4: CloudWatch Custom Metrics (Optional)

```javascript
// Send to CloudWatch if using AWS Lambda backend
async function sendMetric(name, value) {
  try {
    await analysisAPI.post('/metrics', {
      name,
      value,
      timestamp: new Date().toISOString(),
      pathname: window.location.pathname,
    });
  } catch (error) {
    console.error('Failed to send metric:', error);
  }
}
```

### Step 5: Lambda Handler for Metrics

```python
# backend/lambda/index.py - add endpoint
def handle_metrics(event, context):
    """Store performance metrics from frontend"""
    try:
        body = json.loads(event['body'])

        # Log to CloudWatch
        print(f"Metric: {body['name']}={body['value']}ms")

        # Store in DynamoDB (optional)
        table.put_item(Item={
            'pk': f"metrics#{body['name']}",
            'sk': body['timestamp'],
            'value': body['value'],
            'pathname': body.get('pathname', '/'),
        })

        return { 'statusCode': 200, 'body': 'OK' }
    except Exception as e:
        return { 'statusCode': 400, 'body': str(e) }
```

---

## 6. Lighthouse CI/CD Integration (1 hour)

### Step 1: Create lighthouserc.json

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": [
        "https://dv04w7vjfnkg5.cloudfront.net"
      ],
      "settings": {
        "configPath": "./lighthouserc-config.js",
        "chromeFlags": "--disable-gpu --headless --no-sandbox"
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "categories:accessibility": ["error", { "minScore": 0.90 }],
        "categories:best-practices": ["error", { "minScore": 0.85 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Step 2: GitHub Actions Workflow

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  push:
    branches: [develop, main]
    paths:
      - 'frontend/**'
      - '.github/workflows/lighthouse.yml'

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true

      - name: Comment Results
        if: always()
        uses: actions/github-script@v6
        with:
          script: |
            console.log('Lighthouse audit complete');
            // Post results as PR comment
```

---

## Implementation Priority & Effort Matrix

| Task | Priority | Effort | Impact | Timeline |
|------|----------|--------|--------|----------|
| CloudFront Cache Optimization | 🔴 HIGH | 30 min | +3-5 pts | Day 1 |
| Web Vitals Monitoring | 🔴 HIGH | 2 hrs | Baseline | Day 1 |
| Font Preloading | 🟡 MEDIUM | 1 hr | +1-2 pts | Day 1-2 |
| Critical CSS Inline | 🟡 MEDIUM | 2 hrs | +2-3 pts | Day 2-3 |
| Lazy Load Components | 🟡 MEDIUM | 3 hrs | +3-5 pts | Day 2-3 |
| Lighthouse CI/CD | 🟢 LOW | 1 hr | Early detection | Day 3 |

---

## Quick Test Commands

```bash
# Build and measure
cd /Users/echetoui/scamguard-mvp/frontend
npm run build

# Check bundle sizes
echo "=== Bundle Sizes ==="
du -sh build/assets/*

# Check gzip sizes
echo "=== Gzip Sizes ==="
find build/assets -type f | while read f; do
  original=$(stat -f%z "$f")
  gzip=$(gzip -c "$f" | wc -c)
  percent=$(echo "scale=1; $gzip*100/$original" | bc)
  echo "$f: $(($original/1024))KB → $(($gzip/1024))KB (${percent}%)"
done

# Analyze with @vitejs/plugin-visualizer
npm run build  # Creates stats.html
```

---

## Validation Checklist Before Deploying

- [ ] Main bundle ≤ 70 kB gzip
- [ ] Total CSS ≤ 20 kB gzip
- [ ] Cache headers configured for assets (86400s)
- [ ] Cache headers set for index.html (no-cache)
- [ ] Fonts preloaded in HTML
- [ ] `font-display: swap` in CSS
- [ ] All lazy components wrapped in Suspense
- [ ] Web Vitals monitoring initialized
- [ ] CloudFront invalidation on deploy
- [ ] Lighthouse CI passing (≥90 performance)

---

## Performance Regression Detection

Monitor these metrics daily:

```bash
#!/bin/bash
# monitor-performance.sh

echo "Monitoring ScamGuard Frontend Performance"
url="https://dv04w7vjfnkg5.cloudfront.net"

# Test from different regions
for region in "us-east" "us-west" "eu-west"; do
  echo "Testing from $region..."
  curl -w "@curl-format.txt" -o /dev/null -s "$url"
done

# Cloud Watch check
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name BytesDownloaded \
  --dimensions Name=DistributionId,Value=E1C54UEBEPD83U \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

---

**Last Updated:** March 9, 2026
**Target:** 92+ Lighthouse Performance Score
**Status:** Ready for Implementation
