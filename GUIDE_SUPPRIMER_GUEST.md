# 🗑️ Guide : Supprimer l'utilisateur guest@system.local

## ⚠️ Problème

Vous ne pouvez pas supprimer l'utilisateur `guest@system.local` car il est référencé par des commandes dans la table `orders`.

**Erreur** : `Impossible de supprimer la ligne car elle est actuellement référencée par une contrainte de clé étrangère de la table orders`

## ✅ Solution rapide

### Option 1 : Script simple (Recommandé)

1. **Ouvrez Supabase SQL Editor**
2. **Exécutez le script** : `database/supprimer_guest_simple.sql`

Ce script fait tout automatiquement :
- ✅ Vérifie combien de commandes référencent cet utilisateur
- ✅ Met à jour toutes les commandes (met `user_id` à `NULL`)
- ✅ Supprime l'utilisateur

### Option 2 : Commandes manuelles

Si vous préférez exécuter les commandes une par une :

#### Étape 1 : Vérifier
```sql
SELECT COUNT(*) as total_orders
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');
```

#### Étape 2 : Mettre à jour les commandes
```sql
UPDATE orders
SET user_id = NULL
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');
```

#### Étape 3 : Vérifier qu'il n'y a plus de références
```sql
SELECT COUNT(*) as remaining_orders
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');
```
**Le résultat doit être `0`**

#### Étape 4 : Supprimer l'utilisateur
```sql
DELETE FROM users 
WHERE email = 'guest@system.local';
```

#### Étape 5 : Vérification finale
```sql
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'guest@system.local') 
        THEN '❌ L''utilisateur existe encore'
        ELSE '✅ L''utilisateur a été supprimé'
    END as status;
```

## 📋 Fichiers disponibles

- **`database/supprimer_guest_simple.sql`** : Script simple avec commandes séparées
- **`database/supprimer_guest_utilisateur.sql`** : Script automatique avec bloc DO $$
- **`database/cleanup_guest_system_user.sql`** : Script complet avec vérifications
- **`database/SUPPRIMER_GUEST_SYSTEM_USER.md`** : Documentation détaillée

## ⚠️ Important

- ✅ **Les commandes ne seront pas perdues** : Seule la référence à l'utilisateur sera supprimée
- ✅ **La colonne `user_id` doit être nullable** : Si ce n'est pas le cas, exécutez d'abord `database/migrate_orders_user_id_nullable.sql`
- ✅ **Sauvegardez votre base de données** avant d'exécuter les scripts

## 🔄 Après la suppression

Le système créera automatiquement un nouvel utilisateur système lors de la prochaine commande si nécessaire. Vous n'avez rien à faire.

## ❓ Questions fréquentes

**Q : Pourquoi cet utilisateur existe-t-il ?**  
R : Il est créé automatiquement pour les commandes des utilisateurs Firebase qui n'ont pas de compte dans Supabase.

**Q : Puis-je le supprimer sans perdre les commandes ?**  
R : Oui, les commandes seront conservées, seule la référence sera mise à `NULL`.

**Q : Que se passe-t-il après la suppression ?**  
R : Le système créera automatiquement un nouvel utilisateur système si nécessaire lors de la prochaine commande.

