@echo off
setlocal
cd /d "%~dp0"
echo.
echo ================================================
echo       SAVE YOUR PARTNER - FORTRESS V7.2
echo ================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install Node.js LTS from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
echo Node.js detected:
node --version
npm --version
echo.
echo Installing project dependencies. First run may take a few minutes...
npm install
if errorlevel 1 goto fail
npm run install:all
if errorlevel 1 goto fail
echo.
echo Starting player and server...
npm run dev
exit /b 0
:fail
echo.
echo INSTALLATION FAILED. Read the error above.
pause
exit /b 1
