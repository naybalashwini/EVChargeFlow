@echo off
echo.
echo ============================================
echo   ChargeFlow - EV Charging Trip Planner
echo   Setup Script for Windows
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm found:
npm --version
echo.

REM Install dependencies
echo [STEP 1/2] Installing dependencies...
echo This may take 1-2 minutes...
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Installation failed!
    echo Try deleting node_modules folder and package-lock.json, then run this script again.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully!
echo.

REM Start development server
echo [STEP 2/2] Starting development server...
echo.
echo ============================================
echo   ChargeFlow is starting!
echo   Open your browser to: http://localhost:3000
echo ============================================
echo.
echo Press Ctrl+C to stop the server.
echo.

call npm run dev

pause
