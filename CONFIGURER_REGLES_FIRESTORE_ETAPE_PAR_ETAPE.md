# 📸 Guide Visuel : Configurer les règles Firestore

## 🎯 Objectif

Permettre au script de lire les utilisateurs dans Firestore.

## 📝 Étapes détaillées

### 1️⃣ Ouvrir Firebase Console

**Cliquez sur ce lien** (ou copiez-le dans votre navigateur) :
```
https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules
```

### 2️⃣ Vous verrez cette page

```
┌─────────────────────────────────────────────────┐
│  Firestore Database  >  Rules                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Éditeur de code avec les règles actuelles]    │
│                                                  │
│  rules_version = '2';                           │
│  service cloud.firestore {                       │
│    match /databases/{database}/documents {      │
│      ...                                         │
│    }                                             │
│  }                                               │
│                                                  │
│  [Bouton "Publier" en haut à droite]            │
└─────────────────────────────────────────────────┘
```

### 3️⃣ Sélectionner tout le code

- **Appuyez sur** `Ctrl + A` (ou `Cmd + A` sur Mac)
- Tout le code sera sélectionné (en bleu)

### 4️⃣ Supprimer l'ancien code

- **Appuyez sur** `Suppr` ou `Backspace`
- L'éditeur sera maintenant vide

### 5️⃣ Copier le nouveau code

**Copiez ce code** (sélectionnez-le et Ctrl+C) :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 6️⃣ Coller dans l'éditeur

- **Cliquez dans l'éditeur** (qui est maintenant vide)
- **Appuyez sur** `Ctrl + V` (ou `Cmd + V` sur Mac)
- Le nouveau code apparaîtra

### 7️⃣ Vérifier le code

Vous devriez voir exactement :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 8️⃣ Publier

1. **Regardez en haut à droite** de la page
2. **Cliquez sur le bouton bleu "Publier"**
3. **Attendez** quelques secondes
4. **Vous verrez** : "Rules published successfully" ✅

### 9️⃣ Tester

Retournez dans votre terminal PowerShell et tapez :

```powershell
npm run list-firebase-users
```

## ✅ C'est terminé !

Si tout s'est bien passé, vous verrez la liste de tous vos utilisateurs Firebase.

## ❌ Si ça ne marche pas

1. **Vérifiez** que vous avez bien cliqué sur "Publier"
2. **Attendez** 30 secondes et réessayez
3. **Vérifiez** que Firestore est activé dans votre projet Firebase
4. **Vérifiez** que vous êtes bien connecté avec le bon compte Google

## 📞 Aide supplémentaire

Si vous avez toujours des problèmes, dites-moi à quelle étape vous êtes bloqué et je vous aiderai !

