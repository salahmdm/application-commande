# Script de démarrage des serveurs Blossom Café
# Usage: .\DEMARRER_SERVEURS.ps1

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 DÉMARRAGE DES SERVEURS - BLOSSOM CAFÉ" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier si les ports sont déjà utilisés
$port5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$port3010 = Get-NetTCPConnection -LocalPort 3010 -State Listen -ErrorAction SilentlyContinue

if ($port5000) {
    Write-Host "⚠️  Le port 5000 est déjà utilisé (Backend)" -ForegroundColor Yellow
    Write-Host "   PID: $($port5000.OwningProcess)" -ForegroundColor Gray
    $killBackend = Read-Host "   Voulez-vous arrêter ce processus ? (O/N)"
    if ($killBackend -eq "O" -or $killBackend -eq "o") {
        Stop-Process -Id $port5000.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Processus arrêté" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

if ($port3000) {
    Write-Host "⚠️  Le port 3000 est déjà utilisé (Frontend)" -ForegroundColor Yellow
    Write-Host "   PID: $($port3000.OwningProcess)" -ForegroundColor Gray
    $killFrontend = Read-Host "   Voulez-vous arrêter ce processus ? (O/N)"
    if ($killFrontend -eq "O" -or $killFrontend -eq "o") {
        Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Processus arrêté" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

if ($port3010) {
    Write-Host "⚠️  Le port 3010 est déjà utilisé (Kiosk)" -ForegroundColor Yellow
    Write-Host "   PID: $($port3010.OwningProcess)" -ForegroundColor Gray
    $killKiosk = Read-Host "   Voulez-vous arrêter ce processus ? (O/N)"
    if ($killKiosk -eq "O" -or $killKiosk -eq "o") {
        Stop-Process -Id $port3010.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Processus arrêté" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "📦 Démarrage du Backend (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\database'; Write-Host '🔌 BACKEND API - Port 5000' -ForegroundColor Green; Write-Host '================================' -ForegroundColor Green; Write-Host ''; node admin-api.js"

Start-Sleep -Seconds 3

Write-Host "📦 Démarrage du Frontend (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD'; Write-Host '🖥️  FRONTEND REACT - Port 3000' -ForegroundColor Blue; Write-Host '================================' -ForegroundColor Blue; Write-Host ''; npm run dev"

Start-Sleep -Seconds 3

Write-Host "📦 Démarrage du Kiosk (port 3010)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD'; Write-Host '🖥️  KIOSK - Port 3010' -ForegroundColor Magenta; Write-Host '================================' -ForegroundColor Magenta; Write-Host ''; npm run dev:kiosk"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Serveurs démarrés !" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs disponibles :" -ForegroundColor Cyan
Write-Host "   • Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "   • Kiosk:       http://localhost:3010" -ForegroundColor White
Write-Host "   • Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "   • Diagnostic:  http://localhost:3005" -ForegroundColor White
Write-Host ""
Write-Host "💡 Attendez quelques secondes que les serveurs démarrent complètement." -ForegroundColor Yellow
Write-Host ""






