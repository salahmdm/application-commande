# ⚡ Solution Rapide : Données non affichées sur Vercel

## 🎯 Solution en 3 étapes (5 minutes)

### Étape 1 : Variables d'environnement Vercel (2 minutes)

1. **Allez dans Vercel Dashboard → Votre projet → Settings → Environment Variables**

2. **Ajoutez/modifiez ces 4 variables** (copiez-collez exactement) :

```
NEXT_PUBLIC_SUPABASE_URL
https://uvwvfotlvhsplahmnzll.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d3Zmb3RsdmhzcGxhaG1uemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjkzNzEsImV4cCI6MjA3OTQwNTM3MX0.djKzu2ZNwJeSrv8DOGkl7_8WnkMnWFpbFYmPBZtLFgg

VITE_SUPABASE_URL
https://uvwvfotlvhsplahmnzll.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d3Zmb3RsdmhzcGxhaG1uemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjkzNzEsImV4cCI6MjA3OTQwNTM3MX0.djKzu2ZNwJeSrv8DOGkl7_8WnkMnWFpbFYmPBZtLFgg
```

3. **IMPORTANT** : Pour chaque variable, sélectionnez **Production**, **Preview** et **Development**

4. **Cliquez sur Save**

### Étape 2 : Policies RLS Supabase (1 minute)

1. **Ouvrez** le fichier `SUPABASE_RLS_POLICIES_SIMPLE.sql`
2. **Copiez** tout le contenu (Ctrl+A, Ctrl+C)
3. **Allez dans Supabase Dashboard → SQL Editor**
4. **Collez** le contenu (Ctrl+V)
5. **Cliquez sur Run** (ou Ctrl+Enter)
6. **Vérifiez** : Vous devriez voir "Success. No rows returned"

### Étape 3 : Redéploiement Vercel (1 minute)

1. **Faites un commit vide** pour déclencher un redéploiement :
   ```bash
   git commit --allow-empty -m "Trigger redeploy for Supabase variables"
   git push origin main
   ```
2. **Attendez 2-3 minutes** que Vercel redéploie
3. **Testez** votre application

## ✅ Vérification

Après le redéploiement :

1. **Ouvrez votre application déployée sur Vercel**
2. **Ouvrez la console du navigateur** (F12)
3. **Tapez** : `testSupabaseConnection()`
4. **Vous devriez voir** :
   ```
   ✅ Connexion Supabase : SUCCÈS
   Catégories : X
   Produits : Y
   ```

## 🚨 Si ça ne fonctionne toujours pas

### Vérification 1 : Variables chargées ?

Dans la console, tapez :
```javascript
console.log('URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL);
console.log('KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
```

**Si "non défini"** : Les variables ne sont pas chargées → Vérifiez l'étape 1 et redéployez

### Vérification 2 : Policies RLS ?

Si vous voyez "permission denied" dans la console :
- Les policies RLS ne sont pas appliquées → Vérifiez l'étape 2

### Vérification 3 : Données dans Supabase ?

1. **Allez dans Supabase Dashboard → Table Editor**
2. **Vérifiez** que les tables contiennent des données :
   - `categories` : doit avoir au moins 4 catégories
   - `products` : doit avoir au moins 50 produits
   - `users` : doit avoir au moins 8 utilisateurs

**Si les tables sont vides** :
- Les données n'ont pas été transférées
- Exécutez : `node database/transfer-supabase-to-supabase.js`

## 📞 Besoin d'aide ?

Partagez avec moi :
1. Le résultat de `testSupabaseConnection()` dans la console
2. Les erreurs affichées dans la console (F12)
3. Le nombre d'enregistrements dans les tables Supabase (Table Editor)


