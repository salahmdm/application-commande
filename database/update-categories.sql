-- ================================================================
-- MISE À JOUR DES CATÉGORIES - Blossom Café
-- Nouvelles catégories: Boissons chaudes, froides, Délices salés/sucrés
-- ================================================================

USE blossom_cafe;

-- Supprimer les anciennes catégories et produits associés
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- NOUVELLES CATÉGORIES
-- ================================================================

INSERT INTO categories (id, name, slug, description, icon, display_order, is_active) VALUES
(1, 'Boissons Chaudes', 'boissons-chaudes', 'Cafés, thés et chocolats chauds', '☕', 1, TRUE),
(2, 'Boissons Froides', 'boissons-froides', 'Jus, smoothies et boissons glacées', '🥤', 2, TRUE),
(3, 'Délices Salés', 'delices-sales', 'Sandwichs, salades et quiches', '🥐', 3, TRUE),
(4, 'Délices Sucrés', 'delices-sucres', 'Pâtisseries, gâteaux et desserts', '🍰', 4, TRUE);

-- ================================================================
-- PRODUITS PAR CATÉGORIE
-- ================================================================

-- Boissons Chaudes
INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured) VALUES
(1, 'Espresso', 'espresso', 'Café corsé et intense', 2.50, NULL, 100, TRUE, FALSE),
(1, 'Cappuccino', 'cappuccino', 'Espresso avec mousse de lait onctueuse', 3.80, NULL, 100, TRUE, TRUE),
(1, 'Latte', 'latte', 'Café doux avec lait chaud', 4.20, NULL, 100, TRUE, FALSE),
(1, 'Thé Vert', 'the-vert', 'Thé vert bio du Japon', 3.50, NULL, 80, TRUE, FALSE),
(1, 'Thé Noir', 'the-noir', 'Thé noir Earl Grey premium', 3.50, NULL, 80, TRUE, FALSE),
(1, 'Chocolat Chaud', 'chocolat-chaud', 'Chocolat belge onctueux', 4.50, NULL, 60, TRUE, TRUE);

-- Boissons Froides
INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured) VALUES
(2, 'Café Glacé', 'cafe-glace', 'Café froid avec glaçons', 4.50, NULL, 80, TRUE, TRUE),
(2, 'Smoothie Fruits Rouges', 'smoothie-fruits-rouges', 'Fraises, framboises et myrtilles', 5.50, NULL, 50, TRUE, FALSE),
(2, 'Jus d\'Orange Pressé', 'jus-orange', 'Oranges fraîches pressées à la commande', 4.80, NULL, 60, TRUE, FALSE),
(2, 'Limonade Maison', 'limonade-maison', 'Citrons frais, menthe et miel', 4.20, NULL, 70, TRUE, FALSE),
(2, 'Thé Glacé', 'the-glace', 'Thé vert glacé au citron', 4.00, NULL, 80, TRUE, FALSE);

-- Délices Salés
INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured) VALUES
(3, 'Croissant Jambon Fromage', 'croissant-jambon-fromage', 'Croissant garni jambon et emmental', 5.50, NULL, 40, TRUE, TRUE),
(3, 'Sandwich Poulet Avocat', 'sandwich-poulet-avocat', 'Pain complet, poulet grillé et avocat', 7.80, NULL, 30, TRUE, FALSE),
(3, 'Quiche Lorraine', 'quiche-lorraine', 'Quiche aux lardons et gruyère', 6.50, NULL, 25, TRUE, FALSE),
(3, 'Salade César', 'salade-cesar', 'Salade verte, poulet, parmesan et croûtons', 8.50, NULL, 20, TRUE, FALSE),
(3, 'Croque Monsieur', 'croque-monsieur', 'Jambon, fromage et béchamel gratinée', 6.80, NULL, 35, TRUE, FALSE);

-- Délices Sucrés
INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured) VALUES
(4, 'Croissant Nature', 'croissant-nature', 'Croissant pur beurre artisanal', 2.80, NULL, 50, TRUE, TRUE),
(4, 'Pain au Chocolat', 'pain-au-chocolat', 'Viennoiserie au chocolat noir', 3.20, NULL, 50, TRUE, FALSE),
(4, 'Éclair au Chocolat', 'eclair-chocolat', 'Pâte à choux, crème pâtissière et glaçage chocolat', 4.50, NULL, 30, TRUE, FALSE),
(4, 'Tarte aux Fraises', 'tarte-fraises', 'Pâte sablée, crème pâtissière et fraises fraîches', 5.80, NULL, 20, TRUE, TRUE),
(4, 'Macaron Assortiment', 'macaron-assortiment', 'Assortiment de 6 macarons parfums variés', 8.50, NULL, 40, TRUE, FALSE),
(4, 'Cheesecake New York', 'cheesecake', 'Cheesecake crémeux sur base spéculoos', 6.50, NULL, 25, TRUE, FALSE),
(4, 'Brownie au Chocolat', 'brownie', 'Brownie fondant au chocolat belge', 4.80, NULL, 35, TRUE, FALSE);

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Afficher les catégories
SELECT 
    id, 
    name, 
    slug, 
    icon,
    (SELECT COUNT(*) FROM products WHERE category_id = categories.id) as nb_produits
FROM categories
ORDER BY display_order;

-- Afficher les produits par catégorie
SELECT 
    c.name as categorie,
    p.name as produit,
    p.price as prix,
    p.is_featured as populaire
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY c.display_order, p.name;

