# 🔧 Correction des erreurs Vercel

## ⚠️ Erreurs identifiées

### 1. OAuth Domain non autorisé
```
The current domain is not authorized for OAuth operations.
Domain: application-commande-hxfr-git-main-prise-de-commandes-projects.vercel.app
```

**Solution :**
1. Allez sur Firebase Console : https://console.firebase.google.com/project/prise-de-commande-pos/authentication/settings
2. Cliquez sur l'onglet **"Authorized domains"**
3. Cliquez sur **"Add domain"**
4. Ajoutez : `application-commande-hxfr-git-main-prise-de-commandes-projects.vercel.app`
5. Ajoutez aussi votre domaine de production Vercel (si différent)

### 2. Erreurs Firestore permission-denied
```
❌ Firebase - Erreur get document: {code: 'permission-denied'}
```

**Solution :**
- Les règles Firestore bloquent l'accès. C'est normal si vous utilisez Supabase pour les données.
- L'application utilise maintenant Supabase pour les données utilisateur, donc ces erreurs Firestore sont non-bloquantes.
- Si vous voulez supprimer ces erreurs, vous pouvez :
  1. Activer Firestore et configurer les règles (voir `CONFIGURER_REGLES_FIRESTORE.md`)
  2. Ou ignorer ces erreurs car l'application utilise Supabase

### 3. Erreurs localhost:5000 (Backend non disponible)
```
GET http://localhost:5000/api/restaurant-info net::ERR_CONNECTION_REFUSED
GET http://localhost:5000/api/loyalty-rewards net::ERR_CONNECTION_REFUSED
```

**Solution :**
- ✅ **Corrigé** : `businessInfoService.js` utilise maintenant Supabase directement sur Vercel
- ✅ **Corrigé** : Les appels à `loyalty-rewards` utilisent maintenant Supabase
- L'application détecte automatiquement si le backend est disponible et utilise Supabase sinon

### 4. Erreur Supabase 406 (RLS)
```
GET https://brygzpxiemwthickhuqb.supabase.co/rest/v1/settings?select=*&setting_key=eq.loyalty_rewards 406 (Not Acceptable)
```

**Solution :**
- Cette erreur indique que les règles RLS (Row Level Security) bloquent l'accès à la table `settings`
- L'application gère cette erreur en utilisant des valeurs par défaut
- Pour corriger définitivement, configurez les RLS policies dans Supabase pour permettre la lecture publique de `settings`

### 5. Images localhost:5000
```
GET http://localhost:5000/uploads/news/... net::ERR_CONNECTION_REFUSED
```

**Solution :**
- Les images doivent être servies depuis Supabase Storage ou une URL absolue
- ✅ **À corriger** : Les composants utilisent encore `localhost:5000` pour les images
- Utilisez Supabase Storage pour héberger les images en production

## ✅ Corrections appliquées

1. **`businessInfoService.js`** : Utilise maintenant Supabase directement sur Vercel
2. **Gestion des erreurs** : Amélioration de la gestion des erreurs Firestore (non-bloquant)
3. **Détection automatique** : L'application détecte si le backend est disponible et utilise Supabase sinon

## 📋 Actions requises

### 1. Ajouter le domaine Vercel à Firebase (OBLIGATOIRE)

1. Allez sur : https://console.firebase.google.com/project/prise-de-commande-pos/authentication/settings
2. Cliquez sur **"Authorized domains"**
3. Ajoutez votre domaine Vercel

### 2. Configurer Supabase RLS (Optionnel mais recommandé)

Pour permettre l'accès public à `settings` :

```sql
-- Dans Supabase SQL Editor
CREATE POLICY "Allow public read access to settings"
ON settings FOR SELECT
USING (true);
```

### 3. Migrer les images vers Supabase Storage (Recommandé)

Les images doivent être hébergées sur Supabase Storage au lieu de `localhost:5000`.

