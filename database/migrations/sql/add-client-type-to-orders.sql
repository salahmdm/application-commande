-- Ajouter le champ client_type à la table orders
-- pour distinguer les clients particuliers et professionnels

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_type ENUM('particulier', 'professionnel') DEFAULT 'particulier' AFTER order_type;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255) DEFAULT NULL AFTER client_type;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255) DEFAULT NULL AFTER client_name;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_company VARCHAR(255) DEFAULT NULL AFTER client_email;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_siret VARCHAR(14) DEFAULT NULL AFTER client_company;

-- Afficher la structure mise à jour
DESCRIBE orders;

