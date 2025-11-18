-- ================================================================
-- TABLE: loyalty_rewards - Récompenses du programme de fidélité
-- ================================================================

USE blossom_cafe;

-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS loyalty_rewards;

CREATE TABLE loyalty_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT 'Nom de la récompense',
    description TEXT COMMENT 'Description détaillée de la récompense',
    points_required INT NOT NULL DEFAULT 0 COMMENT 'Points nécessaires pour débloquer',
    reward_type ENUM('percentage', 'product', 'fixed') NOT NULL DEFAULT 'percentage' COMMENT 'Type de récompense: percentage (réduction %), product (produit offert), fixed (réduction fixe)',
    discount_value DECIMAL(10, 2) DEFAULT 0 COMMENT 'Valeur de la réduction (pourcentage ou montant fixe selon le type)',
    product_id INT NULL COMMENT 'ID du produit offert (si reward_type = product)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Activer/désactiver la récompense',
    sort_order INT DEFAULT 0 COMMENT 'Ordre d''affichage',
    icon VARCHAR(50) DEFAULT '🎁' COMMENT 'Icône/emoji pour la récompense',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_points_required (points_required),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- INSERTION DE DONNÉES PAR DÉFAUT (OPTIONNEL)
-- ================================================================

-- Exemple de récompenses par défaut
INSERT INTO loyalty_rewards (name, description, points_required, reward_type, discount_value, is_active, sort_order, icon) VALUES
('Réduction 5%', 'Obtenez une réduction de 5% sur votre commande', 50, 'percentage', 5.00, TRUE, 1, '🎁'),
('Réduction 10%', 'Obtenez une réduction de 10% sur votre commande', 100, 'percentage', 10.00, TRUE, 2, '🎁'),
('Réduction 15%', 'Obtenez une réduction de 15% sur votre commande', 200, 'percentage', 15.00, TRUE, 3, '🎁'),
('Réduction 20%', 'Obtenez une réduction de 20% sur votre commande', 300, 'percentage', 20.00, TRUE, 4, '🎁'),
('Boisson offerte', 'Une boisson de votre choix offerte', 150, 'product', 0.00, TRUE, 5, '☕'),
('Dessert offert', 'Un dessert de votre choix offert', 250, 'product', 0.00, TRUE, 6, '🍰');

