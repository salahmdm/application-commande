# 🔄 Synchronisation Borne avec Base de Données

## ✅ Système de Mapping Créé

### 1. **categoryMapper.js** (`src/kiosk/utils/categoryMapper.js`)

Système de mapping intelligent qui :
- **Mappe les catégories BDD vers les styles BK** : Associe les catégories réelles de la BDD (ex: "Boissons Chaudes", "Délices Sucrés") aux catégories Burger King (ex: "BOISSONS", "DESSERTS")
- **Enrichit les catégories** : Ajoute les styles BK (dégradés, couleurs) aux catégories de la BDD
- **Filtre les produits** : Utilise `category_id` de la BDD pour filtrer correctement
- **Détecte les nouveautés/promos** : Analyse les produits pour afficher les badges

### 2. **Mapping des Catégories**

Le système mappe automatiquement :
- `Boissons Chaudes` / `Boissons Froides` → `BOISSONS` (dégradé bleu/cyan)
- `Délices Sucrés` → `DESSERTS` (dégradé rose/violet)
- `Délices Salés` → `SALADES` (dégradé vert)
- Etc.

### 3. **Synchronisation Complète**

#### Catégories
- ✅ Chargement depuis `/api/kiosk/categories`
- ✅ Enrichissement avec styles BK via `enrichCategoriesWithBKStyles()`
- ✅ Affichage dans la sidebar avec dégradés dynamiques
- ✅ Filtrage par `category_id` de la BDD

#### Produits
- ✅ Chargement depuis `/api/kiosk/products`
- ✅ Filtrage par `category_id` de la BDD
- ✅ Enrichissement avec flags `is_new` et `is_promo`
- ✅ Affichage des badges PROMO/NOUVEAU selon les données

### 4. **Flux de Données**

```
BDD MySQL
  ↓
Backend API (/api/kiosk/categories, /api/kiosk/products)
  ↓
kioskService (frontend)
  ↓
HomeScreen (chargement)
  ↓
categoryMapper (enrichissement)
  ↓
Composants UI (affichage)
```

### 5. **Fonctionnalités**

#### Enrichissement des Catégories
```javascript
const enrichedCategories = enrichCategoriesWithBKStyles(dbCategories);
// Résultat : Catégories avec styles BK + données BDD
```

#### Filtrage des Produits
```javascript
const filteredProducts = filterProductsByCategory(products, categoryId);
// Filtre par category_id de la BDD
```

#### Détection Badges
```javascript
const isNew = isProductNew(product); // Basé sur created_at
const isPromo = isProductPromo(product); // Basé sur is_promo ou promo_price
```

### 6. **Structure des Données**

#### Catégorie Enrichie
```javascript
{
  // Données BDD
  id: 1,                    // ID de la BDD (pour filtrage)
  name: "Boissons Chaudes", // Nom original
  slug: "boissons-chaudes",
  icon: "☕",
  display_order: 1,
  is_active: true,
  
  // Styles BK
  bkId: "boissons",         // ID BK (pour styles)
  bkName: "BOISSONS",       // Nom en MAJUSCULES
  headerGradient: "linear-gradient(...)", // Dégradé pour header
  gradient: "from-blue-500 to-cyan-500"    // Dégradé Tailwind
}
```

#### Produit Enrichi
```javascript
{
  // Données BDD
  id: 1,
  category_id: 1,           // ID catégorie BDD (pour filtrage)
  name: "Espresso",
  price: 2.50,
  image_url: "...",
  is_available: true,
  created_at: "2025-01-01",
  
  // Enrichissement
  is_new: true,             // Produit créé il y a < 30 jours
  is_promo: false,          // Pas de promo
  category_name: "Boissons Chaudes" // Depuis JOIN SQL
}
```

### 7. **Avantages**

- ✅ **Synchronisation automatique** : Les catégories et produits de la BDD sont automatiquement affichés
- ✅ **Styles BK préservés** : Les dégradés et couleurs BK sont appliqués selon le mapping
- ✅ **Filtrage précis** : Utilise les IDs réels de la BDD pour filtrer
- ✅ **Extensible** : Facile d'ajouter de nouvelles catégories dans le mapping
- ✅ **Robuste** : Gère les cas où les catégories ne sont pas mappées (catégorie par défaut)

---

**Statut** : ✅ Synchronisation complète entre la borne et la base de données MySQL

