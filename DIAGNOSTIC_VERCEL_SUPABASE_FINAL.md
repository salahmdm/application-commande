# 🔍 Diagnostic Final : Données non affichées sur Vercel

## ✅ Corrections appliquées

### 1. Correction de `kioskService.shouldUseSupabase()`

**Problème** : La fonction vérifiait `isProduction && !hasBackend`, mais sur Vercel, `import.meta.env.PROD` pourrait ne pas être défini correctement.

**Solution** : Simplification de la logique pour vérifier seulement si `VITE_API_URL` n'est pas défini.

```javascript
shouldUseSupabase() {
  const hasBackend = !!import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '';
  if (!hasBackend) {
    return true; // Utiliser Supabase directement
  }
  return false; // Utiliser le backend
}
```

### 2. Correction de `supabaseService.getCategories()`

**Problème** : La fonction filtrait par défaut les catégories actives même si `isActive` était `undefined`.

**Solution** : Ne filtrer que si `isActive` est explicitement défini.

```javascript
if (filters.isActive !== undefined) {
  const isActiveValue = filters.isActive === 1 || filters.isActive === true;
  query = query.eq('is_active', isActiveValue);
}
// Si isActive n'est pas défini, ne pas filtrer
```

### 3. Ajout de logs de débogage

**Ajouté** : Logs détaillés dans `supabaseClient.js` et `supabaseService.js` pour diagnostiquer les erreurs.

## 📋 Checklist de vérification

### 1. Variables d'environnement Vercel

Dans **Vercel Dashboard → Settings → Environment Variables**, vous devez avoir :

```
NEXT_PUBLIC_SUPABASE_URL = https://brygzpxiemwthickhuqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A

VITE_SUPABASE_URL = https://brygzpxiemwthickhuqb.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A
```

**Important** :
- ✅ Sélectionnez **Production**, **Preview** et **Development** pour chaque variable
- ✅ Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
- ✅ Redéployez après avoir ajouté/modifié les variables

### 2. Policies RLS dans Supabase

1. **Allez dans Supabase Dashboard → SQL Editor**
2. **Ouvrez** `SUPABASE_RLS_POLICIES_SIMPLE.sql`
3. **Copiez** tout le contenu
4. **Collez** dans l'éditeur SQL
5. **Exécutez** (Run)

### 3. Vérifier les données dans Supabase

1. **Allez dans Supabase Dashboard → Table Editor**
2. **Vérifiez** que les tables contiennent des données :
   - `categories` : doit avoir des catégories
   - `products` : doit avoir des produits
   - `users` : doit avoir des utilisateurs

### 4. Tester la connexion après redéploiement

1. **Redéployez** l'application sur Vercel
2. **Ouvrez** l'application déployée
3. **Ouvrez la console du navigateur** (F12)
4. **Tapez** : `testSupabaseConnection()`
5. **Vous devriez voir** :
   ```
   ✅ Connexion Supabase : SUCCÈS
   Catégories : X
   Produits : Y
   ```

### 5. Vérifier les logs dans la console

Dans la console du navigateur, vous devriez voir :
- `🔍 Supabase Client - Variables d'environnement:` (en développement)
- `✅ Supabase getCategories - X catégories récupérées`
- `✅ Supabase getProducts - Y produits récupérés`

Si vous voyez des erreurs :
- `❌ ERREUR: Variables Supabase manquantes !` → Vérifiez les variables Vercel
- `❌ Supabase - Erreur getCategories:` → Vérifiez les policies RLS
- `❌ Supabase - Erreur getProducts:` → Vérifiez les policies RLS

## 🔧 Problèmes courants et solutions

### Problème 1 : Variables non chargées

**Symptôme** : `❌ ERREUR: Variables Supabase manquantes !`

**Solution** :
1. Vérifiez que les variables sont bien définies dans Vercel
2. Vérifiez que les variables sont définies pour **Production**, **Preview** et **Development**
3. Redéployez après avoir ajouté/modifié les variables

### Problème 2 : Policies RLS bloquent l'accès

**Symptôme** : `❌ Supabase - Erreur getCategories: new row violates row-level security policy`

**Solution** :
1. Exécutez `SUPABASE_RLS_POLICIES_SIMPLE.sql` dans Supabase
2. Vérifiez que les policies sont actives dans **Authentication → Policies**

### Problème 3 : Aucune donnée dans Supabase

**Symptôme** : Connexion réussie mais `Catégories : 0`, `Produits : 0`

**Solution** :
1. Vérifiez que les données sont présentes dans Supabase (Table Editor)
2. Si les données sont absentes, transférez-les depuis MySQL ou un autre compte Supabase

## 📝 Notes importantes

- Les variables `VITE_*` sont exposées au client pendant le build Vite
- Les variables `NEXT_PUBLIC_*` fonctionnent aussi grâce au fallback dans le code
- Sur Vercel, il n'y a pas de backend Express, donc le code utilise Supabase directement
- Les logs de débogage ne s'affichent qu'en développement pour ne pas polluer la console en production



