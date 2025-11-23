# 🔧 Configurer les règles Firestore temporairement pour la synchronisation

## ⚠️ Objectif

Permettre au script de synchronisation de lire les utilisateurs depuis Firestore **temporairement**.

## 📋 Étapes rapides

### 1. Accéder aux règles Firestore

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet : **prise-de-commande-pos**
3. Dans le menu de gauche, cliquez sur **"Firestore Database"**
4. Cliquez sur l'onglet **"Règles"** (Rules)

### 2. Remplacer les règles temporairement

**⚠️ ATTENTION** : Ces règles sont **très permissives** et doivent être utilisées **UNIQUEMENT pour la synchronisation**.

Copiez et collez ces règles dans l'éditeur :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ RÈGLES PERMISSIVES TEMPORAIRES POUR LA SYNCHRONISATION
    // ⚠️ À REMPLACER APRÈS LA SYNCHRONISATION
    match /users/{userId} {
      allow read, write: if true;
    }
    
    // Bloquer tout le reste
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Publier les règles

1. Cliquez sur **"Publier"** (Publish)
2. Attendez quelques secondes que les règles soient propagées

### 4. Exécuter le script de synchronisation

```bash
npm run sync-firebase-users
```

### 5. ⚠️ IMPORTANT : Remettre les règles sécurisées après la synchronisation

Une fois la synchronisation terminée, **remettez immédiatement** des règles plus sécurisées :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection users : Accès selon le rôle
    match /users/{userId} {
      // ✅ Lecture : L'utilisateur peut lire son propre document
      // ✅ Les admins peuvent lire tous les documents
      allow read: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      // ✅ Écriture : L'utilisateur peut modifier son propre document
      // ✅ Les admins peuvent modifier tous les documents
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      // ✅ Création : N'importe quel utilisateur authentifié peut créer son propre document
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // ✅ Pour les autres collections, refuser l'accès par défaut
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Puis cliquez sur **"Publier"** à nouveau.

## 🔒 Sécurité

**NE LAISSEZ JAMAIS** les règles permissives (`allow read, write: if true`) en production. Elles permettent à n'importe qui de lire et modifier toutes les données.

## ✅ Vérification

Après avoir configuré les règles temporaires, réessayez :

```bash
npm run sync-firebase-users
```

Le script devrait maintenant pouvoir lire les utilisateurs depuis Firestore.

