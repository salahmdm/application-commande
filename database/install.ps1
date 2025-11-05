# ================================================================
# Script d'installation de la base de données Blossom Café
# Pour Windows PowerShell
# ================================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Blossom Café - Installation BDD" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_HOST = "127.0.0.1"
$DB_PORT = "3306"
$DB_USER = "root"
$SQL_FILE = Join-Path $PSScriptRoot "blossom_cafe_schema.sql"

# Vérifier que le fichier SQL existe
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "❌ Erreur: Le fichier SQL n'existe pas: $SQL_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Fichier SQL trouvé: $SQL_FILE" -ForegroundColor Green
Write-Host ""

# Demander le mot de passe MySQL
Write-Host "🔐 Connexion à MySQL..." -ForegroundColor Yellow
Write-Host "   Host: $DB_HOST" -ForegroundColor Gray
Write-Host "   Port: $DB_PORT" -ForegroundColor Gray
Write-Host "   User: $DB_USER" -ForegroundColor Gray
Write-Host ""

$DB_PASSWORD = Read-Host "Entrez le mot de passe MySQL pour l'utilisateur '$DB_USER'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "🚀 Installation en cours..." -ForegroundColor Yellow
Write-Host ""

# Essayer de trouver mysql.exe
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe"
)

$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        Write-Host "✅ MySQL trouvé: $mysqlExe" -ForegroundColor Green
        break
    }
}

if (-not $mysqlExe) {
    # Essayer de trouver mysql dans le PATH
    try {
        $mysqlExe = (Get-Command mysql -ErrorAction Stop).Source
        Write-Host "✅ MySQL trouvé dans le PATH: $mysqlExe" -ForegroundColor Green
    }
    catch {
        Write-Host ""
        Write-Host "❌ Impossible de trouver mysql.exe" -ForegroundColor Red
        Write-Host ""
        Write-Host "Solutions possibles:" -ForegroundColor Yellow
        Write-Host "  1. Ajoutez MySQL au PATH système" -ForegroundColor Gray
        Write-Host "  2. Utilisez MySQL Workbench pour exécuter le script manuellement" -ForegroundColor Gray
        Write-Host "  3. Spécifiez le chemin complet vers mysql.exe" -ForegroundColor Gray
        Write-Host ""
        
        $manualPath = Read-Host "Entrez le chemin complet vers mysql.exe (ou laissez vide pour annuler)"
        if ([string]::IsNullOrWhiteSpace($manualPath)) {
            Write-Host "❌ Installation annulée" -ForegroundColor Red
            exit 1
        }
        
        if (-not (Test-Path $manualPath)) {
            Write-Host "❌ Chemin invalide: $manualPath" -ForegroundColor Red
            exit 1
        }
        
        $mysqlExe = $manualPath
    }
}

Write-Host ""
Write-Host "⏳ Exécution du script SQL..." -ForegroundColor Yellow

# Exécuter le script SQL
try {
    $process = Start-Process -FilePath $mysqlExe `
        -ArgumentList "-h", $DB_HOST, "-P", $DB_PORT, "-u", $DB_USER, "-p$PlainPassword" `
        -RedirectStandardInput $SQL_FILE `
        -RedirectStandardOutput "install_output.log" `
        -RedirectStandardError "install_error.log" `
        -NoNewWindow `
        -Wait `
        -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "  ✅ Installation réussie !" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "📊 Base de données créée: blossom_cafe" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "📋 Données de test incluses:" -ForegroundColor Yellow
        Write-Host "   • 5 utilisateurs (1 client, 1 manager, 1 admin, 2 clients)" -ForegroundColor Gray
        Write-Host "   • 14 produits dans 5 catégories" -ForegroundColor Gray
        Write-Host "   • 4 commandes de test" -ForegroundColor Gray
        Write-Host "   • 4 codes promo actifs" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "👥 Comptes de test:" -ForegroundColor Yellow
        Write-Host "   Client:  client@blossom.com" -ForegroundColor Gray
        Write-Host "   Manager: manager@blossom.com" -ForegroundColor Gray
        Write-Host "   Admin:   admin@blossom.com" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "🎫 Codes promo de test:" -ForegroundColor Yellow
        Write-Host "   WELCOME10 - 10% de réduction" -ForegroundColor Gray
        Write-Host "   SUMMER20  - 20% de réduction" -ForegroundColor Gray
        Write-Host "   VIP30     - 30% de réduction" -ForegroundColor Gray
        Write-Host "   FIRST5    - 5€ de réduction" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
        Write-Host "   1. Ouvrez MySQL Workbench pour explorer la base" -ForegroundColor Gray
        Write-Host "   2. Configurez votre fichier .env avec les paramètres de connexion" -ForegroundColor Gray
        Write-Host "   3. Créez votre backend API pour connecter React à MySQL" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "📚 Documentation:" -ForegroundColor Yellow
        Write-Host "   Consultez database/INSTALLATION.md pour plus d'informations" -ForegroundColor Gray
        Write-Host ""
        
        # Lire et afficher le résumé du log
        if (Test-Path "install_output.log") {
            $output = Get-Content "install_output.log" -Tail 5
            if ($output) {
                Write-Host "📊 Résumé:" -ForegroundColor Cyan
                $output | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
            }
        }
    }
    else {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'installation" -ForegroundColor Red
        Write-Host ""
        
        if (Test-Path "install_error.log") {
            $errors = Get-Content "install_error.log"
            if ($errors) {
                Write-Host "Détails de l'erreur:" -ForegroundColor Yellow
                $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            }
        }
        
        Write-Host ""
        Write-Host "💡 Solutions possibles:" -ForegroundColor Yellow
        Write-Host "   1. Vérifiez que MySQL Server est démarré" -ForegroundColor Gray
        Write-Host "   2. Vérifiez le mot de passe root MySQL" -ForegroundColor Gray
        Write-Host "   3. Consultez le fichier install_error.log pour plus de détails" -ForegroundColor Gray
        Write-Host "   4. Utilisez MySQL Workbench pour exécuter le script manuellement" -ForegroundColor Gray
        Write-Host ""
        
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Exception: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}
finally {
    # Nettoyer le mot de passe de la mémoire
    $PlainPassword = $null
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

