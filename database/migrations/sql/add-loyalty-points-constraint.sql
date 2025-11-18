-- ================================================================
-- MIGRATION: S'assurer que loyalty_points >= 0
-- ================================================================

USE blossom_cafe;

-- Mettre à jour tous les points négatifs à 0 (si il y en a)
UPDATE users SET loyalty_points = 0 WHERE loyalty_points < 0;

-- Pour MySQL 5.7 et versions antérieures, on ne peut pas utiliser CHECK
-- On utilisera plutôt un trigger pour empêcher les valeurs négatives
-- Si MySQL 8.0+, on peut ajouter une contrainte CHECK

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_check_loyalty_points_before_update;

-- Créer un trigger pour empêcher les points négatifs
DELIMITER //
CREATE TRIGGER trg_check_loyalty_points_before_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    -- S'assurer que loyalty_points n'est jamais négatif
    IF NEW.loyalty_points < 0 THEN
        SET NEW.loyalty_points = 0;
    END IF;
END//
DELIMITER ;

-- Créer un trigger pour empêcher les points négatifs lors de l'insertion
DROP TRIGGER IF EXISTS trg_check_loyalty_points_before_insert;

DELIMITER //
CREATE TRIGGER trg_check_loyalty_points_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    -- S'assurer que loyalty_points n'est jamais négatif
    IF NEW.loyalty_points < 0 THEN
        SET NEW.loyalty_points = 0;
    END IF;
END//
DELIMITER ;

-- Vérification
SELECT 'Migration terminée: Triggers pour loyalty_points >= 0 ajoutés' AS result;
