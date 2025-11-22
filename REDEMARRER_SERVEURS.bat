@echo off
echo ===============================================================
echo   REDEMARRAGE DES SERVEURS - BLOSSOM CAFE
echo ===============================================================
echo.

echo [1/4] Arret des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo OK

echo [2/4] Demarrage du Backend (port 5000)...
start "Backend API - Port 5000" cmd /k "cd /d %~dp0database && node admin-api.js"

timeout /t 3 /nobreak >nul

echo [3/4] Demarrage du Frontend (port 3000)...
start "Frontend React - Port 3000" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 2 /nobreak >nul

echo [4/4] Verification...
echo.
echo ===============================================================
echo   SERVEURS DEMARRES
echo ===============================================================
echo.
echo URLs disponibles:
echo   - Frontend:    http://localhost:3000
echo   - Backend API: http://localhost:5000
echo   - Diagnostic:  http://localhost:3005
echo.
echo Appuyez sur une touche pour fermer...
pause >nul






