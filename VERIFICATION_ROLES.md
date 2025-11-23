# 🔐 Vérification et gestion des rôles utilisateurs

## 📋 Vue d'ensemble

L'application utilise un système de rôles basé sur **Firebase Firestore** pour gérer les permissions. Les rôles sont stockés dans la collection `users` de Firestore.

## 🎯 Rôles disponibles

- **`client`** : Utilisateur standard (accès aux produits, commandes, profil)
- **`manager`** : Gestionnaire (accès POS, gestion commandes, produits, inventaire)
- **`admin`** : Administrateur (accès complet à toutes les fonctionnalités)
- **`kiosk`** : Borne tactile (accès limité, ne peut pas utiliser l'application principale)

## 🔍 Vérifier le rôle d'un utilisateur

### Méthode 1 : Script Node.js (Recommandé)

```bash
node scripts/verify-user-role.js admin@blossom.com
```

Ou avec npm :

```bash
npm run verify-user-role admin@blossom.com
```

Ce script affiche :
- ✅ Le rôle actuel de l'utilisateur
- ✅ Les routes accessibles selon le rôle
- ✅ Les informations complètes du compte

### Méthode 2 : Firebase Console (Manuel)

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Projet : **prise-de-commande-pos**
3. **Firestore Database** → Collection **"users"**
4. Recherchez le document avec l'email de l'utilisateur
5. Vérifiez le champ **"role"**

## 🔧 Mettre à jour le rôle d'un utilisateur

### Méthode 1 : Script Node.js (Recommandé)

```bash
node scripts/update-user-role.js admin@blossom.com admin
```

### Méthode 2 : Firebase Console (Manuel)

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Projet : **prise-de-commande-pos**
3. **Firestore Database** → Collection **"users"**
4. Trouvez le document avec l'email de l'utilisateur
5. Modifiez le champ **"role"** à `"admin"` (ou autre rôle)
6. Cliquez sur **"Update"**

## ✅ Vérification que les rôles sont pris en compte

### 1. Vérifier le rôle dans Firestore

```bash
npm run verify-user-role admin@blossom.com
```

### 2. Vérifier dans l'application

1. **Déconnectez-vous** complètement de l'application
2. **Reconnectez-vous** avec le compte
3. Vérifiez que vous avez accès aux routes appropriées :
   - **Admin** : Dashboard CA, Gestion Produits, Gestion Commandes, Inventaire, Gestion des Comptes, Paramètres, Apparence
   - **Manager** : Prise de commande, Gestion commandes, Produits, Inventaire
   - **Client** : Accueil, Produits, Mes commandes, Profil

### 3. Vérifier dans le code

Les rôles sont vérifiés à plusieurs niveaux :

#### Frontend (React)

- **`src/App.jsx`** : Routes par rôle (lignes 493-526)
- **`src/hooks/useAuth.js`** : Hook `hasRole()`, `isAdmin`, `isManager` (lignes 94-114)
- **`src/components/security/SecureRoute.jsx`** : Protection des routes par rôle
- **`src/components/layout/Sidebar.jsx`** : Menu selon le rôle

#### Backend (Node.js Express)

- **`database/admin-api.js`** : Middleware `requireAdmin`, `requireManager` (lignes 515-528)
- **`database/security-middleware.js`** : Vérification des rôles dans les tokens JWT

## 🔒 Hiérarchie des rôles

```
admin
  ├── Accès à toutes les fonctionnalités
  ├── Routes admin complètes
  └── Routes manager

manager
  ├── Accès aux fonctionnalités de gestion
  ├── Routes manager
  └── Routes admin limitées (produits, inventaire)

client
  └── Accès aux fonctionnalités standard
      └── Routes client uniquement
```

## 🛡️ Protection des routes

### Routes Admin (accès admin uniquement)

- `/admin-dashboard` : Dashboard CA
- `/admin-products` : Gestion Produits
- `/admin-orders` : Gestion Commandes
- `/admin-inventory` : Inventaire
- `/admin-accounts` : Gestion des Comptes
- `/admin-settings` : Paramètres
- `/admin-appearance` : Apparence

### Routes Manager (accès manager et admin)

- `/manager-pos` : Prise de commande
- `/manager-orders` : Gestion commandes
- `/manager-stats` : Statistiques

### Routes Client (accès tous)

- `/home` : Accueil
- `/products` : Produits
- `/orders` : Mes commandes
- `/profile` : Profil

## 🐛 Dépannage

### Problème : Le compte admin n'a pas accès admin

1. **Vérifier le rôle dans Firestore** :
   ```bash
   npm run verify-user-role admin@blossom.com
   ```

2. **Si le rôle n'est pas "admin"** :
   ```bash
   npm run update-user-role admin@blossom.com admin
   ```

3. **Déconnectez-vous et reconnectez-vous** dans l'application

4. **Vérifiez dans la console du navigateur** :
   - Ouvrez les DevTools (F12)
   - Onglet Console
   - Tapez : `localStorage.getItem('user')`
   - Vérifiez que `role: "admin"` est présent

### Problème : Les routes admin ne s'affichent pas

1. Vérifiez que le rôle est bien "admin" dans Firestore
2. Vérifiez que vous êtes bien connecté
3. Vérifiez dans `src/App.jsx` que les routes admin sont bien définies pour le rôle "admin"
4. Videz le cache du navigateur et reconnectez-vous

### Problème : Firestore n'est pas activé

Consultez `ACTIVER_FIRESTORE.md` pour activer Firestore.

## 📝 Notes importantes

- ⚠️ Les rôles sont stockés dans **Firebase Firestore**, **PAS dans Supabase**
- ⚠️ Les RLS (Row Level Security) de Supabase n'affectent **PAS** les rôles Firebase
- ⚠️ Après modification d'un rôle, l'utilisateur doit se **déconnecter et se reconnecter** pour voir les changements
- ⚠️ Les rôles sont vérifiés à la fois côté **frontend** et **backend**

## 🔄 Workflow complet pour élever un compte en admin

1. **Vérifier l'état actuel** :
   ```bash
   npm run verify-user-role admin@blossom.com
   ```

2. **Mettre à jour le rôle** :
   ```bash
   npm run update-user-role admin@blossom.com admin
   ```

3. **Vérifier la mise à jour** :
   ```bash
   npm run verify-user-role admin@blossom.com
   ```

4. **Dans l'application** :
   - Déconnectez-vous
   - Reconnectez-vous avec `admin@blossom.com`
   - Vérifiez que vous avez accès aux routes admin

## ✅ Checklist de vérification

- [ ] Le rôle est bien "admin" dans Firestore
- [ ] L'utilisateur est bien connecté dans l'application
- [ ] Le rôle est présent dans `localStorage.getItem('user')`
- [ ] Les routes admin sont accessibles dans la sidebar
- [ ] Les composants admin s'affichent correctement
- [ ] Les API backend acceptent les requêtes admin

