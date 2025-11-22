# 🔧 Correction : Variables d'environnement Vercel

## ✅ Configuration finale

**Compte Supabase à utiliser** :
- ✅ URL : `https://brygzpxiemwthickhuqb.supabase.co`
- ✅ Clé : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A`

## ✅ Solution : Mettre à jour les variables Vercel

### Étape 1 : Modifier les variables dans Vercel

1. **Allez dans Vercel Dashboard → Votre projet → Settings → Environment Variables**

2. **Modifiez `NEXT_PUBLIC_SUPABASE_URL`** :
   - Cliquez sur la variable existante
   - Changez la valeur en : `https://brygzpxiemwthickhuqb.supabase.co`
   - Vérifiez que c'est défini pour **Production**, **Preview** et **Development**
   - Cliquez sur **Save**

3. **Modifiez `NEXT_PUBLIC_SUPABASE_ANON_KEY`** :
   - Cliquez sur la variable existante
   - Changez la valeur en : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A`
   - Vérifiez que c'est défini pour **Production**, **Preview** et **Development**
   - Cliquez sur **Save**

4. **Ajoutez `VITE_SUPABASE_URL`** (si elle n'existe pas) :
   - Cliquez sur **Add New**
   - Nom : `VITE_SUPABASE_URL`
   - Valeur : `https://brygzpxiemwthickhuqb.supabase.co`
   - Sélectionnez **Production**, **Preview** et **Development**
   - Cliquez sur **Save**

5. **Ajoutez `VITE_SUPABASE_ANON_KEY`** (si elle n'existe pas) :
   - Cliquez sur **Add New**
   - Nom : `VITE_SUPABASE_ANON_KEY`
   - Valeur : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A`
   - Sélectionnez **Production**, **Preview** et **Development**
   - Cliquez sur **Save**

### Étape 2 : Vérifier les variables

Après avoir modifié, vous devriez avoir **4 variables** :

```
✅ NEXT_PUBLIC_SUPABASE_URL = https://brygzpxiemwthickhuqb.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A
✅ VITE_SUPABASE_URL = https://brygzpxiemwthickhuqb.supabase.co
✅ VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A
```

### Étape 3 : Redéployer

Après avoir modifié les variables :

1. **Allez dans Vercel Dashboard → Deployments**
2. **Cliquez sur les 3 points** du dernier déploiement
3. **Cliquez sur "Redeploy"**
4. **Attendez 2-3 minutes** que le déploiement se termine

**OU** faites un commit vide :
```bash
git commit --allow-empty -m "Trigger redeploy for Supabase variables"
git push origin main
```

### Étape 4 : Vérifier les policies RLS

1. **Allez dans Supabase Dashboard → SQL Editor**
2. **Ouvrez** `SUPABASE_RLS_POLICIES_SIMPLE.sql`
3. **Copiez** tout le contenu
4. **Collez** dans l'éditeur SQL
5. **Exécutez** (Run)

## ✅ Vérification finale

Après le redéploiement :

1. **Ouvrez votre application déployée sur Vercel**
2. **Ouvrez la console du navigateur** (F12)
3. **Tapez** : `testSupabaseConnection()`
4. **Vous devriez voir** :
   ```
   ✅ Connexion Supabase : SUCCÈS
   Catégories : 4
   Produits : 50
   ```

## 📋 Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` modifié vers `https://brygzpxiemwthickhuqb.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` modifié vers la bonne clé
- [ ] `VITE_SUPABASE_URL` ajouté avec la nouvelle URL
- [ ] `VITE_SUPABASE_ANON_KEY` ajouté avec la nouvelle clé
- [ ] Toutes les variables définies pour **Production**, **Preview** et **Development**
- [ ] Redéploiement effectué
- [ ] Policies RLS exécutées dans Supabase
- [ ] Test `testSupabaseConnection()` réussi

