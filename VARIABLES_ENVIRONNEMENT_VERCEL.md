# 📋 Variables d'environnement à configurer dans Vercel

## 🎯 Variables OBLIGATOIRES pour Supabase

Vous devez configurer **4 variables** dans Vercel pour que l'application fonctionne avec Supabase.

### 📍 Où les configurer ?

1. **Allez dans** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Sélectionnez** votre projet
3. **Cliquez sur** "Settings" (Paramètres)
4. **Cliquez sur** "Environment Variables" (Variables d'environnement)

### ✅ Variables à ajouter

Ajoutez ces **4 variables** une par une :

#### 1. `NEXT_PUBLIC_SUPABASE_URL`
```
Valeur : https://brygzpxiemwthickhuqb.supabase.co
Environnements : ✅ Production, ✅ Preview, ✅ Development
```

#### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
```
Valeur : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A
Environnements : ✅ Production, ✅ Preview, ✅ Development
```

#### 3. `VITE_SUPABASE_URL`
```
Valeur : https://brygzpxiemwthickhuqb.supabase.co
Environnements : ✅ Production, ✅ Preview, ✅ Development
```

#### 4. `VITE_SUPABASE_ANON_KEY`
```
Valeur : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A
Environnements : ✅ Production, ✅ Preview, ✅ Development
```

## ⚠️ Points IMPORTANTS

### 1. Sélectionner tous les environnements
Pour chaque variable, **cochez les 3 cases** :
- ✅ **Production** (pour le site en ligne)
- ✅ **Preview** (pour les previews de branches)
- ✅ **Development** (pour le développement)

### 2. Pas d'espaces
- ❌ **Ne mettez PAS d'espaces** avant ou après les valeurs
- ✅ **Copiez-collez exactement** les valeurs ci-dessus

### 3. Redéploiement obligatoire
Après avoir ajouté/modifié les variables :
1. **Allez dans** "Deployments"
2. **Cliquez sur les 3 points** du dernier déploiement
3. **Cliquez sur** "Redeploy"
4. **Attendez** 2-3 minutes

## 🔍 Comment vérifier que c'est bien configuré ?

### Méthode 1 : Dans Vercel Dashboard
1. **Settings → Environment Variables**
2. **Vérifiez** que les 4 variables sont listées
3. **Vérifiez** que chaque variable a les 3 environnements cochés

### Méthode 2 : Dans la console du navigateur (après redéploiement)
1. **Ouvrez** votre application déployée sur Vercel
2. **Ouvrez la console** (F12)
3. **Tapez** : `testSupabaseConnection()`
4. **Vous devriez voir** :
   ```
   ✅ Connexion Supabase : SUCCÈS
   Catégories : X
   Produits : Y
   ```

## 📝 Résumé rapide

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://brygzpxiemwthickhuqb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A` |
| `VITE_SUPABASE_URL` | `https://brygzpxiemwthickhuqb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A` |

**Pour chaque variable** : ✅ Production, ✅ Preview, ✅ Development

## 🚀 Après configuration

1. ✅ **Redéployez** sur Vercel
2. ✅ **Attendez** 2-3 minutes
3. ✅ **Testez** avec `testSupabaseConnection()` dans la console
4. ✅ **Vérifiez** que les produits s'affichent dans l'application

