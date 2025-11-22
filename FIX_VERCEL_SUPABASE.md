# 🔧 Correction des problèmes Vercel + Supabase

## ✅ Corrections appliquées

### 1. Variables d'environnement Vite

**Problème** : Vite utilise `import.meta.env` et non `process.env`, et les variables doivent être préfixées par `VITE_`.

**Solution** : 
- ✅ `src/services/supabaseClient.js` : Utilise maintenant `import.meta.env.VITE_SUPABASE_URL`
- ✅ `src/utils/supabase/client.ts` : Support des deux formats
- ✅ Support des deux formats (`VITE_` et `NEXT_PUBLIC_`) pour compatibilité

### 2. Variables à ajouter dans Vercel

Dans **Vercel Dashboard → Settings → Environment Variables**, ajoutez :

```
VITE_SUPABASE_URL=https://crkpunuoliiqyuxtgqlr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important** : 
- Les variables `VITE_*` sont exposées au client pendant le build Vite
- Les variables `NEXT_PUBLIC_*` sont pour Next.js (gardez-les aussi si vous utilisez Next.js)

### 3. Policies RLS (Row Level Security)

**Problème** : Les policies RLS bloquent l'accès en production.

**Solution** : 
- ✅ Fichier `SUPABASE_RLS_POLICIES.sql` créé avec les policies nécessaires
- Exécutez ce script dans **Supabase Dashboard → SQL Editor**

**Policies créées** :
- Lecture publique pour `categories`, `products`, `news`, `promo_codes`, `loyalty_rewards`
- Lecture/écriture pour `orders` et `order_items` (utilisateurs authentifiés)
- Lecture limitée pour `users` (profil personnel uniquement)

## 📋 Checklist de déploiement

### Étape 1 : Variables Vercel
- [ ] Ajouter `VITE_SUPABASE_URL` dans Vercel
- [ ] Ajouter `VITE_SUPABASE_ANON_KEY` dans Vercel
- [ ] Vérifier que les variables sont définies pour **Production**, **Preview** et **Development**

### Étape 2 : Policies Supabase
- [ ] Aller dans **Supabase Dashboard → SQL Editor**
- [ ] Exécuter le script `SUPABASE_RLS_POLICIES.sql`
- [ ] Vérifier que les policies sont actives dans **Authentication → Policies**

### Étape 3 : Redéploiement
- [ ] Faire un nouveau push vers GitHub
- [ ] Vérifier les logs de build Vercel
- [ ] Tester l'application déployée

## 🧪 Test après déploiement

1. **Vérifier les logs Vercel** :
   - Allez dans votre déploiement → "Functions" → "Logs"
   - Cherchez les erreurs liées à Supabase

2. **Tester dans le navigateur** :
   - Ouvrez la console (F12)
   - Vérifiez qu'il n'y a pas d'erreurs `Supabase client not initialized`
   - Testez une requête (ex: charger les catégories)

3. **Vérifier les policies RLS** :
   - Si vous avez des erreurs "permission denied"
   - Vérifiez que les policies sont bien créées dans Supabase

## ❓ Si ça ne fonctionne toujours pas

### Vérifier les variables
```javascript
// Dans la console du navigateur (après déploiement)
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
```

### Vérifier les policies RLS
Dans Supabase Dashboard → Authentication → Policies, vérifiez que :
- RLS est activé sur les tables
- Les policies de lecture sont créées
- Les policies utilisent `USING (true)` pour l'accès public

### Logs à partager
Si vous avez encore des problèmes, partagez :
1. Les logs de build Vercel
2. Les logs runtime Vercel
3. Les erreurs dans la console du navigateur
4. Les erreurs dans Supabase Dashboard → Logs

