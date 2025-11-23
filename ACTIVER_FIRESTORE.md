# 🔧 Activer Firestore dans Firebase

## ⚠️ Erreur détectée

L'API Firestore n'est pas activée dans votre projet Firebase. Vous devez l'activer avant de pouvoir utiliser le script de mise à jour des rôles.

## 📋 Étapes pour activer Firestore

### Option 1 : Via le lien direct (Recommandé)

1. **Cliquez sur ce lien** : [Activer Firestore API](ttps://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=prise-de-commande-posh)

2. Cliquez sur **"Activer"** ou **"Enable"**

3. Attendez quelques minutes que l'API soit activée

4. Réessayez le script :
   ```bash
   node scripts/update-user-role.js admin@blossom.com admin
   ```

### Option 2 : Via Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet : **prise-de-commande-pos**
3. Dans le menu de gauche, cliquez sur **"Firestore Database"**
4. Cliquez sur **"Créer une base de données"** ou **"Create database"**
5. Choisissez le mode :
   - **Mode production** (recommandé) : Avec règles de sécurité strictes
   - **Mode test** : Accès ouvert pendant 30 jours (pour développement)
6. Sélectionnez une région (ex: `europe-west1` pour l'Europe)
7. Cliquez sur **"Activer"** ou **"Enable"**

### Option 3 : Via Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez le projet : **prise-de-commande-pos**
3. Dans la barre de recherche, tapez : **"Firestore API"**
4. Cliquez sur **"Cloud Firestore API"**
5. Cliquez sur **"Activer"** ou **"Enable"**

## ⏱️ Délai d'activation

Après activation, attendez **2-5 minutes** pour que l'API soit propagée dans tous les systèmes.

## ✅ Vérification

Une fois activé, vous pouvez vérifier que Firestore fonctionne :

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Projet : **prise-de-commande-pos**
3. **Firestore Database** → Vous devriez voir l'interface Firestore

## 🔄 Réessayer le script

Une fois Firestore activé, réessayez :

```bash
node scripts/update-user-role.js admin@blossom.com admin
```

## 📝 Note importante

Si vous n'avez pas encore créé de base de données Firestore, vous devrez :
1. Créer la base de données (Option 2)
2. Configurer les règles de sécurité Firestore
3. Créer la collection `users` si elle n'existe pas

## 🔒 Règles de sécurité Firestore recommandées

Une fois Firestore activé, configurez les règles de sécurité dans Firebase Console → Firestore Database → Rules :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection users : les utilisateurs peuvent lire/écrire leur propre document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      // Les admins peuvent lire tous les documents
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

**Pour le développement/test**, vous pouvez temporairement utiliser :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

⚠️ **Attention** : Les règles de test expirent après 30 jours et permettent l'accès à tous. Utilisez-les uniquement pour le développement.

