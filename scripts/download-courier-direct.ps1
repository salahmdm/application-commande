# Script PowerShell pour télécharger la police Courier Prime depuis Google Fonts
# Usage: powershell -ExecutionPolicy Bypass -File scripts\download-courier-direct.ps1

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$fontsDir = Join-Path $projectRoot "public\fonts"
$fontPath = Join-Path $fontsDir "Courier-Regular.ttf"

# Créer le dossier si nécessaire
if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir -Force | Out-Null
    Write-Host "📁 Dossier créé: $fontsDir" -ForegroundColor Green
}

Write-Host "📥 Téléchargement de la police Courier Prime..." -ForegroundColor Yellow

# URL directe depuis Google Fonts CDN
$fontUrl = "https://github.com/google/fonts/raw/main/apache/courierprime/CourierPrime-Regular.ttf"

try {
    # Utiliser Invoke-WebRequest avec gestion des erreurs
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $fontUrl -OutFile $fontPath -UseBasicParsing -ErrorAction Stop
    
    $fileSize = (Get-Item $fontPath).Length
    if ($fileSize -gt 0) {
        Write-Host "✅ Police téléchargée avec succès!" -ForegroundColor Green
        Write-Host "   Emplacement: $fontPath" -ForegroundColor Gray
        Write-Host "   Taille: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Gray
    } else {
        Write-Host "❌ Le fichier téléchargé est vide" -ForegroundColor Red
        Remove-Item $fontPath -ErrorAction SilentlyContinue
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors du téléchargement: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative manuelle:" -ForegroundColor Yellow
    Write-Host "   1. Allez sur: https://fonts.google.com/specimen/Courier+Prime" -ForegroundColor Cyan
    Write-Host "   2. Cliquez sur 'Download family'" -ForegroundColor Gray
    Write-Host "   3. Extrayez le ZIP" -ForegroundColor Gray
    Write-Host "   4. Copiez CourierPrime-Regular.ttf dans: $fontsDir" -ForegroundColor Gray
    Write-Host "   5. Renommez-le en: Courier-Regular.ttf" -ForegroundColor Gray
    exit 1
}
