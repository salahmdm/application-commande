# 🔧 Solution : Gestion des rôles avec Firebase (indépendant de Supabase)

## ⚠️ Problème identifié

Vous mentionnez qu'un compte admin dans Supabase a accès à toutes les fonctionnalités et que vous ne pouvez pas mettre de rôle dans les comptes. 

**Important** : Les rôles dans votre application sont stockés dans **Firebase Firestore**, **PAS dans Supabase**. Les RLS (Row Level Security) de Supabase n'affectent **PAS** les rôles Firebase.

## ✅ Solution : Utiliser Firebase Firestore pour les rôles

### Architecture actuelle

1. **Authentification** : Firebase Authentication
2. **Stockage des rôles** : Firebase Firestore (collection `users`)
3. **Base de données produits/commandes** : Supabase
4. **RLS Supabase** : N'affecte que Supabase, pas Firebase

### Les rôles sont indépendants de Supabase

Les rôles sont stockés dans Firestore avec cette structure :
```javascript
{
  email: "admin@blossom.com",
  role: "admin",  // ← Stocké dans Firestore
  firstName: "...",
  lastName: "...",
  // ...
}
```

## 📋 Méthodes pour mettre à jour un rôle

### Méthode 1 : Script Node.js (Recommandé)

```bash
node scripts/update-user-role.js admin@blossom.com admin
```

Ce script :
- ✅ Met à jour le rôle dans **Firestore** (pas Supabase)
- ✅ Fonctionne indépendamment des RLS Supabase
- ✅ Ne nécessite pas de permissions Supabase

### Méthode 2 : Firebase Console (Manuel)

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Projet : **prise-de-commande-pos**
3. **Firestore Database** → Collection **"users"**
4. Trouvez le document avec l'email `admin@blossom.com`
5. Modifiez le champ **"role"** à `"admin"`
6. Cliquez sur **"Update"**

### Méthode 3 : Via l'application (si vous avez déjà un compte admin)

Si vous avez déjà un compte admin, vous pouvez créer une interface dans l'application pour gérer les rôles.

## 🔍 Vérification

Pour vérifier où sont stockés les rôles :

1. **Firebase Firestore** : Collection `users` → Champ `role`
2. **Supabase** : Table `users` → Champ `role` (uniquement pour utilisateurs MySQL, pas Firebase)

## 💡 Pourquoi les RLS Supabase ne posent pas problème

Les RLS (Row Level Security) de Supabase :
- ✅ S'appliquent uniquement aux **tables Supabase**
- ✅ N'affectent **PAS** Firebase Firestore
- ✅ N'affectent **PAS** les rôles stockés dans Firestore

Vous pouvez donc gérer les rôles dans Firestore sans problème, même si vous avez des RLS actives dans Supabase.

## 🎯 Résumé

- **Rôles** = Firebase Firestore (collection `users`)
- **RLS Supabase** = N'affecte que Supabase
- **Solution** = Utiliser le script ou Firebase Console pour mettre à jour les rôles dans Firestore

Le script `update-user-role.js` fonctionne indépendamment de Supabase et de ses RLS.

