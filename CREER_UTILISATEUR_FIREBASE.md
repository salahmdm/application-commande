# 🔧 Créer un utilisateur dans Firebase Authentication

## ❌ Problème

L'erreur `auth/too-many-requests` peut être due à :
1. **Trop de tentatives échouées** : Firebase bloque temporairement après plusieurs échecs
2. **Utilisateur n'existe pas** : L'utilisateur n'a pas été créé dans Firebase Authentication
3. **Mot de passe incorrect** : Le mot de passe utilisé ne correspond pas à celui dans Firebase

## ✅ Solution : Créer l'utilisateur dans Firebase Console

### Méthode 1 : Via Firebase Console (Recommandé)

1. **Allez dans** [Firebase Console](https://console.firebase.google.com/)
2. **Sélectionnez** votre projet : `prise-de-commande-pos`
3. **Allez dans** **Authentication** → **Users**
4. **Cliquez sur** **"Add user"** (en haut à droite)
5. **Entrez** :
   - **Email** : `votre-email@gmail.com` (ou l'email que vous utilisez)
   - **Password** : (votre mot de passe)
6. **Cliquez sur** **"Add user"**

### Méthode 2 : Via l'application (Inscription)

1. **Allez sur** la page d'inscription de l'application
2. **Remplissez** le formulaire avec :
   - Prénom
   - Nom
   - Email : `votre-email@gmail.com`
   - Mot de passe : (votre mot de passe)
3. **Cliquez sur** **"S'inscrire"**
4. **Connectez-vous** avec ces identifiants

### Méthode 3 : Réinitialiser le mot de passe

Si l'utilisateur existe déjà mais que vous avez oublié le mot de passe :

1. **Cliquez sur** **"Mot de passe oublié ?"** dans le formulaire de connexion
2. **Entrez** votre adresse email
3. **Cliquez sur** **"Envoyer"**
4. **Vérifiez** votre boîte email et suivez les instructions

## 🔍 Vérifier si l'utilisateur existe

1. **Firebase Console** → **Authentication** → **Users**
2. **Recherchez** votre email dans la liste
3. Si l'utilisateur n'existe pas, créez-le avec la **Méthode 1**

## ⏱️ Attendre le déblocage

Si vous avez l'erreur `auth/too-many-requests` :

1. **Attendez** 5-15 minutes avant de réessayer
2. **OU** réinitialisez votre mot de passe (cela peut débloquer le compte)
3. **OU** créez un nouvel utilisateur avec un autre email

## 📝 Notes importantes

- **Sécurité** : Firebase bloque automatiquement après trop de tentatives échouées (mesure anti-brute force)
- **Délai** : Le blocage dure généralement 5-15 minutes
- **Réinitialisation** : La réinitialisation du mot de passe peut débloquer le compte
- **Nouvel utilisateur** : Si l'utilisateur n'existe pas, créez-le d'abord avant de vous connecter

## 🎯 Après avoir créé l'utilisateur

1. **Attendez** quelques minutes si vous avez l'erreur `auth/too-many-requests`
2. **Tentez** de vous connecter avec les identifiants créés
3. **Si ça ne fonctionne toujours pas**, réinitialisez le mot de passe

