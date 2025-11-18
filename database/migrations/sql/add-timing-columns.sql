-- ================================================================
-- Script pour ajouter les colonnes de temps de prise en charge et préparation
-- ================================================================

-- Ajouter la colonne pour le timestamp de prise en charge
-- (quand la commande passe de "pending" à "preparing")
ALTER TABLE orders 
ADD COLUMN taken_at TIMESTAMP NULL COMMENT 'Timestamp de prise en charge (passage à preparing)';

-- Ajouter la colonne pour le timestamp de préparation terminée
-- (quand la commande passe de "preparing" à "served")
ALTER TABLE orders 
ADD COLUMN prepared_at TIMESTAMP NULL COMMENT 'Timestamp de fin de préparation (passage à served)';

-- Ajouter des index pour améliorer les performances des requêtes
CREATE INDEX idx_taken_at ON orders(taken_at);
CREATE INDEX idx_prepared_at ON orders(prepared_at);

-- Vérifier la structure
DESCRIBE orders;

