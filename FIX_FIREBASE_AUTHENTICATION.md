# 🔥 Résoudre l'erreur Firebase Authentication

## ❌ Erreur actuelle

```
auth/invalid-credential
```

Cette erreur signifie que :
- L'utilisateur n'existe **pas** dans Firebase Authentication
- OU le **mot de passe** est incorrect
- OU l'**email** est incorrect

## 🔍 Diagnostic

### Étape 1 : Vérifier la configuration Firebase

La configuration Firebase est dans `src/config/firebase.js` :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCwEpdpe1krv8lvFqz_WVo1yYSbKlSdqQ8",
  authDomain: "prise-de-commande-pos.firebaseapp.com",
  projectId: "prise-de-commande-pos",
  // ...
};
```

**Vérifiez** que ces informations correspondent à votre projet Firebase.

### Étape 2 : Vérifier si l'utilisateur existe dans Firebase

1. **Allez dans** [Firebase Console](https://console.firebase.google.com/)
2. **Sélectionnez** votre projet : `prise-de-commande-pos`
3. **Allez dans** Authentication → Users
4. **Vérifiez** si l'utilisateur `admin@blossom.com` existe

## 🔧 Solutions

### Solution 1 : Créer l'utilisateur dans Firebase Console

1. **Firebase Console** → Authentication → Users
2. **Cliquez sur** "Add user"
3. **Entrez** :
   - Email : `admin@blossom.com`
   - Password : (votre mot de passe)
4. **Cliquez sur** "Add user"

### Solution 2 : Créer l'utilisateur via l'application

Si vous avez accès à la page d'inscription :

1. **Allez sur** la page d'inscription de l'application
2. **Créez** un nouveau compte avec :
   - Email : `admin@blossom.com`
   - Password : (votre mot de passe)
3. **Connectez-vous** avec ces identifiants

### Solution 3 : Créer l'utilisateur via la console du navigateur

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
// Importer Firebase
const { getAuth, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwEpdpe1krv8lvFqz_WVo1yYSbKlSdqQ8",
  authDomain: "prise-de-commande-pos.firebaseapp.com",
  projectId: "prise-de-commande-pos"
};

// Initialiser Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = getAuth(app);

// Créer l'utilisateur
createUserWithEmailAndPassword(auth, 'admin@blossom.com', 'votre_mot_de_passe')
  .then((userCredential) => {
    console.log('✅ Utilisateur créé:', userCredential.user.email);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error.message);
  });
```

## 📝 Vérifier que l'utilisateur existe dans Firestore

Après avoir créé l'utilisateur dans Firebase Authentication, vérifiez qu'il existe aussi dans Firestore :

1. **Firebase Console** → Firestore Database
2. **Vérifiez** la collection `users`
3. **Cherchez** un document avec l'email `admin@blossom.com`

Si le document n'existe pas, il sera créé automatiquement lors de la première connexion.

## 🎯 Utilisateurs de test recommandés

Créez ces utilisateurs dans Firebase Authentication pour tester :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@blossom.com` | (votre choix) | Admin |
| `manager@blossom.com` | (votre choix) | Manager |
| `client@blossom.com` | (votre choix) | Client |

## ✅ Vérification après création

1. **Créez** l'utilisateur dans Firebase Authentication
2. **Rechargez** l'application
3. **Essayez** de vous connecter avec :
   - Email : `admin@blossom.com`
   - Password : (le mot de passe que vous avez défini)
4. **Vous devriez** voir : `✅ Connexion réussie`

## 🔐 Sécurité

⚠️ **Important** : 
- Ne partagez **jamais** vos mots de passe
- Utilisez des mots de passe **forts** (minimum 8 caractères, majuscules, minuscules, chiffres)
- En production, activez l'**email verification** dans Firebase

## 🆘 Si le problème persiste

1. **Vérifiez** les logs dans la console du navigateur
2. **Vérifiez** que Firebase est bien initialisé (vous devriez voir `🔥 Firebase - Initialisé` dans les logs)
3. **Vérifiez** que l'API Key Firebase est correcte
4. **Vérifiez** que l'Authentication est activée dans Firebase Console :
   - Firebase Console → Authentication → Sign-in method
   - Vérifiez que "Email/Password" est **activé**

## 📚 Ressources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)

