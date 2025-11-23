# 🔍 Vérifier et créer un utilisateur dans Firebase

## ❌ Problème actuel

L'erreur `auth/too-many-requests` persiste, ce qui indique que :
1. **L'utilisateur n'existe probablement pas** dans Firebase Authentication
2. **OU** le mot de passe est incorrect
3. **OU** trop de tentatives ont été faites

## ✅ Solution : Vérifier et créer l'utilisateur

### Étape 1 : Vérifier si l'utilisateur existe

1. **Allez dans** [Firebase Console](https://console.firebase.google.com/)
2. **Sélectionnez** votre projet : `prise-de-commande-pos`
3. **Allez dans** **Authentication** → **Users**
4. **Recherchez** votre email dans la liste

### Étape 2 : Créer l'utilisateur si nécessaire

Si l'utilisateur **n'existe pas** :

1. **Cliquez sur** **"Add user"** (en haut à droite)
2. **Entrez** :
   - **Email** : `votre-email@gmail.com`
   - **Password** : (votre mot de passe - minimum 6 caractères)
3. **Cliquez sur** **"Add user"**

### Étape 3 : Attendre le déblocage

Si vous avez l'erreur `auth/too-many-requests` :

1. **Attendez** 15 minutes (le blocage se lève automatiquement)
2. **OU** utilisez la fonctionnalité **"Mot de passe oublié ?"** dans l'application
3. **OU** créez un nouvel utilisateur avec un autre email

## 🔧 Vérifications dans Firebase Console

### 1. Vérifier que l'authentification par email/mot de passe est activée

1. **Firebase Console** → **Authentication** → **Sign-in method**
2. **Vérifiez** que **Email/Password** est **activé** (bouton vert)
3. Si ce n'est pas le cas :
   - Cliquez sur **Email/Password**
   - Activez **"Enable"**
   - Cliquez sur **"Save"**

### 2. Vérifier les domaines autorisés

1. **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**
2. **Vérifiez** que les domaines suivants sont présents :
   - `localhost` (pour le développement local)
   - `prise-de-commande-pos.firebaseapp.com` (domaine Firebase par défaut)
   - Votre domaine de production (si déployé)

### 3. Vérifier la configuration de l'application

1. **Firebase Console** → **Project Settings** → **General**
2. **Vérifiez** que la configuration correspond à `src/config/firebase.js` :
   - **API Key** : `AIzaSyCwEpdpe1krv8lvFqz_WVo1yYSbKlSdqQ8`
   - **Auth Domain** : `prise-de-commande-pos.firebaseapp.com`
   - **Project ID** : `prise-de-commande-pos`

## 📝 Créer l'utilisateur via l'application (Alternative)

Si vous préférez créer l'utilisateur via l'application :

1. **Allez sur** la page d'inscription de l'application
2. **Remplissez** le formulaire avec :
   - Prénom
   - Nom
   - Email : `votre-email@gmail.com`
   - Mot de passe : (minimum 8 caractères)
3. **Cliquez sur** **"S'inscrire"**
4. **Connectez-vous** avec ces identifiants

## ⚠️ Protection contre les tentatives répétées

L'application a maintenant une protection qui :
- **Bloque** les tentatives de connexion pendant 15 minutes après l'erreur `auth/too-many-requests`
- **Affiche** un message clair avec le temps restant
- **Suggère** de réinitialiser le mot de passe

## 🎯 Actions immédiates

1. **Vérifiez** dans Firebase Console si votre utilisateur existe
2. **Si l'utilisateur n'existe pas**, créez-le (voir Étape 2)
3. **Attendez** 15 minutes si vous avez l'erreur `auth/too-many-requests`
4. **OU** utilisez **"Mot de passe oublié ?"** pour réinitialiser le mot de passe
5. **Tentez** de vous connecter après avoir créé l'utilisateur ou après le délai

## 📌 Notes importantes

- **L'utilisateur doit exister** dans Firebase Authentication avant de pouvoir se connecter
- **Le mot de passe** doit correspondre exactement à celui dans Firebase
- **Le blocage** dure 15 minutes, mais peut être contourné en réinitialisant le mot de passe
- **La réinitialisation** du mot de passe peut débloquer le compte immédiatement

