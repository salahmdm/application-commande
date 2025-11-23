# 🔧 Solution : Vercel ne récupère pas les données de Supabase

## ✅ Confirmation

- ✅ **Accès local à Supabase** : Fonctionne (50 produits trouvés)
- ❌ **Accès Vercel à Supabase** : Ne fonctionne pas

## 🔍 Causes probables

### 1. Variables d'environnement non configurées dans Vercel ⚠️ PRIORITÉ 1

**Symptôme** : Les requêtes Supabase échouent silencieusement ou retournent des erreurs

**Solution** :
1. **Allez dans Vercel Dashboard → Votre projet → Settings → Environment Variables**
2. **Ajoutez/modifiez** ces 4 variables :

```
NEXT_PUBLIC_SUPABASE_URL = https://brygzpxiemwthickhuqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A

VITE_SUPABASE_URL = https://brygzpxiemwthickhuqb.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A
```

**Important** :
- ✅ Sélectionnez **Production**, **Preview** et **Development** pour chaque variable
- ✅ Vérifiez qu'il n'y a **pas d'espaces** avant/après les valeurs
- ✅ **Redéployez** après avoir ajouté/modifié les variables

### 2. Policies RLS bloquent l'accès ⚠️ PRIORITÉ 2

**Symptôme** : Erreur `PGRST301` ou `new row violates row-level security policy`

**Solution** :
1. **Allez dans Supabase Dashboard → SQL Editor**
2. **Ouvrez** le fichier `SUPABASE_RLS_POLICIES_SIMPLE.sql`
3. **Copiez** tout le contenu
4. **Collez** dans l'éditeur SQL
5. **Exécutez** (Run)

### 3. Code déployé utilise encore l'ancienne version ⚠️ PRIORITÉ 3

**Symptôme** : Erreur `column products.is_active does not exist`

**Solution** : ✅ **DÉJÀ CORRIGÉ** dans le code, mais Vercel doit redéployer

**Vérification** :
- Le code local utilise `is_available` (corrigé)
- Vercel doit redéployer avec le nouveau code

## 🔧 Actions à effectuer (dans l'ordre)

### Étape 1 : Vérifier les variables Vercel

1. **Vercel Dashboard → Settings → Environment Variables**
2. **Vérifiez** que les 4 variables existent :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Si elles n'existent pas**, ajoutez-les avec les valeurs ci-dessus
4. **Si elles existent**, vérifiez qu'elles ont les bonnes valeurs

### Étape 2 : Exécuter les policies RLS

1. **Supabase Dashboard → SQL Editor**
2. **Ouvrez** `SUPABASE_RLS_POLICIES_SIMPLE.sql`
3. **Copiez** tout le contenu
4. **Collez** dans l'éditeur SQL
5. **Exécutez** (Run)

### Étape 3 : Forcer un redéploiement Vercel

1. **Vercel Dashboard → Deployments**
2. **Cliquez sur les 3 points** du dernier déploiement
3. **Cliquez sur "Redeploy"**
4. **Attendez** 2-3 minutes que le déploiement se termine

### Étape 4 : Tester après redéploiement

1. **Ouvrez** l'application déployée sur Vercel
2. **Ouvrez la console du navigateur** (F12)
3. **Tapez** : `testSupabaseConnection()`
4. **Vous devriez voir** :
   ```
   ✅ Connexion Supabase : SUCCÈS
   Catégories : X
   Produits : Y
   ```

## 📋 Checklist de vérification

- [ ] Variables d'environnement configurées dans Vercel (4 variables)
- [ ] Variables définies pour **Production**, **Preview** et **Development**
- [ ] Policies RLS exécutées dans Supabase
- [ ] Redéploiement Vercel effectué
- [ ] Test `testSupabaseConnection()` réussi
- [ ] URL de requête contient `is_available` (pas `is_active`)
- [ ] Produits s'affichent dans l'application

## 🔍 Diagnostic dans la console

Après le redéploiement, dans la console du navigateur, vous devriez voir :

**Si les variables sont bien configurées** :
```
🔍 Supabase Client - Variables d'environnement:
   VITE_SUPABASE_URL: https://brygzpxiemwthickhuqb.supabase.co
   NEXT_PUBLIC_SUPABASE_URL: https://brygzpxiemwthickhuqb.supabase.co
   ...
```

**Si Supabase fonctionne** :
```
🔄 productService.getAllProducts - Utilisation Supabase direct
✅ productService.getAllProducts - X produits récupérés depuis Supabase
```

**Si les policies RLS bloquent** :
```
❌ Supabase - Erreur getProducts: {code: 'PGRST301', ...}
```

## ⚠️ Problèmes courants

### Problème 1 : Variables non chargées

**Symptôme** : `VITE_SUPABASE_URL: non défini`

**Solution** : Vérifiez que les variables sont bien configurées dans Vercel et redéployez

### Problème 2 : Policies RLS

**Symptôme** : `PGRST301` ou `new row violates row-level security policy`

**Solution** : Exécutez `SUPABASE_RLS_POLICIES_SIMPLE.sql` dans Supabase

### Problème 3 : Nom de colonne incorrect

**Symptôme** : `column products.is_active does not exist`

**Solution** : Attendez que Vercel redéploie avec le code corrigé (utilise `is_available`)

