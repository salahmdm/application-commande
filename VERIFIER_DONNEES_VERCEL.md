# 🔍 Vérification : Données non affichées sur Vercel

## ⚠️ Problème

Les données ne s'affichent pas sur l'application déployée sur Vercel, même après avoir connecté la base de données.

## 🔍 Causes possibles

### 1. Variables d'environnement non configurées dans Vercel

**Vérification** :
1. Allez dans **Vercel Dashboard → Votre projet → Settings → Environment Variables**
2. Vérifiez que vous avez **exactement** ces 4 variables :

```
NEXT_PUBLIC_SUPABASE_URL = https://uvwvfotlvhsplahmnzll.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d3Zmb3RsdmhzcGxhaG1uemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjkzNzEsImV4cCI6MjA3OTQwNTM3MX0.djKzu2ZNwJeSrv8DOGkl7_8WnkMnWFpbFYmPBZtLFgg

VITE_SUPABASE_URL = https://uvwvfotlvhsplahmnzll.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d3Zmb3RsdmhzcGxhaG1uemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjkzNzEsImV4cCI6MjA3OTQwNTM3MX0.djKzu2ZNwJeSrv8DOGkl7_8WnkMnWFpbFYmPBZtLFgg
```

**Important** :
- ✅ Sélectionnez **Production**, **Preview** et **Development** pour chaque variable
- ✅ Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
- ✅ Redéployez après avoir ajouté/modifié les variables

### 2. Policies RLS non appliquées dans Supabase

**Vérification** :
1. Allez dans **Supabase Dashboard → Authentication → Policies**
2. Vérifiez que les policies existent pour les tables principales

**Solution** :
1. Ouvrez `SUPABASE_RLS_POLICIES_SIMPLE.sql`
2. Copiez tout le contenu
3. Allez dans **Supabase Dashboard → SQL Editor**
4. Collez et exécutez le script

### 3. Données non présentes dans Supabase

**Vérification** :
1. Allez dans **Supabase Dashboard → Table Editor**
2. Vérifiez que les tables contiennent des données :
   - `categories` : doit avoir des catégories
   - `products` : doit avoir des produits
   - `users` : doit avoir des utilisateurs

**Si les tables sont vides** :
- Exécutez `node database/transfer-supabase-to-supabase.js` pour transférer les données

### 4. Erreurs dans la console du navigateur

**Vérification** :
1. Ouvrez votre application déployée sur Vercel
2. Ouvrez la console du navigateur (F12)
3. Cherchez les erreurs :
   - `permission denied` → Problème de policies RLS
   - `relation does not exist` → Tables n'existent pas
   - `invalid API key` → Clé Supabase incorrecte
   - `Variables Supabase manquantes` → Variables d'environnement non configurées

## 🛠️ Solution étape par étape

### Étape 1 : Vérifier les variables Vercel

1. **Vercel Dashboard → Settings → Environment Variables**
2. **Vérifiez** que les 4 variables sont présentes
3. **Vérifiez** qu'elles sont définies pour **Production**, **Preview** et **Development**
4. **Redéployez** si vous avez modifié les variables

### Étape 2 : Exécuter les policies RLS

1. **Supabase Dashboard → SQL Editor**
2. **Ouvrez** `SUPABASE_RLS_POLICIES_SIMPLE.sql`
3. **Copiez** tout le contenu
4. **Collez** dans l'éditeur SQL
5. **Exécutez** (Run)

### Étape 3 : Vérifier les données dans Supabase

1. **Supabase Dashboard → Table Editor**
2. **Vérifiez** que les tables contiennent des données
3. **Si vides**, exécutez le script de transfert

### Étape 4 : Tester la connexion

Dans la console du navigateur (F12), tapez :
```javascript
testSupabaseConnection()
```

Cela va tester la connexion et afficher les résultats.

## 🔍 Diagnostic rapide

### Test 1 : Variables chargées ?

Dans la console du navigateur :
```javascript
console.log('URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL);
console.log('KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
```

**Si "non défini"** : Les variables ne sont pas chargées → Vérifiez l'étape 1

### Test 2 : Connexion Supabase ?

Dans la console :
```javascript
testSupabaseConnection()
```

**Si erreur "permission denied"** : Policies RLS non appliquées → Vérifiez l'étape 2

**Si erreur "relation does not exist"** : Tables n'existent pas → Exécutez `CREATE_ALL_TABLES_SUPABASE.sql`

**Si succès mais données vides** : Données non transférées → Exécutez le script de transfert

## 📋 Checklist complète

- [ ] Variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` définies dans Vercel
- [ ] Variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` définies dans Vercel
- [ ] Variables définies pour **Production**, **Preview** et **Development**
- [ ] Redéploiement effectué après modification des variables
- [ ] Script `SUPABASE_RLS_POLICIES_SIMPLE.sql` exécuté dans Supabase
- [ ] Tables contiennent des données dans Supabase (vérifier dans Table Editor)
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Test `testSupabaseConnection()` réussi

## 🚨 Si rien ne fonctionne

Partagez avec moi :
1. Les erreurs dans la console du navigateur (F12)
2. Le résultat de `testSupabaseConnection()`
3. Une capture d'écran des variables d'environnement Vercel
4. Le nombre d'enregistrements dans les tables Supabase (Table Editor)



