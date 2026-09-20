@echo off
REM ============================================
REM ChargeFlow - GitHub Upload Script (Windows)
REM ============================================

echo.
echo ========================================
echo   ChargeFlow - GitHub Upload
echo ========================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed!
    echo Please install git first: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo [OK] Git found
git --version
echo.

REM Get GitHub username
set /p GITHUB_USER="Enter your GitHub username: "
set /p REPO_NAME="Enter repository name (default: chargeflow): "
if "%REPO_NAME%"=="" set REPO_NAME=chargeflow

echo.
echo Repository will be: https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.

REM Initialize git if not already
if not exist ".git" (
    echo Initializing git repository...
    git init
    git add .
    git commit -m "Initial commit: ChargeFlow - EV Charging Intelligence ^& Trip Planner"
    echo [OK] Git initialized and committed
) else (
    echo [OK] Git already initialized
)

echo.
echo ========================================
echo   Manual Setup Required:
echo ========================================
echo.
echo Step 1: Create a new repository on GitHub
echo    - Go to: https://github.com/new
echo    - Repository name: %REPO_NAME%
echo    - Description: EV Charging Intelligence ^& Trip Planner
echo    - Make it Public
echo    - DO NOT initialize with README
echo    - Click 'Create repository'
echo.
echo Step 2: After creating, come back here and press Enter
echo.
pause

echo.
echo Connecting to GitHub...

REM Set up remote
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

REM Get current branch
for /f %%i in ('git branch --show-current 2^>nul') do set BRANCH=%%i
if "%BRANCH%"=="" (
    set BRANCH=main
    git branch -M main
)

echo Pushing to GitHub...
git push -u origin %BRANCH%

echo.
echo ========================================
echo   SUCCESS!
echo ========================================
echo.
echo Repository: https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.
echo Your ChargeFlow project is now on GitHub!
echo.
pause
