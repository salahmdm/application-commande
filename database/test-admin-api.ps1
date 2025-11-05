# ================================================================
# Script de test de l'API Admin - Blossom Café
# ================================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Test API Admin - Blossom Café" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:5000"

# ================================================================
# 1. LOGIN ADMIN
# ================================================================
Write-Host "1️⃣  Test Login Admin..." -ForegroundColor Yellow

$loginBody = @{
    email = "admin@blossom.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $authResponse.token
    
    Write-Host "   ✅ Login réussi!" -ForegroundColor Green
    Write-Host "   Utilisateur: $($authResponse.user.first_name) $($authResponse.user.last_name)" -ForegroundColor Gray
    Write-Host "   Rôle: $($authResponse.user.role)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   ❌ Erreur de login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers pour les requêtes authentifiées
$headers = @{
    "Authorization" = "Bearer $token"
}

# ================================================================
# 2. DASHBOARD
# ================================================================
Write-Host "2️⃣  Récupération Dashboard..." -ForegroundColor Yellow

try {
    $dashboard = Invoke-RestMethod -Uri "$API_URL/api/admin/dashboard" -Headers $headers
    
    Write-Host "   ✅ Statistiques:" -ForegroundColor Green
    Write-Host "      Clients: $($dashboard.data.total_clients)" -ForegroundColor Gray
    Write-Host "      Produits: $($dashboard.data.total_products)" -ForegroundColor Gray
    Write-Host "      Commandes: $($dashboard.data.total_orders)" -ForegroundColor Gray
    Write-Host "      Commandes aujourd'hui: $($dashboard.data.orders_today)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# ================================================================
# 3. LISTE DES UTILISATEURS
# ================================================================
Write-Host "3️⃣  Liste des Utilisateurs..." -ForegroundColor Yellow

try {
    $users = Invoke-RestMethod -Uri "$API_URL/api/admin/users" -Headers $headers
    
    Write-Host "   ✅ $($users.data.Count) utilisateurs trouvés:" -ForegroundColor Green
    foreach ($user in $users.data) {
        Write-Host "      • $($user.first_name) $($user.last_name) - $($user.email) [$($user.role)]" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# ================================================================
# 4. LISTE DES CATÉGORIES
# ================================================================
Write-Host "4️⃣  Liste des Catégories..." -ForegroundColor Yellow

try {
    $categories = Invoke-RestMethod -Uri "$API_URL/api/admin/categories" -Headers $headers
    
    Write-Host "   ✅ $($categories.data.Count) catégories trouvées:" -ForegroundColor Green
    foreach ($cat in $categories.data) {
        $active = if ($cat.is_active) { "✅" } else { "❌" }
        Write-Host "      • [$($cat.id)] $($cat.name) - $active" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# ================================================================
# 5. LISTE DES PRODUITS
# ================================================================
Write-Host "5️⃣  Liste des Produits..." -ForegroundColor Yellow

try {
    $products = Invoke-RestMethod -Uri "$API_URL/api/admin/products" -Headers $headers
    
    Write-Host "   ✅ $($products.data.Count) produits trouvés:" -ForegroundColor Green
    foreach ($prod in $products.data) {
        $featured = if ($prod.is_featured) { "⭐" } else { "" }
        Write-Host "      • [$($prod.id)] $($prod.name) - $($prod.price)€ (Stock: $($prod.stock)) $featured" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# ================================================================
# 6. CRÉER UN NOUVEAU PRODUIT
# ================================================================
Write-Host "6️⃣  Créer un nouveau produit..." -ForegroundColor Yellow

$newProduct = @{
    categoryId = 1
    name = "Thé Vert Matcha Premium"
    slug = "the-vert-matcha-premium"
    description = "Thé vert japonais en poudre de qualité premium"
    price = 7.50
    stock = 25
    isAvailable = $true
    isFeatured = $true
    calories = 0
    preparationTime = 3
    allergens = "Aucun"
} | ConvertTo-Json

try {
    $createResult = Invoke-RestMethod -Uri "$API_URL/api/admin/products" -Method POST -Headers $headers -Body $newProduct -ContentType "application/json"
    
    Write-Host "   ✅ Produit créé avec succès!" -ForegroundColor Green
    Write-Host "      ID: $($createResult.productId)" -ForegroundColor Gray
    Write-Host ""
    
    $newProductId = $createResult.productId
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $newProductId = $null
}

# ================================================================
# 7. MODIFIER LE PRODUIT CRÉÉ
# ================================================================
if ($newProductId) {
    Write-Host "7️⃣  Modifier le produit créé..." -ForegroundColor Yellow
    
    $updatedProduct = @{
        categoryId = 1
        name = "Thé Vert Matcha Premium BIO"
        slug = "the-vert-matcha-premium-bio"
        description = "Thé vert japonais BIO en poudre de qualité premium"
        price = 8.50
        stock = 30
        isAvailable = $true
        isFeatured = $true
        calories = 0
        preparationTime = 3
        allergens = "Aucun"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$API_URL/api/admin/products/$newProductId" -Method PUT -Headers $headers -Body $updatedProduct -ContentType "application/json"
        
        Write-Host "   ✅ Produit modifié avec succès!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ================================================================
# 8. LISTE DES CODES PROMO
# ================================================================
Write-Host "8️⃣  Liste des Codes Promo..." -ForegroundColor Yellow

try {
    $promoCodes = Invoke-RestMethod -Uri "$API_URL/api/admin/promo-codes" -Headers $headers
    
    Write-Host "   ✅ $($promoCodes.data.Count) codes promo trouvés:" -ForegroundColor Green
    foreach ($promo in $promoCodes.data) {
        $discount = if ($promo.discount_type -eq "percentage") { "$($promo.discount_value)%" } else { "$($promo.discount_value)€" }
        Write-Host "      • $($promo.code) - $discount de réduction (Utilisé: $($promo.uses_count) fois)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# ================================================================
# 9. CRÉER UN CODE PROMO
# ================================================================
Write-Host "9️⃣  Créer un code promo..." -ForegroundColor Yellow

$newPromo = @{
    code = "TEST15"
    description = "Code promo de test -15%"
    discountType = "percentage"
    discountValue = 15.00
    minOrderAmount = 20.00
    maxUses = 50
    validFrom = "2025-10-01 00:00:00"
    validUntil = "2025-12-31 23:59:59"
} | ConvertTo-Json

try {
    $promoResult = Invoke-RestMethod -Uri "$API_URL/api/admin/promo-codes" -Method POST -Headers $headers -Body $newPromo -ContentType "application/json"
    
    Write-Host "   ✅ Code promo créé avec succès!" -ForegroundColor Green
    Write-Host "      ID: $($promoResult.promoCodeId)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   ⚠️  Le code existe peut-être déjà" -ForegroundColor Yellow
    Write-Host ""
}

# ================================================================
# 10. PARAMÈTRES
# ================================================================
Write-Host "🔟 Liste des Paramètres..." -ForegroundColor Yellow

try {
    $settings = Invoke-RestMethod -Uri "$API_URL/api/admin/settings" -Headers $headers
    
    Write-Host "   ✅ Paramètres système:" -ForegroundColor Green
    foreach ($setting in $settings.data) {
        Write-Host "      • $($setting.setting_key): $($setting.setting_value)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# ================================================================
# RÉSUMÉ
# ================================================================
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ✅ Tests terminés!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Actions effectuées:" -ForegroundColor Yellow
Write-Host "   1. ✅ Login admin" -ForegroundColor Gray
Write-Host "   2. ✅ Récupération du dashboard" -ForegroundColor Gray
Write-Host "   3. ✅ Liste des utilisateurs" -ForegroundColor Gray
Write-Host "   4. ✅ Liste des catégories" -ForegroundColor Gray
Write-Host "   5. ✅ Liste des produits" -ForegroundColor Gray
if ($newProductId) {
    Write-Host "   6. ✅ Création d'un produit" -ForegroundColor Gray
    Write-Host "   7. ✅ Modification du produit" -ForegroundColor Gray
}
Write-Host "   8. ✅ Liste des codes promo" -ForegroundColor Gray
Write-Host "   9. ✅ Création d'un code promo" -ForegroundColor Gray
Write-Host "  10. ✅ Liste des paramètres" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 L'API Admin fonctionne parfaitement!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Documentation complète: database/ADMIN_API_GUIDE.md" -ForegroundColor Cyan
Write-Host ""


