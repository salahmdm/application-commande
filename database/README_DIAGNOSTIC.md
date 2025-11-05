# 🔍 Diagnostic et Correction - Produits & Catégories

## ⚠️ Problème identifié

Les **catégories sont vides** dans la prise de commande alors que les produits ont bien des catégories dans la gestion des produits.

---

## 📋 Solution en 2 étapes

### **Étape 1 : Diagnostic**

Ouvrez **MySQL Workbench** ou **phpMyAdmin** et exécutez le fichier :

```
database/DIAGNOSTIC_PRODUITS_CATEGORIES.sql
```

Ce script va afficher :
- ✅ Toutes les catégories et leur statut
- ✅ Tous les produits avec leurs catégories
- ✅ Les produits visibles en prise de commande
- ✅ Les doublons éventuels
- ✅ Les références invalides
- ✅ La distribution des produits par catégorie

**Cherchez particulièrement :**
- Des catégories avec `is_active = 0` (inactives)
- Des produits avec `category_id = NULL`
- Des produits avec un `category_id` invalide
- Des doublons de catégories

---

### **Étape 2 : Correction**

Une fois le diagnostic fait, exécutez le fichier :

```
database/FIX_PRODUITS_CATEGORIES.sql
```

Ce script va :
1. ✅ Activer les 4 catégories principales
2. ✅ Corriger l'ordre d'affichage des catégories
3. ✅ Identifier les produits sans catégorie
4. ✅ Identifier les références invalides
5. ✅ Afficher l'état final

**IMPORTANT :** Certaines corrections sont commentées par sécurité. Si vous voulez les appliquer automatiquement, décommentez les lignes `UPDATE`.

---

## 🎯 Corrections manuelles possibles

### Si des produits n'ont pas de catégorie :

```sql
-- Assigner tous les produits sans catégorie à "Boissons Chaudes" (ID 1)
UPDATE products 
SET category_id = 1 
WHERE category_id IS NULL AND deleted_at IS NULL;
```

### Si des catégories sont inactives :

```sql
-- Activer toutes les catégories principales
UPDATE categories 
SET is_active = 1 
WHERE name IN ('Boissons Chaudes', 'Boissons Froides', 'Délices Salés', 'Délices Sucrés');
```

### Si l'ordre des catégories est incorrect :

```sql
UPDATE categories SET display_order = 1 WHERE name = 'Boissons Chaudes';
UPDATE categories SET display_order = 2 WHERE name = 'Boissons Froides';
UPDATE categories SET display_order = 3 WHERE name = 'Délices Salés';
UPDATE categories SET display_order = 4 WHERE name = 'Délices Sucrés';
```

---

## 🚀 Après la correction

1. **Redémarrez l'application** : `npm start`
2. **Videz le cache du navigateur** : Ctrl + Shift + R
3. **Testez la prise de commande** : Les catégories devraient maintenant s'afficher

---

## 📊 Vérification rapide dans MySQL

Pour vérifier rapidement si tout est OK :

```sql
-- Voir les catégories actives
SELECT id, name, is_active, display_order 
FROM categories 
WHERE is_active = 1 
ORDER BY display_order;

-- Voir les produits visibles avec leurs catégories
SELECT 
    c.name AS categorie,
    p.name AS produit,
    p.price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_available = TRUE 
  AND p.deleted_at IS NULL
ORDER BY c.display_order, p.name;
```

---

## ❓ Pourquoi les scripts Node.js tournent en boucle ?

Les scripts Node.js avec `mysql2/promise` peuvent rester actifs si :
- La connexion n'est pas fermée correctement
- Des événements restent en attente
- Le pool de connexions n'est pas fermé

**Solution :** Utiliser des fichiers SQL purs pour les opérations de diagnostic et maintenance !

---

## 📝 Fichiers créés

1. `DIAGNOSTIC_PRODUITS_CATEGORIES.sql` - Diagnostic complet
2. `FIX_PRODUITS_CATEGORIES.sql` - Corrections automatiques
3. `README_DIAGNOSTIC.md` - Ce fichier (guide d'utilisation)

---

✅ **Suivez ces étapes et le problème des catégories vides devrait être résolu !**

