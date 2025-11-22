# ✅ Variables d'environnement Vercel - Configuration finale

## 📋 Informations du compte Supabase

- **URL du projet** : `https://brygzpxiemwthickhuqb.supabase.co`
- **Clé API (ANON KEY)** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A`

## 🔧 Configuration dans Vercel

### Variables à configurer

Allez dans **Vercel Dashboard → Votre projet → Settings → Environment Variables** et configurez :

```
NEXT_PUBLIC_SUPABASE_URL = https://brygzpxiemwthickhuqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A

VITE_SUPABASE_URL = https://brygzpxiemwthickhuqb.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A
```

**Important** :
- ✅ Sélectionnez **Production**, **Preview** et **Development** pour chaque variable
- ✅ Redéployez après avoir ajouté/modifié les variables

## ✅ Vérifications

### 1. Vérifier que les données sont dans Supabase

1. **Allez dans Supabase Dashboard → Table Editor**
2. **Vérifiez** que les tables contiennent des données :
   - `categories` : doit avoir des catégories
   - `products` : doit avoir des produits
   - `users` : doit avoir des utilisateurs

### 2. Vérifier les policies RLS

1. **Allez dans Supabase Dashboard → Authentication → Policies**
2. **Vérifiez** que les policies existent pour les tables principales
3. **Si elles n'existent pas**, exécutez `SUPABASE_RLS_POLICIES_SIMPLE.sql`

### 3. Tester la connexion

Après le redéploiement, dans la console du navigateur (F12), tapez :
```javascript
testSupabaseConnection()
```

Vous devriez voir :
```
✅ Connexion Supabase : SUCCÈS
Catégories : X
Produits : Y
```

## 📋 Checklist

- [ ] Variables configurées dans Vercel avec les bonnes valeurs
- [ ] Variables définies pour **Production**, **Preview** et **Development**
- [ ] Redéploiement effectué
- [ ] Policies RLS exécutées dans Supabase
- [ ] Données présentes dans Supabase (vérifier dans Table Editor)
- [ ] Test `testSupabaseConnection()` réussi

