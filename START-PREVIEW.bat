@echo off
title Heidt Studio - Local Preview
cd /d "%~dp0"
echo.
echo   Starting the Heidt Studio preview...
echo   Your browser will open at http://localhost:8080/
echo   Leave this window open while you look around. Close it to stop.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview-server.ps1" -Port 8080
echo.
echo   Preview stopped.
pause
