# ================================================================
# Script de Test de Connexion MySQL
# ================================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Test de Connexion MySQL" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_HOST = "127.0.0.1"
$DB_PORT = "3306"
$DB_USER = "root"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  Port: $DB_PORT" -ForegroundColor Gray
Write-Host "  User: $DB_USER" -ForegroundColor Gray
Write-Host ""

# Demander le mot de passe
$DB_PASSWORD = Read-Host "Entrez le mot de passe MySQL pour '$DB_USER'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Test de connexion en cours..." -ForegroundColor Yellow
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
        break
    }
}

if (-not $mysqlExe) {
    try {
        $mysqlExe = (Get-Command mysql -ErrorAction Stop).Source
    }
    catch {
        Write-Host "❌ Impossible de trouver mysql.exe" -ForegroundColor Red
        Write-Host ""
        Write-Host "Veuillez installer MySQL Server ou ajouter MySQL au PATH système" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ MySQL trouvé: $mysqlExe" -ForegroundColor Green
Write-Host ""

# Tester la connexion avec une simple requête
$testQuery = "SELECT VERSION() AS version, NOW() AS now, DATABASE() AS current_db;"

try {
    # Créer un fichier temporaire pour la requête
    $tempFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $tempFile -Value $testQuery
    
    # Exécuter la connexion et la requête de test
    $process = Start-Process -FilePath $mysqlExe `
        -ArgumentList "-h", $DB_HOST, "-P", $DB_PORT, "-u", $DB_USER, "-p$PlainPassword", "-e", "source $tempFile" `
        -RedirectStandardOutput "connection_test_output.txt" `
        -RedirectStandardError "connection_test_error.txt" `
        -NoNewWindow `
        -Wait `
        -PassThru
    
    # Nettoyer le fichier temporaire
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    if ($process.ExitCode -eq 0) {
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "  ✅ CONNEXION RÉUSSIE !" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        
        # Afficher les informations de connexion
        if (Test-Path "connection_test_output.txt") {
            $output = Get-Content "connection_test_output.txt"
            if ($output) {
                Write-Host "Informations MySQL:" -ForegroundColor Cyan
                $output | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
            }
        }
        
        Write-Host ""
        Write-Host "✅ Le serveur MySQL est accessible" -ForegroundColor Green
        Write-Host "✅ Les identifiants sont corrects" -ForegroundColor Green
        Write-Host "✅ Vous pouvez maintenant installer la base de données" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Prochaine étape:" -ForegroundColor Yellow
        Write-Host "  Exécutez: .\install.ps1" -ForegroundColor Cyan
        Write-Host ""
        
        # Vérifier si la base blossom_cafe existe déjà
        Write-Host "Vérification de la base de données blossom_cafe..." -ForegroundColor Yellow
        
        $checkDbQuery = "SHOW DATABASES LIKE 'blossom_cafe';"
        $tempFile2 = [System.IO.Path]::GetTempFileName()
        Set-Content -Path $tempFile2 -Value $checkDbQuery
        
        $checkProcess = Start-Process -FilePath $mysqlExe `
            -ArgumentList "-h", $DB_HOST, "-P", $DB_PORT, "-u", $DB_USER, "-p$PlainPassword", "-e", "source $tempFile2" `
            -RedirectStandardOutput "check_db_output.txt" `
            -RedirectStandardError "check_db_error.txt" `
            -NoNewWindow `
            -Wait `
            -PassThru
        
        Remove-Item $tempFile2 -ErrorAction SilentlyContinue
        
        if (Test-Path "check_db_output.txt") {
            $dbOutput = Get-Content "check_db_output.txt"
            if ($dbOutput -match "blossom_cafe") {
                Write-Host "⚠️  La base de données 'blossom_cafe' existe déjà" -ForegroundColor Yellow
                Write-Host "   Le script d'installation la supprimera et la recréera" -ForegroundColor Gray
            }
            else {
                Write-Host "✅ La base de données 'blossom_cafe' n'existe pas encore" -ForegroundColor Green
                Write-Host "   Prêt pour l'installation" -ForegroundColor Gray
            }
        }
        
        # Nettoyer les fichiers temporaires
        Remove-Item "check_db_output.txt" -ErrorAction SilentlyContinue
        Remove-Item "check_db_error.txt" -ErrorAction SilentlyContinue
        
    }
    else {
        Write-Host "=========================================" -ForegroundColor Red
        Write-Host "  ❌ ÉCHEC DE CONNEXION" -ForegroundColor Red
        Write-Host "=========================================" -ForegroundColor Red
        Write-Host ""
        
        if (Test-Path "connection_test_error.txt") {
            $errors = Get-Content "connection_test_error.txt"
            if ($errors) {
                Write-Host "Détails de l'erreur:" -ForegroundColor Yellow
                $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            }
        }
        
        Write-Host ""
        Write-Host "Causes possibles:" -ForegroundColor Yellow
        Write-Host "  1. Le serveur MySQL n'est pas démarré" -ForegroundColor Gray
        Write-Host "     Solution: net start MySQL80" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  2. Le mot de passe est incorrect" -ForegroundColor Gray
        Write-Host "     Solution: Vérifiez le mot de passe root MySQL" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  3. L'utilisateur root n'a pas les permissions" -ForegroundColor Gray
        Write-Host "     Solution: Vérifiez les permissions MySQL" -ForegroundColor Cyan
        Write-Host ""
        
        exit 1
    }
}
catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Nettoyer le mot de passe de la mémoire
    $PlainPassword = $null
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    
    # Nettoyer les fichiers temporaires
    Remove-Item "connection_test_output.txt" -ErrorAction SilentlyContinue
    Remove-Item "connection_test_error.txt" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

