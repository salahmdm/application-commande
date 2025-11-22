# 🔥 Intégration Firebase - Blossom Café

## 📋 Vue d'ensemble

Firebase a été intégré dans l'application Blossom Café pour gérer :
- **Storage** : Stockage de fichiers (images produits, uploads)
- **Firestore** : Base de données NoSQL (optionnel, complémentaire à MySQL)
- **Authentication** : Authentification Firebase (optionnel)

## 📁 Fichiers créés

### 1. Configuration Firebase
**Fichier** : `src/config/firebase.js`
- Initialise Firebase avec votre configuration
- Exporte les services : `storage`, `auth`, `db`

### 2. Service Firebase
**Fichier** : `src/services/firebaseService.js`
- Service complet pour utiliser Firebase
- Méthodes pour Storage et Firestore

### 3. Initialisation
**Fichier** : `src/main.jsx`
- Firebase est initialisé au démarrage de l'application

## 🚀 Utilisation

### Uploader une image

```javascript
import firebaseService from '../services/firebaseService';

// Exemple : Uploader une image de produit
const handleImageUpload = async (file) => {
  try {
    // Créer un nom de fichier unique
    const fileName = `products/${Date.now()}_${file.name}`;
    
    // Uploader le fichier
    const imageURL = await firebaseService.uploadFile(file, fileName);
    
    console.log('Image uploadée:', imageURL);
    return imageURL;
  } catch (error) {
    console.error('Erreur upload:', error);
  }
};
```

### Supprimer un fichier

```javascript
// Supprimer une image
await firebaseService.deleteFile('products/image123.jpg');
```

### Utiliser Firestore

```javascript
// Créer ou mettre à jour un document
await firebaseService.setDocument('products', 'product123', {
  name: 'Café Latte',
  price: 4.50,
  category: 'boissons'
});

// Récupérer un document
const product = await firebaseService.getDocument('products', 'product123');

// Récupérer tous les documents avec filtres
const products = await firebaseService.getCollection('products', {
  where: [
    { field: 'category', operator: '==', value: 'boissons' }
  ],
  orderBy: { field: 'name', direction: 'asc' },
  limit: 10
});

// Supprimer un document
await firebaseService.deleteDocument('products', 'product123');
```

### Utiliser Analytics

```javascript
// Enregistrer un événement personnalisé
firebaseService.logEvent('button_click', {
  button_name: 'add_to_cart',
  page: 'products'
});

// Enregistrer une vue de page
firebaseService.logPageView('/products', 'Liste des produits');

// Enregistrer un ajout au panier
firebaseService.logAddToCart('product123', 'Café Latte', 4.50, 'boissons');

// Enregistrer une commande
firebaseService.logPurchase('CMD-0001', 25.50, [
  { id: 'product123', name: 'Café Latte', price: 4.50, quantity: 2 },
  { id: 'product456', name: 'Croissant', price: 2.50, quantity: 1 }
]);

// Enregistrer une recherche
firebaseService.logSearch('café');
```

### Utiliser l'authentification Firebase

```javascript
// Connexion avec email/mot de passe
const result = await firebaseService.signInWithEmail('user@example.com', 'password123');
if (result.success) {
  console.log('Utilisateur connecté:', result.user);
}

// Inscription
const signupResult = await firebaseService.signUpWithEmail(
  'newuser@example.com',
  'password123',
  'John Doe'
);

// Déconnexion
await firebaseService.signOut();

// Réinitialisation de mot de passe
await firebaseService.sendPasswordReset('user@example.com');

// Connexion avec Google
const googleResult = await firebaseService.signInWithGoogle();

// Écouter les changements d'authentification
const unsubscribe = firebaseService.onAuthStateChange((user) => {
  if (user) {
    console.log('Utilisateur connecté:', user);
  } else {
    console.log('Utilisateur déconnecté');
  }
});

// Se désabonner plus tard
unsubscribe();
```

## 📝 Exemple d'intégration dans un composant

```javascript
import { useState } from 'react';
import firebaseService from '../services/firebaseService';

function ProductImageUpload({ productId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Uploader vers Firebase Storage
      const path = `products/${productId}/${file.name}`;
      const imageURL = await firebaseService.uploadFile(file, path);

      // Sauvegarder l'URL dans Firestore (optionnel)
      await firebaseService.setDocument('product_images', productId, {
        productId,
        imageURL,
        uploadedAt: new Date().toISOString()
      });

      onUploadComplete(imageURL);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Upload en cours...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

## 🔐 Configuration Firebase

La configuration Firebase est dans `src/config/firebase.js` :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCwEpdpe1krv8lvFqz_WVo1yYSbKlSdqQ8",
  authDomain: "prise-de-commande-pos.firebaseapp.com",
  projectId: "prise-de-commande-pos",
  storageBucket: "prise-de-commande-pos.firebasestorage.app",
  messagingSenderId: "863731035148",
  appId: "1:863731035148:web:bcbe6115abe56fd57c5229",
  measurementId: "G-CXZFY8T4RM"
};
```

⚠️ **Note de sécurité** : En production, considérez déplacer la configuration dans des variables d'environnement.

## 📚 Services disponibles

### Storage (Stockage de fichiers)

- `uploadFile(file, path, onProgress)` - Uploader un fichier
- `deleteFile(path)` - Supprimer un fichier
- `getFileURL(path)` - Obtenir l'URL d'un fichier
- `listFiles(folderPath)` - Lister les fichiers d'un dossier

### Firestore (Base de données)

- `setDocument(collection, docId, data)` - Créer/mettre à jour un document
- `getDocument(collection, docId)` - Récupérer un document
- `updateDocument(collection, docId, data)` - Mettre à jour un document
- `deleteDocument(collection, docId)` - Supprimer un document
- `getCollection(collection, options)` - Récupérer plusieurs documents

### Authentication

- `getCurrentUser()` - Obtenir l'utilisateur connecté
- `isAuthenticated()` - Vérifier si un utilisateur est connecté
- `signInWithEmail(email, password)` - Connexion avec email/mot de passe
- `signUpWithEmail(email, password, displayName)` - Inscription avec email/mot de passe
- `signOut()` - Déconnexion
- `sendPasswordReset(email)` - Envoyer un email de réinitialisation
- `updateUserPassword(newPassword)` - Mettre à jour le mot de passe
- `updateUserProfile(profileData)` - Mettre à jour le profil utilisateur
- `sendVerificationEmail()` - Envoyer un email de vérification
- `signInWithGoogle()` - Connexion avec Google
- `signInWithFacebook()` - Connexion avec Facebook
- `onAuthStateChange(callback)` - Écouter les changements d'état d'authentification

### Analytics

- `logEvent(eventName, eventParams)` - Enregistrer un événement personnalisé
- `logPageView(pageName, pageTitle)` - Enregistrer une vue de page
- `logAddToCart(productId, productName, price, category)` - Enregistrer un ajout au panier
- `logPurchase(orderId, total, items)` - Enregistrer une commande
- `logSearch(searchTerm)` - Enregistrer une recherche

## 🎯 Cas d'usage recommandés

### 1. Stockage d'images produits
- Uploader les images des produits vers Firebase Storage
- Stocker les URLs dans MySQL ou Firestore

### 2. Backup de données
- Synchroniser certaines données importantes vers Firestore
- Backup automatique des commandes

### 3. Analytics
- Suivre les événements importants (ajout au panier, commandes, recherches)
- Analyser le comportement des utilisateurs
- Mesurer les performances de l'application

### 4. Notifications push (futur)
- Utiliser Firebase Cloud Messaging pour les notifications

## ⚠️ Notes importantes

1. **Coûts** : Firebase a des limites gratuites, surveillez l'utilisation
2. **Sécurité** : Configurez les règles de sécurité dans Firebase Console
3. **Performance** : Firebase Storage est optimisé pour les fichiers statiques
4. **Backup** : Considérez garder une copie locale des fichiers importants

## 🔗 Liens utiles

- [Documentation Firebase](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Règles de sécurité Storage](https://firebase.google.com/docs/storage/security)
- [Règles de sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)

## 🆘 Dépannage

### Erreur "Firebase not initialized"
- Vérifiez que `src/config/firebase.js` est importé dans `src/main.jsx`

### Erreur de permissions
- Vérifiez les règles de sécurité dans Firebase Console
- Assurez-vous que les règles permettent les opérations nécessaires

### Erreur CORS
- Firebase gère CORS automatiquement, mais vérifiez la configuration du projet

---

**Firebase est maintenant prêt à être utilisé dans votre application ! 🚀**

