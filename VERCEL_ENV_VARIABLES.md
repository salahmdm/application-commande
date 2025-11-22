# Variables d'environnement pour Vercel

## ⚠️ IMPORTANT : Vite utilise VITE_ prefix

Dans **Vite**, les variables d'environnement doivent être préfixées par `VITE_` pour être exposées au client pendant le build.

## Variables à ajouter dans Vercel

Allez dans **Vercel Dashboard → Votre Projet → Settings → Environment Variables**

### Variables obligatoires (format Vite)

```
VITE_SUPABASE_URL=https://crkpunuoliiqyuxtgqlr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0
```

### Variables optionnelles (si vous avez un backend séparé)

```
VITE_API_URL=https://votre-backend.railway.app
```

## Configuration dans Vercel

1. **Allez dans votre projet Vercel**
2. **Settings → Environment Variables**
3. **Ajoutez les variables** :
   - Cliquez sur "Add New"
   - Nom : `VITE_SUPABASE_URL`
   - Valeur : `https://crkpunuoliiqyuxtgqlr.supabase.co`
   - Environnements : ✅ Production, ✅ Preview, ✅ Development
   - Cliquez sur "Save"

4. **Répétez pour** `VITE_SUPABASE_ANON_KEY`

## Après avoir ajouté les variables

1. **Redéployez** votre application dans Vercel
2. Ou faites un **nouveau push** vers GitHub (Vercel redéploiera automatiquement)

## Vérification

Pour vérifier que les variables sont bien chargées :

1. Dans Vercel, allez dans votre déploiement
2. Cliquez sur "Functions" → "Logs"
3. Cherchez les logs qui affichent les variables (si vous avez ajouté des console.log)

Ou testez directement dans votre application déployée.

