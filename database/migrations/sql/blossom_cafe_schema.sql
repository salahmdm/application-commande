-- ================================================================
-- BLOSSOM CAFÉ - Schéma de base de données MySQL
-- Application PWA pour salon de thé de luxe
-- ================================================================

-- Créer la base de données
DROP DATABASE IF EXISTS blossom_cafe;
CREATE DATABASE blossom_cafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blossom_cafe;

-- ================================================================
-- TABLE: users
-- Gestion des utilisateurs avec système de rôles
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
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: categories
-- Catégories de produits (Thés, Pâtisseries, etc.)
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
-- TABLE: products
-- Catalogue de produits du salon de thé
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
    allergens TEXT COMMENT 'Liste des allergènes séparés par des virgules',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_category_id (category_id),
    INDEX idx_slug (slug),
    INDEX idx_is_available (is_available),
    INDEX idx_is_featured (is_featured),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: promo_codes
-- Codes promotionnels et réductions
-- ================================================================
CREATE TABLE promo_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_uses INT DEFAULT NULL COMMENT 'NULL = utilisation illimitée',
    uses_count INT DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active),
    INDEX idx_valid_dates (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: orders
-- Commandes des clients
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
    notes TEXT COMMENT 'Instructions spéciales du client',
    table_number VARCHAR(20) COMMENT 'Numéro de table pour dine-in',
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
    INDEX idx_order_type (order_type),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: order_items
-- Articles individuels dans chaque commande
-- ================================================================
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL COMMENT 'Nom du produit au moment de la commande',
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
-- TABLE: favorites
-- Produits favoris des utilisateurs
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
-- TABLE: loyalty_transactions
-- Historique des transactions de points de fidélité
-- ================================================================
CREATE TABLE loyalty_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id INT NULL,
    points INT NOT NULL COMMENT 'Positif = gagné, Négatif = dépensé',
    transaction_type ENUM('earned', 'redeemed', 'bonus', 'expired', 'adjustment') NOT NULL,
    description VARCHAR(255),
    balance_after INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: notifications
-- Notifications pour les utilisateurs
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
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: reviews
-- Avis et notes des clients sur les produits
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
    UNIQUE KEY unique_user_product_order (user_id, product_id, order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: inventory_logs
-- Journal des mouvements de stock
-- ================================================================
CREATE TABLE inventory_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Utilisateur qui a effectué le changement',
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    change_amount INT NOT NULL,
    change_type ENUM('purchase', 'sale', 'adjustment', 'return', 'waste') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: settings
-- Paramètres de l'application
-- ================================================================
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Visible côté client',
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: audit_logs
-- Journal d'audit pour tracer les actions importantes
-- ================================================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL COMMENT 'Type d''entité (product, order, user, etc.)',
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

-- Utilisateurs de test
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, loyalty_points, email_verified) VALUES
('client@blossom.com', '$2a$10$YourHashedPasswordHere1', 'Marie', 'Dupont', '+33612345678', 'client', 150, TRUE),
('manager@blossom.com', '$2a$10$YourHashedPasswordHere2', 'Pierre', 'Martin', '+33687654321', 'manager', 0, TRUE),
('admin@blossom.com', '$2a$10$YourHashedPasswordHere3', 'Sophie', 'Bernard', '+33698765432', 'admin', 0, TRUE),
('jean.client@example.com', '$2a$10$YourHashedPasswordHere4', 'Jean', 'Client', '+33623456789', 'client', 75, TRUE),
('alice.user@example.com', '$2a$10$YourHashedPasswordHere5', 'Alice', 'User', '+33634567890', 'client', 200, TRUE);

-- Catégories
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
('Thés', 'thes', 'Sélection de thés premium du monde entier', 'Coffee', 1),
('Pâtisseries', 'patisseries', 'Pâtisseries françaises faites maison', 'Cake', 2),
('Boissons Chaudes', 'boissons-chaudes', 'Café, chocolat chaud et autres boissons', 'Coffee', 3),
('Salades', 'salades', 'Salades fraîches et healthy', 'Salad', 4),
('Snacks', 'snacks', 'Petites collations et gourmandises', 'Cookie', 5);

-- Produits
INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured, calories, preparation_time) VALUES
-- Thés
(1, 'Thé Vert Sencha', 'the-vert-sencha', 'Thé vert japonais aux notes fraîches et végétales', 4.50, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9', 50, TRUE, TRUE, 0, 5),
(1, 'Thé Noir Earl Grey', 'the-noir-earl-grey', 'Thé noir parfumé à la bergamote', 4.00, 'https://images.unsplash.com/photo-1597318112085-98a14be4c0a9', 45, TRUE, FALSE, 0, 5),
(1, 'Thé Blanc Pai Mu Tan', 'the-blanc-pai-mu-tan', 'Thé blanc délicat aux notes fleuries', 5.50, 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f', 30, TRUE, TRUE, 0, 5),

-- Pâtisseries
(2, 'Croissant au Beurre', 'croissant-au-beurre', 'Croissant pur beurre croustillant', 2.80, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a', 25, TRUE, TRUE, 220, 15),
(2, 'Macaron Framboise', 'macaron-framboise', 'Macaron à la framboise fraîche', 3.20, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43', 40, TRUE, FALSE, 85, 10),
(2, 'Tarte Citron', 'tarte-citron', 'Tarte au citron meringuée', 5.90, 'https://images.unsplash.com/photo-1519915212116-7cfef71f1d3e', 15, TRUE, TRUE, 320, 20),
(2, 'Éclair Chocolat', 'eclair-chocolat', 'Éclair au chocolat noir', 4.50, 'https://images.unsplash.com/photo-1612201078109-0f1d97b9ccd2', 20, TRUE, FALSE, 280, 15),

-- Boissons Chaudes
(3, 'Cappuccino', 'cappuccino', 'Espresso onctueux avec mousse de lait', 3.80, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d', 100, TRUE, TRUE, 120, 7),
(3, 'Chocolat Chaud', 'chocolat-chaud', 'Chocolat chaud maison avec crème fouettée', 4.20, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6', 80, TRUE, FALSE, 250, 8),
(3, 'Latte Vanille', 'latte-vanille', 'Café latte parfumé à la vanille', 4.50, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78', 90, TRUE, TRUE, 180, 7),

-- Salades
(4, 'Salade César', 'salade-cesar', 'Salade romaine, poulet, parmesan, croûtons', 8.90, 'https://images.unsplash.com/photo-1546793665-c74683f339c1', 20, TRUE, FALSE, 350, 12),
(4, 'Salade Chèvre Chaud', 'salade-chevre-chaud', 'Salade verte, chèvre chaud, miel, noix', 9.50, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd', 18, TRUE, TRUE, 380, 15),

-- Snacks
(5, 'Cookie Chocolat', 'cookie-chocolat', 'Cookie aux pépites de chocolat', 2.50, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e', 50, TRUE, FALSE, 180, 5),
(5, 'Muffin Myrtille', 'muffin-myrtille', 'Muffin moelleux aux myrtilles', 3.00, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa', 35, TRUE, TRUE, 220, 8);

-- Codes promo
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_uses, valid_until) VALUES
('WELCOME10', 'Réduction de bienvenue 10%', 'percentage', 10.00, 15.00, NULL, '2025-12-31 23:59:59'),
('SUMMER20', 'Promotion été 20%', 'percentage', 20.00, 25.00, 100, '2025-08-31 23:59:59'),
('VIP30', 'Réduction VIP 30%', 'percentage', 30.00, 50.00, 50, '2025-12-31 23:59:59'),
('FIRST5', 'Première commande -5€', 'fixed', 5.00, 20.00, 200, '2025-12-31 23:59:59');

-- Commandes de test
INSERT INTO orders (user_id, order_number, order_type, status, subtotal, discount_amount, tax_amount, total_amount, promo_code_id, payment_method, payment_status, table_number) VALUES
(1, 'ORD-2025-001', 'dine-in', 'served', 18.30, 1.83, 1.83, 18.30, 1, 'card', 'completed', 'T5'),
(1, 'ORD-2025-002', 'takeaway', 'ready', 12.50, 0, 1.25, 13.75, NULL, 'cash', 'completed', NULL),
(4, 'ORD-2025-003', 'dine-in', 'preparing', 25.80, 0, 2.58, 28.38, NULL, 'card', 'completed', 'T3'),
(5, 'ORD-2025-004', 'takeaway', 'pending', 8.40, 1.68, 0.67, 7.39, 2, 'stripe', 'pending', NULL);

-- Articles de commande
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES
-- Commande 1
(1, 1, 'Thé Vert Sencha', 1, 4.50, 4.50),
(1, 4, 'Croissant au Beurre', 2, 2.80, 5.60),
(1, 8, 'Cappuccino', 2, 3.80, 7.60),

-- Commande 2
(2, 6, 'Tarte Citron', 1, 5.90, 5.90),
(2, 13, 'Cookie Chocolat', 2, 2.50, 5.00),

-- Commande 3
(3, 11, 'Salade César', 2, 8.90, 17.80),
(3, 8, 'Cappuccino', 2, 3.80, 7.60),

-- Commande 4
(4, 5, 'Macaron Framboise', 2, 3.20, 6.40),
(4, 3, 'Thé Blanc Pai Mu Tan', 1, 5.50, 5.50);

-- Favoris
INSERT INTO favorites (user_id, product_id) VALUES
(1, 1),
(1, 4),
(1, 8),
(4, 6),
(4, 11),
(5, 3),
(5, 12);

-- Transactions de fidélité
INSERT INTO loyalty_transactions (user_id, order_id, points, transaction_type, description, balance_after) VALUES
(1, 1, 18, 'earned', 'Points gagnés sur commande ORD-2025-001', 18),
(1, 2, 13, 'earned', 'Points gagnés sur commande ORD-2025-002', 31),
(1, NULL, 50, 'bonus', 'Bonus inscription', 81),
(4, 3, 28, 'earned', 'Points gagnés sur commande ORD-2025-003', 28),
(5, NULL, 100, 'bonus', 'Bonus parrainage', 100);

-- Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, related_order_id) VALUES
(1, 'Commande prête', 'Votre commande ORD-2025-002 est prête à être récupérée', 'order', TRUE, 2),
(1, 'Points de fidélité', 'Vous avez gagné 18 points de fidélité', 'success', TRUE, 1),
(4, 'Commande en préparation', 'Votre commande ORD-2025-003 est en cours de préparation', 'order', FALSE, 3),
(5, 'Bienvenue', 'Bienvenue chez Blossom Café ! Profitez de -10% sur votre première commande avec le code WELCOME10', 'info', FALSE, NULL);

-- Avis
INSERT INTO reviews (user_id, product_id, order_id, rating, comment, is_verified_purchase) VALUES
(1, 1, 1, 5, 'Excellent thé vert, très frais et parfumé', TRUE),
(1, 4, 1, 5, 'Le meilleur croissant de la ville !', TRUE),
(1, 8, 1, 4, 'Très bon cappuccino, mousse onctueuse', TRUE),
(4, 11, 3, 5, 'Salade fraîche et généreuse', TRUE);

-- Paramètres
INSERT INTO settings (setting_key, setting_value, description, is_public) VALUES
('cafe_name', 'Blossom Café', 'Nom du café', TRUE),
('tax_rate', '10', 'Taux de TVA en pourcentage', FALSE),
('loyalty_points_rate', '1', 'Points de fidélité pour 1€ dépensé', FALSE),
('min_order_delivery', '15.00', 'Montant minimum pour livraison', TRUE),
('delivery_fee', '3.50', 'Frais de livraison', TRUE),
('opening_hours', '{"mon-fri": "8:00-19:00", "sat-sun": "9:00-18:00"}', 'Horaires d''ouverture', TRUE),
('contact_email', 'contact@blossomcafe.com', 'Email de contact', TRUE),
('contact_phone', '+33123456789', 'Téléphone de contact', TRUE);

-- ================================================================
-- VUES UTILES
-- ================================================================

-- Vue: Statistiques des produits
CREATE VIEW product_stats AS
SELECT 
    p.id,
    p.name,
    p.price,
    c.name AS category_name,
    COUNT(DISTINCT oi.id) AS total_orders,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
    COALESCE(SUM(oi.subtotal), 0) AS total_revenue,
    COALESCE(AVG(r.rating), 0) AS average_rating,
    COUNT(DISTINCT r.id) AS review_count,
    COUNT(DISTINCT f.id) AS favorite_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = TRUE
LEFT JOIN favorites f ON p.id = f.product_id
GROUP BY p.id, p.name, p.price, c.name;

-- Vue: Statistiques des commandes par utilisateur
CREATE VIEW user_order_stats AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.loyalty_points,
    COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_spent,
    COALESCE(AVG(o.total_amount), 0) AS average_order_value,
    MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'completed'
WHERE u.role = 'client'
GROUP BY u.id, u.email, u.first_name, u.last_name, u.loyalty_points;

-- Vue: Commandes du jour
CREATE VIEW today_orders AS
SELECT 
    o.id,
    o.order_number,
    o.order_type,
    o.status,
    o.total_amount,
    o.table_number,
    u.first_name,
    u.last_name,
    u.phone,
    o.created_at,
    o.estimated_ready_time
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE DATE(o.created_at) = CURDATE()
ORDER BY o.created_at DESC;

-- ================================================================
-- PROCÉDURES STOCKÉES UTILES
-- ================================================================

DELIMITER //

-- Procédure: Ajouter des points de fidélité
CREATE PROCEDURE add_loyalty_points(
    IN p_user_id INT,
    IN p_order_id INT,
    IN p_points INT,
    IN p_description VARCHAR(255)
)
BEGIN
    DECLARE v_new_balance INT;
    
    -- Calculer le nouveau solde
    SELECT loyalty_points INTO v_new_balance FROM users WHERE id = p_user_id;
    SET v_new_balance = v_new_balance + p_points;
    
    -- Mettre à jour le solde de l'utilisateur
    UPDATE users SET loyalty_points = v_new_balance WHERE id = p_user_id;
    
    -- Enregistrer la transaction
    INSERT INTO loyalty_transactions (user_id, order_id, points, transaction_type, description, balance_after)
    VALUES (p_user_id, p_order_id, p_points, 'earned', p_description, v_new_balance);
END //

-- Procédure: Mettre à jour le statut d'une commande
CREATE PROCEDURE update_order_status(
    IN p_order_id INT,
    IN p_new_status VARCHAR(20),
    IN p_user_id INT
)
BEGIN
    DECLARE v_old_status VARCHAR(20);
    DECLARE v_customer_id INT;
    
    -- Récupérer l'ancien statut et le client
    SELECT status, user_id INTO v_old_status, v_customer_id FROM orders WHERE id = p_order_id;
    
    -- Mettre à jour le statut
    UPDATE orders SET status = p_new_status, updated_at = CURRENT_TIMESTAMP WHERE id = p_order_id;
    
    -- Si la commande est terminée, marquer la date de complétion
    IF p_new_status = 'served' THEN
        UPDATE orders SET completed_at = CURRENT_TIMESTAMP WHERE id = p_order_id;
    END IF;
    
    -- Créer une notification pour le client
    INSERT INTO notifications (user_id, title, message, type, related_order_id)
    VALUES (
        v_customer_id,
        CONCAT('Commande ', p_new_status),
        CONCAT('Le statut de votre commande a été mis à jour: ', p_new_status),
        'order',
        p_order_id
    );
    
    -- Logger l'action
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (
        p_user_id,
        'update_status',
        'order',
        p_order_id,
        JSON_OBJECT('status', v_old_status),
        JSON_OBJECT('status', p_new_status)
    );
END //

-- Procédure: Mettre à jour le stock après une commande
CREATE PROCEDURE update_stock_after_order(
    IN p_order_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_product_id INT;
    DECLARE v_quantity INT;
    DECLARE v_old_stock INT;
    DECLARE v_new_stock INT;
    
    DECLARE cur CURSOR FOR 
        SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_product_id, v_quantity;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Récupérer le stock actuel
        SELECT stock INTO v_old_stock FROM products WHERE id = v_product_id;
        SET v_new_stock = v_old_stock - v_quantity;
        
        -- Mettre à jour le stock
        UPDATE products SET stock = v_new_stock WHERE id = v_product_id;
        
        -- Logger le changement
        INSERT INTO inventory_logs (product_id, user_id, previous_stock, new_stock, change_amount, change_type, notes)
        VALUES (v_product_id, p_user_id, v_old_stock, v_new_stock, -v_quantity, 'sale', CONCAT('Commande #', p_order_id));
    END LOOP;
    
    CLOSE cur;
END //

DELIMITER ;

-- ================================================================
-- TRIGGERS
-- ================================================================

DELIMITER //

-- Trigger: Incrémenter l'utilisation d'un code promo
CREATE TRIGGER increment_promo_usage
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    IF NEW.promo_code_id IS NOT NULL THEN
        UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = NEW.promo_code_id;
    END IF;
END //

-- Trigger: Calculer automatiquement le sous-total d'un article de commande
CREATE TRIGGER calculate_order_item_subtotal
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
    SET NEW.subtotal = NEW.quantity * NEW.unit_price;
END //

DELIMITER ;

-- ================================================================
-- INDEX SUPPLÉMENTAIRES POUR LES PERFORMANCES
-- ================================================================

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_date_status ON orders(created_at, status);
CREATE INDEX idx_products_category_available ON products(category_id, is_available);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ================================================================
-- TABLE DE TEST : test1
-- ================================================================
CREATE TABLE test1 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    valeur DECIMAL(10, 2) DEFAULT 0,
    est_actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nom (nom),
    INDEX idx_est_actif (est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques données de test dans test1
INSERT INTO test1 (nom, description, valeur, est_actif) VALUES
('Test Item 1', 'Premier élément de test', 10.50, TRUE),
('Test Item 2', 'Deuxième élément de test', 25.75, TRUE),
('Test Item 3', 'Troisième élément de test', 100.00, FALSE),
('Test Item 4', 'Quatrième élément de test', 50.25, TRUE),
('Test Item 5', 'Cinquième élément de test - inactif', 0.00, FALSE);

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================

SELECT 'Base de données Blossom Café créée avec succès !' AS message;
SELECT CONCAT('Nombre d''utilisateurs: ', COUNT(*)) AS users FROM users;
SELECT CONCAT('Nombre de produits: ', COUNT(*)) AS products FROM products;
SELECT CONCAT('Nombre de commandes: ', COUNT(*)) AS orders FROM orders;
SELECT CONCAT('Nombre d''éléments de test: ', COUNT(*)) AS test_items FROM test1;

