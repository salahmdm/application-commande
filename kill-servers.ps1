# Script PowerShell pour arrêter les serveurs et libérer les ports

Write-Host "🔍 Recherche des processus Node.js..." -ForegroundColor Cyan

# Trouver tous les processus Node.js
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "✅ Trouvé $($nodeProcesses.Count) processus Node.js" -ForegroundColor Green
    
    # Afficher les processus trouvés
    foreach ($proc in $nodeProcesses) {
        Write-Host "   - PID: $($proc.Id) | Démarrage: $($proc.StartTime)" -ForegroundColor Yellow
    }
    
    Write-Host "`n🛑 Arrêt des processus Node.js..." -ForegroundColor Cyan
    
    # Arrêter tous les processus Node.js
    $nodeProcesses | Stop-Process -Force
    
    Write-Host "✅ Tous les processus Node.js ont été arrêtés" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Aucun processus Node.js trouvé" -ForegroundColor Yellow
}

Write-Host "`n🔍 Vérification des ports..." -ForegroundColor Cyan

# Vérifier le port 5000
$port5000 = netstat -ano | findstr ":5000" | findstr "LISTENING"
if ($port5000) {
    Write-Host "⚠️ Le port 5000 est encore utilisé" -ForegroundColor Yellow
    Write-Host "   Résultat: $port5000" -ForegroundColor Gray
} else {
    Write-Host "✅ Le port 5000 est libre" -ForegroundColor Green
}

# Vérifier le port 3000
$port3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($port3000) {
    Write-Host "⚠️ Le port 3000 est encore utilisé" -ForegroundColor Yellow
    Write-Host "   Résultat: $port3000" -ForegroundColor Gray
} else {
    Write-Host "✅ Le port 3000 est libre" -ForegroundColor Green
}

Write-Host "`n✅ Script terminé. Tu peux maintenant démarrer les serveurs avec: npm run start" -ForegroundColor Green






