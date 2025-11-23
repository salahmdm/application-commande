# 🔍 Diagnostic : Vercel ne récupère pas les données de Supabase

## ✅ Confirmation

- ✅ **Accès local à Supabase** : Fonctionne (on a pu voir les produits)
- ❌ **Accès Vercel à Supabase** : Ne fonctionne pas

## 🔍 Causes possibles

### 1. Variables d'environnement non configurées dans Vercel

**Vérification** :
1. Allez dans **Vercel Dashboard → Votre projet → Settings → Environment Variables**
2. Vérifiez que vous avez **exactement** ces 4 variables :

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

### 2. Policies RLS bloquent l'accès

**Symptôme** : Erreur `PGRST301` ou `new row violates row-level security policy`

**Solution** :
1. Allez dans **Supabase Dashboard → SQL Editor**
2. Ouvrez `SUPABASE_RLS_POLICIES_SIMPLE.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Exécutez (Run)

### 3. Code déployé utilise encore l'ancienne version

**Symptôme** : Erreur `column products.is_active does not exist`

**Solution** : ✅ **DÉJÀ CORRIGÉ** dans le code, mais Vercel doit redéployer

**Vérification** :
- Le code local utilise `is_available` (corrigé)
- Vercel doit redéployer avec le nouveau code

### 4. Le code n'utilise pas Supabase directement sur Vercel

**Vérification** : Le code doit détecter qu'on est sur Vercel (pas de `VITE_API_URL`) et utiliser Supabase directement.

## 🔧 Solutions à appliquer

### Étape 1 : Vérifier les variables Vercel

1. **Vercel Dashboard → Settings → Environment Variables**
2. **Vérifiez** que les 4 variables existent**
3. **Redéployez** si vous avez modifié les variables

### Étape 2 : Exécuter les policies RLS

1. **Supabase Dashboard → SQL Editor**
2. **Exécutez** `SUPABASE_RLS_POLICIES_SIMPLE.sql`

### Étape 3 : Forcer un redéploiement Vercel

1. **Vercel Dashboard → Deployments**
2. **Cliquez sur les 3 points** du dernier déploiement
3. **Cliquez sur "Redeploy"**
4. **Attendez** 2-3 minutes

### Étape 4 : Tester après redéploiement

1. **Ouvrez** l'application déployée
2. **Console du navigateur** (F12)
3. **Tapez** : `testSupabaseConnection()`
4. **Vérifiez** les logs dans la console

## 📋 Checklist de vérification

- [ ] Variables d'environnement configurées dans Vercel (4 variables)
- [ ] Variables définies pour **Production**, **Preview** et **Development**
- [ ] Policies RLS exécutées dans Supabase
- [ ] Redéploiement Vercel effectué
- [ ] Test `testSupabaseConnection()` réussi
- [ ] URL de requête contient `is_available` (pas `is_active`)



