-- ============================================================================
-- VÉRIFICATION : État de la table "news" et de ses colonnes
-- ============================================================================
-- Ce script vérifie l'état actuel de la table news et de ses colonnes
-- ============================================================================

-- 1. Vérifier si la table "news" existe
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'news';

-- 2. Lister toutes les colonnes de la table "news"
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'news'
ORDER BY ordinal_position;

-- 3. Vérifier spécifiquement les colonnes "order" et "display_order"
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'news'
  AND column_name IN ('order', 'display_order')
ORDER BY column_name;

-- 4. Si la table existe, afficher un exemple de données
SELECT 
  id,
  title,
  "order" as old_order_column,
  display_order,
  is_active
FROM "news"
LIMIT 5;



