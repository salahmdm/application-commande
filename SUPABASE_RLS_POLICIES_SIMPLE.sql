-- ============================================================================
-- POLICIES RLS SIMPLIFIÉES pour Supabase
-- ============================================================================
-- Version simplifiée : Accès public en lecture/écriture pour le kiosk
-- ⚠️ À utiliser uniquement si vous voulez un accès total sans authentification
-- ============================================================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow public read access to news" ON news;
DROP POLICY IF EXISTS "Allow public read access to promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Allow public read access to loyalty_rewards" ON loyalty_rewards;
DROP POLICY IF EXISTS "Allow public to create orders" ON orders;
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public to create order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public read access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public read access to users" ON users;

-- Activer RLS
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- CATEGORIES - Accès public total
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
USING (true);

-- PRODUCTS - Accès public total
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
USING (true);

-- NEWS - Accès public total
CREATE POLICY "Allow public read access to news"
ON news FOR SELECT
USING (true);

-- PROMO_CODES - Accès public total
CREATE POLICY "Allow public read access to promo_codes"
ON promo_codes FOR SELECT
USING (true);

-- LOYALTY_REWARDS - Accès public total
CREATE POLICY "Allow public read access to loyalty_rewards"
ON loyalty_rewards FOR SELECT
USING (true);

-- ORDERS - Création et lecture publiques
CREATE POLICY "Allow public to create orders"
ON orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public read access to orders"
ON orders FOR SELECT
USING (true);

-- ORDER_ITEMS - Création et lecture publiques
CREATE POLICY "Allow public to create order_items"
ON order_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public read access to order_items"
ON order_items FOR SELECT
USING (true);

-- USERS - Accès public (lecture seule pour sécurité)
CREATE POLICY "Allow public read access to users"
ON users FOR SELECT
USING (true);

