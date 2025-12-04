# Configuration Vercel - Variables d'environnement

## Problème
L'application essaie de se connecter à `http://localhost:5000/api` en production, ce qui ne fonctionne pas car le backend n'est pas sur localhost.

## Solution

### 1. Déterminer l'URL de votre backend

Votre backend doit être déployé sur un service séparé (Railway, Render, Heroku, VPS, etc.).

**Exemples d'URLs backend :**
- Railway : `https://votre-app.railway.app`
- Render : `https://votre-app.onrender.com`
- Heroku : `https://votre-app.herokuapp.com`
- VPS : `https://api.votre-domaine.com`

### 2. Configurer la variable d'environnement dans Vercel

#### Via l'interface Vercel :

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez une nouvelle variable :
   - **Name** : `VITE_API_URL`
   - **Value** : L'URL de votre backend (sans `/api` à la fin)
     - Exemple : `https://votre-backend.railway.app`
     - ⚠️ **IMPORTANT** : Ne pas mettre `/api` à la fin, c'est ajouté automatiquement
   - **Environments** : Cochez **Production**, **Preview**, et **Development** si nécessaire
5. Cliquez sur **Save**
6. **Redéployez** votre application (Settings → Deployments → ... → Redeploy)

#### Via la CLI Vercel :

```bash
vercel env add VITE_API_URL production
# Entrez l'URL de votre backend (ex: https://votre-backend.railway.app)
```

### 3. Vérifier la configuration

Après le redéploiement, l'application devrait utiliser l'URL de votre backend au lieu de `localhost:5000`.

### 4. Configuration CORS du backend

Assurez-vous que votre backend autorise les requêtes depuis votre domaine Vercel :

Dans votre fichier `database/admin-api.js`, vérifiez que votre domaine Vercel est dans `allowedOrigins` :

```javascript
const allowedOrigins = isProd
  ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
  : [
      'http://localhost:3000',
      'http://localhost:3010',
      'http://localhost:3050'
    ];
```

Ajoutez votre domaine Vercel dans les variables d'environnement du backend :
- Variable : `CORS_ORIGINS`
- Valeur : `https://votre-app.vercel.app,https://votre-domaine.com` (séparé par des virgules)

## Variables d'environnement nécessaires

### Frontend (Vercel) :
- `VITE_API_URL` : URL de votre backend (ex: `https://votre-backend.railway.app`)

### Backend (Railway/Render/etc.) :
- `CORS_ORIGINS` : Domaines autorisés (ex: `https://votre-app.vercel.app`)
- `NODE_ENV` : `production`
- `JWT_SECRET` : Votre secret JWT
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` : Configuration MySQL
- Toutes les autres variables nécessaires à votre backend

## Test

Après configuration, testez en ouvrant la console du navigateur (F12) et vérifiez que les requêtes API pointent vers votre backend et non vers `localhost:5000`.

