# 🔄 Synchronisation Complète Firebase ↔ Supabase

## 📋 Problème identifié

Il y a une désynchronisation entre Firebase Authentication et Supabase :

**Firebase Authentication (5 utilisateurs) :**
- tarek@test.com
- manager@blossom.com
- salaheddine.mokadem@gmail.com
- admin@blossom.com
- a@a.com

**Supabase (9 utilisateurs) :**
- a@a.com ✅
- admin@blossom.com ✅
- client@a.com ❌ (n'existe pas dans Firebase)
- client@blossom.com ❌ (n'existe pas dans Firebase)
- guest_marie_dupont@blossomcafe.local ✅ (compte système)
- guest@system.local ✅ (compte système)
- kiosk-001@blossom-cafe.local ✅ (compte système)
- manager@blossom.com ✅
- manager@example.com ❌ (n'existe pas dans Firebase)
- salaheddine.mokadem@gmail.com ✅
- tarek@test.com ❌ (manquant dans Supabase)

## ✅ Solution implémentée

### 1. Script de synchronisation complète

Un nouveau script `sync-firebase-auth-to-supabase.js` a été créé qui :

1. **Récupère tous les utilisateurs depuis Firebase** (via Firestore ou Firebase Auth)
2. **Synchronise avec Supabase** :
   - Crée les utilisateurs Firebase manquants dans Supabase
   - Met à jour les utilisateurs existants
   - Préserve les rôles existants dans Supabase
3. **Nettoie Supabase** :
   - Supprime les utilisateurs Supabase qui ne sont pas dans Firebase
   - **Préserve les comptes système** (guest@system.local, kiosk-*, etc.)

### 2. Amélioration de la synchronisation automatique

La synchronisation automatique dans le code a été améliorée pour :

- **Créer automatiquement** les utilisateurs Firebase dans Supabase lors de la connexion/inscription
- **Stocker le `firebase_uid`** dans Supabase pour référence
- **Déterminer automatiquement le rôle** selon l'email (admin@blossom.com → admin, manager@blossom.com → manager, autres → client)
- **Préserver les rôles existants** dans Supabase lors des mises à jour

## 🚀 Utilisation

### Synchronisation manuelle (recommandé pour corriger la situation actuelle)

```bash
npm run sync-firebase-auth
```

Ce script va :
1. ✅ Créer `tarek@test.com` dans Supabase
2. ✅ Mettre à jour tous les utilisateurs Firebase existants
3. ✅ Supprimer `client@a.com`, `client@blossom.com`, `manager@example.com` de Supabase
4. ✅ Préserver les comptes système (guest, kiosk)

### Synchronisation automatique

La synchronisation se fait automatiquement :
- **Lors de l'inscription** : L'utilisateur est créé dans Supabase
- **Lors de la connexion** : Si l'utilisateur n'existe pas dans Supabase, il est créé automatiquement
- **Lors des changements d'état d'authentification** : Vérification et synchronisation automatique

## 📊 Résultat attendu après synchronisation

**Supabase devrait contenir :**
- ✅ a@a.com (client)
- ✅ admin@blossom.com (admin)
- ✅ manager@blossom.com (manager)
- ✅ salaheddine.mokadem@gmail.com (client)
- ✅ tarek@test.com (client) - **NOUVEAU**
- ✅ guest@system.local (compte système - préservé)
- ✅ guest_marie_dupont@blossomcafe.local (compte système - préservé)
- ✅ kiosk-001@blossom-cafe.local (compte système - préservé)

**Utilisateurs supprimés de Supabase :**
- ❌ client@a.com (n'existe pas dans Firebase)
- ❌ client@blossom.com (n'existe pas dans Firebase)
- ❌ manager@example.com (n'existe pas dans Firebase)

## 🔧 Dépannage

### Si le script échoue avec "permission-denied"

1. Ouvrez : https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules
2. Utilisez des règles temporaires permissives (voir `CONFIGURER_REGLES_FIRESTORE_TEMPORAIRE.md`)
3. Réessayez : `npm run sync-firebase-auth`

### Si les utilisateurs ne sont pas dans Firestore

Le script essaie de récupérer les utilisateurs depuis Firestore. Si aucun utilisateur n'est trouvé :
- Vérifiez que les utilisateurs ont des documents dans la collection `users` de Firestore
- Ou utilisez Firebase Admin SDK pour récupérer directement depuis Firebase Authentication

## 📝 Notes importantes

- **Les comptes système** (guest@system.local, kiosk-*, etc.) sont **toujours préservés** dans Supabase
- **Les rôles existants** dans Supabase sont **préservés** lors des mises à jour
- **Le `firebase_uid`** est stocké dans Supabase pour référence croisée
- La synchronisation est **automatique** lors de la connexion/inscription

