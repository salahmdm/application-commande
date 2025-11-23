# 🔧 Élever un compte en administrateur

## Méthode 1 : Script Node.js (Recommandé)

### Étape 1 : Exécuter le script

Dans le terminal, à la racine du projet :

```bash
npm run update-user-role admin@blossom.com admin
```

Ou directement avec Node.js :

```bash
node scripts/update-user-role.js admin@blossom.com admin
```

### Étape 2 : Vérifier

1. Déconnectez-vous de l'application
2. Reconnectez-vous avec `admin@blossom.com`
3. Vous devriez maintenant avoir accès aux fonctionnalités admin

## Méthode 2 : Via Firebase Console (Manuel)

### Étape 1 : Ouvrir Firebase Console

1. Allez sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionnez votre projet : **prise-de-commande-pos**
3. Dans le menu de gauche, cliquez sur **"Firestore Database"**

### Étape 2 : Trouver l'utilisateur

1. Cliquez sur la collection **"users"**
2. Recherchez le document avec l'email `admin@blossom.com`
   - Si vous ne voyez pas l'email directement, cherchez par UID (l'ID du document)

### Étape 3 : Modifier le rôle

1. Cliquez sur le document de l'utilisateur
2. Trouvez le champ **"role"**
3. Modifiez la valeur de `"client"` (ou autre) à `"admin"`
4. Cliquez sur **"Update"**

### Étape 4 : Vérifier

1. Déconnectez-vous de l'application
2. Reconnectez-vous avec `admin@blossom.com`
3. Vous devriez maintenant avoir accès aux fonctionnalités admin

## Méthode 3 : Via Supabase (si l'utilisateur est dans Supabase)

Si l'utilisateur existe dans la table `users` de Supabase (et non dans Firebase) :

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur **"Table Editor"** dans le menu de gauche

### Étape 2 : Trouver et modifier l'utilisateur

1. Cliquez sur la table **"users"**
2. Recherchez l'utilisateur avec l'email `admin@blossom.com`
3. Cliquez sur la ligne pour l'éditer
4. Modifiez le champ **"role"** de `client` à `admin`
5. Cliquez sur **"Save"**

### Alternative : SQL direct

Dans **SQL Editor**, exécutez :

```sql
UPDATE "users" 
SET "role" = 'admin', 
    "updated_at" = CURRENT_TIMESTAMP
WHERE "email" = 'admin@blossom.com';
```

## Vérification

Après avoir mis à jour le rôle, vérifiez que ça fonctionne :

1. **Déconnectez-vous** complètement de l'application
2. **Reconnectez-vous** avec `admin@blossom.com`
3. Vous devriez voir :
   - Le menu admin dans la sidebar
   - L'accès au dashboard admin
   - L'accès à la gestion des comptes
   - L'accès aux paramètres admin

## Rôles disponibles

- `client` : Utilisateur standard
- `manager` : Gestionnaire (accès POS, commandes)
- `admin` : Administrateur (accès complet)
- `kiosk` : Borne tactile (accès limité)

## Note importante

⚠️ **Firebase vs Supabase** :
- Si vous utilisez **Firebase Authentication**, l'utilisateur est dans **Firestore** (collection `users`)
- Si vous utilisez **Supabase Auth**, l'utilisateur est dans la table **Supabase** (`users`)

L'application utilise actuellement **Firebase Authentication**, donc utilisez la **Méthode 1** (script) ou **Méthode 2** (Firebase Console).

