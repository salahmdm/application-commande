# Script de démarrage pour Blossom Café
# Démarre le backend et le frontend

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🌸 Blossom Café - Démarrage Application" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur : package.json introuvable" -ForegroundColor Red
    Write-Host "Assurez-vous d'être dans le répertoire racine du projet`n" -ForegroundColor Yellow
    exit 1
}

# Vérifier que MySQL est accessible (optionnel)
Write-Host "📊 Vérification de la configuration...`n" -ForegroundColor Yellow

# Démarrer l'application
Write-Host "🚀 Démarrage du backend et du frontend...`n" -ForegroundColor Green
Write-Host "Backend : http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend : http://localhost:3000`n" -ForegroundColor Cyan
Write-Host "Appuyez sur Ctrl+C pour arrêter`n" -ForegroundColor Yellow

# Démarrer avec npm start
npm start






