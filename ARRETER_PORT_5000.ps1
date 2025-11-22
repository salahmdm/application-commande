# Script pour arrêter le processus utilisant le port 5000
# Usage: .\ARRETER_PORT_5000.ps1

Write-Host "🔍 Recherche du processus sur le port 5000..." -ForegroundColor Yellow

$connection = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

if ($connection) {
    $pid = $connection.OwningProcess
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    
    Write-Host "✅ Processus trouvé:" -ForegroundColor Green
    Write-Host "   PID: $pid" -ForegroundColor White
    if ($process) {
        Write-Host "   Nom: $($process.ProcessName)" -ForegroundColor White
        Write-Host "   Chemin: $($process.Path)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "🛑 Arrêt du processus..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 2
    
    # Vérifier que le processus est arrêté
    $check = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
    if (-not $check) {
        Write-Host "✅ Port 5000 libéré avec succès !" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Le processus pourrait encore être en cours d'arrêt..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Le port 5000 est déjà libre" -ForegroundColor Green
}

Write-Host ""






