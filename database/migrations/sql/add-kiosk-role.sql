-- ================================================================
-- MIGRATION: Ajout du rôle 'kiosk' pour les bornes physiques
-- ================================================================
-- Date: 2025-01-XX
-- Description: Ajoute le rôle 'kiosk' à l'ENUM users.role pour permettre
--              l'authentification des bornes tactiles en restaurant
-- ================================================================

USE blossom_cafe;

-- Modifier l'ENUM pour inclure 'kiosk'
ALTER TABLE users 
MODIFY COLUMN role ENUM('client', 'manager', 'admin', 'kiosk') NOT NULL DEFAULT 'client';

-- ✅ Migration terminée
SELECT 'Migration add-kiosk-role terminée avec succès' AS status;

