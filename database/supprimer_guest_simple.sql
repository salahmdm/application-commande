-- ================================================================
-- Script SIMPLE pour supprimer l'utilisateur guest@system.local
-- ================================================================
-- 
-- ⚠️ Exécutez ces commandes UNE PAR UNE dans Supabase SQL Editor
-- ================================================================

-- ÉTAPE 1 : Vérifier combien de commandes référencent cet utilisateur
SELECT 
    COUNT(*) as total_orders
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');

-- ÉTAPE 2 : Voir quelques commandes concernées (optionnel)
SELECT 
    id,
    order_number,
    order_type,
    status,
    total_amount,
    created_at
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local')
ORDER BY created_at DESC
LIMIT 5;

-- ÉTAPE 3 : Mettre à jour toutes les commandes (mettre user_id à NULL)
UPDATE orders
SET user_id = NULL
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');

-- ÉTAPE 4 : Vérifier qu'il n'y a plus de commandes référençant cet utilisateur
-- Le résultat doit être 0
SELECT 
    COUNT(*) as remaining_orders
FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = 'guest@system.local');

-- ÉTAPE 5 : Supprimer l'utilisateur (uniquement si l'étape 4 retourne 0)
DELETE FROM users 
WHERE email = 'guest@system.local';

-- ÉTAPE 6 : Vérification finale
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'guest@system.local') 
        THEN '❌ L''utilisateur existe encore'
        ELSE '✅ L''utilisateur a été supprimé'
    END as status;

