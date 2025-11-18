-- Création de la table app_settings pour les paramètres de l'application
-- À exécuter dans MySQL

CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type ENUM('boolean', 'string', 'number', 'json') DEFAULT 'string',
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les paramètres par défaut
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('table_number_enabled', 'true', 'boolean', 'Activer/désactiver le numéro de table pour les commandes sur place'),
('app_name', 'Blossom Café', 'string', 'Nom de l''application'),
('tax_rate', '10', 'number', 'Taux de TVA en pourcentage')
ON DUPLICATE KEY UPDATE 
  setting_value = VALUES(setting_value),
  description = VALUES(description);

-- Vérification
SELECT * FROM app_settings;

