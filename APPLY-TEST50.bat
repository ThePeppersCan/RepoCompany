@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLY-TEST50.ps1" -SitePath "%~dp0"
echo.
pause
