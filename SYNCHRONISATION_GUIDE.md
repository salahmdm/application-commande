# 🔄 Guide de Synchronisation Firebase ↔ Supabase

## 📋 Situation actuelle

**Firebase Authentication (5 utilisateurs) :**
- tarek@test.com
- manager@blossom.com
- salaheddine.mokadem@gmail.com
- admin@blossom.com
- a@a.com

**Supabase (9 utilisateurs) :**
- a@a.com ✅
- admin@blossom.com ✅
- client@a.com ❌ (à supprimer)
- client@blossom.com ❌ (à supprimer)
- guest_marie_dupont@blossomcafe.local ✅ (compte système - à préserver)
- guest@system.local ✅ (compte système - à préserver)
- kiosk-001@blossom-cafe.local ✅ (compte système - à préserver)
- manager@blossom.com ✅
- manager@example.com ❌ (à supprimer)
- salaheddine.mokadem@gmail.com ✅
- tarek@test.com ❌ (à créer)

## ✅ Solution : Synchronisation automatique améliorée

J'ai amélioré la synchronisation automatique dans le code pour que :

1. **Lors de la connexion** : Si un utilisateur Firebase n'existe pas dans Supabase, il est créé automatiquement
2. **Lors de l'inscription** : L'utilisateur est créé dans Supabase avec le rôle approprié
3. **Stockage du `firebase_uid`** : Pour référence croisée entre Firebase et Supabase
4. **Détermination automatique du rôle** : Selon l'email (admin@blossom.com → admin, manager@blossom.com → manager, autres → client)

## 🚀 Actions à effectuer

### Option 1 : Synchronisation manuelle via Supabase Dashboard (RECOMMANDÉ)

1. **Connectez-vous à Supabase Dashboard** : https://supabase.com/dashboard
2. **Allez dans l'éditeur SQL** : Table Editor → SQL Editor
3. **Exécutez cette requête SQL** pour créer `tarek@test.com` :

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
VALUES (
  'tarek@test.com',
  '$2b$10$FIREBASE_USER_NO_PASSWORD_REQUIRED',
  'Tarek',
  '',
  'client',
  1,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  updated_at = NOW();
```

4. **Supprimez les utilisateurs non-Firebase** :

```sql
DELETE FROM users 
WHERE email IN ('client@a.com', 'client@blossom.com', 'manager@example.com')
AND email NOT LIKE '%@system.local'
AND email NOT LIKE '%@blossomcafe.local'
AND email NOT LIKE '%@blossom-cafe.local';
```

### Option 2 : Utiliser le script de synchronisation (nécessite clé service)

Si vous avez la **clé service** de Supabase (service_role key) :

1. **Créez un fichier `.env`** à la racine du projet :
```env
SUPABASE_SERVICE_KEY=votre_clé_service_ici
```

2. **Modifiez le script** `scripts/sync-emails-to-supabase.js` pour utiliser la clé service :
```javascript
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'votre_clé_service';
```

3. **Exécutez** : `npm run sync-emails`

### Option 3 : Laisser la synchronisation automatique faire le travail

La synchronisation automatique créera `tarek@test.com` lors de sa prochaine connexion. Pour accélérer :

1. **Connectez-vous avec `tarek@test.com`** dans l'application
2. L'utilisateur sera automatiquement créé dans Supabase

## 📊 Résultat attendu

Après synchronisation, Supabase devrait contenir :

- ✅ a@a.com (client)
- ✅ admin@blossom.com (admin)
- ✅ manager@blossom.com (manager)
- ✅ salaheddine.mokadem@gmail.com (client)
- ✅ tarek@test.com (client) - **NOUVEAU**
- ✅ guest@system.local (compte système)
- ✅ guest_marie_dupont@blossomcafe.local (compte système)
- ✅ kiosk-001@blossom-cafe.local (compte système)

**Utilisateurs supprimés :**
- ❌ client@a.com
- ❌ client@blossom.com
- ❌ manager@example.com

## 🔧 Améliorations apportées au code

### 1. `src/services/supabaseService.js`
- ✅ Stockage du `firebase_uid` lors de la synchronisation
- ✅ Détermination automatique du rôle selon l'email
- ✅ Préservation des rôles existants dans Supabase

### 2. `src/services/authServiceFirebase.js`
- ✅ Synchronisation automatique lors de la connexion
- ✅ Synchronisation automatique lors de l'inscription
- ✅ Récupération des données depuis Supabase

### 3. `src/App.jsx`
- ✅ Synchronisation automatique lors des changements d'état d'authentification
- ✅ Création automatique dans Supabase si l'utilisateur n'existe pas

## 📝 Notes importantes

- **Les comptes système** sont toujours préservés
- **Les rôles existants** dans Supabase sont préservés lors des mises à jour
- **La synchronisation est automatique** - pas besoin d'intervention manuelle pour les nouveaux utilisateurs
- **Le `firebase_uid`** est stocké pour référence croisée

