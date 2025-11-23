# 🗑️ Supprimer l'utilisateur système guest@system.local

## ⚠️ Problème

L'utilisateur `guest@system.local` ne peut pas être supprimé car il est référencé par des commandes dans la table `orders` via une contrainte de clé étrangère.

## 🔍 Vérification

Avant de supprimer, vérifiez combien de commandes référencent cet utilisateur :

```sql
SELECT 
    COUNT(*) as total_orders
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');
```

## ✅ Solution 1 : Mettre user_id à NULL (Recommandé)

Si la colonne `user_id` dans la table `orders` est **nullable** (ce qui devrait être le cas), vous pouvez mettre à jour toutes les commandes pour mettre `user_id` à `NULL` :

### Étape 1 : Mettre à jour les commandes

```sql
UPDATE orders
SET user_id = NULL
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');
```

### Étape 2 : Vérifier que toutes les commandes ont été mises à jour

```sql
SELECT 
    COUNT(*) as remaining_orders
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');
```

Si le résultat est `0`, vous pouvez passer à l'étape 3.

### Étape 3 : Supprimer l'utilisateur

```sql
DELETE FROM users WHERE email = 'guest@system.local';
```

## ✅ Solution 2 : Si user_id ne peut pas être NULL

Si la colonne `user_id` a une contrainte `NOT NULL`, vous devez créer un autre utilisateur système et transférer les commandes :

### Étape 1 : Créer un nouvel utilisateur système

```sql
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'system@blossom.local',
    '$2b$10$SYSTEM_USER_NO_LOGIN_ALLOWED',
    'Système',
    'Blossom',
    'client',
    0, -- Désactivé
    NOW(),
    NOW()
) RETURNING id;
```

### Étape 2 : Transférer les commandes vers le nouvel utilisateur

```sql
UPDATE orders
SET user_id = (SELECT id FROM users WHERE email = 'system@blossom.local' LIMIT 1)
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');
```

### Étape 3 : Supprimer l'ancien utilisateur

```sql
DELETE FROM users WHERE email = 'guest@system.local';
```

## 📋 Script complet

Un script SQL complet est disponible dans `database/cleanup_guest_system_user.sql` qui effectue toutes ces étapes automatiquement.

## 🔄 Après la suppression

Après avoir supprimé l'utilisateur `guest@system.local`, le système créera automatiquement un nouvel utilisateur système lors de la prochaine commande si nécessaire (voir `src/services/supabaseService.js` → `createOrder()`).

## ⚠️ Important

- **Sauvegardez votre base de données** avant d'exécuter ces scripts
- **Testez d'abord** sur une base de données de développement
- Les commandes existantes **ne seront pas perdues**, seulement leur référence à l'utilisateur système

