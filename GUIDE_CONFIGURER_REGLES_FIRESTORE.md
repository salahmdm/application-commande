# 🔧 Guide : Configurer les règles Firestore pour lister les utilisateurs

## 📋 Problème

Vous obtenez une erreur `permission-denied` car les règles Firestore bloquent l'accès à la collection `users`.

## ✅ Solution : Configurer les règles Firestore

### Étape 1 : Ouvrir Firebase Console

1. **Ouvrez votre navigateur** (Chrome, Firefox, Edge, etc.)
2. **Allez sur** : https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules
3. **Connectez-vous** avec votre compte Google si nécessaire

### Étape 2 : Accéder aux règles Firestore

Une fois sur la page, vous verrez :
- Un **éditeur de code** avec les règles actuelles
- Un bouton **"Publier"** en haut à droite

### Étape 3 : Copier les nouvelles règles

**Copiez exactement ce code** (sélectionnez tout avec Ctrl+A, puis copiez) :

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

### Étape 4 : Coller dans l'éditeur

1. **Sélectionnez tout le contenu** de l'éditeur (Ctrl+A)
2. **Supprimez-le** (Suppr ou Backspace)
3. **Collez le nouveau code** (Ctrl+V)

### Étape 5 : Publier les règles

1. **Cliquez sur le bouton "Publier"** (en haut à droite, bouton bleu)
2. **Attendez** quelques secondes que les règles soient publiées
3. **Vous verrez un message de confirmation** : "Rules published successfully"

### Étape 6 : Tester

Retournez dans votre terminal et exécutez :

```bash
npm run list-firebase-users
```

## ⚠️ Important

Ces règles sont **temporaires** et **permissives** (elles permettent tout). 

**Pour la production**, vous devriez utiliser des règles plus strictes, mais pour lister les utilisateurs et synchroniser, ces règles fonctionnent.

## 🔒 Règles plus sécurisées (optionnel, pour plus tard)

Une fois la synchronisation terminée, vous pouvez utiliser des règles plus sécurisées :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Permettre la lecture à tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      // Permettre l'écriture seulement au propriétaire
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ❓ Questions fréquentes

**Q : Est-ce que ces règles sont sécurisées ?**  
R : Non, elles sont temporaires et permissives. Utilisez-les uniquement pour la synchronisation, puis remplacez-les par des règles plus strictes.

**Q : Puis-je revenir aux anciennes règles ?**  
R : Oui, Firebase garde un historique. Vous pouvez voir les versions précédentes dans l'onglet "History".

**Q : Combien de temps faut-il pour que les règles soient actives ?**  
R : Généralement quelques secondes, parfois jusqu'à 1 minute.

## 📞 Besoin d'aide ?

Si vous avez des problèmes :
1. Vérifiez que vous êtes bien connecté à Firebase Console
2. Vérifiez que vous avez les droits d'administration sur le projet
3. Essayez de rafraîchir la page (F5)
4. Vérifiez que Firestore est bien activé dans votre projet

