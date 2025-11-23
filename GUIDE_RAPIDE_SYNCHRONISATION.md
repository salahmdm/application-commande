# 🚀 Guide Rapide : Synchronisation Firebase → Supabase

## ⚠️ Erreur actuelle

```
❌ Erreur fatale: Missing or insufficient permissions
Code: permission-denied
```

**Cause** : Les règles Firestore bloquent l'accès à la collection `users`.

## ✅ Solution en 5 minutes

### Étape 1 : Ouvrir Firebase Console

1. Cliquez sur ce lien : [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules)
2. Connectez-vous avec votre compte Google si nécessaire

### Étape 2 : Modifier les règles

1. Dans l'éditeur de règles (zone de texte au centre), **supprimez tout le contenu**
2. **Copiez-collez** exactement ce code :

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

### Étape 3 : Publier les règles

1. Cliquez sur le bouton **"Publier"** (en haut à droite, bouton bleu)
2. Attendez le message de confirmation (quelques secondes)

### Étape 4 : Exécuter le script

Dans votre terminal PowerShell, exécutez :

```bash
npm run sync-firebase-users
```

### Étape 5 : ⚠️ IMPORTANT - Remettre les règles sécurisées

**Dès que la synchronisation est terminée**, remettez ces règles sécurisées :

1. Retournez sur [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules)
2. Remplacez les règles par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Cliquez sur **"Publier"** à nouveau

## 📸 Aide visuelle

### Où trouver les règles Firestore ?

1. **Firebase Console** → https://console.firebase.google.com
2. Sélectionnez le projet : **prise-de-commande-pos**
3. Menu de gauche : **"Firestore Database"**
4. Onglet : **"Règles"** (Rules)

### À quoi ressemble l'éditeur ?

```
┌─────────────────────────────────────────┐
│  Firestore Database  │  Rules  │  Indexes │
├─────────────────────────────────────────┤
│                                         │
│  rules_version = '2';                   │
│  service cloud.firestore {             │
│    ...                                  │
│  }                                      │
│                                         │
│  [Publier]  [Simuler]                  │
└─────────────────────────────────────────┘
```

## 🔍 Vérification

Après avoir publié les règles temporaires, le script devrait afficher :

```
✅ Firebase initialisé
✅ X utilisateur(s) trouvé(s) dans Firebase
✅ Synchronisation terminée !
```

Au lieu de :

```
❌ Erreur fatale: Missing or insufficient permissions
```

## ❓ Problèmes courants

### "Je ne trouve pas l'onglet Règles"

→ Assurez-vous d'être dans **Firestore Database** (pas dans Realtime Database)

### "Le bouton Publier est grisé"

→ Vérifiez que vous avez bien collé le code dans l'éditeur

### "Les règles ne se publient pas"

→ Attendez quelques secondes et rafraîchissez la page

### "Le script fonctionne toujours pas après avoir publié les règles"

→ Attendez 1-2 minutes pour que les règles soient propagées, puis réessayez

## 📞 Besoin d'aide ?

Si vous avez toujours des problèmes après avoir suivi ces étapes, vérifiez :

1. ✅ Firestore est bien activé (voir `ACTIVER_FIRESTORE.md`)
2. ✅ Les règles ont bien été publiées (bouton "Publier" cliqué)
3. ✅ Vous avez attendu 1-2 minutes après la publication
4. ✅ Vous avez bien collé le code exact (sans erreurs de copie)

