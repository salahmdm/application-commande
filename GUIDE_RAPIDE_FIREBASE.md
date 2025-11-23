# 🚀 Guide rapide - Résoudre le problème Firebase

## ⚡ Solution en 2 minutes

### ÉTAPE 1 : Vérifier dans Firebase Console

1. **Ouvrez** [Firebase Console](https://console.firebase.google.com/)
2. **Sélectionnez** : `prise-de-commande-pos`
3. **Allez dans** : **Authentication** → **Sign-in method**
4. **Vérifiez** : **Email/Password** doit être **ACTIVÉ** (bouton vert)
5. **Si ce n'est pas activé** : Cliquez dessus → **Enable** → **Save**

### ÉTAPE 2 : Créer votre utilisateur

1. **Dans Firebase Console**, allez dans : **Authentication** → **Users**
2. **Cliquez** : **"Add user"** (en haut à droite)
3. **Entrez** :
   - Email : `votre-email@gmail.com`
   - Password : `votre-mot-de-passe` (minimum 6 caractères)
4. **Cliquez** : **"Add user"**

### ÉTAPE 3 : Attendre OU réinitialiser

**Option A : Attendre 15-30 minutes** (le blocage se lève automatiquement)

**Option B : Réinitialiser le mot de passe** (plus rapide)
1. Dans l'application, cliquez sur **"Mot de passe oublié ?"**
2. Entrez votre email
3. Vérifiez votre boîte email
4. Créez un nouveau mot de passe
5. Connectez-vous

## 🛠️ Outils de diagnostic (Console navigateur)

Ouvrez la console (F12) et tapez :

```javascript
// Diagnostic complet
diagnosticFirebase()

// Tester une connexion
testFirebaseLogin("votre-email@gmail.com", "votre-mot-de-passe")

// Créer un utilisateur (si auth activée)
createFirebaseUser("votre-email@gmail.com", "votre-mot-de-passe")

// Réinitialiser le mot de passe
resetFirebasePassword("votre-email@gmail.com")
```

## ✅ Checklist

- [ ] Email/Password est **activé** dans Firebase Console
- [ ] Votre utilisateur **existe** dans Firebase Console → Users
- [ ] Vous avez **attendu 15-30 min** OU **réinitialisé le mot de passe**
- [ ] Le mot de passe correspond à celui dans Firebase

## 🎯 Après ces étapes

1. **Rechargez** l'application (Ctrl+F5)
2. **Tentez** de vous connecter
3. **Si ça ne fonctionne toujours pas**, utilisez `diagnosticFirebase()` dans la console

