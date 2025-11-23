# 🔐 Accès Admin Complet - Guide de vérification

## ✅ Confirmation : Le compte admin@blossom.com a le rôle "admin"

Si le compte a bien le rôle "admin" dans Firestore mais n'a pas tous les accès, suivez ce guide.

## 🔍 Vérification complète

### Étape 1 : Diagnostic automatique

Exécutez le script de diagnostic :

```bash
npm run diagnostic-admin admin@blossom.com
```

Ce script vérifie :
- ✅ Le rôle dans Firestore
- ✅ Les routes admin configurées
- ✅ Les éléments du menu admin
- ✅ Les hooks et fonctions disponibles

### Étape 2 : Vérification manuelle dans l'application

1. **Déconnectez-vous complètement** de l'application
2. **Videz le cache du navigateur** :
   - Chrome/Edge : `Ctrl + Shift + Delete`
   - Sélectionnez "Images et fichiers en cache"
   - Cliquez sur "Effacer les données"
3. **Reconnectez-vous** avec `admin@blossom.com`
4. **Ouvrez la console du navigateur** (F12)
5. **Vérifiez le rôle dans localStorage** :
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('Rôle:', user?.role);
   ```
   Le résultat doit être : `"admin"`

### Étape 3 : Vérifier les éléments du menu

Dans la sidebar (menu latéral), vous devriez voir **TOUS** ces éléments :

#### Menu Admin (exclusif admin)
- ✅ **Dashboard CA** (`admin-dashboard`)
- ✅ **Gestion des Comptes** (`admin-accounts`)
- ✅ **Apparence** (`admin-appearance`)
- ✅ **Paramètres** (`admin-settings`)

#### Menu Admin/Manager (partagé)
- ✅ **Gestion Produits** (`admin-products`)
- ✅ **Inventaire** (`admin-inventory`)

#### Menu Manager (admin a aussi accès)
- ✅ **Prise de commande** (`manager-pos`)
- ✅ **Gestion commandes** (`manager-orders`)

#### Menu Base (tous)
- ✅ **Accueil** (`home`)

### Étape 4 : Tester chaque route admin

Cliquez sur chaque élément du menu et vérifiez que :
- ✅ La page s'affiche correctement
- ✅ Pas d'erreur 403 (Accès refusé)
- ✅ Pas de redirection vers la page de connexion
- ✅ Les fonctionnalités sont accessibles

## 🛠️ Routes admin configurées dans le code

Dans `src/App.jsx` (lignes 494-508), les routes admin sont :

```javascript
case 'admin':
  return {
    home: HomeView,
    'admin-dashboard': DashboardCA,        // ✅ Dashboard CA
    'admin-products': AdminProducts,        // ✅ Gestion Produits
    'admin-orders': AdminOrders,            // ✅ Gestion Commandes
    'admin-inventory': AdminInventory,     // ✅ Inventaire
    'admin-accounts': AdminAccounts,       // ✅ Gestion des Comptes
    'admin-settings': AdminSettings,        // ✅ Paramètres
    'admin-appearance': AdminAppearance,   // ✅ Apparence
    'manager-pos': ManagerPOS,             // ✅ Prise de commande
    'manager-orders': ManagerDashboard,    // ✅ Gestion commandes
    'manager-stats': DashboardCA,         // ✅ Statistiques
  };
```

## 🔧 Si le compte n'a toujours pas accès

### Problème 1 : Le rôle n'est pas récupéré depuis Firestore

**Symptôme** : Le rôle dans `localStorage.getItem('user')` n'est pas "admin"

**Solution** :
1. Vérifiez que Firestore est activé (voir `ACTIVER_FIRESTORE.md`)
2. Vérifiez que le document existe dans Firestore avec `role: "admin"`
3. Vérifiez les règles de sécurité Firestore (doivent permettre la lecture)
4. Déconnectez-vous et reconnectez-vous

### Problème 2 : Le rôle n'est pas propagé dans le store

**Symptôme** : Le rôle est "admin" dans localStorage mais pas dans le store

**Solution** :
1. Vérifiez dans `src/store/authStore.js` que le rôle est bien récupéré
2. Vérifiez dans `src/App.jsx` que le rôle est bien utilisé pour déterminer les routes
3. Vérifiez dans `src/hooks/useAuth.js` que `isAdmin` retourne `true`

### Problème 3 : Les routes ne sont pas accessibles

**Symptôme** : Les routes admin redirigent ou affichent une erreur

**Solution** :
1. Vérifiez que `user?.role === 'admin'` dans `src/App.jsx` (ligne 494)
2. Vérifiez que les composants admin sont bien importés
3. Vérifiez la console du navigateur pour les erreurs

### Problème 4 : Le menu n'affiche pas tous les éléments admin

**Symptôme** : Certains éléments du menu admin ne sont pas visibles

**Solution** :
1. Vérifiez dans `src/components/layout/Sidebar.jsx` (lignes 47-54)
2. Vérifiez que `role` est bien "admin" dans le hook `useAuth()`
3. Vérifiez que `item.roles.includes(role)` retourne `true` pour les éléments admin

## 📋 Checklist complète

- [ ] Le rôle est "admin" dans Firestore
- [ ] Firestore est activé et accessible
- [ ] Les règles de sécurité Firestore permettent la lecture
- [ ] L'utilisateur est connecté dans l'application
- [ ] Le rôle est "admin" dans `localStorage.getItem('user')`
- [ ] Le rôle est "admin" dans le store Zustand
- [ ] `useAuth().isAdmin` retourne `true`
- [ ] `useAuth().role` retourne `"admin"`
- [ ] Tous les éléments du menu admin sont visibles
- [ ] Toutes les routes admin sont accessibles
- [ ] Les composants admin s'affichent correctement
- [ ] Pas d'erreur dans la console du navigateur

## 🎯 Test rapide dans la console

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
// Vérifier le rôle dans localStorage
const user = JSON.parse(localStorage.getItem('user'));
console.log('Rôle:', user?.role);
console.log('Email:', user?.email);

// Vérifier le store (si accessible)
// Dans React DevTools, vérifiez le store authStore
```

## 📞 Support

Si après toutes ces vérifications le compte n'a toujours pas accès admin :

1. Exécutez le diagnostic : `npm run diagnostic-admin admin@blossom.com`
2. Vérifiez les logs dans la console du navigateur
3. Vérifiez les erreurs réseau dans l'onglet Network
4. Vérifiez que Firestore est bien activé et accessible

