# 🚀 Créer un utilisateur Firebase automatiquement

## ⚡ Solution rapide (2 commandes)

### Option 1 : Créer un utilisateur directement

```bash
npm run create-firebase-user <email> <password>
```

**Exemple** :
```bash
npm run create-firebase-user user@example.com monmotdepasse123
```

### Option 2 : Réinitialiser le mot de passe (si l'utilisateur existe déjà)

```bash
npm run reset-firebase-password <email>
```

**Exemple** :
```bash
npm run reset-firebase-password user@example.com
```

## 📋 Étapes complètes

### 1. Vérifier que l'authentification est activée

1. Allez dans [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez : `prise-de-commande-pos`
3. Allez dans : **Authentication** → **Sign-in method**
4. Vérifiez que **Email/Password** est **ACTIVÉ** (bouton vert)
5. Si ce n'est pas activé, activez-le

### 2. Créer l'utilisateur

**Méthode A : Via le script (Recommandé)**

```bash
npm run create-firebase-user votre-email@gmail.com votre-mot-de-passe
```

**Méthode B : Via Firebase Console**

1. Firebase Console → **Authentication** → **Users**
2. Cliquez sur **"Add user"**
3. Entrez email et mot de passe
4. Cliquez sur **"Add user"**

### 3. Attendre le déblocage (si erreur `auth/too-many-requests`)

**Option A : Attendre 15-30 minutes**

**Option B : Réinitialiser le mot de passe (plus rapide)**

```bash
npm run reset-firebase-password votre-email@gmail.com
```

Puis suivez les instructions dans l'email.

### 4. Se connecter

1. Rechargez l'application (Ctrl+F5)
2. Connectez-vous avec les identifiants créés

## 🔍 Vérifier que l'utilisateur existe

1. Firebase Console → **Authentication** → **Users**
2. Recherchez votre email dans la liste
3. Si l'utilisateur existe, vous pouvez vous connecter

## ⚠️ Erreurs courantes

### `auth/email-already-in-use`
- **Signification** : L'utilisateur existe déjà
- **Solution** : Connectez-vous directement ou réinitialisez le mot de passe

### `auth/operation-not-allowed`
- **Signification** : L'authentification par email/mot de passe n'est pas activée
- **Solution** : Activez-la dans Firebase Console → Authentication → Sign-in method

### `auth/weak-password`
- **Signification** : Le mot de passe est trop faible
- **Solution** : Utilisez un mot de passe d'au moins 6 caractères

### `auth/too-many-requests`
- **Signification** : Trop de tentatives, Firebase a temporairement bloqué
- **Solution** : Attendez 15-30 minutes OU réinitialisez le mot de passe

## 🎯 Checklist

- [ ] Email/Password est **activé** dans Firebase Console
- [ ] Vous avez créé l'utilisateur (via script OU Firebase Console)
- [ ] Vous avez attendu 15-30 min OU réinitialisé le mot de passe
- [ ] Vous pouvez vous connecter avec les identifiants créés

## 💡 Commandes utiles

```bash
# Créer un utilisateur
npm run create-firebase-user email@example.com password123

# Réinitialiser le mot de passe
npm run reset-firebase-password email@example.com
```

