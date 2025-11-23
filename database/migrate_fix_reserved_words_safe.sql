-- ============================================================================
-- MIGRATION SÉCURISÉE : Correction des mots réservés PostgreSQL
-- ============================================================================
-- Problème : "ORDER" est un mot réservé en SQL
-- Solution : Renommer la colonne "order" en "display_order" dans la table "news"
-- ============================================================================
-- Cette version utilise un bloc DO avec syntaxe PL/pgSQL correcte
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
    EXECUTE 'ALTER TABLE "news" RENAME COLUMN "order" TO "display_order"';
    RAISE NOTICE '✅ Colonne "order" renommée en "display_order" dans la table "news"';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'news' 
    AND column_name = 'display_order'
  ) THEN
    RAISE NOTICE 'ℹ️ Colonne "display_order" existe déjà dans la table "news" - Aucune action nécessaire';
  ELSE
    RAISE NOTICE '⚠️ Aucune colonne "order" ou "display_order" trouvée dans la table "news"';
  END IF;
END $$;

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



