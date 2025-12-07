# 🚀 Options de Déploiement du Backend

## Situation Actuelle

Votre backend est un **serveur Express complet** avec :
- ✅ WebSocket (Socket.io) pour temps réel
- ✅ Connexion à Supabase
- ✅ Sessions persistantes
- ✅ Upload de fichiers
- ✅ Serveur HTTP classique

**Vercel déploie uniquement le frontend** (fichiers statiques React/Vite).

---

## Option 1 : Déployer le Backend Séparément (RECOMMANDÉ) ✅

### Services Recommandés

#### 🚂 Railway (Recommandé)
- **Avantages** : Simple, gratuit pour commencer, supporte WebSocket
- **URL** : `https://votre-app.railway.app`
- **Configuration** :
  1. Créez un compte sur [railway.app](https://railway.app)
  2. Nouveau projet → Deploy from GitHub
  3. Sélectionnez votre repo
  4. Configurez les variables d'environnement
  5. Déployez le dossier `database/`

#### 🌐 Render
- **Avantages** : Gratuit avec limitations, simple
- **URL** : `https://votre-app.onrender.com`
- **Note** : Peut avoir des limitations avec WebSocket

#### ☁️ Heroku
- **Avantages** : Bien connu, stable
- **URL** : `https://votre-app.herokuapp.com`
- **Note** : Payant maintenant (plus de plan gratuit)

#### 💻 VPS (DigitalOcean, AWS, etc.)
- **Avantages** : Contrôle total, performant
- **URL** : Votre domaine personnalisé
- **Note** : Nécessite plus de configuration

### Configuration Requise

Dans le service choisi, configurez :

**Variables d'environnement** :
```
NODE_ENV=production
PORT=5000 (ou celui fourni par le service)
CORS_ORIGINS=https://votre-app.vercel.app
SUPABASE_URL=votre_url_supabase
SUPABASE_KEY=votre_clé_supabase
JWT_SECRET=votre_secret_jwt
```

**Script de démarrage** :
```json
{
  "scripts": {
    "start": "node database/admin-api.js"
  }
}
```

**Point d'entrée** : `database/admin-api.js`

---

## Option 2 : Déployer le Backend sur Vercel (Fonctions Serverless)

⚠️ **ATTENTION** : Cela nécessite une **refactorisation importante** du backend.

### Limitations

- ❌ **WebSocket** : Vercel ne supporte pas WebSocket natif (nécessite un service séparé)
- ❌ **Sessions persistantes** : Les fonctions serverless sont stateless
- ❌ **Upload de fichiers** : Limité à 4.5 MB
- ❌ **Timeout** : Maximum 60 secondes par fonction (10s sur plan gratuit)

### Si vous voulez quand même essayer

1. **Créer un dossier `api/`** à la racine
2. **Convertir les routes en fonctions serverless**
3. **Déployer WebSocket séparément** (Railway, Render, etc.)

**Exemple de structure** :
```
api/
  ├── auth/
  │   └── login.js
  ├── products/
  │   └── index.js
  └── orders/
      └── [id].js
```

**Exemple de fonction** (`api/products/index.js`) :
```javascript
export default async function handler(req, res) {
  // Votre logique ici
  res.json({ success: true, data: [] });
}
```

---

## Option 3 : Déployer Frontend + Backend sur le Même Service

### Railway (Recommandé pour tout déployer)

Railway peut déployer plusieurs services :
1. **Service 1** : Frontend (dossier racine)
2. **Service 2** : Backend (dossier `database/`)

**Avantages** :
- ✅ Tout au même endroit
- ✅ Variables d'environnement partagées
- ✅ Déploiement simplifié

**Configuration** :
- Frontend : `VITE_API_URL=https://backend.railway.app`
- Backend : `CORS_ORIGINS=https://frontend.railway.app`

---

## 🎯 Recommandation

### Pour votre cas, je recommande :

1. **Déployer le backend sur Railway** (le plus simple)
2. **Garder le frontend sur Vercel** (excellent pour React/Vite)
3. **Configurer `VITE_API_URL`** dans Vercel avec l'URL Railway

### Étapes Rapides (Railway)

1. **Créez un compte Railway** : [railway.app](https://railway.app)
2. **Nouveau projet** → "Deploy from GitHub repo"
3. **Sélectionnez votre repo**
4. **Configurez** :
   - **Root Directory** : `database`
   - **Start Command** : `node admin-api.js`
5. **Ajoutez les variables d'environnement**
6. **Déployez**
7. **Copiez l'URL** (ex: `https://blossom-backend.railway.app`)
8. **Dans Vercel** : Ajoutez `VITE_API_URL=https://blossom-backend.railway.app`

---

## 📋 Checklist Déploiement Backend

### Avant de déployer

- [ ] Variables d'environnement configurées
- [ ] Base de données Supabase accessible
- [ ] CORS configuré pour autoriser Vercel
- [ ] Port configuré (utiliser celui du service ou variable d'environnement)

### Après déploiement

- [ ] Backend accessible (tester l'URL dans le navigateur)
- [ ] Health check fonctionne (`/api/health`)
- [ ] CORS fonctionne (pas d'erreurs CORS dans la console)
- [ ] WebSocket fonctionne (si utilisé)
- [ ] `VITE_API_URL` configuré dans Vercel
- [ ] Frontend redéployé sur Vercel

---

## 🔍 Vérification

### Tester le backend déployé

1. **Ouvrez l'URL du backend** dans votre navigateur
2. **Vous devriez voir** : Une réponse JSON ou une erreur 404 (normal, pas de route `/`)
3. **Testez** : `https://votre-backend.railway.app/api/health`
4. **Devrait retourner** : `{ "status": "ok", "database": "connected" }`

### Tester depuis le frontend

1. **Ouvrez la console** (F12)
2. **Regardez les requêtes réseau**
3. **Les requêtes doivent pointer vers** : `https://votre-backend.railway.app/api/...`
4. **Pas vers** : `http://localhost:5000/api/...`

---

## 🆘 Besoin d'Aide ?

Si vous avez besoin d'aide pour :
- Configurer Railway
- Configurer Render
- Convertir en fonctions serverless Vercel
- Configurer un VPS

Dites-moi quel service vous préférez et je vous guiderai étape par étape !

---

**Résumé** : Vercel = Frontend uniquement. Backend = Déployer séparément (Railway recommandé).

