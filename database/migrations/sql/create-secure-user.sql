-- Script de création d'utilisateur MySQL sécurisé pour Blossom Café
-- ⚠️ À exécuter avec les privilèges root

-- Créer un utilisateur dédié pour l'application
CREATE USER IF NOT EXISTS 'blossom_user'@'localhost' IDENTIFIED BY 'SecurePassword123!@#';

-- Accorder uniquement les privilèges nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON blossom_cafe.* TO 'blossom_user'@'localhost';

-- Accorder le privilège de création de tables temporaires (nécessaire pour certaines requêtes)
GRANT CREATE TEMPORARY TABLES ON blossom_cafe.* TO 'blossom_user'@'localhost';

-- Accorder le privilège de verrouillage des tables (pour les transactions)
GRANT LOCK TABLES ON blossom_cafe.* TO 'blossom_user'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier les privilèges accordés
SHOW GRANTS FOR 'blossom_user'@'localhost';

-- Créer un utilisateur pour les sauvegardes (optionnel)
CREATE USER IF NOT EXISTS 'blossom_backup'@'localhost' IDENTIFIED BY 'BackupPassword456!@#';
GRANT SELECT, LOCK TABLES, SHOW VIEW ON blossom_cafe.* TO 'blossom_backup'@'localhost';
FLUSH PRIVILEGES;

-- Afficher les utilisateurs créés
SELECT User, Host FROM mysql.user WHERE User LIKE 'blossom_%';
