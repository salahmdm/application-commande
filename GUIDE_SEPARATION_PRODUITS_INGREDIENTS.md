# 🏪 SÉPARATION PRODUITS FINIS / MATIÈRES PREMIÈRES

## 📋 **Vue d'ensemble**

L'application distingue maintenant clairement deux types d'éléments :

### 🍰 **PRODUITS FINIS** (Gestion des Produits)
- **Table** : `products`
- **Interface** : Gestion des Produits
- **Usage** : Ce que les clients commandent
- **Exemples** : Cappuccino, Sandwich, Tarte aux Fraises, Salade César

### 🥛 **MATIÈRES PREMIÈRES** (Inventaire)
- **Table** : `ingredients` 
- **Interface** : Inventaire
- **Usage** : Stock pour fabriquer les produits finis
- **Exemples** : Café en grains, Lait, Farine, Beurre, Sucre

---

## 🗄️ **Structure de la base de données**

### Table `products` (Produits finis)
```sql
- id, name, slug, category_id
- stock, price, min_stock
- is_available, description
- created_at, updated_at, deleted_at
```

### Table `ingredients` (Matières premières)
```sql
- id, name, slug, category_id
- quantity, unit, price_per_unit, min_quantity
- supplier, description, is_available
- created_at, updated_at, deleted_at
```

---

## 🔄 **Routes API**

### Produits finis (`/api/products`)
- `GET /api/products` - Liste des produits pour les clients
- `GET /api/admin/products` - Gestion admin des produits
- `POST /api/admin/products` - Ajouter un produit
- `PUT /api/admin/products/:id` - Modifier un produit
- `DELETE /api/admin/products/:id` - Supprimer un produit

### Matières premières (`/api/inventory`)
- `GET /api/inventory` - Liste des ingrédients
- `POST /api/inventory` - Ajouter un ingrédient
- `PUT /api/inventory/:id` - Modifier un ingrédient
- `DELETE /api/inventory/:id` - Supprimer un ingrédient

---

## 📊 **Fonctionnalités par section**

### 🍰 **Gestion des Produits**
- ✅ Sélection multiple
- ✅ Import/Export CSV
- ✅ Actions en lot (suppression)
- ✅ Interface moderne avec KPI
- ✅ Gestion des catégories
- ✅ Statut disponible/indisponible

### 🥛 **Inventaire (Matières premières)**
- ✅ Sélection multiple
- ✅ Import/Export CSV
- ✅ Actions en lot (suppression)
- ✅ Interface moderne avec KPI
- ✅ Inventaire physique avec modal
- ✅ Boutons +/- pour quantités
- ✅ Gestion des unités (kg, L, pièces)
- ✅ Fournisseurs
- ✅ Statut basé sur quantité

---

## 📁 **Fichiers créés/modifiés**

### Nouveaux fichiers
- `database/create-ingredients-table.js` - Script de création de la table ingredients
- `database/inventory-routes-ingredients.js` - Routes API pour les ingrédients
- `exemple_ingredients.csv` - Exemple CSV pour l'import d'ingrédients

### Fichiers modifiés
- `database/admin-api.js` - Routes API mises à jour pour utiliser ingredients
- `src/views/admin/AdminProducts.jsx` - Interface produits finis
- `src/components/admin/AdminProductsTable.jsx` - Tableau produits finis
- `src/views/admin/AdminInventory.jsx` - Interface matières premières

---

## 🚀 **Utilisation**

### Pour les produits finis :
1. Aller dans **"Gestion des Produits"**
2. Ajouter/modifier les produits que les clients peuvent commander
3. Utiliser l'import CSV avec le format produits finis

### Pour les matières premières :
1. Aller dans **"Inventaire"**
2. Ajouter/modifier les ingrédients nécessaires à la fabrication
3. Utiliser l'import CSV avec le format matières premières
4. Effectuer des inventaires physiques avec le bouton "INVENTAIRE"

---

## 📝 **Formats CSV**

### Produits finis (`exemple_produits.csv`)
```csv
Nom,Catégorie,Prix,Stock,Description,Image URL,Populaire,Ingrédients
"Cappuccino","Boissons Chaudes",3.50,100,"Café avec mousse de lait","https://example.com/cappuccino.jpg",TRUE,"Café, Lait"
```

### Matières premières (`exemple_ingredients.csv`)
```csv
Nom,Catégorie,Quantité,Unité,Prix unitaire (€),Qté Min,Fournisseur,Description
"Café en grains","Boissons Chaudes",25.5,"kg",12.50,5.0,"Fournisseur Café","Café arabica premium"
```

---

## ✅ **Avantages de cette séparation**

1. **Clarté** : Distinction nette entre ce qui est vendu et ce qui est stocké
2. **Gestion** : Inventaire séparé des produits finis
3. **Flexibilité** : Possibilité d'avoir des produits sans stock physique
4. **Traçabilité** : Suivi des matières premières et des fournisseurs
5. **Évolutivité** : Facilite l'ajout de fonctionnalités spécifiques à chaque type

---

## 🎯 **Prochaines étapes possibles**

1. **Recettes** : Lier les produits finis aux ingrédients nécessaires
2. **Coûts** : Calcul automatique du coût de revient des produits
3. **Alertes** : Notifications quand les ingrédients sont en rupture
4. **Commandes fournisseurs** : Gestion des approvisionnements
5. **Analyses** : Rapports sur la consommation d'ingrédients

---

**🎉 La séparation est maintenant opérationnelle !**
- **Produits finis** = Ce que les clients commandent
- **Matières premières** = Ce qui est en stock pour fabriquer
