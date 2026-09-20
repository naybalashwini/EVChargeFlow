# 📤 How to Upload ChargeFlow to GitHub

Complete step-by-step guide to upload your ChargeFlow project to GitHub.

---

## 🎯 Method 1: Using the Upload Script (Easiest)

### For Mac/Linux/Git Bash:
```bash
chmod +x upload-to-github.sh
./upload-to-github.sh
```

### For Windows:
```cmd
upload-to-github.bat
```

The script will guide you through the process automatically.

---

## 🎯 Method 2: Manual Upload (Step-by-Step)

### Step 1: Create a GitHub Account (if you don't have one)

1. Go to [https://github.com](https://github.com)
2. Click "Sign up"
3. Follow the registration process
4. Verify your email

### Step 2: Install Git (if not installed)

**Windows:**
- Download from: https://git-scm.com/download/win
- Run the installer with default settings

**Mac:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install git  # Ubuntu/Debian
sudo dnf install git      # Fedora
```

### Step 3: Configure Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 4: Create a New Repository on GitHub

1. Go to [https://github.com/new](https://github.com/new)
2. Fill in the details:
   - **Repository name**: `chargeflow` (or any name you prefer)
   - **Description**: `EV Charging Intelligence & Trip Planner`
   - **Public** (recommended for portfolio projects)
   - **❌ DO NOT** check "Add a README file"
   - **❌ DO NOT** check "Add .gitignore"
   - **❌ DO NOT** check "Choose a license"
3. Click **"Create repository"**

### Step 5: Upload Your Project

Open your terminal/command prompt in the ChargeFlow project folder and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: ChargeFlow - EV Charging Intelligence & Trip Planner"

# Connect to GitHub (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 6: GitHub Authentication

When prompted for authentication, you have two options:

**Option A: Personal Access Token (Recommended)**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "ChargeFlow Upload"
4. Select scope: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when git asks

**Option B: GitHub CLI (Easier)**
```bash
# Install GitHub CLI
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: see https://cli.github.com/

# Login
gh auth login

# Then push
git push -u origin main
```

---

## 🎯 Method 3: Using GitHub Desktop (Visual)

1. Download GitHub Desktop from [https://desktop.github.com](https://desktop.github.com)
2. Install and sign in with your GitHub account
3. Click "Add" → "Add Existing Repository"
4. Browse to your ChargeFlow folder
5. Click "Create Repository"
6. Write a commit message like "Initial commit"
7. Click "Commit to main"
8. Click "Publish repository"
9. Choose repository name and description
10. Click "Publish"

---

## ✅ Verify Your Upload

1. Go to `https://github.com/YOUR_USERNAME/YOUR_REPO`
2. Refresh the page
3. You should see all your project files
4. Check that README.md is displayed nicely

---

## 🚀 Next Steps

### Add a Website Preview
1. Go to your repository on GitHub
2. Click "Settings" → "Pages"
3. Under "Source", select "GitHub Actions"
4. Choose "Static HTML" workflow
5. Your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### Share Your Project
Add this badge to your portfolio or LinkedIn:
```markdown
[![ChargeFlow](https://img.shields.io/badge/⚡_ChargeFlow-Live_Project-brightgreen)](https://YOUR_USERNAME.github.io/chargeflow/)
```

---

## 🐛 Troubleshooting

### "Permission denied" error
- Make sure you're using the correct GitHub username
- Check that your Personal Access Token has `repo` scope
- Try using HTTPS instead of SSH

### "Repository not found" error
- Verify the repository exists on GitHub
- Check the URL format: `https://github.com/USERNAME/REPO.git`
- Make sure you have push access to the repository

### "Everything up-to-date" but files not showing
- Refresh the GitHub page
- Check that you pushed to the correct branch (main/master)
- Verify files were committed: `git log`

### Large files warning
- The project should be under 100MB
- If larger, check for node_modules: `git rm -r --cached node_modules`
- Add to .gitignore and commit again

---

## 📞 Need Help?

- GitHub Docs: https://docs.github.com
- Git Tutorial: https://git-scm.com/book/en/v2
- Stack Overflow: https://stackoverflow.com/questions/tagged/git

---

**Good luck with your GitHub upload! 🚀**
