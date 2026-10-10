@echo off
cd /d "%~dp0"
node --version >nul 2>&1
if errorlevel 1 (
 echo Install Node.js 22 or newer, then run this file again.
 pause
 exit /b 1
)
if not exist node_modules (
 echo Installing the project dependencies...
 call npm ci
 if errorlevel 1 (
  echo Installation failed. Check the error above and your internet connection.
  pause
  exit /b 1
 )
)
echo Keep this window open. Visit http://localhost:8081 once the server says Ready.
call npm run dev
pause
