# 🔄 Guide : Synchroniser tous les utilisateurs Firebase avec Supabase

## 🎯 Objectif

Synchroniser **tous les utilisateurs Firebase** avec la table `users` de Supabase pour que les deux bases de données soient identiques.

## ✅ Solution

Un script automatique a été créé pour synchroniser tous les utilisateurs Firebase (depuis Firestore) vers Supabase.

## 🚀 Utilisation

### Option 1 : Script automatique (Recommandé)

Exécutez simplement :

```bash
npm run sync-all-firebase
```

Ce script va :
1. ✅ Récupérer tous les utilisateurs depuis Firebase Firestore
2. ✅ Les synchroniser avec Supabase (créer ou mettre à jour)
3. ✅ Supprimer les utilisateurs Supabase qui ne sont pas dans Firebase (sauf les comptes système)
4. ✅ Préserver les rôles et points de fidélité existants dans Supabase

### Option 2 : Scripts existants

D'autres scripts sont disponibles :

```bash
# Synchroniser depuis Firestore (collection 'users')
npm run sync-firebase-users

# Synchroniser depuis Firebase Auth (via Firestore)
npm run sync-firebase-auth

# Synchroniser une liste d'emails spécifiques
npm run sync-emails
```

## 📋 Ce que fait le script

### 1. Récupération des utilisateurs Firebase
- Lit tous les utilisateurs depuis la collection `users` de Firestore
- Récupère : email, nom, prénom, téléphone, photo, rôle, points de fidélité

### 2. Synchronisation avec Supabase
Pour chaque utilisateur Firebase :
- ✅ **Si existe dans Supabase** : Met à jour les informations (sauf rôle et points si déjà définis)
- ✅ **Si n'existe pas** : Crée l'utilisateur avec toutes les informations

### 3. Détermination automatique du rôle
- `admin@blossom.com` → `admin`
- `manager@blossom.com` → `manager`
- Autres → `client`

### 4. Nettoyage
- Supprime les utilisateurs Supabase qui ne sont **pas** dans Firebase
- **Exception** : Les comptes système (`@system.local`) sont préservés
- **Exception** : Les utilisateurs avec `firebase_uid` sont préservés

## ⚠️ Prérequis

### 1. Activer Firestore
- Aller dans Firebase Console
- Activer Firestore Database
- Voir `ACTIVER_FIRESTORE.md` pour plus de détails

### 2. Configurer les règles Firestore
Les règles Firestore doivent permettre la lecture de la collection `users` :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true; // Temporaire pour la synchronisation
    }
  }
}
```

Voir `CONFIGURER_REGLES_FIRESTORE_TEMPORAIRE.md` pour plus de détails.

## 📊 Résultat attendu

Après l'exécution, vous verrez un résumé :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RÉSUMÉ DE LA SYNCHRONISATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Créés: 5
🔄 Mis à jour: 3
🗑️ Supprimés: 2
❌ Erreurs: 0

✅ Synchronisation terminée !
```

## 🔍 Vérification

Pour vérifier que la synchronisation a fonctionné :

### Dans Supabase
1. Aller dans la table `users`
2. Vérifier que tous les utilisateurs Firebase y sont présents
3. Vérifier que `firebase_uid` est renseigné pour chaque utilisateur

### Script de vérification
```bash
npm run verify-sync
```

## ❓ Questions fréquentes

**Q : Les rôles existants dans Supabase seront-ils écrasés ?**  
R : Non, les rôles existants dans Supabase sont préservés. Seuls les nouveaux utilisateurs reçoivent un rôle automatique.

**Q : Les points de fidélité seront-ils perdus ?**  
R : Non, les points de fidélité existants dans Supabase sont préservés.

**Q : Que se passe-t-il si un utilisateur Firebase n'a pas d'email ?**  
R : Il sera ignoré (seuls les utilisateurs avec email sont synchronisés).

**Q : Les comptes système seront-ils supprimés ?**  
R : Non, les comptes système (`@system.local`) sont toujours préservés.

**Q : Puis-je exécuter ce script plusieurs fois ?**  
R : Oui, le script est idempotent. Vous pouvez l'exécuter autant de fois que nécessaire.

## 🔄 Synchronisation continue

La synchronisation automatique se fait aussi :
- ✅ Lors de l'inscription d'un nouvel utilisateur
- ✅ Lors de la connexion d'un utilisateur existant
- ✅ Lors des changements d'état d'authentification

Voir `SYNCHRONISATION_AUTOMATIQUE_COMPLETE.md` pour plus de détails.

