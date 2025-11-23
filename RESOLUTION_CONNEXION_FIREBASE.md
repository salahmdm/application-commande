# 🔧 Résolution du problème de connexion Firebase

## ❌ Problème actuel

**Erreur** : `auth/too-many-requests`

**Message** : "Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer."

**Cause** : Firebase a temporairement bloqué les tentatives de connexion après plusieurs échecs consécutifs.

## ✅ Solutions appliquées

### 1. Ajout du lien "Mot de passe oublié"

**Fichier** : `src/views/auth/AuthView.jsx`

**Ajout** : Un lien "Mot de passe oublié ?" sous le champ mot de passe dans le formulaire de connexion.

### 2. Modal de réinitialisation de mot de passe

**Fichier** : `src/views/auth/AuthView.jsx`

**Ajout** : Un modal permettant de :
- Saisir l'adresse email
- Envoyer un email de réinitialisation
- Réinitialiser le mot de passe même si le compte est bloqué

### 3. Message d'erreur amélioré

**Fichier** : `src/views/auth/AuthView.jsx`

**Ajout** : Un message d'erreur spécial pour `auth/too-many-requests` avec :
- Explication claire du problème
- Bouton pour réinitialiser le mot de passe directement

### 4. Fonction `resetPassword` dans `useAuth`

**Fichier** : `src/hooks/useAuth.js`

**Ajout** : Fonction `resetPassword` accessible depuis le hook `useAuth`.

## 🔧 Solutions immédiates

### Solution 1 : Réinitialiser le mot de passe (Recommandé)

1. **Cliquez sur** **"Mot de passe oublié ?"** dans le formulaire de connexion
2. **Entrez** votre adresse email
3. **Cliquez sur** **"Envoyer"**
4. **Vérifiez** votre boîte email et suivez les instructions
5. **Créez** un nouveau mot de passe
6. **Connectez-vous** avec le nouveau mot de passe

**Avantage** : Cela peut débloquer le compte immédiatement.

### Solution 2 : Attendre quelques minutes

1. **Attendez** 5-15 minutes
2. **Tentez** de vous connecter à nouveau

**Note** : Le blocage se lève automatiquement après un certain délai.

### Solution 3 : Créer l'utilisateur dans Firebase Console

Si l'utilisateur n'existe pas dans Firebase :

1. **Allez dans** [Firebase Console](https://console.firebase.google.com/)
2. **Sélectionnez** votre projet : `prise-de-commande-pos`
3. **Allez dans** **Authentication** → **Users**
4. **Cliquez sur** **"Add user"**
5. **Entrez** :
   - **Email** : `votre-email@gmail.com`
   - **Password** : (votre mot de passe)
6. **Cliquez sur** **"Add user"**

## 📝 Vérifications à faire

### 1. Vérifier que l'utilisateur existe dans Firebase

1. **Firebase Console** → **Authentication** → **Users**
2. **Recherchez** votre email dans la liste
3. Si l'utilisateur n'existe pas, créez-le (voir Solution 3)

### 2. Vérifier que l'authentification par email/mot de passe est activée

1. **Firebase Console** → **Authentication** → **Sign-in method**
2. **Vérifiez** que **Email/Password** est activé
3. Si ce n'est pas le cas, activez-le

### 3. Vérifier les domaines autorisés

1. **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**
2. **Vérifiez** que `localhost` est dans la liste (pour le développement local)

## 🎯 Utilisation de la nouvelle fonctionnalité

### Réinitialiser le mot de passe depuis l'application

1. **Sur la page de connexion**, cliquez sur **"Mot de passe oublié ?"**
2. **Entrez** votre adresse email
3. **Cliquez sur** **"Envoyer"**
4. **Vérifiez** votre boîte email
5. **Cliquez sur** le lien dans l'email
6. **Créez** un nouveau mot de passe
7. **Connectez-vous** avec le nouveau mot de passe

### En cas d'erreur `auth/too-many-requests`

1. **Un message d'erreur** apparaîtra avec une explication
2. **Un bouton** "Réinitialiser mon mot de passe maintenant" sera disponible
3. **Cliquez sur** ce bouton pour ouvrir le modal de réinitialisation
4. **Suivez** les étapes ci-dessus

## 📌 Notes importantes

- **Sécurité** : Le blocage est une fonctionnalité de sécurité de Firebase (anti-brute force)
- **Délai** : Le blocage dure généralement 5-15 minutes
- **Réinitialisation** : La réinitialisation du mot de passe peut débloquer le compte immédiatement
- **Nouvel utilisateur** : Si l'utilisateur n'existe pas, créez-le d'abord dans Firebase Console

## 🔄 Test

1. **Tentez** de vous connecter
2. **Si vous avez l'erreur** `auth/too-many-requests`, cliquez sur **"Mot de passe oublié ?"**
3. **Entrez** votre email et envoyez la réinitialisation
4. **Vérifiez** votre boîte email
5. **Créez** un nouveau mot de passe
6. **Connectez-vous** avec le nouveau mot de passe

## 📚 Documentation supplémentaire

- `CREER_UTILISATEUR_FIREBASE.md` : Guide pour créer un utilisateur dans Firebase
- `VERIFIER_CONFIGURATION_FIREBASE.md` : Guide pour vérifier la configuration Firebase
- `FIX_FIREBASE_TOO_MANY_REQUESTS.md` : Détails sur l'erreur `auth/too-many-requests`

