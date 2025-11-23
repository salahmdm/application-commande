# 🔧 Ajouter le domaine Vercel à Firebase OAuth

## ⚠️ Erreur actuelle

```
The current domain is not authorized for OAuth operations.
Domain: application-commande-hxfr-git-main-prise-de-commandes-projects.vercel.app
```

## ✅ Solution

### Étape 1 : Accéder aux paramètres Firebase

1. Allez sur Firebase Console : https://console.firebase.google.com/project/prise-de-commande-pos/authentication/settings
2. Cliquez sur l'onglet **"Authorized domains"** (Domaines autorisés)

### Étape 2 : Ajouter le domaine Vercel

1. Cliquez sur le bouton **"Add domain"** (Ajouter un domaine)
2. Entrez votre domaine Vercel :
   - `application-commande-hxfr-git-main-prise-de-commandes-projects.vercel.app`
   - Ou votre domaine de production personnalisé si vous en avez un
3. Cliquez sur **"Add"** (Ajouter)

### Étape 3 : Vérifier

Les domaines autorisés par défaut sont :
- `localhost` (développement local)
- `prise-de-commande-pos.firebaseapp.com` (domaine Firebase)
- `prise-de-commande-pos.web.app` (domaine Firebase)

Après ajout, vous devriez voir :
- ✅ `application-commande-hxfr-git-main-prise-de-commandes-projects.vercel.app`

## 📝 Note importante

Si vous avez plusieurs environnements Vercel (Production, Preview, Development), vous devrez ajouter chaque domaine :
- Production : `votre-app.vercel.app`
- Preview : `votre-app-git-*-username.vercel.app`
- Development : `votre-app-git-main-username.vercel.app`

## 🔍 Vérification

Après avoir ajouté le domaine, l'erreur OAuth devrait disparaître de la console.

