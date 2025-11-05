# 📋 GUIDE IMPORT CSV - GESTION DES PRODUITS

## 🎯 **Format CSV Simplifié**

Votre fichier CSV peut maintenant utiliser le format simple :

```csv
Produit,Catégorie,Prix
"Cappuccino","Boissons Chaudes",3.50
"Espresso","Boissons Chaudes",2.50
"Sandwich Jambon","Délices Salés",8.50
```

---

## 📊 **Formats Supportés**

### ✅ **Format Minimal (3 colonnes)**
```csv
Produit,Catégorie,Prix
"Cappuccino","Boissons Chaudes",3.50
```

### ✅ **Format Étendu (7 colonnes)**
```csv
Nom,Catégorie,Prix,Stock,Description,Statut,Populaire
"Cappuccino","Boissons Chaudes",3.50,100,"Café avec mousse","Actif","Oui"
```

---

## 🏷️ **Catégories Valides**

| Catégorie CSV | Catégorie BDD |
|---------------|---------------|
| `Boissons Chaudes` | Boissons Chaudes |
| `Boissons Froides` | Boissons Froides |
| `Délices Salés` | Délices Salés |
| `Délices Sucrés` | Délices Sucrés |
| `Thés` | Boissons Chaudes |
| `Cafés` | Boissons Chaudes |
| `Pâtisseries` | Délices Sucrés |
| `Sandwichs` | Délices Salés |

**⚠️ Note** : Si une catégorie n'est pas reconnue, elle sera automatiquement mappée vers "Boissons Chaudes".

---

## 🔧 **Valeurs par Défaut**

Si vous utilisez le format minimal, ces valeurs seront appliquées automatiquement :

| Champ | Valeur par Défaut |
|-------|------------------|
| **Stock** | 0 |
| **Description** | "Produit [Nom]" |
| **Statut** | Actif |
| **Populaire** | Non |
| **Ingrédients** | Vide |

---

## 📝 **Exemples de Fichiers**

### **Exemple 1 - Format Minimal**
```csv
Produit,Catégorie,Prix
"Cappuccino","Boissons Chaudes",3.50
"Espresso","Boissons Chaudes",2.50
"Jus d'Orange","Boissons Froides",4.50
```

### **Exemple 2 - Format Complet**
```csv
Nom,Catégorie,Prix,Stock,Description,Statut,Populaire,Ingrédients
"Cappuccino","Boissons Chaudes",3.50,100,"Café avec mousse de lait","Actif","Oui","Café, Lait"
"Espresso","Boissons Chaudes",2.50,50,"Café corsé","Actif","Non","Café"
```

---

## 🚀 **Comment Importer**

1. **Préparer votre fichier CSV** avec le format souhaité
2. **Aller dans "Gestion des Produits"**
3. **Cliquer sur "Importer CSV"**
4. **Sélectionner votre fichier**
5. **Attendre la confirmation d'import**

---

## ✅ **Avantages du Nouveau Format**

- ✅ **Plus simple** : Seulement 3 colonnes obligatoires
- ✅ **Flexible** : Accepte 3 à 7 colonnes
- ✅ **Robuste** : Gère les erreurs automatiquement
- ✅ **Mapping automatique** : Catégories mappées intelligemment
- ✅ **Valeurs par défaut** : Champs manquants remplis automatiquement

---

## 🎉 **Prêt à Utiliser !**

Votre format `produit, catégorie, prix` est maintenant parfaitement supporté !
