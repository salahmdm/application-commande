@echo off
echo ========================================
echo   Blossom Cafe - Demarrage Application
echo ========================================
echo.
echo Demarrage du backend et du frontend...
echo.

cd /d "%~dp0"

REM Demarrer le backend en arriere-plan
start "Backend API" cmd /k "node database/admin-api.js"

REM Attendre 2 secondes pour que le backend demarre
timeout /t 2 /nobreak >nul

REM Demarrer le frontend
echo.
echo Demarrage du frontend...
start "Frontend Vite" cmd /k "npm run dev"

echo.
echo ========================================
echo   Application demarree !
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul

