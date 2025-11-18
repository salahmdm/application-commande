-- Script pour supprimer toutes les commandes et leurs données associées
-- ⚠️ ATTENTION : Cette opération est irréversible !

-- Désactiver temporairement les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Supprimer tous les items des commandes
DELETE FROM order_items;

-- 2. Supprimer tous les paiements des commandes
DELETE FROM order_payments;

-- 3. Supprimer toutes les commandes
DELETE FROM orders;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Vérifier que tout a été supprimé
SELECT 
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM order_items) as total_order_items,
    (SELECT COUNT(*) FROM order_payments) as total_order_payments;

