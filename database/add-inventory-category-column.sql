-- Ajouter une colonne category_inventory à la table ingredients
-- pour stocker les catégories spécifiques à l'inventaire (Surgelé, Frais, Autres)

USE blossom_cafe;

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS category_inventory VARCHAR(50) DEFAULT 'Autres' AFTER category_id;

-- Mettre à jour les ingrédients existants avec la catégorie "Autres" par défaut
UPDATE ingredients 
SET category_inventory = 'Autres'
WHERE category_inventory IS NULL OR category_inventory = '';

SELECT 'Colonne category_inventory ajoutée avec succès!' AS message;
SELECT COUNT(*) as total_ingredients FROM ingredients WHERE deleted_at IS NULL;

