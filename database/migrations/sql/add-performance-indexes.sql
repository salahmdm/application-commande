-- ================================================================
-- INDEXES DE PERFORMANCE - OPTIMISATION
-- ================================================================
-- Ces indexes améliorent les performances des requêtes fréquentes
-- sans modifier le comportement de l'application
-- Sécurité : 100% sûrs, aucun impact négatif

-- Index composite pour order_items (fréquemment utilisé dans les jointures)
-- Améliore les requêtes avec JSON_ARRAYAGG sur order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_product 
ON order_items(order_id, product_id);

-- Index composite pour order_payments
-- Améliore les requêtes de récupération des paiements par commande
CREATE INDEX IF NOT EXISTS idx_order_payments_order_created 
ON order_payments(order_id, created_at);

-- Index pour améliorer les requêtes de recherche de commandes par statut et date
-- Utilisé dans /api/admin/orders avec ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

-- Index composite pour améliorer les requêtes avec user_id ET status
-- Utilisé dans /api/admin/users/:id/details et recherches de commandes utilisateur
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created 
ON orders(user_id, status, created_at DESC);

-- Index pour améliorer les jointures products-categories fréquentes
-- Déjà présent dans le schéma mais on s'assure qu'il existe
CREATE INDEX IF NOT EXISTS idx_products_category_available 
ON products(category_id, is_available);

-- Vérification des indexes créés
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME LIKE 'idx_%'
  AND TABLE_NAME IN ('orders', 'order_items', 'order_payments', 'products')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

