# Script PowerShell pour démarrer l'application Blossom Cafe

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Blossom Cafe - Demarrage Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Aller dans le répertoire du projet
Set-Location $PSScriptRoot

# Démarrer le backend en arrière-plan
Write-Host "🚀 Démarrage du backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node database/admin-api.js" -WindowStyle Normal

# Attendre 3 secondes pour que le backend démarre
Start-Sleep -Seconds 3

# Démarrer le frontend en arrière-plan
Write-Host "🚀 Démarrage du frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Application démarrée !" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

