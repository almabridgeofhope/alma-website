#!/bin/bash

# Sync secrets from .env.local to GitHub Secrets using GitHub CLI
# 
# Requirements:
#   - GitHub CLI installed: https://cli.github.com/
#   - Authenticated with: gh auth login
#   - .env.local file in project root

set -e

ENV_FILE=".env.local"

# Auto-detect repository from git remote
if command -v git &> /dev/null; then
  GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ "$GIT_REMOTE" =~ github.com[:/]([^/]+)/([^/]+)(\.git)?$ ]]; then
    REPO_OWNER="${BASH_REMATCH[1]}"
    REPO_NAME="${BASH_REMATCH[2]%.git}"
  fi
fi

# Fallback to environment variables or defaults
REPO_OWNER="${GITHUB_REPO_OWNER:-${REPO_OWNER:-your-username}}"
REPO_NAME="${GITHUB_REPO_NAME:-${REPO_NAME:-alma-website}}"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: $ENV_FILE not found"
  echo "   Create it in the project root with your environment variables"
  exit 1
fi

if ! command -v gh &> /dev/null; then
  echo "❌ Error: GitHub CLI (gh) not found"
  echo "   Install it: https://cli.github.com/"
  echo "   macOS: brew install gh"
  echo "   Or download: https://cli.github.com/"
  exit 1
fi

# Check authentication
if ! gh auth status &>/dev/null; then
  echo "❌ Error: Not authenticated with GitHub CLI"
  echo "   Run: gh auth login"
  exit 1
fi

echo "🔄 Syncing secrets from $ENV_FILE"
echo "📦 Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Read .env.local and sync each variable
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
  
  # Remove quotes from value
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  
  # Only sync relevant secrets (VITE_*, STRIPE_*, PAYPAL_*)
  if [[ "$key" =~ ^(VITE_|STRIPE_|PAYPAL_) ]]; then
    if [ -z "$value" ]; then
      echo "⏭️  Skipping $key (empty value)"
      continue
    fi
    
    echo "📦 Syncing $key..."
    if gh secret set "$key" --body "$value" 2>/dev/null; then
      echo "✅ Synced $key"
    else
      echo "❌ Failed to sync $key"
    fi
    echo ""
  fi
done < "$ENV_FILE"

echo "✨ Sync complete!"
echo ""
echo "💡 Tip: Push to main branch to trigger deployment with updated secrets"

