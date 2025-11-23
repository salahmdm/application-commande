-- ============================================================================
-- NETTOYAGE : Supprimer la table "catégories" (doublon)
-- ============================================================================
-- Cette table semble être un doublon de "categories" (sans accent)
-- Elle n'a pas de contraintes ni de clé primaire, donc probablement vide
-- ============================================================================

-- ÉTAPE 1 : Vérifier si la table contient des données
-- ============================================================================
SELECT 
  COUNT(*) as row_count,
  'catégories' as table_name
FROM "catégories";

-- ÉTAPE 2 : Vérifier les colonnes de la table
-- ============================================================================
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'catégories'
ORDER BY ordinal_position;

-- ÉTAPE 3 : Supprimer la table si elle est vide (optionnel)
-- ============================================================================
-- ⚠️ DÉCOMMENTEZ CETTE LIGNE SEULEMENT SI VOUS ÊTES SÛR QUE LA TABLE EST VIDE
-- DROP TABLE IF EXISTS "catégories";

-- ============================================================================
-- NOTE IMPORTANTE
-- ============================================================================
-- Si la table "catégories" contient des données importantes, NE PAS la supprimer.
-- Dans ce cas, vous devrez peut-être migrer les données vers "categories" avant.
-- ============================================================================


