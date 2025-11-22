# 🔧 Correction : Nom de colonne incorrect pour les produits

## ⚠️ Problème identifié

L'erreur `column products.is_active does not exist` indique que le code utilise le mauvais nom de colonne.

**Dans Supabase** :
- Table `products` : la colonne s'appelle **`is_available`** (pas `is_active`)
- Table `categories` : la colonne s'appelle **`is_active`** (correct)

## ✅ Correction appliquée

J'ai corrigé `src/services/supabaseService.js` pour utiliser `is_available` au lieu de `is_active` pour les produits :

```javascript
// ❌ AVANT (incorrect)
query = query.eq('is_active', isActiveValue);

// ✅ APRÈS (correct)
query = query.eq('is_available', isActiveValue);
```

## 📋 Vérification du schéma Supabase

Pour vérifier le nom exact des colonnes dans Supabase :

1. **Allez dans Supabase Dashboard → Table Editor**
2. **Ouvrez la table `products`**
3. **Vérifiez** que la colonne s'appelle bien `is_available`

Si la colonne s'appelle différemment dans votre base de données, vous devez soit :
- **Option 1** : Renommer la colonne dans Supabase pour qu'elle corresponde au code
- **Option 2** : Modifier le code pour utiliser le nom de colonne existant

## 🔄 Redéploiement

Après cette correction :
1. **Redéployez** l'application sur Vercel
2. **Testez** avec `testSupabaseConnection()` dans la console
3. **Vérifiez** que les produits s'affichent correctement

