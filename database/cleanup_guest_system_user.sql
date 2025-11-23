-- ================================================================
-- Script de nettoyage pour supprimer l'utilisateur système guest
-- ================================================================
-- 
-- Ce script permet de supprimer l'utilisateur guest@system.local
-- en mettant à jour toutes les commandes qui le référencent.
--
-- ⚠️ ATTENTION : Ce script modifie les données de la table orders
-- ================================================================

-- 1. Vérifier combien de commandes référencent cet utilisateur
SELECT 
    COUNT(*) as total_orders,
    COUNT(DISTINCT user_id) as unique_users
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');

-- 2. Afficher les commandes concernées (optionnel, pour vérification)
SELECT 
    o.id,
    o.order_number,
    o.order_type,
    o.status,
    o.total_amount,
    o.created_at,
    u.email as user_email
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.user_id = (SELECT id FROM users WHERE email = 'guest@system.local')
ORDER BY o.created_at DESC
LIMIT 10;

-- 3. Mettre à jour toutes les commandes pour mettre user_id à NULL
--    (Cela fonctionne seulement si la colonne user_id est nullable)
UPDATE orders
SET user_id = NULL
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');

-- 4. Vérifier que toutes les commandes ont été mises à jour
SELECT 
    COUNT(*) as remaining_orders
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');

-- 5. Si le résultat est 0, vous pouvez maintenant supprimer l'utilisateur
-- DELETE FROM users WHERE email = 'guest@system.local';

-- ================================================================
-- ALTERNATIVE : Si user_id ne peut pas être NULL
-- ================================================================
-- Si la colonne user_id a une contrainte NOT NULL, vous devez :
-- 1. Soit créer un autre utilisateur système
-- 2. Soit transférer les commandes vers un autre utilisateur
--
-- Exemple : Transférer vers un autre utilisateur système
-- UPDATE orders
-- SET user_id = (SELECT id FROM users WHERE email = 'system@blossom.local' LIMIT 1)
-- WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');
-- ================================================================

