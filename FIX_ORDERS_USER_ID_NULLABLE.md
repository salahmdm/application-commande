# 🔧 Correction : Permettre user_id NULL dans la table orders

## Problème

L'erreur `null value in column "user_id" of relation "orders" violates not-null constraint` indique que la table `orders` dans Supabase a une contrainte `NOT NULL` sur la colonne `user_id`, ce qui empêche de créer des commandes pour les utilisateurs Firebase.

## Solution

Il faut modifier la table `orders` dans Supabase pour permettre `user_id` à `NULL`.

## Étapes à suivre

### 1. Ouvrir Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet

### 2. Ouvrir le SQL Editor

1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"**

### 3. Exécuter la migration

Copiez et collez le script suivant dans l'éditeur SQL :

```sql
-- Migration : Permettre user_id NULL dans la table orders
ALTER TABLE "orders" 
  ALTER COLUMN "user_id" DROP NOT NULL;
```

### 4. Exécuter le script

1. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)
2. Vérifiez que le message de succès s'affiche

### 5. Vérification

Pour vérifier que la migration a réussi, exécutez cette requête :

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name = 'user_id';
```

Vous devriez voir `is_nullable = 'YES'`.

## Alternative : Script complet

Si vous préférez, vous pouvez utiliser le script complet dans `database/migrate_orders_user_id_nullable.sql`.

## Après la migration

Une fois la migration exécutée, les commandes pourront être créées avec `user_id = NULL` pour :
- ✅ Les utilisateurs Firebase (UID stocké dans les notes)
- ✅ Les invités (nom stocké dans les notes)
- ✅ Les commandes depuis le kiosk

L'application fonctionnera correctement sans erreur de contrainte.

## Note importante

La contrainte de clé étrangère (`FOREIGN KEY`) vers la table `users` reste active, mais elle permet déjà les valeurs NULL par défaut dans PostgreSQL. Vous n'avez donc pas besoin de la modifier.

