# 🔄 Migration Firebase → Supabase Auth

## ✅ Migration complète terminée

L'application a été migrée de **Firebase Authentication** vers **Supabase Auth** pour l'authentification.

## 📋 Fichiers modifiés

### 1. Nouveaux fichiers créés
- ✅ `src/services/authServiceSupabase.js` - Service d'authentification Supabase (remplace Firebase Auth)
- ✅ `scripts/migrate-firebase-users-to-supabase-auth.js` - Script de migration des utilisateurs
- ✅ `scripts/list-supabase-users.js` - Script pour lister les utilisateurs Supabase

### 2. Fichiers adaptés
- ✅ `src/store/authStore.js` - Utilise maintenant `authServiceSupabase` au lieu de `authServiceFirebase`
- ✅ `src/hooks/useAuth.js` - Utilise maintenant `authServiceSupabase`
- ✅ `src/App.jsx` - Utilise `onAuthStateChange` de Supabase au lieu de Firebase
- ✅ `package.json` - Ajout des scripts `migrate-firebase-auth` et `list-supabase-users`

## 🔧 Fonctionnalités migrées

### Authentification
- ✅ Login (connexion)
- ✅ Register (inscription)
- ✅ Logout (déconnexion)
- ✅ Reset Password (réinitialisation mot de passe)
- ✅ Update Profile (mise à jour profil)
- ✅ On Auth State Change (écoute des changements d'état)

### Gestion des utilisateurs
- ✅ Récupération des données utilisateur depuis Supabase (table `users`)
- ✅ Synchronisation automatique lors de la connexion
- ✅ Création automatique dans Supabase si l'utilisateur n'existe pas
- ✅ Gestion des rôles (admin, manager, client)
- ✅ Points de fidélité

## 📝 Scripts disponibles

### Lister les utilisateurs Supabase
```bash
npm run list-supabase-users
```

### Migrer les utilisateurs Firebase vers Supabase Auth
```bash
npm run migrate-firebase-auth
```

⚠️ **IMPORTANT**: Les utilisateurs devront réinitialiser leur mot de passe car on ne peut pas récupérer les mots de passe depuis Firebase.

## 🎯 Architecture finale

### Avant (Firebase)
- Firebase Authentication → Authentification
- Firebase Firestore → Profils utilisateurs (rôles)
- Supabase → Données (produits, commandes, etc.)

### Après (Supabase)
- Supabase Auth → Authentification
- Supabase (table `users`) → Profils utilisateurs (rôles)
- Supabase → Données (produits, commandes, etc.)

## ✅ Avantages de la migration

1. **Architecture unifiée** : Tout est maintenant dans Supabase
2. **Simplicité** : Un seul service au lieu de deux
3. **Coûts** : Un seul service à payer
4. **Maintenance** : Moins de complexité
5. **RLS** : Règles de sécurité au niveau base de données

## ⚠️ Notes importantes

1. **Mots de passe** : Les utilisateurs devront utiliser "Mot de passe oublié" pour définir un nouveau mot de passe dans Supabase Auth
2. **Firebase** : Firebase peut toujours être utilisé pour Firestore/Storage si nécessaire (non utilisé actuellement pour l'auth)
3. **Migration des utilisateurs** : Utilisez `npm run migrate-firebase-auth` pour migrer les utilisateurs existants

## 🔍 Vérification

Pour vérifier que la migration fonctionne :

1. Tester la connexion avec un compte existant
2. Tester l'inscription d'un nouveau compte
3. Vérifier que les rôles sont correctement récupérés depuis Supabase
4. Vérifier que les points de fidélité sont synchronisés

## 📚 Documentation

- Service d'authentification : `src/services/authServiceSupabase.js`
- Store d'authentification : `src/store/authStore.js`
- Hook d'authentification : `src/hooks/useAuth.js`

