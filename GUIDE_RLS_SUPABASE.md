# 🔒 Guide : Configuration RLS (Row Level Security) dans Supabase

## ⚠️ Problème rencontré

Lors de l'exécution du script SQL dans Supabase, vous avez eu une erreur de syntaxe.

## ✅ Solution : Deux scripts disponibles

J'ai créé deux versions du script :

### 1. `SUPABASE_RLS_POLICIES.sql` (Version avec filtres)

Cette version filtre les données selon leur statut (`is_active`, `is_available`, etc.) :

- ✅ **Plus sécurisé** : N'affiche que les données actives
- ✅ **Recommandé pour la production**
- ⚠️ **Attention** : Vérifiez que vos colonnes `is_active` sont bien de type `SMALLINT` (0 ou 1) ou `BOOLEAN`

### 2. `SUPABASE_RLS_POLICIES_SIMPLE.sql` (Version simplifiée)

Cette version permet l'accès total sans filtres :

- ✅ **Plus simple** : Accès public complet
- ✅ **Idéal pour tester rapidement**
- ⚠️ **Moins sécurisé** : Affiche toutes les données, même inactives

## 📋 Instructions d'utilisation

### Option A : Script avec filtres (Recommandé)

1. **Allez dans Supabase Dashboard** → **SQL Editor**
2. **Copiez-collez le contenu** de `SUPABASE_RLS_POLICIES.sql`
3. **Cliquez sur "Run"** (ou Ctrl+Enter)
4. **Vérifiez les résultats** : Vous devriez voir "Success. No rows returned"

### Option B : Script simplifié (Pour test rapide)

1. **Allez dans Supabase Dashboard** → **SQL Editor**
2. **Copiez-collez le contenu** de `SUPABASE_RLS_POLICIES_SIMPLE.sql`
3. **Cliquez sur "Run"**
4. **Testez** : Les données devraient maintenant s'afficher

## 🔍 Vérification après exécution

1. **Allez dans Supabase Dashboard** → **Authentication** → **Policies**
2. **Sélectionnez une table** (ex: `categories`)
3. **Vérifiez** que les policies sont listées :
   - "Allow public read access to categories"
   - etc.

## ❓ Si vous avez encore des erreurs

### Erreur : "relation does not exist"

**Cause** : La table n'existe pas dans Supabase.

**Solution** :
1. Vérifiez que vous avez bien exécuté le schéma SQL (`schema_supabase_blossom_cafe_ORDRE_CORRECT.sql`)
2. Vérifiez dans **Table Editor** que les tables existent

### Erreur : "syntax error"

**Cause** : Problème de syntaxe SQL.

**Solution** :
1. Utilisez le script `SUPABASE_RLS_POLICIES_SIMPLE.sql` (plus simple)
2. Ou exécutez les commandes une par une dans l'éditeur SQL

### Erreur : "permission denied"

**Cause** : Vous n'avez pas les droits pour créer des policies.

**Solution** :
1. Vérifiez que vous êtes connecté avec le bon compte
2. Utilisez la **Service Role Key** si nécessaire (dans Settings → API)

## 🧪 Test des policies

Après avoir exécuté le script, testez dans votre application :

1. **Ouvrez l'application déployée sur Vercel**
2. **Ouvrez la console du navigateur** (F12)
3. **Vérifiez** qu'il n'y a pas d'erreurs "permission denied"
4. **Les catégories et produits devraient s'afficher**

## 📝 Notes importantes

- **RLS est activé** : Les policies sont obligatoires pour accéder aux données
- **Accès public** : Les policies permettent l'accès sans authentification (pour le kiosk)
- **Sécurité** : En production, vous pouvez restreindre l'accès selon vos besoins
- **Service Role Key** : Le backend peut utiliser cette clé pour bypass RLS si nécessaire

## 🔄 Si vous voulez désactiver RLS temporairement

```sql
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- etc.
```

**⚠️ Attention** : Désactiver RLS expose toutes les données. À utiliser uniquement pour le debug.

