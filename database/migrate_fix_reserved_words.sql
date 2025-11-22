-- ============================================================================
-- MIGRATION : Correction des mots réservés PostgreSQL
-- ============================================================================
-- Problème : "ORDER" est un mot réservé en SQL
-- Solution : Renommer la colonne "order" en "display_order" dans la table "news"
-- ============================================================================

-- ÉTAPE 1 : Vérifier si la colonne "order" existe et la renommer
-- ============================================================================

-- Méthode 1 : Renommer directement (échouera silencieusement si la colonne n'existe pas)
-- Si la colonne "order" existe, elle sera renommée en "display_order"
-- Si elle n'existe pas, l'erreur sera ignorée (vous pouvez vérifier manuellement)

-- Renommer la colonne "order" en "display_order" dans la table "news"
-- ⚠️ Cette commande échouera si la colonne "order" n'existe pas
-- Dans ce cas, vérifiez que la colonne "display_order" existe déjà
ALTER TABLE "news" RENAME COLUMN "order" TO "display_order";

-- ============================================================================
-- ÉTAPE 2 : Vérifier que la table "orders" utilise des guillemets (déjà fait)
-- ============================================================================

-- La table "orders" est déjà créée avec des guillemets doubles dans le schéma
-- PostgreSQL/Supabase gère automatiquement l'échappement pour les requêtes via PostgREST
-- Le code JavaScript utilise déjà .from('orders') qui est correct

-- ============================================================================
-- ÉTAPE 3 : Vérifier les contraintes CHECK qui utilisent 'order' comme valeur
-- ============================================================================

-- La contrainte CHECK pour notifications.type utilise 'order' comme valeur ENUM
-- Ceci est correct car c'est une valeur, pas un identifiant
-- Pas besoin de modification

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. PostgreSQL est sensible à la casse pour les identifiants entre guillemets
-- 2. Les guillemets doubles permettent d'utiliser des mots réservés comme noms
-- 3. Dans Supabase/PostgREST, les noms de tables sont automatiquement échappés
-- 4. Le code JavaScript doit utiliser les noms exacts : 'orders' (sans guillemets dans JS)
-- 5. La colonne "order" dans "news" a été renommée en "display_order" pour éviter les conflits
-- ============================================================================

-- ============================================================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================================================

-- Vérifier que la colonne a bien été renommée
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'news'
  AND column_name IN ('order', 'display_order')
ORDER BY column_name;

-- ============================================================================
-- NOTE IMPORTANTE
-- ============================================================================
-- Si cette commande échoue avec "column 'order' does not exist", cela signifie
-- que la colonne a déjà été renommée ou n'existe pas.
-- 
-- Dans ce cas, utilisez le script migrate_fix_reserved_words_safe.sql
-- qui vérifie l'existence de la colonne avant de la renommer.
-- ============================================================================

