# 🔧 Guide : Correction du mot réservé "ORDER" en PostgreSQL

## ⚠️ Problème identifié

PostgreSQL se plaint que `ORDER` est un mot réservé en SQL. Cela peut causer des erreurs lors des requêtes.

## ✅ Solutions appliquées

### 1. Table `orders`

La table `orders` est déjà correctement échappée avec des guillemets doubles dans le schéma :
```sql
CREATE TABLE IF NOT EXISTS "orders" (...)
```

**Aucune modification nécessaire** - PostgreSQL/Supabase gère automatiquement l'échappement via PostgREST.

### 2. Colonne `order` dans la table `news`

**Problème** : La colonne `order` dans la table `news` est un mot réservé.

**Solution** : Renommer la colonne en `display_order`.

## 📋 Étapes de migration

### Étape 1 : Exécuter le script de migration dans Supabase

1. Allez dans **Supabase Dashboard → SQL Editor**
2. Ouvrez le fichier `database/migrate_fix_reserved_words.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **Run**

Ce script va :
- Renommer la colonne `order` en `display_order` dans la table `news`
- Vérifier que la migration a réussi

### Étape 2 : Vérifier la migration

Après avoir exécuté le script, vérifiez dans **Supabase Dashboard → Table Editor → news** :
- La colonne doit s'appeler `display_order` (et non `order`)

### Étape 3 : Mise à jour du code (déjà fait)

Le code a été mis à jour pour utiliser `display_order` :
- ✅ `src/views/client/HomeView.jsx`
- ✅ `src/components/news/NewsEditor.jsx`
- ✅ `src/components/news/NewsEditorModal.jsx`
- ✅ `database/schema_supabase_blossom_cafe_ORDRE_CORRECT.sql`

Le code supporte aussi `order` en fallback pour compatibilité avec l'ancienne base de données.

## 🔍 Vérification

### Test 1 : Vérifier la colonne dans Supabase

Dans **Supabase Dashboard → SQL Editor**, exécutez :
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'news'
  AND column_name IN ('order', 'display_order')
ORDER BY column_name;
```

**Résultat attendu** : Vous devriez voir `display_order` (et non `order`)

### Test 2 : Tester l'application

1. Ouvrez l'application
2. Allez dans la section "Actualités" (News)
3. Vérifiez que les actualités s'affichent correctement
4. Testez l'édition d'une actualité (changer l'ordre)

## 📝 Notes importantes

1. **Compatibilité** : Le code supporte les deux noms (`display_order` et `order`) pour une transition en douceur
2. **Table `orders`** : Aucune modification nécessaire, elle fonctionne déjà correctement
3. **PostgreSQL** : Les guillemets doubles permettent d'utiliser des mots réservés comme noms de tables/colonnes
4. **Supabase/PostgREST** : Gère automatiquement l'échappement pour les requêtes via l'API

## 🚨 Si vous avez encore des erreurs

### Erreur : "column 'order' does not exist"

**Cause** : La migration n'a pas été exécutée.

**Solution** : Exécutez `database/migrate_fix_reserved_words.sql` dans Supabase.

### Erreur : "syntax error at or near 'order'"

**Cause** : Une requête SQL utilise `order` sans guillemets.

**Solution** : Vérifiez que toutes les requêtes SQL utilisent `"order"` (avec guillemets) ou `display_order`.

## ✅ Checklist

- [ ] Script `migrate_fix_reserved_words.sql` exécuté dans Supabase
- [ ] Colonne `display_order` vérifiée dans Supabase Table Editor
- [ ] Code mis à jour (déjà fait automatiquement)
- [ ] Application testée et fonctionnelle
- [ ] Aucune erreur dans la console du navigateur


