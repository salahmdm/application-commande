# 🚨 GUIDE URGENT - Configuration Vercel

## ⚠️ PROBLÈME ACTUEL

Vous recevez l'erreur :
```
Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré sur http://localhost:5000/api
```

**Cela signifie que la variable d'environnement `VITE_API_URL` n'est pas configurée dans Vercel.**

---

## ✅ SOLUTION EN 3 ÉTAPES

### Étape 1 : Trouver l'URL de votre backend

Votre backend doit être déployé sur un service comme :
- **Railway** : `https://votre-app.railway.app`
- **Render** : `https://votre-app.onrender.com`
- **Heroku** : `https://votre-app.herokuapp.com`
- **VPS** : `https://api.votre-domaine.com`

**Exemple** : Si votre backend est sur Railway, l'URL ressemble à `https://mon-backend.railway.app`

### Étape 2 : Configurer dans Vercel

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Sélectionnez votre projet**
3. **Cliquez sur "Settings"** (Paramètres)
4. **Cliquez sur "Environment Variables"** (Variables d'environnement)
5. **Cliquez sur "Add New"** (Ajouter)
6. **Remplissez** :
   - **Key** (Clé) : `VITE_API_URL`
   - **Value** (Valeur) : L'URL de votre backend **SANS `/api` à la fin**
     - ✅ **BON** : `https://mon-backend.railway.app`
     - ❌ **MAUVAIS** : `https://mon-backend.railway.app/api`
   - **Environments** : Cochez **Production**, **Preview**, et **Development**
7. **Cliquez sur "Save"** (Enregistrer)

### Étape 3 : Redéployer

1. **Allez dans "Deployments"** (Déploiements)
2. **Trouvez le dernier déploiement**
3. **Cliquez sur les trois points (...)** à droite
4. **Cliquez sur "Redeploy"** (Redéployer)
5. **Attendez la fin du déploiement** (2-3 minutes)

---

## 📋 EXEMPLE COMPLET

### Si votre backend est sur Railway :

1. **URL du backend** : `https://blossom-cafe-backend.railway.app`
2. **Dans Vercel** :
   - Key : `VITE_API_URL`
   - Value : `https://blossom-cafe-backend.railway.app`
   - Environments : ✅ Production, ✅ Preview, ✅ Development
3. **Redéployer**

### Après le redéploiement :

L'application utilisera automatiquement `https://blossom-cafe-backend.railway.app/api` au lieu de `http://localhost:5000/api`

---

## 🔍 VÉRIFICATION

### Comment savoir si c'est bien configuré ?

1. **Ouvrez votre application déployée sur Vercel**
2. **Ouvrez la console du navigateur** (F12)
3. **Regardez les requêtes réseau** (onglet Network)
4. **Les requêtes doivent pointer vers votre backend**, pas vers `localhost:5000`

### Si ça ne fonctionne toujours pas :

1. **Vérifiez que le backend est bien déployé et accessible**
   - Ouvrez l'URL du backend dans votre navigateur
   - Vous devriez voir une réponse (même une erreur 404 est OK, ça signifie que le serveur répond)

2. **Vérifiez CORS sur le backend**
   - Le backend doit autoriser les requêtes depuis votre domaine Vercel
   - Variable d'environnement dans le backend : `CORS_ORIGINS`
   - Valeur : `https://votre-app.vercel.app`

3. **Vérifiez les logs Vercel**
   - Allez dans Vercel → Deployments → Votre déploiement → Logs
   - Cherchez des erreurs de build

---

## 🆘 BESOIN D'AIDE ?

Si vous n'avez pas encore de backend déployé :

1. **Déployez votre backend** sur Railway, Render, ou Heroku
2. **Notez l'URL** du backend
3. **Suivez les étapes ci-dessus** pour configurer `VITE_API_URL`

---

## 📝 RÉCAPITULATIF

✅ **Variable à ajouter** : `VITE_API_URL`  
✅ **Valeur** : URL de votre backend (sans `/api`)  
✅ **Environnements** : Production, Preview, Development  
✅ **Action** : Redéployer après configuration  

---

**Une fois configuré, votre application fonctionnera correctement !** 🎉

