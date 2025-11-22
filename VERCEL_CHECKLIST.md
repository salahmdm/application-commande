# ✅ Checklist Configuration Vercel + Supabase

## Variables d'environnement dans Vercel

### ✅ Déjà configuré (correct)
- `NEXT_PUBLIC_SUPABASE_URL` = https://crkpunuoliiqyuxtgqlr.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### ⚠️ À ajouter si vous avez un backend séparé

Si votre backend Express tourne sur un autre service (Railway, Render, etc.) :

**Dans Vercel → Settings → Environment Variables**, ajoutez :
```
VITE_API_URL=https://votre-backend.railway.app
```

**Important** : Remplacez `https://votre-backend.railway.app` par l'URL réelle de votre backend.

## Corrections apportées au code

### 1. ✅ Backend Supabase (`database/supabase-backend-service.js`)
- Utilise maintenant `NEXT_PUBLIC_SUPABASE_URL` en fallback
- Compatible avec les variables Vercel

### 2. ✅ Frontend Supabase (`src/services/supabaseClient.js`)
- Utilise `NEXT_PUBLIC_SUPABASE_URL` au lieu d'une valeur en dur

### 3. ✅ Frontend API (`src/services/api.js`)
- Utilise maintenant `VITE_API_URL` pour l'URL du backend
- Fallback sur `http://localhost:5000/api` en développement

## ⚠️ Problème important : Backend Express

**Vercel ne peut pas exécuter directement un serveur Express.**

Vous avez deux options :

### Option A : Backend séparé (Recommandé)

1. **Déployez le backend sur Railway** (gratuit) :
   - Allez sur https://railway.app
   - Créez un nouveau projet
   - Connectez votre repo GitHub
   - Sélectionnez "Deploy from GitHub repo"
   - Railway détectera automatiquement Node.js
   - Ajoutez les variables d'environnement :
     - `SUPABASE_URL` = https://crkpunuoliiqyuxtgqlr.supabase.co
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = eyJhbGci...
     - `PORT` = 5000 (ou laissez Railway gérer)

2. **Dans Vercel**, ajoutez :
   - `VITE_API_URL` = URL fournie par Railway (ex: https://votre-app.railway.app)

### Option B : Convertir en Serverless Functions

Nécessite de réécrire toutes les routes Express. Complexe mais possible.

## Test de connexion Supabase

Pour vérifier que Supabase fonctionne depuis Vercel :

1. **Dans Vercel**, allez dans votre déploiement
2. **Cliquez sur "Functions" → "Logs"**
3. **Cherchez les erreurs** liées à Supabase

Si vous voyez des erreurs comme :
- `Failed to fetch`
- `CORS error`
- `Invalid API key`

Partagez-les et je pourrai vous aider.

## Vérification rapide

Après déploiement, testez :
1. **Frontend** : Votre app Vercel devrait se charger
2. **Supabase** : Les appels depuis le frontend devraient fonctionner
3. **Backend** : Si déployé séparément, vérifiez les logs

## Questions fréquentes

### Q: Pourquoi le backend ne peut pas tourner sur Vercel ?
R: Vercel est conçu pour les applications statiques et les Serverless Functions. Un serveur Express qui écoute en continu ne peut pas tourner sur Vercel.

### Q: Puis-je utiliser Supabase directement depuis le frontend ?
R: Oui ! C'est même recommandé. Le frontend peut appeler Supabase directement sans passer par votre backend Express.

### Q: Dois-je garder le backend Express ?
R: Seulement si vous avez besoin de :
- Authentification JWT personnalisée
- Logique métier complexe
- WebSockets
- Upload de fichiers

Sinon, vous pouvez utiliser Supabase directement depuis le frontend.

