# 🔧 Correction de la déconnexion au rafraîchissement de la page

## ❌ Problème identifié

Lors de l'actualisation de la page (F5), l'utilisateur connecté était déconnecté automatiquement.

**Causes identifiées** :
1. Firebase Auth peut prendre du temps à s'initialiser au chargement
2. Si Firestore est hors ligne, la restauration échouait et déconnectait l'utilisateur
3. La méthode `restoreAuth` déconnectait l'utilisateur si Firebase Auth n'était pas encore prêt

## ✅ Corrections appliquées

### 1. Attente de l'initialisation Firebase Auth

**Fichier** : `src/store/authStore.js` - méthode `restoreAuth()`

**Avant** : Si Firebase Auth n'était pas prêt, on déconnectait immédiatement l'utilisateur.

**Après** : On attend jusqu'à 1 seconde (10 tentatives × 100ms) que Firebase Auth s'initialise avant de déconnecter.

```javascript
// Attendre que Firebase Auth s'initialise
let firebaseUser = firebaseService.getCurrentUser();
if (!firebaseUser && userStr) {
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    firebaseUser = firebaseService.getCurrentUser();
    if (firebaseUser) break;
  }
}
```

### 2. Utilisation du cache localStorage si Firebase Auth n'est pas prêt

**Fichier** : `src/store/authStore.js` - méthode `restoreAuth()`

**Correction** : Si Firebase Auth n'est pas encore initialisé mais qu'on a des données en cache, on garde l'utilisateur connecté temporairement. Firebase s'initialisera via `onAuthStateChange` dans `App.jsx`.

```javascript
if (!firebaseUser && userStr) {
  const cachedUser = JSON.parse(userStr);
  if (cachedUser && cachedUser.uid && cachedUser.role !== 'kiosk') {
    logger.warn('⚠️ Firebase Auth pas encore initialisé, utilisation du cache temporaire');
    set({ user: cachedUser, isAuthenticated: true, role: cachedUser.role });
    return { success: true, user: cachedUser };
  }
}
```

### 3. Gestion de Firestore hors ligne

**Fichier** : `src/store/authStore.js` - méthode `restoreAuth()`

**Correction** : Si Firestore est hors ligne, on utilise le cache localStorage au lieu de déconnecter l'utilisateur.

```javascript
try {
  userData = await firebaseService.getDocument('users', firebaseUser.uid);
} catch (firestoreError) {
  // Si Firestore est hors ligne, utiliser le cache localStorage
  const cachedUserStr = localStorage.getItem('user');
  if (cachedUserStr) {
    const cachedUser = JSON.parse(cachedUserStr);
    if (cachedUser && cachedUser.uid === firebaseUser.uid) {
      set({ user: cachedUser, isAuthenticated: true, role: cachedUser.role });
      return { success: true, user: cachedUser };
    }
  }
}
```

### 4. Gestion de Firestore hors ligne dans App.jsx

**Fichier** : `src/App.jsx` - `onAuthStateChange`

**Correction** : Si Firestore échoue lors de la récupération des données utilisateur, on utilise le cache localStorage au lieu de créer un utilisateur minimal.

```javascript
} catch (firestoreError) {
  // Si Firestore est hors ligne, utiliser le cache localStorage
  const cachedUserStr = localStorage.getItem('user');
  if (cachedUserStr) {
    const cachedUser = JSON.parse(cachedUserStr);
    if (cachedUser && cachedUser.uid === (user.uid || user.id)) {
      setUser(cachedUser);
      setAuthenticated(true);
      setRole(cachedUser.role);
      return;
    }
  }
}
```

## 📝 Stratégie de restauration

1. **Restauration immédiate depuis localStorage** (dans `App.jsx`)
   - Au chargement, on restaure immédiatement depuis localStorage pour un affichage instantané
   - Pas d'attente de Firebase

2. **Vérification Firebase Auth** (dans `restoreAuth`)
   - On attend jusqu'à 1 seconde que Firebase Auth s'initialise
   - Si Firebase Auth n'est pas prêt mais qu'on a un cache, on garde l'utilisateur connecté

3. **Récupération Firestore** (en arrière-plan)
   - Si Firestore est disponible, on met à jour les données utilisateur
   - Si Firestore est hors ligne, on utilise le cache localStorage

4. **Synchronisation continue** (via `onAuthStateChange`)
   - Firebase Auth synchronise automatiquement l'état d'authentification
   - Les données Firestore sont mises à jour en arrière-plan

## 🎯 Résultat attendu

Après ces corrections :
- ✅ L'utilisateur reste connecté après un rafraîchissement de page
- ✅ La restauration est instantanée depuis localStorage
- ✅ L'application fonctionne même si Firestore est temporairement hors ligne
- ✅ Firebase Auth s'initialise en arrière-plan sans déconnecter l'utilisateur

## 🔄 Test

1. **Connectez-vous** à l'application
2. **Actualisez la page** (F5 ou Ctrl+R)
3. **Vérifiez** que vous restez connecté
4. **Vérifiez** la console pour confirmer qu'il n'y a pas de déconnexion inattendue

## 📌 Notes importantes

- La session est persistée dans `localStorage` avec la clé `'user'`
- Firebase Auth gère automatiquement la persistance de session (via `persistence: 'local'`)
- Si Firebase Auth se déconnecte vraiment (session expirée), l'utilisateur sera déconnecté (comportement normal)
- Les données Firestore sont mises en cache dans `localStorage` avec la clé `firestore_user_{uid}`

