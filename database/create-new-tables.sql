-- ================================================================
-- CRÉATION DES NOUVELLES TABLES POUR BLOSSOM CAFÉ
-- Connexion au schéma blossom_cafe
-- ================================================================

USE blossom_cafe;

-- Supprimer les tables existantes si nécessaire (dans le bon ordre à cause des clés étrangères)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS loyalty_transactions;
DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS promo_codes;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;
DROP VIEW IF EXISTS v_products_ordered;

-- ================================================================
-- TABLE: users - Utilisateurs de l'application
-- ================================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('client', 'manager', 'admin') NOT NULL DEFAULT 'client',
    loyalty_points INT DEFAULT 0,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: categories - Catégories de produits
-- ================================================================
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: products - Catalogue de produits
-- ================================================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    stock INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    calories INT,
    preparation_time INT COMMENT 'Temps de préparation en minutes',
    allergens TEXT COMMENT 'Liste des allergènes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_category_id (category_id),
    INDEX idx_slug (slug),
    INDEX idx_is_available (is_available),
    INDEX idx_is_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: promo_codes - Codes promotionnels
-- ================================================================
CREATE TABLE promo_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_uses INT DEFAULT NULL,
    uses_count INT DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: orders - Commandes
-- ================================================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    order_type ENUM('dine-in', 'takeaway', 'delivery') NOT NULL,
    status ENUM('pending', 'preparing', 'ready', 'served', 'cancelled') NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    promo_code_id INT NULL,
    payment_method ENUM('cash', 'card', 'stripe', 'paypal') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    notes TEXT,
    table_number VARCHAR(20),
    delivery_address TEXT,
    estimated_ready_time TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: order_items - Articles de commande
-- ================================================================
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: favorites - Produits favoris
-- ================================================================
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: loyalty_transactions - Historique des points de fidélité
-- ================================================================
CREATE TABLE loyalty_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id INT NULL,
    points INT NOT NULL,
    transaction_type ENUM('earned', 'redeemed', 'bonus', 'expired', 'adjustment') NOT NULL,
    description VARCHAR(255),
    balance_after INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: notifications - Notifications utilisateurs
-- ================================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'order') NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_order_id INT NULL,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: reviews - Avis clients
-- ================================================================
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    order_id INT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: inventory_logs - Journal des stocks
-- ================================================================
CREATE TABLE inventory_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    change_amount INT NOT NULL,
    change_type ENUM('purchase', 'sale', 'adjustment', 'return', 'waste') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: settings - Paramètres de l'application
-- ================================================================
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: audit_logs - Journal d'audit
-- ================================================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- INSERTION DES DONNÉES DE TEST
-- ================================================================

-- Utilisateurs
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, loyalty_points, email_verified) VALUES
('client@blossom.com', '$2a$10$YourHashedPasswordHere1', 'Marie', 'Dupont', '+33612345678', 'client', 150, TRUE),
('manager@blossom.com', '$2a$10$YourHashedPasswordHere2', 'Pierre', 'Martin', '+33687654321', 'manager', 0, TRUE),
('admin@blossom.com', '$2a$10$YourHashedPasswordHere3', 'Sophie', 'Bernard', '+33698765432', 'admin', 0, TRUE);

-- Catégories
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
('Thés', 'thes', 'Sélection de thés premium', 'Coffee', 1),
('Pâtisseries', 'patisseries', 'Pâtisseries françaises', 'Cake', 2),
('Boissons Chaudes', 'boissons-chaudes', 'Café et chocolat chaud', 'Coffee', 3),
('Salades', 'salades', 'Salades fraîches', 'Salad', 4),
('Snacks', 'snacks', 'Petites collations', 'Cookie', 5);

-- Produits
INSERT INTO products (category_id, name, slug, description, price, stock, is_available, is_featured, calories, preparation_time) VALUES
(1, 'Thé Vert Sencha', 'the-vert-sencha', 'Thé vert japonais', 4.50, 50, TRUE, TRUE, 0, 5),
(1, 'Thé Noir Earl Grey', 'the-noir-earl-grey', 'Thé noir à la bergamote', 4.00, 45, TRUE, FALSE, 0, 5),
(2, 'Croissant au Beurre', 'croissant-au-beurre', 'Croissant pur beurre', 2.80, 25, TRUE, TRUE, 220, 15),
(2, 'Macaron Framboise', 'macaron-framboise', 'Macaron à la framboise', 3.20, 40, TRUE, FALSE, 85, 10),
(3, 'Cappuccino', 'cappuccino', 'Espresso avec mousse de lait', 3.80, 100, TRUE, TRUE, 120, 7),
(3, 'Chocolat Chaud', 'chocolat-chaud', 'Chocolat chaud maison', 4.20, 80, TRUE, FALSE, 250, 8),
(4, 'Salade César', 'salade-cesar', 'Salade romaine, poulet, parmesan', 8.90, 20, TRUE, FALSE, 350, 12),
(5, 'Cookie Chocolat', 'cookie-chocolat', 'Cookie aux pépites de chocolat', 2.50, 50, TRUE, FALSE, 180, 5);

-- Codes promo
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, valid_until) VALUES
('WELCOME10', 'Bienvenue -10%', 'percentage', 10.00, 15.00, '2025-12-31 23:59:59'),
('SUMMER20', 'Été -20%', 'percentage', 20.00, 25.00, '2025-08-31 23:59:59');

-- Paramètres système
INSERT INTO settings (setting_key, setting_value, description, is_public) VALUES
('cafe_name', 'Blossom Café', 'Nom du café', TRUE),
('tax_rate', '10', 'Taux de TVA (%)', FALSE),
('loyalty_points_rate', '1', 'Points par euro dépensé', FALSE),
('contact_email', 'contact@blossomcafe.com', 'Email de contact', TRUE);

-- ================================================================
-- VUES SQL
-- ================================================================

CREATE VIEW v_product_stats AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.stock,
    c.name AS category_name,
    COUNT(DISTINCT oi.id) AS total_orders,
    COALESCE(SUM(oi.quantity), 0) AS total_sold,
    COALESCE(AVG(r.rating), 0) AS avg_rating
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name, p.price, p.stock, c.name;

-- ================================================================
SELECT 'Nouvelles tables créées avec succès dans blossom_cafe !' AS message;
SELECT COUNT(*) AS nb_users FROM users;
SELECT COUNT(*) AS nb_products FROM products;
SELECT COUNT(*) AS nb_categories FROM categories;


