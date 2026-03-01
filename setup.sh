#!/bin/bash
# ============================================
# Lanturn Weekly v2 — Setup Script
# Run this once from your local machine.
# Requires: git, a GitHub account with access to actualbeing/lanturn
# ============================================

set -e

REPO_DIR="./lanturn"
REMOTE="git@github.com:actualbeing/lanturn.git"

echo ""
echo "🔥 Lanturn Weekly v2 — Setup"
echo "============================"
echo ""

# -------------------------------------------
# Step 1: Check if we're in the right place
# -------------------------------------------
if [ ! -f "$REPO_DIR/config.yaml" ]; then
    echo "❌ Can't find $REPO_DIR/config.yaml"
    echo "   Make sure you've extracted lanturn-v2-site.tar.gz first:"
    echo ""
    echo "   tar xzf lanturn-v2-site.tar.gz"
    echo ""
    exit 1
fi

cd "$REPO_DIR"

# -------------------------------------------
# Step 2: Initialize fresh git repo
# -------------------------------------------
echo "→ Initializing git repo..."
rm -rf .git
git init
git branch -M main

# -------------------------------------------
# Step 3: Add all files and commit
# -------------------------------------------
echo "→ Adding files..."
git add -A
git commit -m "Lanturn Weekly v2 — clean start

- Custom Hugo theme (no PaperMod dependency)
- Purged all v1 content
- Relaunch post + first editorial cycle
- Digest: renewable energy, AI magnets, SF childcare
- Glow: deep dive on AI for materials science"

# -------------------------------------------
# Step 4: Push to GitHub (force, replaces v1)
# -------------------------------------------
echo "→ Pushing to GitHub..."
echo ""
echo "   ⚠️  This will FORCE PUSH to $REMOTE"
echo "   All v1 content will be replaced."
echo ""
read -p "   Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

git remote add origin "$REMOTE" 2>/dev/null || git remote set-url origin "$REMOTE"
git push -u origin main --force

echo ""
echo "✅ Pushed to GitHub!"
echo ""

# -------------------------------------------
# Step 5: Cloudflare Pages setup instructions
# -------------------------------------------
echo "============================"
echo "📋 Next: Connect Cloudflare Pages"
echo "============================"
echo ""
echo "1. Go to: https://dash.cloudflare.com"
echo "2. Click: Workers & Pages → Create → Pages → Connect to Git"
echo "3. Authorize GitHub, select 'actualbeing/lanturn'"
echo "4. Build settings:"
echo "     Framework preset:    Hugo"
echo "     Build command:       hugo --minify"
echo "     Build output dir:    public"
echo "     Environment variable: HUGO_VERSION = 0.146.6"
echo "5. Click 'Save and Deploy'"
echo ""
echo "After first deploy:"
echo "6. Go to your Pages project → Custom domains"
echo "7. Add: lanturnweekly.com"
echo "8. If domain is already on Cloudflare DNS, it auto-configures."
echo "   If not, Cloudflare will give you DNS records to add."
echo ""
echo "Once confirmed working:"
echo "- Delete .github/workflows/deploy.yaml from old repo (already gone)"
echo "- Remove Hostinger FTP secrets from GitHub repo settings"
echo "- Cancel Hostinger hosting when ready"
echo ""
echo "============================"
echo "🔥 You're live. Welcome to v2."
echo "============================"
