# Test rapide de l'API Admin
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Test Rapide API Admin" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:5000"

# Test de santé
Write-Host "🏥 Test de connexion au serveur..." -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 1
    Invoke-WebRequest -Uri "$API_URL/api/health" -UseBasicParsing -ErrorAction Stop | Out-Null
    Write-Host "✅ Serveur accessible!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️  Serveur non accessible, démarrage en cours..." -ForegroundColor Yellow
    Write-Host ""
}

# Test Login
Write-Host "🔐 Test Login Admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@blossom.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $auth = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login réussi!" -ForegroundColor Green
    Write-Host "   Utilisateur: $($auth.user.first_name) $($auth.user.last_name)" -ForegroundColor Gray
    Write-Host "   Email: $($auth.user.email)" -ForegroundColor Gray
    Write-Host "   Rôle: $($auth.user.role)" -ForegroundColor Gray
    Write-Host ""
    
    $token = $auth.token
    $headers = @{ "Authorization" = "Bearer $token" }
    
    # Test Dashboard
    Write-Host "📊 Test Dashboard..." -ForegroundColor Yellow
    $dashboard = Invoke-RestMethod -Uri "$API_URL/api/admin/dashboard" -Headers $headers
    Write-Host "✅ Dashboard accessible!" -ForegroundColor Green
    Write-Host "   Clients: $($dashboard.data.total_clients)" -ForegroundColor Gray
    Write-Host "   Produits: $($dashboard.data.total_products)" -ForegroundColor Gray
    Write-Host "   Commandes: $($dashboard.data.total_orders)" -ForegroundColor Gray
    Write-Host ""
    
    # Test Liste Produits
    Write-Host "🛍️  Test Liste Produits..." -ForegroundColor Yellow
    $products = Invoke-RestMethod -Uri "$API_URL/api/admin/products" -Headers $headers
    Write-Host "✅ $($products.data.Count) produits trouvés!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Produits disponibles:" -ForegroundColor Cyan
    foreach ($prod in $products.data | Select-Object -First 5) {
        $featured = if ($prod.is_featured) { "⭐" } else { "  " }
        Write-Host "   $featured [$($prod.id)] $($prod.name) - $($prod.price)€ (Stock: $($prod.stock))" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  ✅ API Admin Fonctionnelle!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URL API: $API_URL" -ForegroundColor Cyan
    Write-Host "🔐 Token JWT généré avec succès" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📖 Documentation: database/ADMIN_API_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    
}
catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Le serveur est peut-être encore en démarrage." -ForegroundColor Yellow
    Write-Host "Attendez quelques secondes et réessayez." -ForegroundColor Yellow
    Write-Host ""
}

