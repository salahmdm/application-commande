# Guide de Déploiement Vercel avec Supabase

## ⚠️ Problème identifié

Votre application a :
- **Frontend** : Vite + React (peut être déployé sur Vercel)
- **Backend** : Express (`database/admin-api.js`) - **NE PEUT PAS tourner directement sur Vercel**

## Solutions possibles

### Option 1 : Backend séparé (Recommandé pour votre cas)

Le backend Express doit être déployé sur un autre service :
- **Railway** (recommandé) : https://railway.app
- **Render** : https://render.com
- **Heroku** : https://heroku.com
- **DigitalOcean App Platform**

**Configuration** :
1. Déployez le backend sur Railway/Render
2. Déployez le frontend sur Vercel
3. Dans Vercel, ajoutez une variable d'environnement :
   - `VITE_API_URL` = URL de votre backend (ex: https://votre-backend.railway.app)

### Option 2 : Convertir le backend en Serverless Functions Vercel

Créer des fonctions serverless pour chaque route API.

**Structure nécessaire** :
```
api/
├── auth/
│   └── login.js
├── products/
│   └── [id].js
└── orders/
    └── index.js
```

⚠️ **Complexe** : Nécessite de réécrire toutes les routes Express en fonctions serverless.

## ✅ Corrections apportées

J'ai corrigé le code pour qu'il utilise les variables Vercel :

1. **Backend** (`database/supabase-backend-service.js`) :
   - ✅ Utilise maintenant `NEXT_PUBLIC_SUPABASE_URL` en fallback
   - ✅ Utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Frontend** (`src/services/supabaseClient.js`) :
   - ✅ Utilise `NEXT_PUBLIC_SUPABASE_URL` au lieu d'une valeur en dur

## 🔧 Configuration Vercel actuelle

Vous avez configuré :
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Ces variables sont correctes** pour le frontend.

## 📝 Actions requises

### Si vous déployez seulement le frontend sur Vercel :

1. **Déployez le backend ailleurs** (Railway recommandé)
2. **Dans Vercel**, ajoutez aussi :
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```

3. **Modifiez les appels API dans le frontend** pour utiliser `VITE_API_URL` :
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```

### Si vous voulez tout sur Vercel :

Vous devez convertir le backend Express en Serverless Functions. C'est un gros travail.

## 🧪 Test local

Pour tester avec les mêmes variables que Vercel :

1. Créez `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://crkpunuoliiqyuxtgqlr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Testez le frontend :
   ```bash
   npm run dev
   ```

## ❓ Questions à clarifier

1. **Où est déployé votre backend Express actuellement ?**
   - Sur Vercel (via Serverless Functions) ?
   - Sur un autre service (Railway, Render, etc.) ?
   - Localement seulement ?

2. **Quelle erreur voyez-vous exactement dans Vercel ?**
   - Erreur de build ?
   - Erreur runtime ?
   - Erreur de connexion Supabase ?

## 🔍 Vérification

Pour vérifier que Supabase est accessible depuis Vercel :

1. Allez dans votre déploiement Vercel
2. Cliquez sur "Functions" → "Logs"
3. Cherchez les erreurs liées à Supabase

Si vous voyez des erreurs, partagez-les et je pourrai vous aider à les résoudre.

