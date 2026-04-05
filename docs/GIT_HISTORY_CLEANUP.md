# Git History Cleanup - Instructions for Repo Admin

**Issue:** Git history divergence caused by `filter-branch` operations removing large files  
**Affected Branch:** `develop`  
**Blocked PR:** [#57](https://github.com/echetoui/scamguard-mvp/pull/57)  
**Cleanup Date:** April 5, 2026

---

## 🔍 Problem Summary

During the SecurityHeartDashboard refactor, `filter-branch` operations were run to remove:
1. `backend/lambda_/threats-lambda.zip` (129.72 MB — exceeds GitHub's 100 MB limit)
2. `backend/.env.local` (contains secrets — GitHub push protection)

These operations created a **divergent history** where:
- Local `develop` branch has 283 commits ahead of remote
- Remote `origin/develop` has 200 commits ahead of local
- This prevents automatic merges (PR #57 shows "CONFLICTING")

---

## ✅ Resolution Steps

### Step 1: Assess Current State

```bash
cd /path/to/scamguard-mvp
git log --oneline origin/develop | head -20
git log --oneline develop | head -20
```

**Expected:** You'll see different commit histories diverging.

### Step 2: Identify What Needs Cleanup

**Files to remove from history:**
- `backend/lambda_/threats-lambda.zip` (129.72 MB)
- `backend/lambda_/lambda_deployment.zip` (64.82 MB — warning, recommended max 50 MB)
- `backend/.env.local` (contains Twilio secrets)

**Option A: Use GitHub's Archive & Purge** (Recommended)

1. Go to GitHub repo Settings → **Security** → **Secret Scanning**
2. Look for the unblocked secret:
   ```
   https://github.com/echetoui/scamguard-mvp/security/secret-scanning/unblock-secret/3Bxa4nJc9VNUrefTCC2erOVi5Iq
   ```
3. Click to **purge the secret from history** (this removes it from all commits)

4. For large files, GitHub may need to purge them as well. Contact support if needed.

**Option B: Local Cleanup + Force Push** (Advanced)

If Option A doesn't work, do this locally:

```bash
# Install git-filter-repo (modern replacement for filter-branch)
pip install git-filter-repo

# Clone a fresh copy to work with
cd /tmp
git clone --mirror https://github.com/echetoui/scamguard-mvp.git scamguard-mvp.git
cd scamguard-mvp.git

# Remove large files from all history
git filter-repo --strip-blobs-bigger-than 100M --force

# Remove secrets from all history
git filter-repo --replace-text <(echo 'SG.xxx...REDACTED') --force

# Push back to remote (requires force push permission)
git push --mirror https://github.com/echetoui/scamguard-mvp.git
```

### Step 3: Verify Cleanup

```bash
# Fetch fresh refs from remote
git fetch origin

# Check if develop and origin/develop are now aligned
git log --oneline develop | wc -l
git log --oneline origin/develop | wc -l
# Should be close or identical

# Try to merge the feature branch
git checkout feature/security-dashboard-refactor
git merge origin/develop --no-commit
# Should have 0 conflicts or very few
```

### Step 4: Resolve Any Remaining Conflicts

If there are still conflicts after cleanup:

```bash
# See what conflicts exist
git status

# Most should be auto-resolvable
git add .
git commit -m "Merge develop after git history cleanup"
git push origin feature/security-dashboard-refactor
```

### Step 5: Verify PR Mergeability

```bash
# Check PR #57 on GitHub
# Should now show "Mergeable: CONFLICTING" → "Mergeable: TRUE"
```

Once green, PR can be merged automatically.

---

## 🛡️ Prevention for Future

### Add to `.gitignore`

```bash
# Already added but verify:
cat >> .gitignore << 'EOF'

# Large files (zips, archives, binaries)
*.zip
*.tar.gz
*.rar

# Environment files with secrets
.env.local
.env.*.local
secrets.json

# Build artifacts (keep for some, check team preference)
dist/
build/
*.o
*.so
EOF

git add .gitignore
git commit -m "chore: update gitignore to prevent accidental large file/secret commits"
```

### Configure Pre-commit Hooks (Optional)

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-added-large-files
        args: ['--maxkb=50']
      - id: detect-private-key
      - id: check-merge-conflict
EOF

git add .pre-commit-config.yaml
git commit -m "chore: add pre-commit hooks to prevent accidental commits"

# Install hooks
pre-commit install
```

---

## 📋 Checklist for Repo Admin

- [ ] Verify git history divergence with `git log --oneline`
- [ ] Identify files needing removal (large files, secrets)
- [ ] Use GitHub Secret Scanning to purge secrets
- [ ] Consider `git-filter-repo` for large files
- [ ] Test merge of PR #57 locally
- [ ] Verify no new conflicts after cleanup
- [ ] Update `.gitignore` to prevent future issues
- [ ] Consider enabling pre-commit hooks
- [ ] Merge PR #57 once verified
- [ ] Document what was cleaned up

---

## 🚨 Important Notes

1. **Force Push Required:** Cleanup will require force-pushing to `develop`. Coordinate with team first.

2. **Clone State:** After cleanup, team members should:
   ```bash
   git fetch origin
   git reset --hard origin/develop
   # Discard local changes and re-sync
   ```

3. **CI/CD Triggers:** If cleanup happens, re-run CI/CD pipelines as webhook history may be affected.

4. **Backup:** Consider backing up the current state before cleanup:
   ```bash
   git branch backup/develop-before-cleanup develop
   ```

---

## 📞 If You Need Help

- **Git-filter-repo docs:** https://github.com/newren/git-filter-repo
- **GitHub Secret Scanning:** https://docs.github.com/code-security/secret-scanning
- **Pre-commit hooks:** https://pre-commit.com/

---

**Once cleanup is done:**
1. PR #57 will merge cleanly
2. SecurityHeartDashboard refactor goes to production
3. Team can continue with Phase 2 screen refactors

