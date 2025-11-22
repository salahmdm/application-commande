# 🔧 Correction : Affichage des données sur Vercel

## ⚠️ Problème identifié

Les données de la base de données ne s'affichent pas sur l'application déployée sur Vercel.

**Cause** : Le frontend essaie d'appeler le backend Express (`/api/kiosk/categories`, `/api/kiosk/products`), mais :
- Sur Vercel, il n'y a **pas de backend Node.js** qui tourne
- Les appels API échouent car `VITE_API_URL` n'est pas défini ou pointe vers un backend inexistant

## ✅ Solution appliquée

J'ai modifié `kioskService` pour utiliser **Supabase directement** depuis le frontend quand :
- On est en production (`import.meta.env.PROD === true`)
- Et qu'il n'y a pas de backend configuré (`!import.meta.env.VITE_API_URL`)

### Fichiers modifiés

1. **`src/services/kioskService.js`** :
   - ✅ Ajout de la méthode `shouldUseSupabase()` pour détecter si on doit utiliser Supabase directement
   - ✅ `getCategories()` utilise maintenant Supabase directement en production
   - ✅ `getProductsByCategory()` utilise maintenant Supabase directement en production

2. **`src/services/supabaseService.js`** :
   - ✅ `getCategories()` accepte maintenant des filtres (`isActive`, `search`)
   - ✅ `getProducts()` supporte déjà les filtres

## 📋 Checklist de vérification

### 1. Variables Vercel (obligatoires)

Dans **Vercel Dashboard → Settings → Environment Variables**, vérifiez que vous avez :

```
VITE_SUPABASE_URL=https://crkpunuoliiqyuxtgqlr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important** : Ces variables doivent être définies pour **Production**, **Preview** et **Development**.

### 2. Policies RLS Supabase

Assurez-vous que les policies RLS sont bien configurées dans Supabase :

1. Allez dans **Supabase Dashboard → SQL Editor**
2. Exécutez le script `SUPABASE_RLS_POLICIES.sql`
3. Vérifiez dans **Authentication → Policies** que les policies sont actives

### 3. Redéploiement

Après avoir ajouté les variables et exécuté les policies :
1. Faites un nouveau push vers GitHub
2. Vercel redéploiera automatiquement
3. Vérifiez les logs de déploiement

## 🧪 Test

### Test local (simulation production)

1. Créez un fichier `.env.production.local` :
   ```
   VITE_SUPABASE_URL=https://crkpunuoliiqyuxtgqlr.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Build et preview :
   ```bash
   npm run build
   npm run preview
   ```

3. Ouvrez `http://localhost:4173` et vérifiez que les catégories et produits s'affichent

### Test sur Vercel

1. Vérifiez les logs de build Vercel
2. Ouvrez l'application déployée
3. Ouvrez la console du navigateur (F12)
4. Vérifiez qu'il n'y a pas d'erreurs Supabase
5. Les catégories et produits devraient s'afficher

## 🔍 Debug

Si les données ne s'affichent toujours pas :

### 1. Vérifier les variables dans la console

Ouvrez la console du navigateur et tapez :
```javascript
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
```

### 2. Vérifier les erreurs Supabase

Dans la console, cherchez les erreurs :
- `permission denied` → Problème de policies RLS
- `relation does not exist` → Table n'existe pas dans Supabase
- `invalid API key` → Clé Supabase incorrecte

### 3. Vérifier les logs Vercel

Dans Vercel Dashboard → Votre déploiement → Functions → Logs, cherchez :
- Erreurs de build
- Erreurs runtime
- Erreurs Supabase

## 📝 Notes

- **En développement local** : Le code utilisera toujours le backend API si `VITE_API_URL` est défini
- **En production Vercel** : Le code utilisera Supabase directement si `VITE_API_URL` n'est pas défini
- **Si vous déployez le backend séparément** : Ajoutez `VITE_API_URL` dans Vercel et le code utilisera le backend

