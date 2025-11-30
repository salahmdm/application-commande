# 📊 Rapport de Migration MySQL → Supabase

## ✅ Éléments déjà migrés vers Supabase

### Endpoints Produits (100% migré)
- ✅ `GET /api/admin/products` - Liste des produits
- ✅ `POST /api/admin/products` - Création de produit
- ✅ `PUT /api/admin/products/:id` - Modification de produit
- ✅ `PUT /api/admin/products/:id/toggle` - Toggle disponibilité
- ✅ `DELETE /api/admin/products/:id` - Suppression de produit
- ✅ `DELETE /api/admin/products/:id/image` - Suppression d'image
- ✅ `GET /api/products/all` - Tous les produits (authentifiés)

### Configuration
- ✅ `pool` est défini comme `supabaseService` (ligne 410)
- ✅ Tous les appels `pool.query()` utilisent le service Supabase

## ⚠️ Éléments utilisant encore MySQL (à migrer)

### 1. Endpoints Utilisateurs (Users)
**Fichier**: `database/admin-api.js`
- `POST /api/auth/login` - Ligne 834-841 (fallback MySQL)
- `PUT /api/users/:id` - Ligne 949 (UPDATE last_login)
- `GET /api/admin/users` - Ligne 2433+ (SELECT users)
- `POST /api/admin/users` - Ligne 1276+ (INSERT user)
- `PUT /api/admin/users/:id` - Ligne 2699+ (UPDATE user)
- `DELETE /api/admin/users/:id` - Ligne 3225 (DELETE user)
- Et plusieurs autres endpoints utilisateurs

### 2. Endpoints Commandes (Orders)
**Fichier**: `database/admin-api.js`
- `GET /api/admin/orders` - Ligne 1878+ (SELECT orders)
- `POST /api/admin/orders` - Ligne 2167+ (INSERT order)
- `PUT /api/admin/orders/:id/status` - Ligne 4611+ (UPDATE order)
- `GET /api/manager/today-orders` - Ligne 6194+ (SELECT orders)
- Et plusieurs autres endpoints commandes

### 3. Endpoints Statistiques (Dashboard)
**Fichier**: `database/admin-api.js`
- `GET /api/admin/analytics/revenue-comparison` - Ligne 5851+ (SELECT stats)
- `GET /api/admin/analytics/top-products-period` - Ligne 5923+ (SELECT products)
- `GET /api/admin/analytics/peak-hours` - Ligne 6547+ (SELECT hours)
- `GET /api/manager/today-stats` - Ligne 6219+ (SELECT stats)
- Et plusieurs autres endpoints statistiques

### 4. Endpoints Inventaire (Ingredients)
**Fichier**: `database/admin-api.js`
- `GET /api/inventory` - Ligne 7466+ (SELECT ingredients)
- `POST /api/inventory` - Ligne 7592+ (INSERT ingredient)
- `PUT /api/inventory/:id` - Ligne 7625+ (UPDATE ingredient)
- `DELETE /api/inventory/:id` - Ligne 7840+ (DELETE ingredient)

### 5. Endpoints Liste de Courses (Shopping List)
**Fichier**: `database/admin-api.js`
- `GET /api/shopping-list` - Ligne 7980+ (SELECT shopping_list)
- `POST /api/shopping-list/:id/mark-received` - Ligne 7899+ (UPDATE)

### 6. Endpoints Loyalty Points
**Fichier**: `database/admin-api.js`
- `GET /api/admin/loyalty/rewards` - Ligne 4114+ (SELECT rewards)
- `POST /api/admin/loyalty/rewards` - Ligne 4145+ (INSERT reward)
- `PUT /api/users/:id/loyalty-points` - Ligne 3587+ (UPDATE points)

### 7. Endpoints Catégories
**Fichier**: `database/admin-api.js`
- `GET /api/admin/categories` - Ligne 7466+ (SELECT categories)
- `POST /api/admin/categories` - Utilise déjà Supabase ✅
- `PUT /api/admin/categories/:id` - Utilise déjà Supabase ✅
- `DELETE /api/admin/categories/:id` - Utilise déjà Supabase ✅

## 📝 Commentaires et Logs (Non critiques)

Ces éléments mentionnent MySQL mais ne sont pas critiques :
- Commentaires dans le code
- Messages de log
- Documentation
- Scripts de migration/utilitaire (peuvent garder MySQL)

## 🔧 Scripts de Migration (Peuvent garder MySQL)

Ces scripts sont des outils de migration et peuvent garder MySQL :
- `database/sync-mysql-to-supabase.js`
- `database/delete-all-orders.js`
- `database/verify-and-sync-products.js`
- Et autres scripts dans `database/`

## 📊 Statistiques

- **Total appels `pool.query()`**: ~116 dans `admin-api.js`
- **Endpoints produits migrés**: 7/7 (100%)
- **Endpoints autres à migrer**: ~100+ appels restants

## 🎯 Priorités de Migration

### Priorité HAUTE (Fonctionnalités critiques)
1. ✅ **Produits** - DÉJÀ MIGRÉ
2. **Commandes** - Création, modification, statut
3. **Utilisateurs** - Login, gestion des comptes
4. **Inventaire** - CRUD complet

### Priorité MOYENNE
5. **Statistiques Dashboard** - Analytics
6. **Loyalty Points** - Système de fidélité
7. **Liste de courses** - Gestion des achats

### Priorité BASSE
8. Scripts de migration/utilitaire (peuvent rester en MySQL)

## 💡 Note Importante

**Tous les appels `pool.query()` utilisent maintenant `supabaseService`** grâce à l'alias `const pool = supabaseService` (ligne 410).

Cependant, beaucoup d'appels utilisent encore du **SQL MySQL brut** qui est parsé par `supabaseService.query()`. Pour une meilleure performance et fiabilité, il serait préférable de migrer ces appels vers les méthodes natives Supabase :
- `supabaseService.select()` au lieu de `pool.query('SELECT ...')`
- `supabaseService.insert()` au lieu de `pool.query('INSERT ...')`
- `supabaseService.update()` au lieu de `pool.query('UPDATE ...')`
- `supabaseService.delete()` au lieu de `pool.query('DELETE ...')`

