@echo off
REM Example Windows Scheduled Task wrapper for the brand-os ingest CLI.
REM Adjust the paths below for your machine, then point Task Scheduler at this file.

set "LOG=%TEMP%\brand-os-ingest.log"
set "BRAND_OS_DIR=%USERPROFILE%\brand-os"
set "APP_DIR=%~dp0.."

echo. >> "%LOG%"
echo === Run %DATE% %TIME% === >> "%LOG%"
cd /d "%APP_DIR%"
node scripts\ingest.mjs >> "%LOG%" 2>&1
echo === Exit %ERRORLEVEL% === >> "%LOG%"
exit /b %ERRORLEVEL%
