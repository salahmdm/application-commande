# 📂 Catégories Valides pour l'Import CSV

## ⚠️ IMPORTANT

Pour que l'import CSV fonctionne, vous **DEVEZ** utiliser **EXACTEMENT** ces 4 catégories :

## ✅ Catégories Valides

### 1. `Boissons Chaudes`
**Produits typiques :**
- Cappuccino
- Espresso
- Latte
- Thé (tous types)
- Chocolat Chaud
- Café (tous types)

### 2. `Boissons Froides`
**Produits typiques :**
- Sodas (Coca-Cola, Sprite, etc.)
- Jus de fruits
- Eau minérale
- Limonade
- Smoothies
- Thé glacé

### 3. `Délices Salés`
**Produits typiques :**
- Croissant
- Pain au Chocolat
- Sandwichs
- Quiches
- Croque-Monsieur
- Pizzas
- Salades

### 4. `Délices Sucrés`
**Produits typiques :**
- Éclairs
- Tartes
- Macarons
- Mille-Feuille
- Tiramisu
- Gâteaux
- Brownies
- Cheesecakes

---

## ❌ Catégories INVALIDES (Erreurs Courantes)

Ces catégories **NE FONCTIONNERONT PAS** :

- ❌ `Sèche` → Utiliser `Délices Salés` ou `Délices Sucrés`
- ❌ `Sucrée` → Utiliser `Délices Sucrés`
- ❌ `Fromage` → Utiliser `Délices Salés`
- ❌ `Traiteur` → Utiliser `Délices Salés`
- ❌ `Dessert` → Utiliser `Délices Sucrés`
- ❌ `Surgelés` → Utiliser `Boissons Froides` ou `Délices Salés`
- ❌ `Légumes` → Utiliser `Délices Salés`
- ❌ `Boissons` → Utiliser `Boissons Chaudes` ou `Boissons Froides`
- ❌ `Pâtisseries` → Utiliser `Délices Sucrés`
- ❌ `Viennoiseries` → Utiliser `Délices Salés`

---

## 📝 Format CSV Correct

**En-tête obligatoire :**
```csv
Nom,Catégorie,Quantité,Prix,Qté Min
```

**Exemples de lignes valides :**
```csv
"Cappuccino","Boissons Chaudes",50,4.50,10
"Coca-Cola","Boissons Froides",100,2.50,20
"Croissant","Délices Salés",40,1.80,10
"Éclair au Chocolat","Délices Sucrés",30,3.50,8
```

---

## 🎯 Règles Importantes

### ✅ À FAIRE

1. **Respecter EXACTEMENT les noms**
   - Majuscules au début
   - Accents présents
   - Espace entre les mots

2. **Utiliser des guillemets**
   ```csv
   "Cappuccino","Boissons Chaudes",50,4.50,10
   ```

3. **Prix avec point** (pas virgule)
   - ✅ `4.50`
   - ❌ `4,50`

4. **Pas de lignes vides**

### ❌ À NE PAS FAIRE

1. **Fautes de frappe**
   - ❌ `Boisson Chaude` (singulier)
   - ❌ `Boissons chaudes` (minuscule)
   - ❌ `Boissons Chaude` (pas de 's')

2. **Catégories personnalisées**
   - Vous ne pouvez PAS créer de nouvelles catégories via CSV
   - Utilisez uniquement les 4 catégories existantes

3. **Séparateurs incorrects**
   - ❌ Point-virgule `;`
   - ✅ Virgule `,`

---

## 🔧 Comment Corriger Votre Fichier CSV

### Option 1 : Utiliser le fichier corrigé

**Fichier fourni : `exemple_inventaire_corrige.csv`**

Ce fichier contient 20 produits avec les **bonnes catégories** :
- 5 Boissons Chaudes
- 5 Boissons Froides
- 5 Délices Salés
- 5 Délices Sucrés

**Testez-le :**
1. Aller dans Inventaire
2. Cliquer "Importer CSV"
3. Sélectionner `exemple_inventaire_corrige.csv`
4. Résultat : `✅ 20 article(s) importé(s) avec succès !`

### Option 2 : Corriger votre fichier

1. **Ouvrir votre fichier CSV** dans un éditeur
2. **Remplacer les catégories** :
   ```
   Sèche      → Délices Salés
   Sucrée     → Délices Sucrés
   Dessert    → Délices Sucrés
   Fromage    → Délices Salés
   Traiteur   → Délices Salés
   Surgelés   → Boissons Froides (ou Délices Salés selon le produit)
   Légumes    → Délices Salés
   ```
3. **Enregistrer**
4. **Réimporter**

---

## 🧪 Test avec 1 Produit

**Créez un fichier `test-simple.csv` :**
```csv
Nom,Catégorie,Quantité,Prix,Qté Min
"Test Produit","Boissons Chaudes",10,5.00,2
```

**Importez-le :**
- Si ça marche → ✅ Votre problème vient des catégories
- Si ça échoue → Le problème est ailleurs

---

## 📊 Mapping Intelligent

### Boissons → Boissons Chaudes ou Froides

| Votre Produit | Catégorie Correcte |
|---------------|-------------------|
| Café, Thé, Chocolat chaud | `Boissons Chaudes` |
| Sodas, Jus, Eau, Smoothies | `Boissons Froides` |

### Produits Salés → Délices Salés

| Votre Produit | Catégorie Correcte |
|---------------|-------------------|
| Croissant, Pain, Sandwich | `Délices Salés` |
| Quiche, Pizza, Salade | `Délices Salés` |
| Fromage, Charcuterie | `Délices Salés` |

### Produits Sucrés → Délices Sucrés

| Votre Produit | Catégorie Correcte |
|---------------|-------------------|
| Gâteaux, Tartes, Éclairs | `Délices Sucrés` |
| Macarons, Brownies | `Délices Sucrés` |
| Desserts divers | `Délices Sucrés` |

---

## 🎯 Solution Rapide

**Utilisez le fichier corrigé que je viens de créer :**

1. **Fichier : `exemple_inventaire_corrige.csv`**
2. **Emplacement :** Racine du projet
3. **Contenu :** 20 produits avec les bonnes catégories
4. **Import :** Devrait fonctionner à 100%

---

## 💡 Astuce Pro

**Pour éviter les erreurs de catégories :**

1. **Exportez d'abord** votre inventaire actuel
2. **Utilisez le fichier exporté** comme modèle
3. Les catégories seront déjà correctes !

---

**🎉 Utilisez `exemple_inventaire_corrige.csv` et l'import devrait réussir ! ✅**

