-- Ajouter la colonne min_stock à la table products si elle n'existe pas

-- Vérifier si la colonne existe déjà
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INT DEFAULT 0;

-- Mettre à jour les valeurs NULL
UPDATE products SET min_stock = 0 WHERE min_stock IS NULL;

-- Afficher les colonnes de la table products pour vérification
DESCRIBE products;

-- Afficher quelques produits pour test
SELECT id, name, stock, price, min_stock FROM products LIMIT 5;

