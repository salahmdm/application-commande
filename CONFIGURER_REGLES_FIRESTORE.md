# 🔒 Configuration des règles de sécurité Firestore

## ⚠️ Problème détecté

L'erreur `permission-denied Missing or insufficient permissions` indique que les règles de sécurité Firestore bloquent l'accès à la collection `users`.

## 📋 Solution : Configurer les règles Firestore

### Étape 1 : Accéder aux règles Firestore

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet : **prise-de-commande-pos**
3. Dans le menu de gauche, cliquez sur **"Firestore Database"**
4. Cliquez sur l'onglet **"Règles"** (Rules)

### Étape 2 : Configurer les règles pour la collection `users`

Copiez et collez ces règles dans l'éditeur de règles Firestore :

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
    
    // ✅ Pour les autres collections, ajustez selon vos besoins
    // Par défaut, refuser l'accès (sécurité par défaut)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Étape 3 : Règles simplifiées pour le développement (temporaire)

⚠️ **ATTENTION** : Ces règles sont **moins sécurisées** et doivent être utilisées **uniquement pour le développement**.

Si vous avez besoin de règles plus permissives temporairement pour tester :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ✅ Règles de test : Accès ouvert pendant 30 jours
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // ✅ Pour toutes les autres collections (si nécessaire)
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

⚠️ **Important** : Ces règles de test expirent après la date spécifiée et permettent l'accès à tous les utilisateurs authentifiés. Utilisez-les uniquement pour le développement.

### Étape 4 : Publier les règles

1. Après avoir collé les règles, cliquez sur **"Publier"** (Publish)
2. Attendez quelques secondes que les règles soient propagées
3. Les règles sont maintenant actives

### Étape 5 : Vérifier que les règles fonctionnent

Réessayez le script de diagnostic :

```bash
npm run diagnostic-admin admin@blossom.com
```

Ou le script de vérification :

```bash
npm run verify-user-role admin@blossom.com
```

## 🔍 Explication des règles

### Règle de lecture (read)

```javascript
allow read: if request.auth != null && (
  request.auth.uid == userId ||
  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
);
```

Cette règle permet :
- ✅ L'utilisateur de lire son propre document (`request.auth.uid == userId`)
- ✅ Les admins de lire tous les documents (vérification du rôle admin)

### Règle d'écriture (write)

```javascript
allow write: if request.auth != null && (
  request.auth.uid == userId ||
  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
);
```

Cette règle permet :
- ✅ L'utilisateur de modifier son propre document
- ✅ Les admins de modifier tous les documents

### Règle de création (create)

```javascript
allow create: if request.auth != null && request.auth.uid == userId;
```

Cette règle permet :
- ✅ L'utilisateur de créer son propre document (lors de l'inscription)

## 🛡️ Sécurité

### Bonnes pratiques

1. ✅ **Toujours vérifier l'authentification** : `request.auth != null`
2. ✅ **Limiter l'accès aux données** : Seulement les données nécessaires
3. ✅ **Vérifier les rôles** : Utiliser `get()` pour vérifier le rôle admin
4. ✅ **Tester les règles** : Utiliser le simulateur de règles Firestore

### Règles à éviter

❌ **Ne pas utiliser** :
```javascript
// ❌ DANGEREUX : Accès ouvert à tous
allow read, write: if true;

// ❌ DANGEREUX : Pas de vérification d'authentification
allow read, write: if request.auth.uid != null;
```

## 🔧 Dépannage

### Problème : Les règles ne fonctionnent pas

1. **Vérifiez que les règles sont publiées** :
   - Allez dans Firebase Console → Firestore → Rules
   - Vérifiez que la date de dernière publication est récente

2. **Vérifiez la syntaxe** :
   - Les règles doivent être valides JavaScript
   - Vérifiez qu'il n'y a pas d'erreurs de syntaxe

3. **Testez avec le simulateur** :
   - Dans Firebase Console → Firestore → Rules
   - Cliquez sur "Simulateur" (Simulator)
   - Testez différentes requêtes

### Problème : Erreur "Missing or insufficient permissions"

1. **Vérifiez que l'utilisateur est authentifié** :
   - `request.auth != null` doit être vrai
   - L'utilisateur doit être connecté dans Firebase Auth

2. **Vérifiez que le document existe** :
   - Le document `users/{userId}` doit exister
   - L'utilisateur doit avoir un document dans Firestore

3. **Vérifiez les règles** :
   - Les règles doivent permettre l'accès pour cet utilisateur
   - Vérifiez que les conditions sont correctes

## 📝 Notes importantes

- ⚠️ Les règles Firestore sont **différentes** des RLS Supabase
- ⚠️ Les règles Firestore s'appliquent **uniquement** à Firestore
- ⚠️ Les règles doivent être **publiées** pour être actives
- ⚠️ Les changements de règles peuvent prendre **quelques secondes** à se propager

## ✅ Vérification finale

Après avoir configuré les règles, testez :

1. **Script de diagnostic** :
   ```bash
   npm run diagnostic-admin admin@blossom.com
   ```

2. **Script de vérification** :
   ```bash
   npm run verify-user-role admin@blossom.com
   ```

3. **Dans l'application** :
   - Connectez-vous avec `admin@blossom.com`
   - Vérifiez que vous avez accès à toutes les fonctionnalités admin

