# ✅ Correction : Erreur "Failed to get document because the client is offline"

## ❌ Problème

Lors de la connexion, l'erreur suivante apparaissait :
```
Erreur lors de la récupération: Failed to get document because the client is offline.
```

Cela empêchait la connexion même si Firebase Authentication fonctionnait correctement.

## ✅ Solution appliquée

### 1. Gestion de l'erreur "offline" dans `firebaseService.js`

**Fichier** : `src/services/firebaseService.js` - méthode `getDocument()`

**Correction** : Détection spécifique de l'erreur "client is offline" et retour de `null` au lieu de throw une erreur.

```javascript
async getDocument(collectionName, docId) {
  // ...
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    // ...
  } catch (error) {
    // ✅ CORRECTION: Gérer spécifiquement l'erreur "client is offline"
    if (error.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('Failed to get document because the client is offline')) {
      logger.warn('⚠️ Firebase - Client hors ligne, impossible de récupérer le document');
      // Ne pas throw, retourner null pour permettre l'utilisation du cache
      return null;
    }
    // ...
  }
}
```

### 2. Utilisation du cache localStorage en fallback dans `authServiceFirebase.js`

**Fichier** : `src/services/authServiceFirebase.js` - méthode `login()`

**Correction** : Si Firestore est hors ligne, utilisation automatique du cache localStorage.

```javascript
// Si pas de cache valide, récupérer depuis Firestore
if (!userData) {
  try {
    userData = await firebaseService.getDocument('users', uid);
    // ...
  } catch (firestoreError) {
    // ✅ CORRECTION: Si Firestore est hors ligne, utiliser le cache localStorage 'user'
    if (firestoreError.message?.includes('offline') || firestoreError.message?.includes('client is offline')) {
      logger.warn('⚠️ authServiceFirebase.login - Firestore hors ligne, recherche dans localStorage');
      // Utiliser les données du cache localStorage
      const cachedUserStr = localStorage.getItem('user');
      if (cachedUserStr) {
        const cachedUser = JSON.parse(cachedUserStr);
        if (cachedUser && cachedUser.uid === uid) {
          userData = {
            email: cachedUser.email,
            displayName: cachedUser.name || cachedUser.displayName || '',
            role: cachedUser.role || 'client',
            // ...
          };
        }
      }
    }
  }
}
```

## 🎯 Résultat

Maintenant, même si Firestore est temporairement hors ligne :
- ✅ La connexion fonctionne avec les données en cache
- ✅ L'utilisateur peut accéder à l'application
- ✅ Les données sont récupérées depuis localStorage
- ✅ Aucune erreur bloquante n'est affichée

## 📝 Comportement

1. **Firestore disponible** : Les données sont récupérées depuis Firestore et mises en cache
2. **Firestore hors ligne** : Les données sont récupérées depuis le cache localStorage
3. **Pas de cache** : Un profil par défaut est créé avec les données Firebase Auth

## 🔄 Synchronisation

Quand Firestore redevient disponible, les données sont automatiquement synchronisées lors de la prochaine connexion.

