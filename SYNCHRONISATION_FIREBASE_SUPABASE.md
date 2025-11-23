# 🔄 Synchronisation Firebase ↔ Supabase

## ✅ Implémentation terminée

L'application synchronise maintenant **Firebase Authentication** avec la table **`users`** de **Supabase** pour que les rôles soient gérés dans Supabase.

## 🏗️ Architecture mise à jour

### Flux de connexion

1. **Firebase Authentication** : Vérifie email + mot de passe
2. **Supabase** : Récupère le rôle et les données utilisateur (source de vérité)
3. **Application** : Utilise le rôle depuis Supabase

### Flux d'inscription

1. **Firebase Authentication** : Crée le compte (email + mot de passe)
2. **Supabase** : Crée automatiquement l'utilisateur dans la table `users` avec rôle `client`
3. **Application** : Utilise le rôle depuis Supabase

## 🔧 Modifications apportées

### 1. `src/services/supabaseService.js`

Ajout de deux nouvelles méthodes :

#### `getUserByEmail(email)`
- Récupère un utilisateur depuis Supabase par email
- Utilisé pour récupérer le rôle après connexion Firebase

#### `syncFirebaseUser(firebaseUser, additionalData)`
- Crée ou met à jour un utilisateur Firebase dans Supabase
- Synchronise automatiquement lors de l'inscription/connexion
- Préserve le rôle existant dans Supabase (ne l'écrase pas)

### 2. `src/services/authServiceFirebase.js`

#### `login()`
- ✅ Récupère le rôle depuis **Supabase** au lieu de Firestore
- ✅ Synchronise automatiquement avec Supabase si l'utilisateur n'existe pas
- ✅ Vérifie le rôle depuis Supabase en arrière-plan pour les mises à jour

#### `register()`
- ✅ Synchronise avec **Supabase** au lieu de Firestore
- ✅ Crée l'utilisateur dans Supabase avec rôle `client` par défaut

#### `updateProfile()`
- ✅ Met à jour le profil dans **Supabase** au lieu de Firestore
- ✅ Récupère le rôle depuis Supabase après mise à jour

#### `onAuthStateChange()`
- ✅ Récupère les données depuis **Supabase** au lieu de Firestore
- ✅ Synchronise automatiquement si l'utilisateur n'existe pas dans Supabase

### 3. `src/App.jsx`

- ✅ Utilise **Supabase** pour récupérer les rôles au lieu de Firestore
- ✅ Synchronise automatiquement avec Supabase lors de la connexion
- ✅ Met à jour le rôle depuis Supabase en arrière-plan

## 📋 Comment ça fonctionne maintenant

### Connexion

1. L'utilisateur entre email + mot de passe
2. **Firebase Auth** vérifie les identifiants
3. **Supabase** est consulté pour récupérer le rôle (par email)
4. Si l'utilisateur n'existe pas dans Supabase, il est créé automatiquement avec rôle `client`
5. L'application utilise le rôle depuis Supabase

### Inscription

1. L'utilisateur s'inscrit avec email + mot de passe
2. **Firebase Auth** crée le compte
3. **Supabase** crée automatiquement l'utilisateur avec :
   - Email
   - Nom/Prénom
   - Rôle : `client` (par défaut)
   - Points de fidélité : 0
4. L'application utilise le rôle depuis Supabase

### Mise à jour du rôle

Pour mettre à jour le rôle d'un utilisateur, modifiez-le **directement dans Supabase** :

#### Méthode 1 : Via Supabase Dashboard

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **Table Editor** → Table **`users`**
4. Trouvez l'utilisateur par email
5. Modifiez le champ **`role`** à `admin` (ou autre)
6. Cliquez sur **Save**

#### Méthode 2 : Via SQL

```sql
UPDATE "users" 
SET "role" = 'admin', 
    "updated_at" = CURRENT_TIMESTAMP
WHERE "email" = 'admin@blossom.com';
```

#### Méthode 3 : Script Node.js (à créer)

Vous pouvez créer un script similaire à `update-user-role.js` mais qui met à jour Supabase au lieu de Firestore.

## ✅ Avantages de cette architecture

1. ✅ **Source de vérité unique** : Les rôles sont dans Supabase
2. ✅ **Gestion centralisée** : Tout est dans Supabase (produits, commandes, utilisateurs)
3. ✅ **Firebase pour l'authentification** : Firebase Auth reste pour la sécurité (email/mot de passe)
4. ✅ **Synchronisation automatique** : Les utilisateurs Firebase sont automatiquement créés dans Supabase
5. ✅ **Pas de migration nécessaire** : Les utilisateurs existants dans Supabase continuent de fonctionner

## 🔍 Vérification

### Vérifier qu'un utilisateur est dans Supabase

```sql
SELECT email, role, first_name, last_name, loyalty_points 
FROM "users" 
WHERE "email" = 'admin@blossom.com';
```

### Vérifier la synchronisation

1. Connectez-vous avec un compte Firebase
2. Vérifiez dans Supabase que l'utilisateur existe (ou a été créé)
3. Vérifiez que le rôle est correct dans Supabase
4. Déconnectez-vous et reconnectez-vous
5. Vérifiez que le rôle est bien récupéré depuis Supabase

## 📝 Notes importantes

- ⚠️ **Firebase Auth** reste utilisé pour l'authentification (email + mot de passe)
- ⚠️ **Supabase** est maintenant la source de vérité pour les rôles
- ⚠️ **Firestore** n'est plus utilisé pour les rôles (mais peut rester pour d'autres données si nécessaire)
- ⚠️ Les utilisateurs Firebase sont automatiquement synchronisés avec Supabase
- ⚠️ Le rôle dans Supabase a la priorité sur tout autre source

## 🎯 Résumé

| Aspect | Avant | Maintenant |
|--------|-------|------------|
| **Authentification** | Firebase Auth | Firebase Auth (inchangé) |
| **Rôles** | Firestore | **Supabase** ✅ |
| **Profils utilisateurs** | Firestore | **Supabase** ✅ |
| **Synchronisation** | Manuelle | **Automatique** ✅ |

L'application utilise maintenant **Supabase comme source de vérité** pour les rôles, tout en gardant **Firebase Auth** pour l'authentification sécurisée.

