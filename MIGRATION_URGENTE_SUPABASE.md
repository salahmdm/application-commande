# ⚠️ MIGRATION URGENTE - À EXÉCUTER MAINTENANT

## 🚨 Problème actuel

L'application ne peut pas créer de commandes car la table `orders` dans Supabase a une contrainte `NOT NULL` sur `user_id`.

## ✅ Solution : Exécuter cette migration SQL

### Étape 1 : Ouvrir Supabase

1. Allez sur : **https://supabase.com/dashboard**
2. Connectez-vous
3. **Sélectionnez votre projet** (celui avec l'URL `brygzpxiemwthickhuqb.supabase.co`)

### Étape 2 : Ouvrir SQL Editor

1. Dans le menu de gauche, cliquez sur **"SQL Editor"** (icône avec `</>`)
2. Cliquez sur le bouton **"New query"** en haut à droite

### Étape 3 : Copier-coller ce script

**Copiez TOUT ce script et collez-le dans l'éditeur :**

```sql
-- ============================================================================
-- MIGRATION URGENTE : Permettre user_id NULL dans orders
-- ============================================================================
-- Cette commande permet de créer des commandes pour Firebase et invités
-- ============================================================================

ALTER TABLE "orders" 
  ALTER COLUMN "user_id" DROP NOT NULL;
```

### Étape 4 : Exécuter

1. Cliquez sur le bouton **"Run"** (ou appuyez sur `Ctrl+Enter`)
2. Attendez le message de succès : **"Success. No rows returned"**

### Étape 5 : Vérifier (optionnel)

Pour vérifier que ça a fonctionné, exécutez cette requête :

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name = 'user_id';
```

**Résultat attendu :** `is_nullable` doit être `'YES'`

## ✅ Après la migration

Une fois la migration exécutée :
- ✅ Les commandes pourront être créées avec `user_id = NULL`
- ✅ L'erreur ne devrait plus apparaître
- ✅ L'application fonctionnera normalement

## 📝 Note

Cette migration est **sûre** et **réversible**. Elle ne supprime aucune donnée, elle permet simplement d'avoir des valeurs NULL dans `user_id` pour les utilisateurs Firebase et les invités.

---

**⏱️ Temps estimé : 30 secondes**

