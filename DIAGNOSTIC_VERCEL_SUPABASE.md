# 🔍 Diagnostic : Vercel + Supabase ne fonctionnent pas ensemble

## 🚨 Problèmes courants et solutions

### 1. Variables d'environnement non chargées

**Symptôme** : Erreurs "Variables Supabase manquantes" dans la console

**Solution** :
1. Allez dans **Vercel Dashboard → Votre projet → Settings → Environment Variables**
2. Vérifiez que vous avez **exactement** ces variables :
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://crkpunuoliiqyuxtgqlr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0
   ```
3. **IMPORTANT** : Sélectionnez **Production**, **Preview** et **Development** pour chaque variable
4. **Redéployez** après avoir ajouté/modifié les variables

### 2. Variables Vite non exposées (Vite nécessite VITE_*)

**Symptôme** : Les variables `NEXT_PUBLIC_*` ne sont pas accessibles dans le code Vite

**Solution** : Ajoutez aussi les variables avec le préfixe `VITE_` :
```
VITE_SUPABASE_URL = https://crkpunuoliiqyuxtgqlr.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0
```

### 3. Policies RLS bloquent l'accès

**Symptôme** : Erreurs "permission denied" ou "new row violates row-level security policy"

**Solution** :
1. Allez dans **Supabase Dashboard → SQL Editor**
2. Exécutez le script `SUPABASE_RLS_POLICIES_SIMPLE.sql`
3. Vérifiez dans **Authentication → Policies** que les policies sont actives

### 4. CORS bloqué

**Symptôme** : Erreurs CORS dans la console du navigateur

**Solution** : Vérifiez dans **Supabase Dashboard → Settings → API** :
- Les origines autorisées incluent votre domaine Vercel
- Ou utilisez `*` pour le développement (non recommandé en production)

### 5. Tables n'existent pas

**Symptôme** : Erreurs "relation does not exist"

**Solution** :
1. Vérifiez dans **Supabase Dashboard → Table Editor** que les tables existent
2. Si elles n'existent pas, exécutez `database/schema_supabase_blossom_cafe_ORDRE_CORRECT.sql`

## 🔍 Étapes de diagnostic

### Étape 1 : Vérifier les variables dans la console

1. Ouvrez votre application déployée sur Vercel
2. Ouvrez la console du navigateur (F12)
3. Tapez :
```javascript
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
```

**Résultat attendu** : Au moins une des variables doit être définie

### Étape 2 : Tester la connexion Supabase

Dans la console du navigateur, tapez :
```javascript
import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({ createClient }) => {
  const supabase = createClient(
    'https://crkpunuoliiqyuxtgqlr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0'
  );
  
  supabase.from('categories').select('*').limit(1).then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur Supabase:', error);
    } else {
      console.log('✅ Connexion Supabase OK:', data);
    }
  });
});
```

**Résultat attendu** : Les données doivent s'afficher, ou une erreur RLS claire

### Étape 3 : Vérifier les logs Vercel

1. Allez dans **Vercel Dashboard → Votre projet → Deployments**
2. Cliquez sur le dernier déploiement
3. Vérifiez les **Build Logs** et **Function Logs**
4. Cherchez les erreurs liées à :
   - Variables d'environnement
   - Supabase
   - Build errors

### Étape 4 : Vérifier les policies RLS

1. Allez dans **Supabase Dashboard → Authentication → Policies**
2. Vérifiez que les policies existent pour :
   - `categories`
   - `products`
   - `orders`
   - `order_items`
3. Si elles n'existent pas, exécutez `SUPABASE_RLS_POLICIES_SIMPLE.sql`

## ✅ Checklist complète

- [ ] Variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` définies dans Vercel
- [ ] Variables définies pour **Production**, **Preview** et **Development**
- [ ] Variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` aussi définies (recommandé)
- [ ] Redéploiement effectué après modification des variables
- [ ] Script `SUPABASE_RLS_POLICIES_SIMPLE.sql` exécuté dans Supabase
- [ ] Tables existent dans Supabase (vérifier dans Table Editor)
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Pas d'erreurs dans les logs Vercel

## 🛠️ Solution rapide (si rien ne fonctionne)

1. **Ajoutez les 4 variables dans Vercel** :
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://crkpunuoliiqyuxtgqlr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0
   VITE_SUPABASE_URL = https://crkpunuoliiqyuxtgqlr.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0
   ```

2. **Exécutez le script RLS** dans Supabase :
   - Ouvrez `SUPABASE_RLS_POLICIES_SIMPLE.sql`
   - Copiez tout le contenu
   - Collez dans **Supabase Dashboard → SQL Editor**
   - Cliquez sur "Run"

3. **Redéployez sur Vercel** :
   - Faites un commit vide : `git commit --allow-empty -m "Trigger redeploy"`
   - `git push origin main`

4. **Attendez le redéploiement** et testez

## 📞 Si le problème persiste

Partagez avec moi :
1. Les erreurs dans la console du navigateur (F12)
2. Les logs de build Vercel
3. Le résultat de l'étape 2 (test connexion Supabase)
4. Une capture d'écran des variables d'environnement Vercel



