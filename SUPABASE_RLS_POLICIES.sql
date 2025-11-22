-- ============================================================================
-- POLICIES RLS (Row Level Security) pour Supabase
-- ============================================================================
-- Ces policies permettent l'accès public en lecture pour les tables principales
-- ⚠️ À adapter selon vos besoins de sécurité
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CATEGORIES - Lecture publique
-- ============================================================================
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
USING (is_active = 1);

-- ============================================================================
-- PRODUCTS - Lecture publique
-- ============================================================================
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
USING (is_available = 1);

-- ============================================================================
-- NEWS - Lecture publique
-- ============================================================================
CREATE POLICY "Allow public read access to news"
ON news FOR SELECT
USING (is_active = 1 AND is_visible = 1);

-- ============================================================================
-- PROMO_CODES - Lecture publique (pour validation)
-- ============================================================================
CREATE POLICY "Allow public read access to promo_codes"
ON promo_codes FOR SELECT
USING (is_active = 1);

-- ============================================================================
-- LOYALTY_REWARDS - Lecture publique
-- ============================================================================
CREATE POLICY "Allow public read access to loyalty_rewards"
ON loyalty_rewards FOR SELECT
USING (is_active = 1);

-- ============================================================================
-- ORDERS - Lecture et écriture pour utilisateurs authentifiés
-- ============================================================================
-- Permettre la création de commandes (pour kiosk et clients)
CREATE POLICY "Allow authenticated users to create orders"
ON orders FOR INSERT
WITH CHECK (true);

-- Permettre la lecture de ses propres commandes
CREATE POLICY "Allow users to read their own orders"
ON orders FOR SELECT
USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- ============================================================================
-- ORDER_ITEMS - Lecture et écriture liées aux commandes
-- ============================================================================
CREATE POLICY "Allow authenticated users to create order_items"
ON order_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow users to read order_items for their orders"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id::text = auth.uid()::text OR auth.role() = 'service_role')
  )
);

-- ============================================================================
-- USERS - Politique restrictive (lecture limitée)
-- ============================================================================
-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Allow users to read their own profile"
ON users FOR SELECT
USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. Ces policies permettent l'accès public en LECTURE pour les tables publiques
-- 2. Pour les opérations d'écriture (INSERT, UPDATE, DELETE), vous devrez créer
--    des policies plus restrictives selon vos besoins
-- 3. Le backend peut utiliser SERVICE_ROLE_KEY pour bypass RLS si nécessaire
-- 4. Testez ces policies dans Supabase Dashboard → Authentication → Policies

