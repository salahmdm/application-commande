# 🚂 Guide Étape par Étape - Déploiement Backend sur Railway

## 📋 Vue d'ensemble

Ce guide vous accompagne pour déployer votre backend Node.js/Express sur Railway, puis configurer Vercel pour s'y connecter.

**Temps estimé** : 15-20 minutes

---

## ÉTAPE 1 : Créer un compte Railway

### 1.1 Aller sur Railway

1. Ouvrez votre navigateur
2. Allez sur [railway.app](https://railway.app)
3. Cliquez sur **"Start a New Project"** ou **"Login"**

### 1.2 Se connecter avec GitHub

1. Cliquez sur **"Login with GitHub"**
2. Autorisez Railway à accéder à votre compte GitHub
3. Railway se connecte automatiquement

✅ **Vous êtes maintenant connecté à Railway**

---

## ÉTAPE 2 : Créer un nouveau projet

### 2.1 Nouveau projet

1. Dans Railway, cliquez sur **"New Project"** (bouton vert en haut à droite)
2. Sélectionnez **"Deploy from GitHub repo"**
3. Si c'est la première fois, autorisez Railway à accéder à vos repositories GitHub

### 2.2 Sélectionner votre repository

1. **Recherchez** votre repository : `application prise de commande`
2. **Cliquez** sur votre repository
3. Railway commence à analyser votre projet

✅ **Railway détecte automatiquement Node.js**

---

## ÉTAPE 3 : Configurer le service backend

### 3.1 Configuration de base

Railway ouvre automatiquement la configuration. Si ce n'est pas le cas :

1. Cliquez sur le **service** créé (généralement nommé d'après votre repo)
2. Allez dans l'onglet **"Settings"**

### 3.2 Configurer le Root Directory

1. Dans **"Settings"**, trouvez **"Root Directory"**
2. **Changez** de `/` (racine) à `database`
3. Cela indique à Railway que le backend est dans le dossier `database/`

### 3.3 Configurer le Start Command

1. Trouvez **"Start Command"**
2. **Entrez** : `node admin-api.js`
3. C'est la commande qui démarre votre serveur backend

### 3.4 Configurer le Port (optionnel)

1. Railway assigne automatiquement un port
2. Le backend utilisera la variable `PORT` fournie par Railway
3. **Ne changez rien** ici

✅ **Configuration de base terminée**

---

## ÉTAPE 4 : Configurer les variables d'environnement

### 4.1 Accéder aux variables

1. Dans votre service Railway, allez dans l'onglet **"Variables"**
2. Cliquez sur **"New Variable"** ou **"Raw Editor"**

### 4.2 Variables à ajouter

Ajoutez **une par une** ces variables :

#### Variable 1 : NODE_ENV
- **Name** : `NODE_ENV`
- **Value** : `production`
- **Cliquez** sur "Add"

#### Variable 2 : SUPABASE_URL
- **Name** : `SUPABASE_URL`
- **Value** : Votre URL Supabase
  - Allez sur [supabase.com](https://supabase.com)
  - Sélectionnez votre projet
  - **Settings** → **API**
  - Copiez **"Project URL"** (ex: `https://brygzpxiemwthickhuqb.supabase.co`)
- **Cliquez** sur "Add"

#### Variable 3 : SUPABASE_SERVICE_ROLE_KEY
- **Name** : `SUPABASE_SERVICE_ROLE_KEY`
- **Value** : Votre Service Role Key
  - Toujours dans Supabase → Settings → API
  - Copiez **"service_role" key** (⚠️ SECRET, ne jamais exposer)
  - C'est une longue chaîne qui commence par `eyJ...`
- **Cliquez** sur "Add"

#### Variable 4 : JWT_SECRET
- **Name** : `JWT_SECRET`
- **Value** : Générez un secret aléatoire
  - **Option 1** : Utilisez un générateur en ligne
  - **Option 2** : Exécutez dans votre terminal :
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
  - **Minimum 32 caractères** (recommandé : 64 caractères)
- **Cliquez** sur "Add"

#### Variable 5 : CORS_ORIGINS
- **Name** : `CORS_ORIGINS`
- **Value** : L'URL de votre app Vercel
  - Allez sur [vercel.com](https://vercel.com)
  - Sélectionnez votre projet
  - Copiez l'URL (ex: `https://blossom-cafe.vercel.app`)
  - Si vous avez plusieurs domaines, séparez par des virgules :
    - Exemple : `https://blossom-cafe.vercel.app,https://votre-domaine.com`
- **Cliquez** sur "Add"

#### Variable 6 : PORT (optionnel)
- Railway fournit automatiquement `PORT`
- **Ne l'ajoutez pas manuellement** sauf si nécessaire

✅ **Toutes les variables sont configurées**

---

## ÉTAPE 5 : Déployer

### 5.1 Lancer le déploiement

1. Railway démarre automatiquement le déploiement
2. Si ce n'est pas le cas, cliquez sur **"Deploy"** ou **"Redeploy"**

### 5.2 Suivre le déploiement

1. Allez dans l'onglet **"Deployments"**
2. Vous verrez les logs en temps réel
3. Attendez que le statut passe à **"Success"** (vert)

### 5.3 Vérifier les logs

1. Cliquez sur le déploiement
2. Regardez les logs pour vérifier :
   - ✅ `✅ Serveur démarré sur http://0.0.0.0:XXXX`
   - ✅ `✅ Backend configuré pour utiliser Supabase`
   - ❌ S'il y a des erreurs, notez-les

✅ **Backend déployé**

---

## ÉTAPE 6 : Obtenir l'URL du backend

### 6.1 Générer un domaine

1. Dans votre service Railway, allez dans l'onglet **"Settings"**
2. Trouvez **"Networking"** ou **"Domains"**
3. Cliquez sur **"Generate Domain"** ou **"Custom Domain"**
4. Railway génère une URL comme : `https://votre-service-production.up.railway.app`

### 6.2 Copier l'URL

1. **Copiez** l'URL complète (ex: `https://blossom-backend-production.up.railway.app`)
2. **Notez-la** quelque part, vous en aurez besoin

✅ **URL backend obtenue**

---

## ÉTAPE 7 : Configurer Vercel

### 7.1 Aller dans Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. **Connectez-vous** si nécessaire
3. **Sélectionnez** votre projet

### 7.2 Accéder aux variables d'environnement

1. Cliquez sur **"Settings"** (en haut)
2. Dans le menu de gauche, cliquez sur **"Environment Variables"**

### 7.3 Ajouter VITE_API_URL

1. Cliquez sur **"Add New"** (ou **"Add"**)
2. Remplissez :
   - **Key** : `VITE_API_URL`
   - **Value** : L'URL Railway que vous avez copiée (SANS `/api` à la fin)
     - ✅ **BON** : `https://blossom-backend-production.up.railway.app`
     - ❌ **MAUVAIS** : `https://blossom-backend-production.up.railway.app/api`
   - **Environments** : Cochez les 3 cases :
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Cliquez sur **"Save"**

✅ **Variable configurée dans Vercel**

---

## ÉTAPE 8 : Redéployer Vercel

### 8.1 Redéployer

1. Dans Vercel, allez dans **"Deployments"**
2. Trouvez le **dernier déploiement**
3. Cliquez sur les **trois points (...)** à droite
4. Cliquez sur **"Redeploy"**
5. Confirmez si demandé

### 8.2 Attendre le déploiement

1. Le déploiement prend **2-3 minutes**
2. Attendez que le statut passe à **"Ready"** (vert)

✅ **Frontend redéployé avec la nouvelle configuration**

---

## ÉTAPE 9 : Tester

### 9.1 Ouvrir l'application

1. Ouvrez votre application Vercel dans votre navigateur
2. Ouvrez la **console développeur** (F12)

### 9.2 Vérifier les requêtes

1. Allez dans l'onglet **"Network"** (Réseau)
2. Tentez de vous **connecter** ou de faire une action qui appelle l'API
3. Regardez les requêtes :
   - ✅ **BON** : Les requêtes pointent vers Railway
     - Exemple : `https://blossom-backend-production.up.railway.app/api/auth/login`
   - ❌ **MAUVAIS** : Les requêtes pointent vers localhost
     - Exemple : `http://localhost:5000/api/auth/login`

### 9.3 Tester la connexion

1. Tentez de vous **connecter** avec un compte existant
2. Si ça fonctionne : ✅ **Tout est configuré correctement !**
3. Si ça ne fonctionne pas : Voir la section "Dépannage" ci-dessous

---

## 🔧 Dépannage

### Problème : "Cannot connect to server"

**Causes possibles** :
1. `VITE_API_URL` non configurée dans Vercel
   - **Solution** : Vérifiez que la variable est bien ajoutée et redéployez

2. Backend non démarré sur Railway
   - **Solution** : Vérifiez les logs Railway → Deployments

3. CORS bloqué
   - **Solution** : Vérifiez que `CORS_ORIGINS` dans Railway contient votre URL Vercel

### Problème : "401 Unauthorized" ou "403 Forbidden"

**Causes possibles** :
1. Variables d'environnement manquantes dans Railway
   - **Solution** : Vérifiez que toutes les variables sont configurées

2. `SUPABASE_SERVICE_ROLE_KEY` incorrecte
   - **Solution** : Vérifiez dans Supabase Dashboard → Settings → API

### Problème : Backend ne démarre pas sur Railway

**Vérifiez les logs Railway** :
1. Allez dans Railway → Deployments → Logs
2. Cherchez les erreurs :
   - ❌ `Cannot find module` → Dépendances manquantes
   - ❌ `Port already in use` → Conflit de port
   - ❌ `SUPABASE_URL is required` → Variable manquante

**Solutions** :
- Vérifiez que `Root Directory` = `database`
- Vérifiez que `Start Command` = `node admin-api.js`
- Vérifiez que toutes les variables sont configurées

### Problème : Erreurs CORS

**Symptôme** : Erreur dans la console : `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution** :
1. Vérifiez que `CORS_ORIGINS` dans Railway contient votre URL Vercel
2. Format : `https://votre-app.vercel.app` (sans slash final)
3. Si plusieurs domaines : `https://app1.vercel.app,https://app2.vercel.app`
4. Redéployez Railway après modification

---

## ✅ Checklist Finale

Avant de considérer que tout est configuré :

- [ ] Compte Railway créé
- [ ] Projet Railway créé et connecté à GitHub
- [ ] Root Directory = `database`
- [ ] Start Command = `node admin-api.js`
- [ ] Variables d'environnement configurées dans Railway :
  - [ ] `NODE_ENV=production`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `JWT_SECRET`
  - [ ] `CORS_ORIGINS`
- [ ] Backend déployé et accessible (testez l'URL dans le navigateur)
- [ ] URL Railway copiée
- [ ] `VITE_API_URL` configurée dans Vercel (URL Railway)
- [ ] Vercel redéployé
- [ ] Test de connexion réussi
- [ ] Console navigateur montre les requêtes vers Railway (pas localhost)

---

## 🎉 Félicitations !

Si tous les points de la checklist sont cochés, votre application est maintenant complètement déployée :

- ✅ **Frontend** : Vercel
- ✅ **Backend** : Railway
- ✅ **Database** : Supabase
- ✅ **Tout connecté** et fonctionnel

---

## 📞 Besoin d'Aide ?

Si vous êtes bloqué à une étape :
1. **Notez** l'étape où vous êtes
2. **Notez** les erreurs que vous voyez
3. **Partagez** ces informations et je vous aiderai

---

**Bon déploiement ! 🚀**

