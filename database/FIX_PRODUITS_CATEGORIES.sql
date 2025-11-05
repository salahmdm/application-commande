-- ================================================================
-- CORRECTION PRODUITS ET CATÉGORIES
-- Script pour réparer les problèmes courants
-- ================================================================

USE blossom_cafe;

-- AVANT DE COMMENCER : AFFICHER L'ÉTAT ACTUEL
SELECT '========== ÉTAT AVANT CORRECTION ==========' AS '';
SELECT 
    COUNT(*) AS 'Total Produits',
    SUM(CASE WHEN category_id IS NULL AND deleted_at IS NULL THEN 1 ELSE 0 END) AS 'Produits Sans Catégorie',
    SUM(CASE WHEN is_available = 1 AND deleted_at IS NULL THEN 1 ELSE 0 END) AS 'Produits Disponibles'
FROM products;

-- 1. VÉRIFIER ET ACTIVER LES CATÉGORIES PRINCIPALES
SELECT '========== ACTIVATION DES CATÉGORIES ==========' AS '';
UPDATE categories 
SET is_active = 1 
WHERE name IN ('Boissons Chaudes', 'Boissons Froides', 'Délices Salés', 'Délices Sucrés');

SELECT 
    name AS 'Catégorie',
    IF(is_active = 1, '✓ Activée', '✗ Désactivée') AS 'Statut'
FROM categories
ORDER BY display_order;

-- 2. CORRIGER LES PRODUITS SANS CATÉGORIE (les assigner à une catégorie par défaut)
-- D'abord, identifier les produits sans catégorie
SELECT '========== PRODUITS SANS CATÉGORIE ==========' AS '';
SELECT 
    id,
    name AS 'Produit Sans Catégorie'
FROM products
WHERE category_id IS NULL 
  AND deleted_at IS NULL;

-- Assigner une catégorie par défaut (ID 1 = Boissons Chaudes généralement)
-- NOTE: Commentez cette ligne si vous ne voulez pas l'exécuter automatiquement
-- UPDATE products 
-- SET category_id = 1 
-- WHERE category_id IS NULL AND deleted_at IS NULL;

-- 3. CORRIGER LES RÉFÉRENCES INVALIDES
-- Produits qui pointent vers des catégories inexistantes
SELECT '========== RÉFÉRENCES INVALIDES ==========' AS '';
SELECT 
    p.id,
    p.name AS 'Produit',
    p.category_id AS 'Category_ID Invalide'
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NOT NULL 
  AND c.id IS NULL
  AND p.deleted_at IS NULL;

-- Corriger en assignant à la catégorie 1 (Boissons Chaudes)
-- NOTE: Commentez cette ligne si vous ne voulez pas l'exécuter automatiquement
-- UPDATE products p
-- LEFT JOIN categories c ON p.category_id = c.id
-- SET p.category_id = 1
-- WHERE p.category_id IS NOT NULL 
--   AND c.id IS NULL
--   AND p.deleted_at IS NULL;

-- 4. VÉRIFIER L'ORDRE D'AFFICHAGE DES CATÉGORIES
SELECT '========== ORDRE DES CATÉGORIES ==========' AS '';
SELECT 
    id,
    name AS 'Catégorie',
    display_order AS 'Ordre',
    IF(is_active = 1, '✓', '✗') AS 'Actif'
FROM categories
ORDER BY display_order;

-- Corriger l'ordre si nécessaire
UPDATE categories SET display_order = 1 WHERE name = 'Boissons Chaudes';
UPDATE categories SET display_order = 2 WHERE name = 'Boissons Froides';
UPDATE categories SET display_order = 3 WHERE name = 'Délices Salés';
UPDATE categories SET display_order = 4 WHERE name = 'Délices Sucrés';

-- 5. ÉTAT APRÈS CORRECTION
SELECT '========== ÉTAT APRÈS CORRECTION ==========' AS '';
SELECT 
    COUNT(*) AS 'Total Produits Actifs',
    SUM(CASE WHEN category_id IS NULL THEN 1 ELSE 0 END) AS 'Sans Catégorie',
    SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) AS 'Disponibles'
FROM products
WHERE deleted_at IS NULL;

-- 6. AFFICHER LES PRODUITS PAR CATÉGORIE (CE QUE VERRA LA PRISE DE COMMANDE)
SELECT '========== PRODUITS VISIBLES PAR CATÉGORIE ==========' AS '';
SELECT 
    c.name AS 'Catégorie',
    p.name AS 'Produit',
    p.price AS 'Prix €'
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_available = TRUE 
  AND p.deleted_at IS NULL
ORDER BY c.display_order, p.name;

SELECT '========== FIN DES CORRECTIONS ==========' AS '';

