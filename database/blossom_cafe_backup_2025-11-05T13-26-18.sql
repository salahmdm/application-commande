-- Export de la base de données blossom_cafe
-- Date: 2025-11-05T13:26:18.735Z

SET FOREIGN_KEY_CHECKS=0;


-- Structure de la table app_settings
DROP TABLE IF EXISTS `app_settings`;
CREATE TABLE `app_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_type` enum('boolean','string','number','json') DEFAULT 'string',
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Données de la table app_settings
LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (1, 'table_number_enabled', 'false', 'boolean', 'Activer/désactiver le numéro de table pour les commandes sur place', Wed Oct 15 2025 23:37:11 GMT+0200 (heure d’été d’Europe centrale), Mon Oct 13 2025 18:31:27 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (2, 'app_name', 'Blossom Café', 'string', 'Nom de l\'application', Mon Oct 13 2025 18:31:27 GMT+0200 (heure d’été d’Europe centrale), Mon Oct 13 2025 18:31:27 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (3, 'tax_rate', '10', 'number', 'Taux de TVA en pourcentage', Mon Oct 13 2025 18:31:27 GMT+0200 (heure d’été d’Europe centrale), Mon Oct 13 2025 18:31:27 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (4, 'opening_hours', '{\"monday\":{\"open\":\"08:00\",\"close\":\"21:45\",\"closed\":false},\"tuesday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"wednesday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"thursday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"friday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"saturday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"sunday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false}}', 'string', NULL, Mon Nov 03 2025 15:54:29 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (5, 'address_street', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (6, 'address_city', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (7, 'address_postal', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (8, 'address_country', 'France', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (9, 'restaurant_address', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (10, 'phone_main', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (11, 'phone_mobile', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (12, 'email_contact', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (13, 'email_reservation', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (14, 'contact_phone', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (15, 'contact_email', '', 'string', NULL, Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 15:49:11 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`, `created_at`) VALUES (16, 'currency_symbol', '€', 'string', NULL, Tue Nov 04 2025 16:02:01 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 16:01:16 GMT+0100 (heure normale d’Europe centrale));
/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table audit_logs
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Structure de la table categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table categories
LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Boissons Chaudes', 'boissons-chaudes', 'Cafés, thés et chocolats chauds', '☕', 2, 1, Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale), Fri Oct 17 2025 14:46:40 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'Boissons Froides', 'boissons-froides', 'Jus, smoothies et boissons glacées', '🧊', 3, 1, Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale), Fri Oct 17 2025 14:30:10 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'Délices Salés', 'delices-sales', 'Sandwichs, salades et quiches', '🥪', 1, 1, Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:14:19 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (4, 'Délices Sucrés', 'delices-sucres', 'Pâtisseries, gâteaux et desserts', '🍰', 4, 1, Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale), Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale));
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table favorites
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Structure de la table ingredients
DROP TABLE IF EXISTS `ingredients`;
CREATE TABLE `ingredients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `category_id` int DEFAULT NULL,
  `category_inventory` varchar(50) DEFAULT 'Autres',
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unit` varchar(20) NOT NULL DEFAULT 'kg',
  `price_per_unit` decimal(10,2) DEFAULT '0.00',
  `min_quantity` decimal(10,2) DEFAULT '0.00',
  `supplier` varchar(255) DEFAULT NULL,
  `description` text,
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_name` (`name`),
  KEY `idx_category` (`category_id`),
  KEY `idx_available` (`is_available`),
  KEY `idx_deleted` (`deleted_at`),
  CONSTRAINT `ingredients_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Données de la table ingredients
LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (1, 'Café en grains', 'cafe-en-grains', 1, 'Autres', '25.50', 'kg', '12.50', '5.00', 'Fournisseur Café', 'Café arabica premium', 1, Tue Oct 21 2025 13:47:00 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (2, 'Lait entier', 'lait-entier', 1, 'Autres', '15.00', 'L', '1.20', '3.00', 'Laiterie Locale', 'Lait frais pasteurisé', 1, Tue Oct 21 2025 13:47:00 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (3, 'Farine T55', 'farine-t55', 3, 'Autres', '50.00', 'kg', '0.85', '10.00', 'Meunier Régional', 'Farine de blé pour pâtisserie', 1, Tue Oct 21 2025 13:47:00 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (4, 'Beurre doux', 'beurre-doux', 3, 'Autres', '8.50', 'kg', '6.50', '2.00', 'Beurrerie Artisanale', 'Beurre de baratte artisanal', 1, Tue Oct 21 2025 13:47:00 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (5, 'Sucre blanc', 'sucre-blanc', 4, 'Autres', '30.00', 'kg', '1.10', '5.00', 'Sucrerie Nationale', 'Sucre cristallisé blanc', 1, Tue Oct 21 2025 13:47:00 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (6, 'Œufs frais', 'ufs-frais', 3, 'Autres', '120.00', 'pièces', '0.25', '30.00', 'Ferme Locale', 'Œufs de poules élevées en plein air', 1, Tue Oct 21 2025 13:47:00 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:22 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (7, 'OIGNONS FRITS 500G METRO CHEF', 'oignons-frits-500g-metro-chef', 3, 'Autres', '1.00', 'kg', '3.86', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (8, 'TOPPING CARAM BEUR SALE 1,2KG', 'topping-caram-beur-sale-1-2kg', 3, 'Autres', '1.00', 'kg', '9.33', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (9, 'SAUCE FROMAG CHEDDAR 1KG MC', 'sauce-fromag-cheddar-1kg-mc', 3, 'Autres', '2.00', 'kg', '7.14', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (10, 'BRIOCHE TRESSEE MGV 600G ARO', 'brioche-tressee-mgv-600g-aro', 3, 'Autres', '5.00', 'kg', '2.19', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (11, 'BAC VANILLE 5L ECO', 'bac-vanille-5l-eco', 3, 'Autres', '1.00', 'kg', '8.83', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (12, 'ZIGGY FRIES 2.5KG LAMBWESTON', 'ziggy-fries-2-5kg-lambweston', 3, 'Autres', '1.00', 'kg', '6.77', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (13, 'TWISTER AVEC PEAU 2.5KG', 'twister-avec-peau-2-5kg', 3, 'Autres', '1.00', 'kg', '8.15', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (14, 'COULIS FRAMBOISES 500G', 'coulis-framboises-500g', 3, 'Autres', '1.00', 'kg', '6.27', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (15, 'POP DE PLT CRUNCHY HALAL 1KG', 'pop-de-plt-crunchy-halal-1kg', 3, 'Autres', '2.00', 'kg', '11.21', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (16, 'AIGUILETTE PLT GRAINES HALA 1KG', 'aiguilette-plt-graines-hala-1kg', 3, 'Autres', '2.00', 'kg', '11.72', '1.00', '', '', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 16:26:04 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (17, 'FILET PLT JAPAN STYLE 960G HAL', 'filet-plt-japan-style-960g-hal', 3, 'Autres', '1.00', 'kg', '11.06', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (18, 'FRAMBOISE 125G PTPORTUGAL', 'framboise-125g-ptportugal', 3, 'Autres', '1.00', 'kg', '1.99', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `ingredients` (`id`, `name`, `slug`, `category_id`, `category_inventory`, `quantity`, `unit`, `price_per_unit`, `min_quantity`, `supplier`, `description`, `is_available`, `created_at`, `updated_at`, `deleted_at`) VALUES (19, 'AVO PRE MURI PC9 PEROU', 'avo-pre-muri-pc9-perou', 3, 'Autres', '9.00', 'kg', '1.49', '0.00', '', 'Ingrédient ajouté depuis l\'inventaire', 1, Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 13:56:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table inventory
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ingredient_name` varchar(100) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unit` varchar(20) NOT NULL DEFAULT 'kg',
  `threshold` decimal(10,2) NOT NULL DEFAULT '5.00',
  `price_per_unit` decimal(10,2) DEFAULT '0.00',
  `supplier` varchar(100) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Données de la table inventory
LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (1, 'Thé vert (feuilles)', '50.00', 'kg', '10.00', '25.00', 'Thés du Monde', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (2, 'Thé noir (feuilles)', '45.00', 'kg', '10.00', '22.00', 'Thés du Monde', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (3, 'Café (grains)', '30.00', 'kg', '8.00', '18.00', 'Café Premium', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (4, 'Lait', '80.00', 'L', '20.00', '1.20', 'Laiterie Bio', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (5, 'Sucre', '25.00', 'kg', '5.00', '1.50', 'Sucre & Co', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (6, 'Farine', '40.00', 'kg', '10.00', '0.80', 'Moulin Artisanal', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (7, 'Beurre', '15.00', 'kg', '5.00', '8.00', 'Laiterie Bio', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (8, 'Œufs', '120.00', 'unités', '30.00', '0.25', 'Ferme du Village', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (9, 'Chocolat', '20.00', 'kg', '5.00', '12.00', 'Chocolat Gourmet', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (10, 'Fruits frais', '25.00', 'kg', '8.00', '4.50', 'Marché Local', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (11, 'Miel', '10.00', 'kg', '3.00', '15.00', 'Ruche Dorée', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (12, 'Amandes', '2.00', 'kg', '2.00', '18.00', 'Fruits Secs Bio', Wed Oct 08 2025 12:02:12 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (13, 'Crème fraîche', '12.00', 'L', '5.00', '3.50', 'Laiterie Bio', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `inventory` (`id`, `ingredient_name`, `quantity`, `unit`, `threshold`, `price_per_unit`, `supplier`, `last_updated`, `created_at`) VALUES (14, 'Vanille (gousses)', '0.50', 'kg', '0.10', '250.00', 'Épices Rares', Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 11:41:35 GMT+0200 (heure d’été d’Europe centrale));
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table inventory_logs
DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `previous_stock` int NOT NULL,
  `new_stock` int NOT NULL,
  `change_amount` int NOT NULL,
  `change_type` enum('purchase','sale','adjustment','return','waste') COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Structure de la table loyalty_transactions
DROP TABLE IF EXISTS `loyalty_transactions`;
CREATE TABLE `loyalty_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `points` int NOT NULL,
  `transaction_type` enum('earned','redeemed','bonus','expired','adjustment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance_after` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `loyalty_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `loyalty_transactions_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Structure de la table news
DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '?',
  `gradient` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'from-purple-500 to-indigo-600',
  `bg_pattern` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` enum('normal','large','extra-large') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `is_visible` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_new` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table news
LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
INSERT INTO `news` (`id`, `title`, `description`, `date`, `image_url`, `icon`, `gradient`, `bg_pattern`, `size`, `is_visible`, `is_active`, `order`, `created_at`, `updated_at`, `is_new`) VALUES (1, 'HAPPY HOUR', 'Formule Thé ou café + 2 pancakes a seulement 7€', 'Tout les Mercredis à partir de 14h', '/uploads/news/news-1762287880589-930161687-happy-hour-paper-background-color-hapvector-illustration-88989997.webp', '🍃', 'from-emerald-400 via-teal-500 to-cyan-600', 'bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.15),transparent_50%)]', 'normal', 1, 1, 1, Fri Oct 24 2025 09:34:33 GMT+0200 (heure d’été d’Europe centrale), Wed Nov 05 2025 07:35:52 GMT+0100 (heure normale d’Europe centrale), 0);
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','success','warning','error','order') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `related_order_id` int DEFAULT NULL,
  `action_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `related_order_id` (`related_order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`related_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table notifications
LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (1, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 4, NULL, Mon Oct 13 2025 09:27:34 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (2, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 4, NULL, Mon Oct 13 2025 09:27:36 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (3, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 4, NULL, Mon Oct 13 2025 09:27:38 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (4, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 1, NULL, Mon Oct 13 2025 19:19:57 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (5, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 1, NULL, Mon Oct 13 2025 19:19:59 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (6, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 1, NULL, Mon Oct 13 2025 19:20:01 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (7, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 2, NULL, Tue Oct 14 2025 10:37:12 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (8, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 2, NULL, Tue Oct 14 2025 10:37:13 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (9, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 2, NULL, Tue Oct 14 2025 10:37:14 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (10, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 3, NULL, Tue Oct 14 2025 13:29:02 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (11, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 3, NULL, Tue Oct 14 2025 13:29:05 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (12, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 3, NULL, Tue Oct 14 2025 13:29:14 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (13, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 4, NULL, Tue Oct 14 2025 14:16:05 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (14, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 5, NULL, Tue Oct 14 2025 17:01:47 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (15, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 5, NULL, Tue Oct 14 2025 17:01:48 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (16, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 5, NULL, Tue Oct 14 2025 17:01:49 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (17, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 7, NULL, Wed Oct 15 2025 22:10:30 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (18, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 7, NULL, Wed Oct 15 2025 22:10:32 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (19, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 7, NULL, Wed Oct 15 2025 22:10:33 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (20, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 8, NULL, Sat Oct 18 2025 09:58:16 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (21, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 8, NULL, Sat Oct 18 2025 09:58:18 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (22, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 8, NULL, Sat Oct 18 2025 09:58:20 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (23, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 9, NULL, Tue Oct 21 2025 11:00:43 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (24, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 9, NULL, Tue Oct 21 2025 11:05:40 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (25, 1, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 9, NULL, Tue Oct 21 2025 11:05:41 GMT+0200 (heure d’été d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (26, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 11, NULL, Mon Nov 03 2025 09:32:15 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (27, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 11, NULL, Mon Nov 03 2025 09:32:16 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (28, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 11, NULL, Mon Nov 03 2025 09:32:18 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (29, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 10, NULL, Mon Nov 03 2025 16:31:32 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (30, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 12, NULL, Mon Nov 03 2025 16:49:14 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (31, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 12, NULL, Mon Nov 03 2025 16:51:40 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (32, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 13, NULL, Mon Nov 03 2025 16:52:53 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (33, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 14, NULL, Mon Nov 03 2025 20:35:42 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (34, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 12, NULL, Mon Nov 03 2025 20:37:42 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (35, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 6, NULL, Mon Nov 03 2025 20:38:00 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (36, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 14, NULL, Mon Nov 03 2025 20:38:14 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (37, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 15, NULL, Mon Nov 03 2025 20:46:43 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (38, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: cancelled', 'order', 0, 6, NULL, Mon Nov 03 2025 21:12:39 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (39, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: cancelled', 'order', 0, 4, NULL, Mon Nov 03 2025 21:12:46 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (40, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: cancelled', 'order', 0, 14, NULL, Mon Nov 03 2025 21:12:50 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (41, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 10, NULL, Mon Nov 03 2025 21:13:13 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (42, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 17, NULL, Mon Nov 03 2025 21:54:37 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (43, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: cancelled', 'order', 0, 10, NULL, Mon Nov 03 2025 22:38:08 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (44, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 15, NULL, Tue Nov 04 2025 12:51:05 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (45, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 13, NULL, Tue Nov 04 2025 12:51:07 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (46, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 15, NULL, Tue Nov 04 2025 12:51:08 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (47, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 13, NULL, Tue Nov 04 2025 12:51:10 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (48, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 17, NULL, Tue Nov 04 2025 12:51:11 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (49, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 17, NULL, Tue Nov 04 2025 12:51:18 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (50, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 26, NULL, Tue Nov 04 2025 15:08:06 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (51, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 26, NULL, Tue Nov 04 2025 15:08:20 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (52, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 26, NULL, Tue Nov 04 2025 15:08:24 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (53, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 25, NULL, Tue Nov 04 2025 15:09:35 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (54, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 25, NULL, Tue Nov 04 2025 15:09:42 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (55, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: served', 'order', 0, 25, NULL, Tue Nov 04 2025 15:09:50 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (56, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 24, NULL, Tue Nov 04 2025 15:10:16 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (57, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 23, NULL, Tue Nov 04 2025 15:10:17 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (58, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 23, NULL, Tue Nov 04 2025 15:17:15 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (59, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 16, NULL, Wed Nov 05 2025 09:02:49 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (60, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 16, NULL, Wed Nov 05 2025 09:02:53 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (61, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: preparing', 'order', 0, 27, NULL, Wed Nov 05 2025 09:03:47 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_order_id`, `action_url`, `created_at`, `read_at`) VALUES (62, 3, 'Statut de commande mis à jour', 'Votre commande est maintenant: ready', 'order', 0, 27, NULL, Wed Nov 05 2025 09:03:54 GMT+0100 (heure normale d’Europe centrale), NULL);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table order_items
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `special_instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table order_items
LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (1, 1, 20, 'Tarte aux Fraises', 1, '5.80', '5.80', NULL, Mon Oct 13 2025 19:19:26 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (2, 1, 2, 'Cappuccino', 1, '3.80', '3.80', NULL, Mon Oct 13 2025 19:19:26 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (3, 2, 2, 'Cappuccino', 1, '3.80', '3.80', NULL, Tue Oct 14 2025 10:37:05 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (4, 2, 1, 'Espresso', 1, '2.50', '2.50', NULL, Tue Oct 14 2025 10:37:05 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (5, 3, 2, 'Cappuccino', 1, '3.80', '3.80', NULL, Tue Oct 14 2025 13:28:21 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (6, 4, 2, 'Cappuccino', 1, '3.80', '3.80', NULL, Tue Oct 14 2025 14:05:24 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (7, 5, 2, 'Cappuccino', 1, '3.80', '3.80', NULL, Tue Oct 14 2025 17:01:40 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (8, 6, 2, 'Cappuccino', 1, '3.80', '3.80', NULL, Tue Oct 14 2025 17:11:20 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (9, 7, 1, 'Espresso', 1, '2.50', '2.50', NULL, Wed Oct 15 2025 22:10:23 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (10, 8, 3, 'Latte', 1, '4.20', '4.20', NULL, Sat Oct 18 2025 09:58:08 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (11, 9, 2, 'Cappuccino', 1, '3.80', '3.80', NULL, Tue Oct 21 2025 10:57:47 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (12, 10, 156, 'Thé gingembre citron', 1, '4.00', '4.00', NULL, Mon Nov 03 2025 09:13:44 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (13, 11, 157, 'Thé menthe', 1, '3.00', '3.00', NULL, Mon Nov 03 2025 09:32:03 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (14, 12, 157, 'Thé menthe', 1, '3.00', '3.00', NULL, Mon Nov 03 2025 16:37:48 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (15, 12, 156, 'Thé gingembre citron', 1, '4.00', '4.00', NULL, Mon Nov 03 2025 16:37:48 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (16, 12, 155, 'Ice Latte', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 16:37:48 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (17, 12, 154, 'Dalgona', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 16:37:48 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (18, 13, 156, 'Thé gingembre citron', 1, '4.00', '4.00', NULL, Mon Nov 03 2025 16:51:58 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (19, 14, 156, 'Thé gingembre citron', 2, '4.00', '8.00', NULL, Mon Nov 03 2025 17:13:17 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (20, 15, 157, 'Thé menthe', 1, '3.00', '3.00', NULL, Mon Nov 03 2025 20:40:48 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (21, 16, 154, 'Dalgona', 3, '4.50', '13.50', NULL, Mon Nov 03 2025 20:48:33 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (22, 17, 156, 'Thé gingembre citron', 1, '4.00', '4.00', NULL, Mon Nov 03 2025 21:00:23 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (23, 18, 157, 'Thé menthe', 1, '3.00', '3.00', NULL, Mon Nov 03 2025 21:29:41 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (24, 18, 156, 'Thé gingembre citron', 1, '4.00', '4.00', NULL, Mon Nov 03 2025 21:29:41 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (25, 18, 155, 'Ice Latte', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 21:29:41 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (26, 18, 154, 'Dalgona', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 21:29:41 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (27, 18, 153, 'Chocolat chaud', 1, '4.90', '4.90', NULL, Mon Nov 03 2025 21:29:41 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (28, 18, 128, 'Sirop d’érable myrtilles', 1, '8.90', '8.90', NULL, Mon Nov 03 2025 21:29:41 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (29, 19, 154, 'Dalgona', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 21:47:33 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (30, 20, 155, 'Ice Latte', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 21:51:53 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (31, 21, 155, 'Ice Latte', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 21:55:05 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (32, 21, 154, 'Dalgona', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 21:55:05 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (33, 22, 154, 'Dalgona', 3, '4.50', '13.50', NULL, Mon Nov 03 2025 21:56:40 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (34, 23, 155, 'Ice Latte', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 21:59:37 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (35, 24, 157, 'Thé menthe', 1, '3.00', '3.00', NULL, Mon Nov 03 2025 22:08:47 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (36, 25, 154, 'Dalgona', 1, '4.50', '4.50', NULL, Mon Nov 03 2025 22:17:52 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (37, 26, 123, 'Bagel saumon', 1, '12.90', '12.90', NULL, Tue Nov 04 2025 15:07:50 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`, `special_instructions`, `created_at`) VALUES (38, 27, 123, 'Bagel saumon', 1, '12.90', '12.90', NULL, Wed Nov 05 2025 08:51:41 GMT+0100 (heure normale d’Europe centrale));
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table orders
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_type` enum('dine-in','takeaway','delivery') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','preparing','ready','served','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `promo_code_id` int DEFAULT NULL,
  `payment_method` enum('cash','card','stripe','paypal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `table_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address` text COLLATE utf8mb4_unicode_ci,
  `estimated_ready_time` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `taken_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp de prise en charge (passage à preparing)',
  `prepared_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp de fin de préparation (passage à served)',
  PRIMARY KEY (`id`),
  KEY `promo_code_id` (`promo_code_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_taken_at` (`taken_at`),
  KEY `idx_prepared_at` (`prepared_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table orders
LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (1, 1, 'CMD-0001', 'dine-in', 'served', '9.60', '0.00', '0.96', '10.56', NULL, 'cash', 'pending', 'Commande client Invité - Paiement en caisse', NULL, NULL, NULL, NULL, Mon Oct 13 2025 19:19:26 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:14 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (2, 3, 'CMD-0001', 'dine-in', 'served', '6.30', '0.00', '0.63', '6.93', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Tue Oct 14 2025 10:37:05 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:14 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (3, 3, 'CMD-0002', 'dine-in', 'served', '3.80', '0.00', '0.38', '4.18', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Tue Oct 14 2025 13:28:21 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:14 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (4, 3, 'CMD-0003', 'dine-in', 'cancelled', '3.80', '0.00', '0.38', '4.18', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Tue Oct 14 2025 14:05:24 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:14 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (5, 3, 'CMD-0004', 'dine-in', 'served', '3.80', '0.00', '0.38', '4.18', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Tue Oct 14 2025 17:01:40 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:14 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (6, 3, 'CMD-0005', 'dine-in', 'cancelled', '3.80', '0.00', '0.38', '4.18', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Tue Oct 14 2025 17:11:20 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:14 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (7, 3, 'CMD-0001', 'dine-in', 'served', '2.50', '0.00', '0.25', '2.75', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Wed Oct 15 2025 22:10:23 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:15 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (8, 3, 'CMD-0001', 'dine-in', 'served', '4.20', '0.00', '0.42', '4.62', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Sat Oct 18 2025 09:58:08 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:15 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (9, 1, 'CMD-0001', 'dine-in', 'served', '3.80', '0.00', '0.38', '4.18', NULL, 'cash', 'pending', 'Commande client Invité - Paiement en caisse', NULL, NULL, NULL, NULL, Tue Oct 21 2025 10:57:46 GMT+0200 (heure d’été d’Europe centrale), Mon Nov 03 2025 21:50:15 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (10, 3, 'CMD-0001', 'dine-in', 'cancelled', '4.00', '0.00', '0.40', '4.40', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 09:13:44 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 22:38:08 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (11, 3, 'CMD-0002', 'dine-in', 'served', '3.00', '0.00', '0.30', '3.30', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 09:32:03 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 21:50:15 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (12, 3, 'CMD-0003', 'dine-in', 'served', '16.00', '0.00', '1.60', '17.60', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 16:37:48 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 21:50:15 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (13, 3, 'CMD-0004', 'dine-in', 'served', '4.00', '0.00', '0.40', '4.40', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 16:51:58 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 12:51:10 GMT+0100 (heure normale d’Europe centrale), NULL, Tue Nov 04 2025 12:51:10 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (14, 3, 'CMD-0005', 'dine-in', 'cancelled', '8.00', '0.00', '0.80', '8.80', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 17:13:17 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 21:50:15 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (15, 3, 'CMD-0006', 'dine-in', 'served', '3.00', '0.00', '0.30', '3.30', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 20:40:48 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 12:51:08 GMT+0100 (heure normale d’Europe centrale), NULL, Tue Nov 04 2025 12:51:08 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (16, 3, 'CMD-0007', 'dine-in', 'ready', '13.50', '0.00', '1.35', '14.85', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 20:48:33 GMT+0100 (heure normale d’Europe centrale), Wed Nov 05 2025 09:02:53 GMT+0100 (heure normale d’Europe centrale), Wed Nov 05 2025 09:02:49 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (17, 3, 'CMD-0008', 'dine-in', 'served', '4.00', '0.00', '0.40', '4.40', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 21:00:23 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 12:51:18 GMT+0100 (heure normale d’Europe centrale), NULL, Tue Nov 04 2025 12:51:18 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (18, 3, 'CMD-0009', 'dine-in', 'pending', '29.80', '0.00', '2.98', '32.78', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 21:29:41 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 21:50:15 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (19, 3, 'CMD-0010', 'dine-in', 'pending', '4.50', '0.00', '0.45', '4.95', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 21:47:33 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 21:50:15 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (20, 3, 'CMD-0011', 'dine-in', 'pending', '4.50', '0.00', '0.45', '4.95', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 21:51:53 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 21:59:20 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (21, 3, 'CMD-0012', 'dine-in', 'pending', '9.00', '0.00', '0.90', '9.90', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 21:55:05 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 21:59:20 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (22, 3, 'CMD-0013', 'dine-in', 'pending', '13.50', '0.00', '1.35', '14.85', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 21:56:40 GMT+0100 (heure normale d’Europe centrale), Mon Nov 03 2025 21:59:20 GMT+0100 (heure normale d’Europe centrale), NULL, NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (23, 3, 'CMD-0014', 'dine-in', 'ready', '4.50', '0.00', '0.45', '4.95', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 21:59:37 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:17:15 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:10:17 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (24, 3, 'CMD-0015', 'dine-in', 'preparing', '3.00', '0.00', '0.30', '3.30', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 22:08:47 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:10:16 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:10:16 GMT+0100 (heure normale d’Europe centrale), NULL);
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (25, 3, 'ORD-2025-1762204672608', 'dine-in', 'served', '4.50', '0.00', '0.45', '4.95', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Mon Nov 03 2025 22:17:52 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:09:50 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:09:35 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:09:50 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (26, 3, 'CMD-0001', 'dine-in', 'served', '12.90', '0.00', '1.29', '14.19', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Tue Nov 04 2025 15:07:50 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:08:24 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:08:06 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:08:24 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `orders` (`id`, `user_id`, `order_number`, `order_type`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `promo_code_id`, `payment_method`, `payment_status`, `notes`, `table_number`, `delivery_address`, `estimated_ready_time`, `completed_at`, `created_at`, `updated_at`, `taken_at`, `prepared_at`) VALUES (27, 3, 'CMD-0001', 'dine-in', 'ready', '12.90', '0.00', '1.29', '14.19', NULL, 'cash', 'pending', 'Commande créée par le manager', '', NULL, NULL, NULL, Wed Nov 05 2025 08:51:41 GMT+0100 (heure normale d’Europe centrale), Wed Nov 05 2025 09:03:54 GMT+0100 (heure normale d’Europe centrale), Wed Nov 05 2025 09:03:47 GMT+0100 (heure normale d’Europe centrale), NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table products
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock` int DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `calories` int DEFAULT NULL,
  `preparation_time` int DEFAULT NULL COMMENT 'Temps de préparation en minutes',
  `allergens` text COLLATE utf8mb4_unicode_ci COMMENT 'Liste des allergènes',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `min_stock` int DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_slug` (`slug`),
  KEY `idx_is_available` (`is_available`),
  KEY `idx_is_featured` (`is_featured`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=158 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table products
LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (1, 1, 'Espresso', 'espresso', 'Café corsé et intense', '2.50', '/uploads/products/product-1760535687262-266887832-caf--.jpg', 100, 1, 0, 0, 5, '[]', Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 11:40:29 GMT+0200 (heure d’été d’Europe centrale), 0, Tue Oct 21 2025 11:40:29 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (2, 1, 'Cappuccino', 'cappuccino', 'Espresso avec mousse de lait onctueuse', '3.80', '/uploads/products/product-1760362605836-713008650-blossom.jpeg', 100, 1, 1, 0, 5, '[]', Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 11:40:25 GMT+0200 (heure d’été d’Europe centrale), 0, Tue Oct 21 2025 11:40:25 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (3, 1, 'Latte', 'latte', 'Café doux avec lait chaud', '4.20', NULL, 100, 1, 0, NULL, NULL, NULL, Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 11:40:32 GMT+0200 (heure d’été d’Europe centrale), 0, Tue Oct 21 2025 11:40:32 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (20, 4, 'Tarte aux Fraises', 'tarte-fraises', 'Pâte sablée, crème pâtissière et fraises fraîches', '5.80', NULL, 20, 1, 1, NULL, NULL, NULL, Mon Oct 13 2025 12:17:21 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 11:40:38 GMT+0200 (heure d’été d’Europe centrale), 0, Tue Oct 21 2025 11:40:38 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (119, 3, 'Dynamite Chicken', 'dynamite-chicken', 'Produit Dynamite Chicken', '9.90', NULL, 0, 1, 0, 0, 5, '[\"Poulet épicé\",\"Pain brioche\",\"Salade\",\"Tomate\",\"Oignon rouge\",\"Sauce dynamite\"]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:44:54 GMT+0100 (heure normale d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (120, 3, 'Menu poulet', 'menu-poulet', 'Produit Menu poulet', '13.90', NULL, 0, 1, 0, 0, 5, '[\"Poulet grillé\",\"Frites\",\"Salade\",\"Sauce\"]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:44:54 GMT+0100 (heure normale d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (121, 3, 'Frites cheddar', 'frites-cheddar', 'Produit Frites cheddar', '5.90', NULL, 0, 1, 0, 0, 5, '[\"Pommes de terre\",\"Fromage cheddar\",\"Oignons frits\",\"Sauce\"]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:44:54 GMT+0100 (heure normale d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (122, 3, 'Toast saumon', 'toast-saumon', 'Produit Toast saumon', '13.90', NULL, 0, 1, 0, 0, 5, '[\"Pain de campagne\",\"Saumon fumé\",\"Fromage frais\",\"Salade\",\"Citron\",\"Aneth\"]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:44:54 GMT+0100 (heure normale d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (123, 3, 'Bagel saumon', 'bagel-saumon', 'Produit Bagel saumon', '12.90', '/uploads/products/product-1762270701811-958136178-ibagel-saumon.jpg', NULL, 1, 0, 0, 5, '[\"Bagel\",\"Saumon fumé\",\"Fromage frais\",\"Salade\",\"Concombre\",\"Oignon rouge\",\"Câpres\"]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:44:54 GMT+0100 (heure normale d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (124, 3, 'Brioche poulet', 'brioche-poulet', 'Produit Brioche poulet', '12.90', NULL, 0, 1, 0, 0, 5, '[\"Brioche\",\"Poulet grillé\",\"Salade\",\"Tomate\",\"Mayonnaise\",\"Cornichons\"]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:44:54 GMT+0100 (heure normale d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (125, 3, 'Burger poulet', 'burger-poulet', 'Produit Burger poulet', '13.90', NULL, 0, 1, 0, 0, 5, '[\"Pain burger\",\"Poulet pané\",\"Salade\",\"Tomate\",\"Oignon\",\"Fromage\",\"Sauce spéciale\"]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:44:54 GMT+0100 (heure normale d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (126, 4, 'Pancakes Spéculoos', 'pancakes-spéculoos', 'Produit Pancakes Spéculoos', '12.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (127, 4, 'Brioche Brûlée', 'brioche-brûlée', 'Produit Brioche Brûlée', '12.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (128, 4, 'Sirop d’érable myrtilles', 'sirop-d’érable-myrtilles', 'Produit Sirop d’érable myrtilles', '8.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (129, 4, 'Chocolat, caramel', 'chocolat,-caramel', 'Produit Chocolat, caramel', '8.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (130, 4, 'Pistache, framboise', 'pistache,-framboise', 'Produit Pistache, framboise', '8.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (131, 4, 'Caramel, spéculoos', 'caramel,-spéculoos', 'Produit Caramel, spéculoos', '8.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:32 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (132, 4, 'Chocolat blanc, chocolat au lait, noisettes', 'chocolat-blanc,-chocolat-au-lait,-noisettes', 'Produit Chocolat blanc, chocolat au lait, noisettes', '7.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (133, 4, 'Chocolat blanc, chocolat au lait, barres', 'chocolat-blanc,-chocolat-au-lait,-barres', 'Produit Chocolat blanc, chocolat au lait, barres', '7.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (134, 2, 'Ginger beer', 'ginger-beer', 'Produit Ginger beer', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (135, 2, 'Concombre', 'concombre', 'Produit Concombre', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (136, 2, 'Blue lagoon', 'blue-lagoon', 'Produit Blue lagoon', '6.00', '/uploads/products/product-1762270970635-299820925-blue-lagoon.png', NULL, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 16:43:01 GMT+0100 (heure normale d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (137, 2, 'Mojito (Classique / Fraise / Violette / Litchi / Kiwi / Framboise / Myrtille)', 'mojito-(classique-/-fraise-/-violette-/-litchi-/-kiwi-/-framboise-/-myrtille)', 'Produit Mojito (Classique / Fraise / Violette / Litchi / Kiwi / Framboise / Myrtille)', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (138, 2, 'Orange, mangue, ananas', 'orange,-mangue,-ananas', 'Produit Orange, mangue, ananas', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (139, 2, 'Framboise', 'framboise', 'Produit Framboise', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (140, 2, 'Pomme, kiwi, framboise', 'pomme,-kiwi,-framboise', 'Produit Pomme, kiwi, framboise', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (141, 2, 'Power booster (orange, citron, spiruline)', 'power-booster-(orange,-citron,-spiruline)', 'Produit Power booster (orange, citron, spiruline)', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (142, 2, 'Kinder Bueno', 'kinder-bueno', 'Produit Kinder Bueno', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (143, 2, 'Spéculoos', 'spéculoos', 'Produit Spéculoos', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (144, 2, 'Fraise', 'fraise', 'Produit Fraise', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (145, 2, 'Pop Corn', 'pop-corn', 'Produit Pop Corn', '6.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (146, 2, 'Fuze Tea', 'fuze-tea', 'Produit Fuze Tea', '2.50', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (147, 1, 'Latte Cinnamon Roll', 'latte-cinnamon-roll', 'Produit Latte Cinnamon Roll', '7.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (148, 1, 'Latte Pistache', 'latte-pistache', 'Produit Latte Pistache', '7.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (149, 1, 'Latte Spéculoos Caramel', 'latte-spéculoos-caramel', 'Produit Latte Spéculoos Caramel', '7.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (152, 1, 'Latte noisettes', 'latte-noisettes', 'Produit Latte noisettes', '4.50', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:33 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (153, 1, 'Chocolat chaud', 'chocolat-chaud', 'Produit Chocolat chaud', '4.90', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (154, 1, 'Dalgona', 'dalgona', 'Produit Dalgona', '4.50', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (155, 1, 'Ice Latte', 'ice-latte', 'Produit Ice Latte', '4.50', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (156, 1, 'Thé gingembre citron', 'thé-gingembre-citron', 'Produit Thé gingembre citron', '4.00', NULL, 0, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `stock`, `is_available`, `is_featured`, `calories`, `preparation_time`, `allergens`, `created_at`, `updated_at`, `min_stock`, `deleted_at`) VALUES (157, 1, 'Thé menthe', 'thé-menthe', 'Produit Thé menthe', '3.00', NULL, NULL, 1, 0, 0, 5, '[]', Tue Oct 21 2025 15:48:34 GMT+0200 (heure d’été d’Europe centrale), Tue Oct 21 2025 16:47:18 GMT+0200 (heure d’été d’Europe centrale), 0, NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table promo_codes
DROP TABLE IF EXISTS `promo_codes`;
CREATE TABLE `promo_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` enum('percentage','fixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(10,2) DEFAULT '0.00',
  `max_uses` int DEFAULT NULL,
  `uses_count` int DEFAULT '0',
  `valid_from` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table promo_codes
LOCK TABLES `promo_codes` WRITE;
/*!40000 ALTER TABLE `promo_codes` DISABLE KEYS */;
INSERT INTO `promo_codes` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `max_uses`, `uses_count`, `valid_from`, `valid_until`, `is_active`, `created_at`) VALUES (1, 'WELCOME10', 'Bienvenue -10%', 'percentage', '10.00', '15.00', NULL, 0, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Wed Dec 31 2025 23:59:59 GMT+0100 (heure normale d’Europe centrale), 1, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `promo_codes` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `max_uses`, `uses_count`, `valid_from`, `valid_until`, `is_active`, `created_at`) VALUES (2, 'SUMMER20', 'Été -20%', 'percentage', '20.00', '25.00', NULL, 0, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Sun Aug 31 2025 23:59:59 GMT+0200 (heure d’été d’Europe centrale), 1, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale));
/*!40000 ALTER TABLE `promo_codes` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table reviews
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `rating` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `is_verified_purchase` tinyint(1) DEFAULT '0',
  `is_approved` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Structure de la table settings
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '0',
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_setting_key` (`setting_key`),
  CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table settings
LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `description`, `is_public`, `updated_by`, `created_at`, `updated_at`) VALUES (1, 'cafe_name', 'Blossom Café', 'Nom du café', 1, 3, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Mon Oct 13 2025 18:42:34 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `description`, `is_public`, `updated_by`, `created_at`, `updated_at`) VALUES (2, 'tax_rate', '10', 'Taux de TVA (%)', 0, 3, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Mon Oct 13 2025 18:42:34 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `description`, `is_public`, `updated_by`, `created_at`, `updated_at`) VALUES (3, 'loyalty_points_rate', '1', 'Points par euro dépensé', 0, 3, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Mon Oct 13 2025 18:42:34 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `description`, `is_public`, `updated_by`, `created_at`, `updated_at`) VALUES (4, 'contact_email', 'contact@blossomcafe.com', 'Email de contact', 1, 3, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Mon Oct 13 2025 18:42:34 GMT+0200 (heure d’été d’Europe centrale));
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('client','manager','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'client',
  `loyalty_points` int DEFAULT '0',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `email_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table users
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `loyalty_points`, `avatar_url`, `is_active`, `email_verified`, `created_at`, `updated_at`, `last_login`) VALUES (1, 'client@blossom.com', '$2b$10$wZQsl8B9dY75f5aoY.PqpePobL6mGYcT6FCx9JIHOi1xgLEwIeonm', 'Marie', 'Dupont', '+33612345678', 'client', 150, NULL, 1, 1, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 15:03:40 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:03:40 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `loyalty_points`, `avatar_url`, `is_active`, `email_verified`, `created_at`, `updated_at`, `last_login`) VALUES (2, 'manager@blossom.com', '$2b$10$7FuC0MbouSHykt32r7Q1v.Uq3.6Ze86EQpJztEqhtP8MxY4OjaQVy', 'Pierre', 'Martin', '+33687654321', 'manager', 0, NULL, 1, 1, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Fri Oct 31 2025 19:08:02 GMT+0100 (heure normale d’Europe centrale), Fri Oct 31 2025 19:08:02 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `loyalty_points`, `avatar_url`, `is_active`, `email_verified`, `created_at`, `updated_at`, `last_login`) VALUES (3, 'admin@blossom.com', '$2b$10$AJTy/h0xaJ83CCiBMg3lVO6U9Oh67v2WFX.xlL2gbfrMcv89/ETn6', 'Sophie', 'Bernard', '+33698765432', 'admin', 0, NULL, 1, 1, Tue Oct 07 2025 17:06:00 GMT+0200 (heure d’été d’Europe centrale), Tue Nov 04 2025 15:07:03 GMT+0100 (heure normale d’Europe centrale), Tue Nov 04 2025 15:07:03 GMT+0100 (heure normale d’Europe centrale));
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `loyalty_points`, `avatar_url`, `is_active`, `email_verified`, `created_at`, `updated_at`, `last_login`) VALUES (4, 'client@example.com', '$2b$10$mjiNqYyR7NsFPrBOhNd0pu2g8H9iGTuTWGCydseRLTQd0YIFKOhCm', 'Test', 'Client', '+33600000001', 'client', 0, NULL, 1, 1, Wed Oct 08 2025 13:07:30 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 13:21:18 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 13:10:30 GMT+0200 (heure d’été d’Europe centrale));
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `loyalty_points`, `avatar_url`, `is_active`, `email_verified`, `created_at`, `updated_at`, `last_login`) VALUES (5, 'manager@example.com', '$2b$10$W9YFPkVqYZZF2g/LdFrho.1g6r.NjeymAXNNvrdr2TLX0r6R1vGe.', 'Test', 'Manager', '+33600000002', 'manager', 0, NULL, 1, 1, Wed Oct 08 2025 13:07:30 GMT+0200 (heure d’été d’Europe centrale), Wed Oct 08 2025 13:21:18 GMT+0200 (heure d’été d’Europe centrale), NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;


-- Structure de la table v_product_stats
DROP TABLE IF EXISTS `v_product_stats`;
undefined;

-- Données de la table v_product_stats
LOCK TABLES `v_product_stats` WRITE;
/*!40000 ALTER TABLE `v_product_stats` DISABLE KEYS */;
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (1, 'Espresso', '2.50', 100, 'Boissons Chaudes', 2, '2', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (2, 'Cappuccino', '3.80', 100, 'Boissons Chaudes', 7, '7', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (3, 'Latte', '4.20', 100, 'Boissons Chaudes', 1, '1', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (20, 'Tarte aux Fraises', '5.80', 20, 'Délices Sucrés', 1, '1', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (119, 'Dynamite Chicken', '9.90', 0, 'Délices Salés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (120, 'Menu poulet', '13.90', 0, 'Délices Salés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (121, 'Frites cheddar', '5.90', 0, 'Délices Salés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (122, 'Toast saumon', '13.90', 0, 'Délices Salés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (123, 'Bagel saumon', '12.90', NULL, 'Délices Salés', 2, '2', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (124, 'Brioche poulet', '12.90', 0, 'Délices Salés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (125, 'Burger poulet', '13.90', 0, 'Délices Salés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (126, 'Pancakes Spéculoos', '12.90', 0, 'Délices Sucrés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (127, 'Brioche Brûlée', '12.90', 0, 'Délices Sucrés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (128, 'Sirop d’érable myrtilles', '8.90', 0, 'Délices Sucrés', 1, '1', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (129, 'Chocolat, caramel', '8.90', 0, 'Délices Sucrés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (130, 'Pistache, framboise', '8.90', 0, 'Délices Sucrés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (131, 'Caramel, spéculoos', '8.90', 0, 'Délices Sucrés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (132, 'Chocolat blanc, chocolat au lait, noisettes', '7.90', 0, 'Délices Sucrés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (133, 'Chocolat blanc, chocolat au lait, barres', '7.90', 0, 'Délices Sucrés', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (134, 'Ginger beer', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (135, 'Concombre', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (136, 'Blue lagoon', '6.00', NULL, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (137, 'Mojito (Classique / Fraise / Violette / Litchi / Kiwi / Framboise / Myrtille)', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (138, 'Orange, mangue, ananas', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (139, 'Framboise', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (140, 'Pomme, kiwi, framboise', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (141, 'Power booster (orange, citron, spiruline)', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (142, 'Kinder Bueno', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (143, 'Spéculoos', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (144, 'Fraise', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (145, 'Pop Corn', '6.00', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (146, 'Fuze Tea', '2.50', 0, 'Boissons Froides', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (147, 'Latte Cinnamon Roll', '7.00', 0, 'Boissons Chaudes', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (148, 'Latte Pistache', '7.00', 0, 'Boissons Chaudes', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (149, 'Latte Spéculoos Caramel', '7.00', 0, 'Boissons Chaudes', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (152, 'Latte noisettes', '4.50', 0, 'Boissons Chaudes', 0, '0', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (153, 'Chocolat chaud', '4.90', 0, 'Boissons Chaudes', 1, '1', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (154, 'Dalgona', '4.50', 0, 'Boissons Chaudes', 7, '11', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (155, 'Ice Latte', '4.50', 0, 'Boissons Chaudes', 5, '5', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (156, 'Thé gingembre citron', '4.00', 0, 'Boissons Chaudes', 6, '7', '0.0000');
INSERT INTO `v_product_stats` (`id`, `name`, `price`, `stock`, `category_name`, `total_orders`, `total_sold`, `avg_rating`) VALUES (157, 'Thé menthe', '3.00', NULL, 'Boissons Chaudes', 5, '5', '0.0000');
/*!40000 ALTER TABLE `v_product_stats` ENABLE KEYS */;
UNLOCK TABLES;

SET FOREIGN_KEY_CHECKS=1;
