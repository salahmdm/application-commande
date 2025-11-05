# 🎯 Séparation Produits Finis & Matières Premières

## ✅ Objectif

Séparer complètement la gestion des **produits finis** (Gestion des Produits) et des **matières premières** (Inventaire) avec des catégories distinctes pour chaque section.

---

## 📊 Catégories par Section

### **Gestion des Produits** (Produits finis)
Table : `products`
- ☕ Boissons Chaudes
- 🥤 Boissons Froides  
- 🥗 Délices Salés
- 🍰 Délices Sucrés

### **Inventaire** (Matières premières)
Table : `ingredients`
- ❄️ Surgelé
- 🥬 Frais
- 📦 Autres

---

## 🔧 Modifications Apportées

### 1. **Base de données** (`ingredients` table)

**Nouvelle colonne ajoutée :**
```sql
ALTER TABLE ingredients 
ADD COLUMN category_inventory VARCHAR(50) DEFAULT 'Autres' AFTER category_id;
```

**Cette colonne stocke directement le nom de la catégorie d'inventaire** : `Surgelé`, `Frais`, ou `Autres`

---

### 2. **Backend API** (`database/admin-api.js`)

#### **Route GET `/api/inventory`**
```javascript
SELECT 
  i.id,
  i.name,
  COALESCE(i.category_inventory, 'Autres') as category,  // ← Nouvelle colonne
  i.quantity,
  i.price_per_unit as price,
  ...
FROM ingredients i
WHERE i.deleted_at IS NULL
```

#### **Route POST `/api/inventory`**
- Validation des catégories : `['Surgelé', 'Frais', 'Autres']`
- Insertion avec `category_inventory` au lieu de `category_id`

#### **Route PUT `/api/inventory/:id`**
- Validation des catégories d'inventaire
- Mise à jour avec `category_inventory`

---

### 3. **Frontend** (`src/views/admin/AdminInventory.jsx`)

**Catégories mises à jour :**
```javascript
// Catégories spécifiques à l'inventaire (matières premières)
const categories = ['Surgelé', 'Frais', 'Autres'];
```

**Mapping CSV pour l'import :**
```javascript
const categoryMapping = {
  'Épicerie Sèche': 'Autres',
  'Épicerie Sucrée': 'Autres',
  'Fromage': 'Frais',
  'Traiteur': 'Frais',
  'Glace / Dessert': 'Surgelé',
  'Surgelés': 'Surgelé',
  'Fruits et Légumes': 'Frais',
  // Catégories déjà valides
  'Surgelé': 'Surgelé',
  'Frais': 'Frais',
  'Autres': 'Autres'
};
```

**Catégorie par défaut** : Si une catégorie n'est pas reconnue, elle est automatiquement mappée vers `'Autres'`

---

## 🚀 Prochaines Étapes

### **1. Ajouter la colonne à la base de données**

Exécutez le script SQL :
```bash
mysql -u root -p blossom_cafe < database/add-inventory-category-column.sql
```

OU directement dans MySQL :
```sql
USE blossom_cafe;

ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS category_inventory VARCHAR(50) DEFAULT 'Autres' AFTER category_id;

UPDATE ingredients 
SET category_inventory = 'Autres'
WHERE category_inventory IS NULL OR category_inventory = '';
```

### **2. Redémarrer l'application**

```bash
npm start
```

### **3. Tester**

1. **Aller dans "Inventaire"**
2. **Ajouter un nouvel ingrédient** avec une des catégories : `Surgelé`, `Frais`, `Autres`
3. **Importer un fichier CSV** avec vos matières premières
4. **Vérifier** que les catégories s'affichent correctement

---

## 📋 Format CSV pour l'Inventaire

```csv
Article,Catégorie,Quantité,Prix unitaire (€),Qté Min,Date d'ajout,Statut
"Farine T55","Autres",50,1.20,10,"2025-01-01","Disponible"
"Beurre doux","Frais",20,8.50,5,"2025-01-01","Disponible"
"Légumes surgelés","Surgelé",100,3.50,20,"2025-01-01","Disponible"
```

**Les anciennes catégories seront automatiquement mappées** :
- `Épicerie Sèche` → `Autres`
- `Fruits et Légumes` → `Frais`
- `Surgelés` → `Surgelé`
- etc.

---

## ✅ Avantages de cette Séparation

1. **✅ Distinction claire** : Produits finis ≠ Matières premières
2. **✅ Catégories adaptées** : Chaque section a ses propres catégories pertinentes
3. **✅ Import CSV facile** : Mapping automatique des anciennes catégories
4. **✅ Pas de conflit** : Tables complètement séparées (`products` vs `ingredients`)
5. **✅ Gestion indépendante** : Chaque section fonctionne de manière autonome

---

## 🔍 Vérification

**Dans la Gestion des Produits** :
- ☕ Boissons Chaudes
- 🥤 Boissons Froides
- 🥗 Délices Salés
- 🍰 Délices Sucrés

**Dans l'Inventaire** :
- ❄️ Surgelé
- 🥬 Frais
- 📦 Autres

**Les deux sections sont maintenant complètement indépendantes !** 🎉

