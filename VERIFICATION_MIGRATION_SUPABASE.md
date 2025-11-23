# 🔍 Vérification Migration MySQL → Supabase

## ✅ Services MIGRÉS (utilisent Supabase quand backend indisponible)

Ces services utilisent `shouldUseSupabase()` et appellent `supabaseService` directement quand `VITE_API_URL` n'est pas défini :

1. **`kioskService.js`** ✅
   - `getCategories()` → `supabaseService.getCategories()`
   - `getProductsByCategory()` → `supabaseService.getProducts()`

2. **`productService.js`** ✅
   - `getAllProducts()` → `supabaseService.getProducts()`
   - `getAllProductsAdmin()` → `supabaseService.getProducts()`
   - `getCategories()` → `supabaseService.getCategories()`

3. **`newsService.js`** ✅
   - `getNews()` → `supabaseService.getNews()`

4. **`settingsService.js`** ✅
   - `getAllSettings()` → `supabaseService.getAllSettings()`
   - `getSetting()` → `supabaseService.getSetting()`

5. **`orderService.js`** ✅ MIGRÉ (fonctionnalités principales)
   - `createOrder()` → `supabaseService.createOrder()` ✅
   - `getUserOrders()` → `supabaseService.getOrders()` ✅
   - `getAllOrders()` → `supabaseService.getOrders()` ✅
   - `getOrderById()` → `supabaseService.getOrderById()` ✅
   - `updateOrderStatus()` → `supabaseService.updateOrder()` ✅
   - `cancelOrder()` → API backend ⚠️ (peut utiliser updateOrder avec status='cancelled')
   - `getOrderStats()` → API backend ❌ (nécessite calculs complexes)
   - `updatePaymentStatus()` → API backend ⚠️ (peut utiliser updateOrder)
   - `completePaymentWorkflow()` → API backend ⚠️ (nécessite logique métier)

## ❌ Services NON MIGRÉS (utilisent uniquement l'API backend)

Ces services doivent être adaptés pour utiliser Supabase quand le backend n'est pas disponible :

1. **`inventoryService.js`** ❌
   - `getInventory()`
   - `addInventoryItem()`
   - `updateInventoryItem()`
   - `deleteInventoryItem()`

2. **`homeService.js`** ❌
   - `getHomeStats()`

3. **`dashboardService.js`** ❌
   - `getDashboardStats()`
   - `getSalesStats()`
   - `getTopProducts()`
   - `getRevenueByCategory()`
   - `getOrdersPeriod()`
   - `getCustomersStats()`

4. **`adminService.js`** ❌
   - `getAllUsers()`
   - `getUserById()`
   - `createUser()`
   - `updateUser()`
   - `deleteUser()`
   - `getAllOrders()`
   - `getOrderById()`
   - `updateOrderStatus()`
   - `cancelOrder()`
   - `getAllProducts()`
   - `createProduct()`
   - `updateProduct()`
   - `deleteProduct()`
   - `getAllCategories()`
   - `createCategory()`
   - `updateCategory()`
   - `deleteCategory()`
   - `getAllPromoCodes()`
   - `createPromoCode()`
   - `updatePromoCode()`
   - `deletePromoCode()`
   - `getAllLoyaltyRewards()`
   - `createLoyaltyReward()`
   - `updateLoyaltyReward()`
   - `deleteLoyaltyReward()`

5. **`shoppingListService.js`** ❌
   - `getShoppingList()`
   - `addToShoppingList()`
   - `autoAddLowStock()`
   - `updateShoppingListItem()`
   - `deleteShoppingListItem()`
   - `exportShoppingList()`

6. **`authService.js`** ⚠️ (utilise Firebase maintenant, mais certaines méthodes peuvent encore utiliser MySQL)
   - Vérifier si toutes les méthodes utilisent Firebase

7. **`secureAuthService.js`** ❌
   - Vérifier si nécessaire (peut être obsolète si Firebase est utilisé)

8. **`businessInfoService.js`** ❌
   - Vérifier les méthodes utilisées

9. **`restaurantInfoService.js`** ❌
   - Vérifier les méthodes utilisées

10. **`paymentService.js`** ❌
    - Vérifier les méthodes utilisées

## 🔍 Méthodes Supabase manquantes

Vérifier si `supabaseService.js` a toutes les méthodes nécessaires :

### ✅ Déjà implémentées dans supabaseService :
- `getProducts()`
- `getProductById()`
- `getCategories()`
- `getNews()`
- `getSetting()`
- `getAllSettings()`
- `createOrder()`
- `getOrderById()`
- `updateOrder()`
- `getUserById()`
- `getUserByEmail()`
- `createUser()`
- `updateUser()`
- `deleteUser()`

### ❌ Manquantes dans supabaseService :
- `getOrders()` (avec filtres)
- `getInventory()`
- `getShoppingList()`
- `getDashboardStats()`
- `getSalesStats()`
- `getTopProducts()`
- `getRevenueByCategory()`
- `getAllUsers()`
- `getAllProducts()` (admin)
- `createProduct()`
- `updateProduct()`
- `deleteProduct()`
- `createCategory()`
- `updateCategory()`
- `deleteCategory()`
- `getAllPromoCodes()`
- `createPromoCode()`
- `updatePromoCode()`
- `deletePromoCode()`
- `getAllLoyaltyRewards()`
- `createLoyaltyReward()`
- `updateLoyaltyReward()`
- `deleteLoyaltyReward()`

## 📋 Plan d'action

### Priorité 1 : Fonctionnalités critiques pour Vercel (sans backend)
1. ✅ **Commandes** - `orderService.createOrder()` (FAIT)
2. ⚠️ **Commandes** - `orderService.getUserOrders()` (À FAIRE)
3. ✅ **Produits** - `productService.getAllProducts()` (FAIT)
4. ✅ **Catégories** - `productService.getCategories()` (FAIT)
5. ✅ **Actualités** - `newsService.getNews()` (FAIT)
6. ✅ **Paramètres** - `settingsService.getSetting()` (FAIT)

### Priorité 2 : Fonctionnalités admin (peuvent nécessiter backend)
1. ⚠️ **Commandes admin** - `orderService.getAllOrders()`, `updateOrderStatus()`, etc.
2. ⚠️ **Utilisateurs admin** - `adminService.getAllUsers()`, `createUser()`, etc.
3. ⚠️ **Produits admin** - `adminService.createProduct()`, `updateProduct()`, etc.
4. ⚠️ **Dashboard** - `dashboardService.getDashboardStats()`, etc.

### Priorité 3 : Fonctionnalités secondaires
1. ⚠️ **Inventaire** - `inventoryService.*`
2. ⚠️ **Liste de courses** - `shoppingListService.*`
3. ⚠️ **Infos business** - `businessInfoService.*`, `restaurantInfoService.*`

## 🎯 Recommandations

1. **Pour Vercel (production sans backend)** :
   - Les fonctionnalités critiques sont migrées ✅
   - Les fonctionnalités admin peuvent rester sur backend (si disponible)
   - Ajouter un fallback gracieux pour les fonctionnalités non migrées

2. **Pour développement local** :
   - Garder le backend MySQL pour les fonctionnalités admin
   - Utiliser Supabase pour les fonctionnalités client

3. **Migration complète** :
   - Implémenter toutes les méthodes manquantes dans `supabaseService.js`
   - Adapter tous les services pour utiliser `shouldUseSupabase()`
   - Tester toutes les fonctionnalités

