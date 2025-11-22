# 🔒 Isolation Complète : Application Kiosk vs Application Principale

## ✅ Architecture Isolée

### Deux Applications Distinctes

1. **Application Principale** (`/`)
   - Pour la caisse/administration
   - Store : `authStore`, `cartStore`, `uiStore`
   - Services : `productService`, `authService`
   - Routes API : `/api/products`, `/api/categories`, etc.

2. **Application Kiosk** (`/kiosk`)
   - Pour les bornes tactiles
   - Store : `kioskStore` (isolé dans sessionStorage)
   - Services : `kioskService` (routes dédiées)
   - Routes API : `/api/kiosk/products`, `/api/kiosk/categories`, etc.

## 🔐 Isolation Garantie

### 1. Stores Isolés

**Application Principale** :
- `authStore` → localStorage
- `cartStore` → localStorage
- `uiStore` → localStorage

**Application Kiosk** :
- `kioskStore` → sessionStorage (isolé)
- Pas d'accès aux stores de l'app principale

### 2. Services Isolés

**Application Principale** :
```javascript
// src/services/productService.js
getAllProducts() → GET /api/products
getCategories() → GET /api/categories
```

**Application Kiosk** :
```javascript
// src/services/kioskService.js
getProductsByCategory() → GET /api/kiosk/products
getCategories() → GET /api/kiosk/categories
```

### 3. Routes Backend Isolées

**Application Principale** :
- `/api/products` → Tous les produits (avec cache)
- `/api/categories` → Toutes les catégories (avec cache)

**Application Kiosk** :
- `/api/kiosk/products` → Tous les produits disponibles (sans filtre stock)
- `/api/kiosk/categories` → Toutes les catégories actives
- Authentification requise : `requireKiosk` middleware

## 📊 Récupération des Données

### Produits Kiosk

**Route** : `GET /api/kiosk/products?categoryId=X`

**Requête SQL** :
```sql
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_available = TRUE
[AND p.category_id = ?]
ORDER BY c.display_order ASC, p.name ASC
```

**Filtres** :
- ✅ `is_available = TRUE` (uniquement)
- ❌ Pas de filtre `stock > 0` (récupère TOUS les produits disponibles)

### Catégories Kiosk

**Route** : `GET /api/kiosk/categories`

**Requête SQL** :
```sql
SELECT * FROM categories 
WHERE is_active = TRUE 
ORDER BY display_order ASC, name ASC
```

## ✅ Vérifications

1. **Stores séparés** ✅
   - `kioskStore` utilise `sessionStorage`
   - `authStore` utilise `localStorage`
   - Pas de mélange

2. **Services séparés** ✅
   - `kioskService` pour la borne
   - `productService` pour l'app principale
   - Routes API différentes

3. **Données depuis BDD** ✅
   - Les deux apps récupèrent depuis MySQL
   - Mais via des routes différentes
   - Isolation garantie

4. **Tous les produits** ✅
   - Route kiosk récupère TOUS les produits disponibles
   - Pas de filtre `stock > 0`
   - Inclut les informations de catégorie

## 🚨 Points d'Attention

1. **Ne jamais utiliser `productService` dans les vues kiosk**
   - ✅ Utiliser `kioskService`
   - ❌ Ne pas utiliser `productService`

2. **Ne jamais utiliser `authStore` dans les vues kiosk**
   - ✅ Utiliser `kioskStore`
   - ❌ Ne pas utiliser `authStore`

3. **Routes API différentes**
   - ✅ `/api/kiosk/*` pour la borne
   - ❌ Ne pas utiliser `/api/products` dans la borne

---

**Statut** : ✅ Isolation complète garantie entre les deux applications

