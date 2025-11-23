-- ================================================================
-- Script pour supprimer l'utilisateur guest@system.local
-- ================================================================
-- 
-- Ce script :
-- 1. Vérifie combien de commandes référencent cet utilisateur
-- 2. Met à jour toutes les commandes pour mettre user_id à NULL
-- 3. Supprime l'utilisateur
--
-- ⚠️ ATTENTION : Exécutez ce script dans Supabase SQL Editor
-- ================================================================

-- Étape 1 : Vérifier l'ID de l'utilisateur et le nombre de commandes
DO $$
DECLARE
    guest_user_id INTEGER;
    orders_count INTEGER;
BEGIN
    -- Récupérer l'ID de l'utilisateur guest
    SELECT id INTO guest_user_id
    FROM users
    WHERE email = 'guest@system.local';
    
    IF guest_user_id IS NULL THEN
        RAISE NOTICE '❌ Utilisateur guest@system.local non trouvé';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Utilisateur trouvé avec ID: %', guest_user_id;
    
    -- Compter les commandes qui référencent cet utilisateur
    SELECT COUNT(*) INTO orders_count
    FROM orders
    WHERE user_id = guest_user_id;
    
    RAISE NOTICE '📊 Nombre de commandes référençant cet utilisateur: %', orders_count;
    
    -- Étape 2 : Mettre à jour toutes les commandes pour mettre user_id à NULL
    IF orders_count > 0 THEN
        UPDATE orders
        SET user_id = NULL
        WHERE user_id = guest_user_id;
        
        RAISE NOTICE '✅ % commande(s) mise(s) à jour (user_id = NULL)', orders_count;
    ELSE
        RAISE NOTICE 'ℹ️ Aucune commande à mettre à jour';
    END IF;
    
    -- Étape 3 : Vérifier qu'il n'y a plus de commandes référençant cet utilisateur
    SELECT COUNT(*) INTO orders_count
    FROM orders
    WHERE user_id = guest_user_id;
    
    IF orders_count > 0 THEN
        RAISE EXCEPTION '❌ Erreur : Il reste % commande(s) référençant cet utilisateur. La colonne user_id n''est peut-être pas nullable.', orders_count;
    END IF;
    
    -- Étape 4 : Supprimer l'utilisateur
    DELETE FROM users
    WHERE id = guest_user_id;
    
    RAISE NOTICE '✅ Utilisateur guest@system.local supprimé avec succès';
    
END $$;

-- Vérification finale
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'guest@system.local') 
        THEN '❌ L''utilisateur existe encore'
        ELSE '✅ L''utilisateur a été supprimé'
    END as status;

