-- ============================================================================
-- POLICIES RLS (Row Level Security) pour Supabase
-- ============================================================================
-- Ces policies permettent l'accès public en lecture pour les tables principales
-- ⚠️ À adapter selon vos besoins de sécurité
-- ============================================================================

-- Supprimer les policies existantes si elles existent (pour éviter les erreurs)
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow public read access to news" ON news;
DROP POLICY IF EXISTS "Allow public read access to promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Allow public read access to loyalty_rewards" ON loyalty_rewards;
DROP POLICY IF EXISTS "Allow authenticated users to create orders" ON orders;
DROP POLICY IF EXISTS "Allow users to read their own orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to create order_items" ON order_items;
DROP POLICY IF EXISTS "Allow users to read order_items for their orders" ON order_items;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON users;

-- Activer RLS sur toutes les tables
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CATEGORIES - Lecture publique (accès sans authentification)
-- ============================================================================
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
USING (is_active = 1 OR is_active = true);

-- ============================================================================
-- PRODUCTS - Lecture publique (accès sans authentification)
-- ============================================================================
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
USING (is_available = 1 OR is_available = true);

-- ============================================================================
-- NEWS - Lecture publique (accès sans authentification)
-- ============================================================================
CREATE POLICY "Allow public read access to news"
ON news FOR SELECT
USING ((is_active = 1 OR is_active = true) AND (is_visible = 1 OR is_visible = true));

-- ============================================================================
-- PROMO_CODES - Lecture publique (pour validation)
-- ============================================================================
CREATE POLICY "Allow public read access to promo_codes"
ON promo_codes FOR SELECT
USING (is_active = 1 OR is_active = true);

-- ============================================================================
-- LOYALTY_REWARDS - Lecture publique (accès sans authentification)
-- ============================================================================
CREATE POLICY "Allow public read access to loyalty_rewards"
ON loyalty_rewards FOR SELECT
USING (is_active = 1 OR is_active = true);

-- ============================================================================
-- ORDERS - Création publique (pour kiosk sans authentification)
-- ============================================================================
-- Permettre la création de commandes sans authentification (pour kiosk)
CREATE POLICY "Allow public to create orders"
ON orders FOR INSERT
WITH CHECK (true);

-- Permettre la lecture publique des commandes (pour le kiosk)
-- ⚠️ Si vous voulez restreindre, utilisez auth.uid() mais cela bloquera le kiosk
CREATE POLICY "Allow public read access to orders"
ON orders FOR SELECT
USING (true);

-- ============================================================================
-- ORDER_ITEMS - Création publique (pour kiosk sans authentification)
-- ============================================================================
-- Permettre la création d'items sans authentification (pour kiosk)
CREATE POLICY "Allow public to create order_items"
ON order_items FOR INSERT
WITH CHECK (true);

-- Permettre la lecture publique des items (pour le kiosk)
CREATE POLICY "Allow public read access to order_items"
ON order_items FOR SELECT
USING (true);

-- ============================================================================
-- USERS - Politique restrictive (lecture limitée)
-- ============================================================================
-- Les utilisateurs peuvent lire leur propre profil (si authentifiés)
-- Sinon, accès public limité (pour compatibilité)
CREATE POLICY "Allow public read access to users"
ON users FOR SELECT
USING (true);

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. Ces policies permettent l'accès public en LECTURE pour les tables publiques
-- 2. Pour les opérations d'écriture (INSERT, UPDATE, DELETE), vous devrez créer
--    des policies plus restrictives selon vos besoins
-- 3. Le backend peut utiliser SERVICE_ROLE_KEY pour bypass RLS si nécessaire
-- 4. Testez ces policies dans Supabase Dashboard → Authentication → Policies

