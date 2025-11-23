# 🔄 Synchronisation Automatique Firebase → Supabase

## ✅ Fonctionnalité implémentée

La synchronisation automatique des comptes créés dans Firebase vers la base de données Supabase est **entièrement automatisée** et fonctionne dans plusieurs scénarios.

## 🎯 Quand la synchronisation se déclenche-t-elle ?

### 1. **Lors de l'inscription** (`register`)
- ✅ **Moment** : Immédiatement après la création du compte Firebase
- ✅ **Fichier** : `src/services/authServiceFirebase.js` → `register()`
- ✅ **Données transférées** :
  - Email
  - Prénom (`first_name`)
  - Nom (`last_name`)
  - Téléphone (`phone`)
  - Rôle (`role` - par défaut `client`)
  - Points de fidélité (`loyalty_points` - par défaut `0`)
  - Avatar (`avatar_url`)
  - UID Firebase (`firebase_uid`)
  - Statut email vérifié (`email_verified`)

### 2. **Lors de la connexion** (`login`)
- ✅ **Moment** : Si l'utilisateur existe dans Firebase mais pas dans Supabase
- ✅ **Fichier** : `src/services/authServiceFirebase.js` → `login()`
- ✅ **Données transférées** : Toutes les informations disponibles depuis Firebase

### 3. **Lors des changements d'état d'authentification** (`onAuthStateChange`)
- ✅ **Moment** : Quand Firebase détecte un changement d'état (connexion, déconnexion)
- ✅ **Fichier** : `src/App.jsx` → `useEffect` avec `onAuthStateChange`
- ✅ **Données transférées** : Toutes les informations disponibles depuis Firebase

## 🔧 Fonction de synchronisation

### `supabaseService.syncFirebaseUser(firebaseUser, additionalData)`

Cette fonction est le cœur de la synchronisation automatique :

```javascript
// Exemple d'utilisation
const syncResult = await supabaseService.syncFirebaseUser(firebaseUser, {
  firstName: 'John',
  lastName: 'Doe',
  phone: '+33123456789',
  role: 'client',
  loyalty_points: 0
});
```

**Comportement** :
1. ✅ Vérifie si l'utilisateur existe déjà dans Supabase (par email)
2. ✅ Si **existant** : Met à jour les informations (sans écraser le rôle existant)
3. ✅ Si **nouveau** : Crée l'utilisateur avec toutes les informations
4. ✅ Gère les erreurs (contraintes uniques, etc.)
5. ✅ Retourne un objet `{ success: true, data: {...}, isNew: true/false }`

## 📋 Informations transférées

### Champs obligatoires
- ✅ `email` : Email de l'utilisateur (depuis Firebase Auth)
- ✅ `password_hash` : Hash spécial pour les utilisateurs Firebase (`$2b$10$FIREBASE_USER_NO_PASSWORD_REQUIRED`)
- ✅ `first_name` : Prénom
- ✅ `last_name` : Nom
- ✅ `role` : Rôle (déterminé automatiquement selon l'email ou `client` par défaut)
- ✅ `firebase_uid` : UID Firebase pour la traçabilité

### Champs optionnels
- ✅ `phone` : Numéro de téléphone
- ✅ `avatar_url` : URL de l'avatar
- ✅ `loyalty_points` : Points de fidélité (par défaut `0`)
- ✅ `is_active` : Statut actif (par défaut `1`)
- ✅ `email_verified` : Email vérifié (depuis Firebase)

## 🔄 Mécanisme de réessai

Si la synchronisation échoue, le système :
1. ✅ **Log l'erreur** pour le débogage
2. ✅ **Réessaye automatiquement** après 500ms
3. ✅ **Continue l'opération** même en cas d'échec (l'utilisateur sera synchronisé lors de la prochaine connexion)

## 📊 Logs de débogage

La synchronisation génère des logs détaillés dans la console :

```
🔄 authServiceFirebase.register - Synchronisation automatique Firebase → Supabase...
   📋 Données à synchroniser: { email, firstName, lastName, phone, role }
✅ authServiceFirebase.register - Utilisateur créé avec succès dans Supabase: user@example.com
   ✅ Toutes les informations ont été transférées: { email, first_name, last_name, phone, role }
```

## 🎯 Détermination automatique du rôle

Le rôle est déterminé automatiquement selon l'email :

- `admin@blossom.com` → `admin`
- `manager@blossom.com` ou emails contenant `manager@` → `manager`
- Autres emails → `client`

## ✅ Vérification

Pour vérifier qu'un utilisateur a été synchronisé :

1. **Dans Supabase** :
   - Aller dans la table `users`
   - Rechercher par email
   - Vérifier que `firebase_uid` est renseigné

2. **Dans les logs** :
   - Ouvrir la console du navigateur
   - Chercher les messages `✅ Supabase - Utilisateur synchronisé`

3. **Dans l'application** :
   - Se connecter avec le compte
   - Vérifier que le profil affiche toutes les informations

## 🚀 Résultat

**Tous les comptes créés dans Firebase sont automatiquement synchronisés vers Supabase avec toutes leurs informations !**

Aucune action manuelle n'est nécessaire. La synchronisation est **100% automatique** et **transparente** pour l'utilisateur.

