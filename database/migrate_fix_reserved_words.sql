-- ============================================================================
-- MIGRATION : Correction des mots réservés PostgreSQL
-- ============================================================================
-- Problème : "ORDER" est un mot réservé en SQL
-- Solution : Renommer la colonne "order" en "display_order" dans la table "news"
-- ============================================================================

-- ÉTAPE 1 : Renommer la colonne "order" en "display_order" dans la table "news"
-- ============================================================================

DO $$
BEGIN
  -- Vérifier si la colonne "order" existe et la renommer
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'news' 
    AND column_name = 'order'
  ) THEN
    -- Renommer la colonne
    ALTER TABLE "news" RENAME COLUMN "order" TO "display_order";
    RAISE NOTICE '✅ Colonne "order" renommée en "display_order" dans la table "news"';
  ELSE
    -- Vérifier si la colonne "display_order" existe déjà
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'news' 
      AND column_name = 'display_order'
    ) THEN
      RAISE NOTICE 'ℹ️ Colonne "display_order" existe déjà dans la table "news"';
    ELSE
      RAISE NOTICE '⚠️ Colonne "order" n''existe pas dans la table "news"';
    END IF;
  END IF;
END $$;

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

