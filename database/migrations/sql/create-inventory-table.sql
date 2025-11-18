-- ================================================================
-- TABLE INVENTAIRE (MATIÈRE PREMIÈRE)
-- ================================================================

-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS inventory;

-- Créer la table inventory
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ingredient_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  threshold DECIMAL(10, 2) NOT NULL DEFAULT 5,
  price_per_unit DECIMAL(10, 2) DEFAULT 0,
  supplier VARCHAR(100),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer des données de test pour un salon de thé
INSERT INTO inventory (ingredient_name, quantity, unit, threshold, price_per_unit, supplier) VALUES
('Thé vert (feuilles)', 50.00, 'kg', 10.00, 25.00, 'Thés du Monde'),
('Thé noir (feuilles)', 45.00, 'kg', 10.00, 22.00, 'Thés du Monde'),
('Café (grains)', 30.00, 'kg', 8.00, 18.00, 'Café Premium'),
('Lait', 80.00, 'L', 20.00, 1.20, 'Laiterie Bio'),
('Sucre', 25.00, 'kg', 5.00, 1.50, 'Sucre & Co'),
('Farine', 40.00, 'kg', 10.00, 0.80, 'Moulin Artisanal'),
('Beurre', 15.00, 'kg', 5.00, 8.00, 'Laiterie Bio'),
('Œufs', 120.00, 'unités', 30.00, 0.25, 'Ferme du Village'),
('Chocolat', 20.00, 'kg', 5.00, 12.00, 'Chocolat Gourmet'),
('Fruits frais', 25.00, 'kg', 8.00, 4.50, 'Marché Local'),
('Miel', 10.00, 'kg', 3.00, 15.00, 'Ruche Dorée'),
('Amandes', 8.00, 'kg', 2.00, 18.00, 'Fruits Secs Bio'),
('Crème fraîche', 12.00, 'L', 5.00, 3.50, 'Laiterie Bio'),
('Vanille (gousses)', 0.50, 'kg', 0.10, 250.00, 'Épices Rares');

-- Index pour optimiser les recherches
CREATE INDEX idx_ingredient_name ON inventory(ingredient_name);
CREATE INDEX idx_threshold ON inventory(quantity, threshold);

-- Afficher les ingrédients avec stock faible
SELECT 
  ingredient_name, 
  quantity, 
  unit, 
  threshold,
  CASE 
    WHEN quantity <= threshold THEN 'ALERTE STOCK FAIBLE'
    ELSE 'Stock OK'
  END as status
FROM inventory
WHERE quantity <= threshold
ORDER BY quantity ASC;

SELECT '✅ Table inventory créée avec succès !' as message;






