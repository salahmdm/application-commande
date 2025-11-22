# 🔧 Correction Variables Vercel + Vite

## ⚠️ Problème identifié

Dans **Vite**, les variables d'environnement doivent :
1. Utiliser `import.meta.env` (pas `process.env`)
2. Être préfixées par `VITE_` pour être exposées au client

## ✅ Solution : Variables à ajouter dans Vercel

Dans **Vercel Dashboard → Settings → Environment Variables**, ajoutez :

### Variables pour Vite (obligatoires)
```
VITE_SUPABASE_URL=https://crkpunuoliiqyuxtgqlr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Variables existantes (gardez-les aussi)
```
NEXT_PUBLIC_SUPABASE_URL=https://crkpunuoliiqyuxtgqlr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note** : Le code supporte maintenant les deux formats pour compatibilité.

## 🔒 Problème RLS (Row Level Security)

Si vous avez des erreurs "permission denied" ou "row-level security policy violation" :

### Solution 1 : Désactiver RLS temporairement (pour test)

Dans **Supabase Dashboard → Authentication → Policies** :

1. Allez dans chaque table
2. Désactivez temporairement RLS pour tester
3. **⚠️ Réactivez RLS après les tests pour la sécurité**

### Solution 2 : Créer des policies RLS appropriées (Recommandé)

Pour chaque table, créez des policies qui permettent la lecture :

```sql
-- Exemple pour la table 'products'
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
USING (true);

-- Exemple pour la table 'categories'
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
USING (true);
```

### Solution 3 : Utiliser SERVICE_ROLE_KEY pour le backend

Si votre backend a besoin de bypass RLS :
1. Dans Supabase Dashboard → Settings → API
2. Copiez la **Service Role Key** (⚠️ SECRET, ne jamais exposer côté client)
3. Dans Vercel, ajoutez :
   ```
   SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
   ```

## 📝 Checklist Vercel

- [ ] Ajouter `VITE_SUPABASE_URL` dans Vercel
- [ ] Ajouter `VITE_SUPABASE_ANON_KEY` dans Vercel
- [ ] Garder `NEXT_PUBLIC_SUPABASE_URL` (pour compatibilité)
- [ ] Garder `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pour compatibilité)
- [ ] Vérifier les policies RLS dans Supabase
- [ ] Redéployer sur Vercel après avoir ajouté les variables

## 🧪 Test

Après avoir ajouté les variables dans Vercel :

1. **Redéployez** (ou faites un nouveau push)
2. **Vérifiez les logs Vercel** pour voir si les variables sont bien chargées
3. **Testez l'application** déployée

## ❓ Si ça ne fonctionne toujours pas

Partagez :
1. Les logs de build Vercel
2. Les logs runtime Vercel
3. Les erreurs dans la console du navigateur

