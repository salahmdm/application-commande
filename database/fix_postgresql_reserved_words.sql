-- ============================================================================
-- CORRECTION : Mots réservés PostgreSQL
-- ============================================================================
-- Ce script corrige les problèmes liés aux mots réservés SQL dans PostgreSQL
-- Problème : "ORDER" est un mot réservé en SQL
-- Solution : Utiliser des guillemets doubles pour échapper les identifiants
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Vérifier et corriger la colonne "order" dans la table "news"
-- ============================================================================

-- Vérifier si la colonne existe
DO $$
BEGIN
  -- Si la colonne "order" existe, la renommer en "display_order" pour éviter les conflits
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'news' 
    AND column_name = 'order'
  ) THEN
    -- Renommer la colonne
    ALTER TABLE "news" RENAME COLUMN "order" TO "display_order";
    RAISE NOTICE 'Colonne "order" renommée en "display_order" dans la table "news"';
  ELSE
    RAISE NOTICE 'Colonne "order" n''existe pas dans la table "news"';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : S'assurer que toutes les tables utilisent des guillemets
-- ============================================================================

-- Les tables sont déjà créées avec des guillemets doubles dans le schéma
-- Cette étape est juste pour information

-- ============================================================================
-- ÉTAPE 3 : Créer des vues ou alias si nécessaire (optionnel)
-- ============================================================================

-- Si vous voulez créer un alias pour la table orders (non recommandé, mais possible)
-- CREATE VIEW "customer_orders" AS SELECT * FROM "orders";

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. PostgreSQL est sensible à la casse pour les identifiants entre guillemets
-- 2. Les guillemets doubles permettent d'utiliser des mots réservés comme noms
-- 3. Dans Supabase/PostgREST, les noms de tables sont automatiquement échappés
-- 4. Le code JavaScript doit utiliser les noms exacts : 'orders' (sans guillemets dans JS)
-- ============================================================================



