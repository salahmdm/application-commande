-- ================================================================
-- AJOUT DE PRODUITS D'INVENTAIRE POUR SALON DE THÉ
-- 10 produits par catégorie (Boissons Chaudes, Boissons Froides, Délices Salés, Délices Sucrés)
-- ================================================================

-- Boissons Chaudes (10 produits)
INSERT INTO products (name, category, description, price, stock, min_stock, available, image_url, created_at) VALUES
('Thé Vert Sencha', 'Boissons Chaudes', 'Thé vert japonais traditionnel', 4.50, 45, 10, 1, '/uploads/the-vert.jpg', NOW()),
('Thé Noir Earl Grey', 'Boissons Chaudes', 'Thé noir aromatisé à la bergamote', 4.50, 38, 10, 1, '/uploads/earl-grey.jpg', NOW()),
('Thé Jasmin', 'Boissons Chaudes', 'Thé vert parfumé au jasmin', 5.00, 32, 10, 1, '/uploads/jasmin.jpg', NOW()),
('Thé Blanc Pai Mu Tan', 'Boissons Chaudes', 'Thé blanc délicat aux notes florales', 6.50, 25, 8, 1, '/uploads/the-blanc.jpg', NOW()),
('Matcha Latte', 'Boissons Chaudes', 'Latte au thé matcha premium', 5.50, 28, 10, 1, '/uploads/matcha-latte.jpg', NOW()),
('Café Espresso', 'Boissons Chaudes', 'Espresso italien corsé', 3.50, 50, 15, 1, '/uploads/espresso.jpg', NOW()),
('Cappuccino', 'Boissons Chaudes', 'Espresso avec mousse de lait', 4.50, 42, 12, 1, '/uploads/cappuccino.jpg', NOW()),
('Chocolat Chaud', 'Boissons Chaudes', 'Chocolat chaud onctueux', 4.00, 35, 10, 1, '/uploads/chocolat-chaud.jpg', NOW()),
('Infusion Menthe', 'Boissons Chaudes', 'Infusion fraîche à la menthe', 3.50, 40, 10, 1, '/uploads/menthe.jpg', NOW()),
('Chai Latte', 'Boissons Chaudes', 'Latte épicé aux saveurs indiennes', 5.00, 30, 10, 1, '/uploads/chai-latte.jpg', NOW());

-- Boissons Froides (10 produits)
INSERT INTO products (name, category, description, price, stock, min_stock, available, image_url, created_at) VALUES
('Thé Glacé Pêche', 'Boissons Froides', 'Thé noir glacé à la pêche', 4.50, 55, 12, 1, '/uploads/the-glace-peche.jpg', NOW()),
('Limonade Maison', 'Boissons Froides', 'Limonade fraîche artisanale', 4.00, 48, 12, 1, '/uploads/limonade.jpg', NOW()),
('Smoothie Fraise Banane', 'Boissons Froides', 'Smoothie onctueux aux fruits', 6.00, 30, 10, 1, '/uploads/smoothie-fraise.jpg', NOW()),
('Jus d''Orange Pressé', 'Boissons Froides', 'Jus d''orange 100% naturel', 5.00, 42, 10, 1, '/uploads/jus-orange.jpg', NOW()),
('Thé Glacé Citron', 'Boissons Froides', 'Thé vert glacé au citron', 4.50, 50, 12, 1, '/uploads/the-glace-citron.jpg', NOW()),
('Frappé Caramel', 'Boissons Froides', 'Café frappé au caramel', 5.50, 35, 10, 1, '/uploads/frappe-caramel.jpg', NOW()),
('Milkshake Vanille', 'Boissons Froides', 'Milkshake crémeux à la vanille', 5.50, 28, 8, 1, '/uploads/milkshake.jpg', NOW()),
('Eau Pétillante Aromatisée', 'Boissons Froides', 'Eau gazeuse aux fruits', 3.50, 60, 15, 1, '/uploads/eau-petillante.jpg', NOW()),
('Kombucha Gingembre', 'Boissons Froides', 'Boisson fermentée au gingembre', 6.00, 25, 8, 1, '/uploads/kombucha.jpg', NOW()),
('Thé Glacé Hibiscus', 'Boissons Froides', 'Infusion glacée aux fleurs d''hibiscus', 4.50, 38, 10, 1, '/uploads/the-hibiscus.jpg', NOW());

-- Délices Salés (10 produits)
INSERT INTO products (name, category, description, price, stock, min_stock, available, image_url, created_at) VALUES
('Croissant Jambon Fromage', 'Délices Salés', 'Croissant garni au jambon et emmental', 4.50, 20, 5, 1, '/uploads/croissant-jambon.jpg', NOW()),
('Quiche Lorraine', 'Délices Salés', 'Quiche traditionnelle aux lardons', 6.00, 15, 5, 1, '/uploads/quiche.jpg', NOW()),
('Sandwich Poulet Avocat', 'Délices Salés', 'Sandwich complet au poulet et avocat', 7.50, 18, 5, 1, '/uploads/sandwich-poulet.jpg', NOW()),
('Wrap Végétarien', 'Délices Salés', 'Wrap aux légumes grillés', 6.50, 22, 5, 1, '/uploads/wrap-vege.jpg', NOW()),
('Tarte Saumon Épinards', 'Délices Salés', 'Tarte fine au saumon fumé', 7.00, 12, 4, 1, '/uploads/tarte-saumon.jpg', NOW()),
('Bagel Cream Cheese', 'Délices Salés', 'Bagel au fromage frais et saumon', 6.00, 16, 5, 1, '/uploads/bagel.jpg', NOW()),
('Croque Monsieur', 'Délices Salés', 'Croque-monsieur traditionnel', 5.50, 25, 6, 1, '/uploads/croque.jpg', NOW()),
('Salade César', 'Délices Salés', 'Salade romaine au poulet grillé', 8.50, 10, 4, 1, '/uploads/salade-cesar.jpg', NOW()),
('Pizza Margherita', 'Délices Salés', 'Pizza tomate mozzarella basilic', 7.50, 14, 4, 1, '/uploads/pizza.jpg', NOW()),
('Soupe du Jour', 'Délices Salés', 'Soupe maison quotidienne', 5.00, 8, 3, 1, '/uploads/soupe.jpg', NOW());

-- Délices Sucrés (10 produits)
INSERT INTO products (name, category, description, price, stock, min_stock, available, image_url, created_at) VALUES
('Croissant au Beurre', 'Délices Sucrés', 'Croissant pur beurre artisanal', 2.50, 30, 8, 1, '/uploads/croissant.jpg', NOW()),
('Pain au Chocolat', 'Délices Sucrés', 'Viennoiserie au chocolat noir', 2.80, 28, 8, 1, '/uploads/pain-chocolat.jpg', NOW()),
('Éclair au Chocolat', 'Délices Sucrés', 'Éclair fourré à la crème pâtissière', 4.50, 18, 6, 1, '/uploads/eclair.jpg', NOW()),
('Macaron Assortiment', 'Délices Sucrés', 'Boîte de 6 macarons variés', 12.00, 25, 8, 1, '/uploads/macarons.jpg', NOW()),
('Tarte Citron Meringuée', 'Délices Sucrés', 'Tarte au citron avec meringue', 5.50, 12, 4, 1, '/uploads/tarte-citron.jpg', NOW()),
('Millefeuille', 'Délices Sucrés', 'Millefeuille crème vanille', 5.00, 15, 5, 1, '/uploads/millefeuille.jpg', NOW()),
('Cookie Chocolat', 'Délices Sucrés', 'Cookie moelleux aux pépites', 3.00, 40, 10, 1, '/uploads/cookie.jpg', NOW()),
('Brownie Chocolat Noix', 'Délices Sucrés', 'Brownie fondant aux noix', 4.00, 22, 6, 1, '/uploads/brownie.jpg', NOW()),
('Cheesecake Fruits Rouges', 'Délices Sucrés', 'Cheesecake coulis de fruits', 6.00, 10, 4, 1, '/uploads/cheesecake.jpg', NOW()),
('Muffin Myrtille', 'Délices Sucrés', 'Muffin moelleux aux myrtilles', 3.50, 35, 8, 1, '/uploads/muffin.jpg', NOW());

-- ================================================================
-- RÉSUMÉ
-- ================================================================
-- Total: 40 produits ajoutés
-- - Boissons Chaudes: 10 produits
-- - Boissons Froides: 10 produits
-- - Délices Salés: 10 produits
-- - Délices Sucrés: 10 produits
-- ================================================================

