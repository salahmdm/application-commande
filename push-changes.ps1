# Script PowerShell pour pousser les changements vers GitHub

Write-Host "🔄 Vérification de l'état Git..." -ForegroundColor Cyan
git status

Write-Host "`n📦 Ajout des fichiers modifiés..." -ForegroundColor Cyan
git add .

Write-Host "`n💾 Création du commit..." -ForegroundColor Cyan
$commitMessage = "Migration Supabase: schéma et données transférées"
git commit -m $commitMessage

Write-Host "`n🚀 Push vers GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push réussi !" -ForegroundColor Green
} else {
    Write-Host "`n❌ Erreur lors du push. Code de sortie: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "`n💡 Vérifiez:" -ForegroundColor Yellow
    Write-Host "   1. Votre connexion Internet" -ForegroundColor Yellow
    Write-Host "   2. Vos credentials GitHub (cmdkey /list)" -ForegroundColor Yellow
    Write-Host "   3. Les permissions sur le dépôt" -ForegroundColor Yellow
}

