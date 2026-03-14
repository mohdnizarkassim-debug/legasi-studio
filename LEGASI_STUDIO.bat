@echo off
title LEGASI STUDIO
color 0A
echo.
echo  ================================================
echo   LEGASI STUDIO v2.0 - Starting...
echo   SYSTEM BUILT BY COMMAND, TRADED BY DISCIPLINE
echo  ================================================
echo.
echo  [1/2] Starting server...
cd /d "%~dp0"
start "" http://localhost:5173
echo  [2/2] Opening browser...
echo.
echo  App is running at: http://localhost:5173
echo  Close this window to STOP the app.
echo.
npm run dev
pause
