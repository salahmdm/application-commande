-- ================================================================
-- DIAGNOSTIC PRODUITS ET CATÉGORIES
-- Vérification complète de la configuration
-- ================================================================

USE blossom_cafe;

-- 1. AFFICHER TOUTES LES CATÉGORIES
SELECT '========== CATÉGORIES ==========' AS '';
SELECT 
    id,
    name AS 'Nom',
    slug AS 'Slug',
    IF(is_active = 1, '✓ Actif', '✗ Inactif') AS 'Statut',
    display_order AS 'Ordre'
FROM categories
ORDER BY display_order;

-- Compter les catégories
SELECT COUNT(*) AS 'Total Catégories' FROM categories;
SELECT COUNT(*) AS 'Catégories Actives' FROM categories WHERE is_active = 1;

-- 2. AFFICHER TOUS LES PRODUITS AVEC LEURS CATÉGORIES
SELECT '========== PRODUITS ==========' AS '';
SELECT 
    p.id AS 'ID',
    p.name AS 'Nom Produit',
    p.category_id AS 'Cat_ID',
    c.name AS 'Nom Catégorie',
    IF(p.is_available = 1, '✓ Dispo', '✗ Indispo') AS 'Statut',
    IF(p.deleted_at IS NULL, 'Actif', 'Supprimé') AS 'État'
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.deleted_at IS NULL DESC, p.id;

-- Compter les produits
SELECT 
    COUNT(*) AS 'Total Produits',
    SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS 'Produits Actifs',
    SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS 'Produits Supprimés',
    SUM(CASE WHEN is_available = 1 AND deleted_at IS NULL THEN 1 ELSE 0 END) AS 'Produits Disponibles',
    SUM(CASE WHEN category_id IS NULL AND deleted_at IS NULL THEN 1 ELSE 0 END) AS 'Sans Catégorie'
FROM products;

-- 3. PRODUITS VISIBLES EN PRISE DE COMMANDE
SELECT '========== PRODUITS VISIBLES EN PRISE DE COMMANDE ==========' AS '';
SELECT 
    p.id,
    p.name AS 'Produit',
    c.name AS 'Catégorie',
    c.slug AS 'Slug Catégorie',
    p.price AS 'Prix'
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_available = TRUE 
  AND p.deleted_at IS NULL
ORDER BY c.display_order, p.name;

-- 4. VÉRIFIER LES DOUBLONS DE CATÉGORIES
SELECT '========== VÉRIFICATION DOUBLONS ==========' AS '';
SELECT 
    name AS 'Nom Catégorie',
    COUNT(*) AS 'Nombre'
FROM categories
GROUP BY name
HAVING COUNT(*) > 1;

-- Si aucun doublon
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ Aucun doublon de nom de catégorie'
        ELSE CONCAT('⚠ ', COUNT(*), ' doublons trouvés')
    END AS 'Résultat Doublons Noms'
FROM (
    SELECT name
    FROM categories
    GROUP BY name
    HAVING COUNT(*) > 1
) AS duplicates;

-- Vérifier doublons de slug
SELECT 
    slug AS 'Slug Catégorie',
    COUNT(*) AS 'Nombre'
FROM categories
GROUP BY slug
HAVING COUNT(*) > 1;

-- 5. VÉRIFIER LES RÉFÉRENCES INVALIDES
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

-- Résumé des références
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ Toutes les références sont valides'
        ELSE CONCAT('⚠ ', COUNT(*), ' produits avec category_id invalide')
    END AS 'Résultat Références'
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NOT NULL 
  AND c.id IS NULL
  AND p.deleted_at IS NULL;

-- 6. DISTRIBUTION DES PRODUITS PAR CATÉGORIE
SELECT '========== DISTRIBUTION PAR CATÉGORIE ==========' AS '';
SELECT 
    COALESCE(c.name, '⚠ SANS CATÉGORIE') AS 'Catégorie',
    COUNT(p.id) AS 'Nombre de Produits'
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.deleted_at IS NULL
GROUP BY c.name
ORDER BY COUNT(p.id) DESC;

-- 7. VÉRIFIER LA STRUCTURE DES TABLES
SELECT '========== STRUCTURE TABLE PRODUCTS ==========' AS '';
DESCRIBE products;

SELECT '========== STRUCTURE TABLE CATEGORIES ==========' AS '';
DESCRIBE categories;

SELECT '========== FIN DU DIAGNOSTIC ==========' AS '';

