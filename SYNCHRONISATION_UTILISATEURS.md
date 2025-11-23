# 🔄 Synchronisation des Utilisateurs Firebase → Supabase

## 📋 Objectif

Ce script synchronise tous les utilisateurs de Firebase Firestore vers Supabase, en :
- Créant les utilisateurs Firebase dans Supabase s'ils n'existent pas
- Mettant à jour les utilisateurs existants dans Supabase avec les données Firebase
- Assignant les rôles corrects :
  - `admin@blossom.com` → rôle `admin`
  - `manager@blossom.com` → rôle `manager`
  - Tous les autres → rôle `client`
- Supprimant les utilisateurs Supabase qui ne sont pas dans Firebase

## 🚀 Utilisation

```bash
npm run sync-firebase-users
```

## ⚠️ Prérequis

### 1. Activer Firestore dans Firebase

Si vous obtenez l'erreur `permission-denied`, vous devez d'abord activer Firestore :

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet : **prise-de-commande-pos**
3. Dans le menu de gauche, cliquez sur **"Firestore Database"**
4. Si Firestore n'est pas activé, cliquez sur **"Créer une base de données"**
5. Choisissez le mode de production ou de test (pour le développement, vous pouvez choisir "Mode test")
6. Sélectionnez une région (par exemple : `europe-west`)

Voir aussi : `ACTIVER_FIRESTORE.md`

### 2. Configurer les règles Firestore

Pour que le script puisse lire les utilisateurs, vous devez configurer les règles Firestore **temporairement**.

**📖 Guide détaillé** : Voir `CONFIGURER_REGLES_FIRESTORE_TEMPORAIRE.md`

**Résumé rapide** :

1. Allez sur [Firebase Console](https://console.firebase.google.com) → Firestore Database → Règles
2. Remplacez les règles par ces règles temporaires (⚠️ **UNIQUEMENT POUR LA SYNCHRONISATION**) :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ RÈGLES PERMISSIVES TEMPORAIRES POUR LA SYNCHRONISATION
    match /users/{userId} {
      allow read, write: if true;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Cliquez sur **"Publier"**
4. Exécutez le script : `npm run sync-firebase-users`
5. **⚠️ IMPORTANT** : Remettez immédiatement des règles sécurisées après la synchronisation (voir `CONFIGURER_REGLES_FIRESTORE_TEMPORAIRE.md`)

### 3. Vérifier les variables d'environnement Supabase

Le script utilise les variables d'environnement Supabase. Si elles ne sont pas définies, il utilise les valeurs par défaut du projet.

Vous pouvez définir ces variables dans un fichier `.env` :

```env
VITE_SUPABASE_URL=https://brygzpxiemwthickhuqb.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon
```

## 📊 Ce que fait le script

1. **Récupère tous les utilisateurs depuis Firebase Firestore**
   - Lit la collection `users` dans Firestore
   - Récupère tous les documents avec leurs données

2. **Récupère tous les utilisateurs depuis Supabase**
   - Lit la table `users` dans Supabase
   - Crée un index des emails pour recherche rapide

3. **Synchronise chaque utilisateur Firebase vers Supabase**
   - Si l'utilisateur existe dans Supabase (par email) → **Mise à jour**
   - Si l'utilisateur n'existe pas dans Supabase → **Création**
   - Le rôle est déterminé selon l'email :
     - `admin@blossom.com` → `admin`
     - `manager@blossom.com` → `manager`
     - Autres → `client`

4. **Nettoie les utilisateurs Supabase**
   - Supprime les utilisateurs Supabase qui ne sont pas dans Firebase
   - Cela garantit que Supabase contient uniquement les utilisateurs Firebase

## 🔍 Résultat attendu

Après l'exécution, vous devriez voir :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RÉSUMÉ DE LA SYNCHRONISATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Utilisateurs créés: X
   - admin@blossom.com (admin)
   - manager@blossom.com (manager)
   - ...

🔄 Utilisateurs mis à jour: Y
   - ...

🗑️ Utilisateurs supprimés: Z
   - ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Synchronisation terminée !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ⚠️ Notes importantes

1. **Les mots de passe** : Les utilisateurs créés dans Supabase auront un hash de mot de passe temporaire, car Firebase gère l'authentification. Les utilisateurs doivent se connecter via Firebase.

2. **Les rôles** : Les rôles sont assignés selon l'email :
   - `admin@blossom.com` → `admin`
   - `manager@blossom.com` → `manager`
   - Tous les autres → `client`

3. **Les utilisateurs supprimés** : Les utilisateurs Supabase qui ne sont pas dans Firebase seront supprimés. Assurez-vous que tous les utilisateurs importants sont dans Firebase avant d'exécuter le script.

4. **Firebase UID** : L'UID Firebase est stocké dans le champ `firebase_uid` de Supabase pour référence.

## 🐛 Dépannage

### Erreur "permission-denied"

**Cause** : Les règles Firestore bloquent l'accès.

**Solution** :
1. Activez Firestore dans Firebase Console
2. Configurez les règles Firestore (voir section 2 ci-dessus)
3. Réessayez le script

### Erreur "Firestore API not enabled"

**Cause** : L'API Firestore n'est pas activée dans Google Cloud.

**Solution** :
1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez le projet `prise-de-commande-pos`
3. Activez l'API Firestore

Voir aussi : `ACTIVER_FIRESTORE.md`

### Aucun utilisateur trouvé dans Firebase

**Cause** : La collection `users` est vide dans Firestore.

**Solution** :
1. Vérifiez que les utilisateurs existent dans Firebase Authentication
2. Vérifiez que les documents existent dans la collection `users` de Firestore
3. Si les documents n'existent pas, ils seront créés automatiquement lors de la première connexion

## 📝 Après la synchronisation

Une fois la synchronisation terminée :

1. **Vérifiez les rôles dans Supabase** :
   ```bash
   npm run update-user-role-supabase admin@blossom.com admin
   npm run update-user-role-supabase manager@blossom.com manager
   ```

2. **Remplacez les règles Firestore** par des règles plus strictes (voir `CONFIGURER_REGLES_FIRESTORE.md`)

3. **Testez la connexion** avec les différents comptes pour vérifier que les rôles sont corrects

