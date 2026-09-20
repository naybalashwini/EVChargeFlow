#!/bin/bash

# ============================================
# ChargeFlow - GitHub Upload Script
# ============================================

echo ""
echo "========================================" 
echo "  ⚡ ChargeFlow - GitHub Upload"
echo "========================================" 
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed!"
    echo "Please install git first: https://git-scm.com/downloads"
    exit 1
fi

# Check if gh CLI is installed (optional)
if command -v gh &> /dev/null; then
    HAS_GH=true
else
    HAS_GH=false
fi

echo "✅ Git found: $(git --version)"
echo ""

# Get GitHub username
if [ "$HAS_GH" = true ]; then
    GH_USER=$(gh api user --jq .login 2>/dev/null)
    if [ -n "$GH_USER" ]; then
        echo "👤 Logged in as: $GH_USER"
        echo ""
    fi
fi

read -p "📝 Enter your GitHub username: " GITHUB_USER
read -p "📦 Enter repository name (default: chargeflow): " REPO_NAME
REPO_NAME=${REPO_NAME:-chargeflow}

echo ""
echo "📋 Repository will be: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

# Initialize git if not already
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: ChargeFlow - EV Charging Intelligence & Trip Planner"
    echo "✅ Git initialized and committed"
else
    echo "✅ Git already initialized"
    # Check for uncommitted changes
    if ! git diff --quiet HEAD; then
        echo "📝 Committing changes..."
        git add .
        git commit -m "Update: ChargeFlow project files"
    fi
fi

echo ""

if [ "$HAS_GH" = true ]; then
    echo "🚀 Creating GitHub repository using gh CLI..."
    
    # Try to create repo
    if gh repo create "$REPO_NAME" --public --source=. --push --description "⚡ EV Charging Intelligence & Trip Planner - Find chargers, compare stations, and plan your journey"; then
        echo ""
        echo "========================================" 
        echo "  ✅ SUCCESS!"
        echo "========================================" 
        echo ""
        echo "🌐 Repository: https://github.com/$GITHUB_USER/$REPO_NAME"
        echo ""
        echo "Your ChargeFlow project is now on GitHub!"
        exit 0
    else
        echo "⚠️  gh CLI failed. Falling back to manual method..."
    fi
fi

# Manual method
echo ""
echo "📋 Manual Setup Required:"
echo ""
echo "Step 1: Create a new repository on GitHub"
echo "   👉 Go to: https://github.com/new"
echo "   👉 Repository name: $REPO_NAME"
echo "   👉 Description: EV Charging Intelligence & Trip Planner"
echo "   👉 Make it Public"
echo "   👉 DO NOT initialize with README"
echo "   👉 Click 'Create repository'"
echo ""
read -p "✅ Press Enter after creating the repository..."

echo ""
echo "🔗 Connecting to GitHub..."

# Set up remote
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Get current branch name
BRANCH=$(git branch --show-current)
if [ -z "$BRANCH" ]; then
    BRANCH="main"
    git branch -M main
fi

echo "📤 Pushing to GitHub..."
git push -u origin "$BRANCH"

echo ""
echo "========================================" 
echo "  ✅ SUCCESS!"
echo "========================================" 
echo ""
echo "🌐 Repository: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "Your ChargeFlow project is now on GitHub!"
echo ""
