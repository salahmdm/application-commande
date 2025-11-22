-- ============================================================================
-- SCHÉMA DE LA BASE DE DONNÉES: BLOSSOM_CAFE
-- Exporté pour Supabase (PostgreSQL)
-- Date d'export: 22/11/2025
-- Source: MySQL (127.0.0.1:3306)
-- ============================================================================

-- Note: Ce schéma a été converti depuis MySQL vers PostgreSQL
-- Ordre de création corrigé pour respecter les dépendances

-- ============================================================================
-- ÉTAPE 1 : Tables sans dépendances (tables de référence)
-- ============================================================================

-- Table: categories
CREATE TABLE IF NOT EXISTS "categories" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "icon" VARCHAR(50),
  "display_order" INTEGER DEFAULT 0,
  "is_active" SMALLINT DEFAULT 1,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("name"),
  UNIQUE ("slug")
);

-- Table: settings
CREATE TABLE IF NOT EXISTS "settings" (
  "id" SERIAL NOT NULL,
  "setting_key" VARCHAR(100) NOT NULL,
  "setting_value" TEXT NOT NULL,
  "description" VARCHAR(255),
  "is_public" SMALLINT DEFAULT 0,
  "updated_by" INTEGER,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("setting_key")
);

-- Table: app_settings
CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" SERIAL NOT NULL,
  "setting_key" VARCHAR(100) NOT NULL,
  "setting_value" TEXT NOT NULL,
  "setting_type" VARCHAR(255) DEFAULT 'string',
  "description" VARCHAR(255),
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("setting_key")
);

ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_setting_type_check" CHECK ("setting_type" IN ('boolean', 'string', 'number', 'json'));

-- Table: inventory
CREATE TABLE IF NOT EXISTS "inventory" (
  "id" SERIAL NOT NULL,
  "ingredient_name" VARCHAR(100) NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "unit" VARCHAR(20) NOT NULL DEFAULT 'kg',
  "threshold" DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  "price_per_unit" DECIMAL(10,2) DEFAULT 0.00,
  "supplier" VARCHAR(100),
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Table: promo_codes
CREATE TABLE IF NOT EXISTS "promo_codes" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "description" VARCHAR(255),
  "discount_type" VARCHAR(255) NOT NULL,
  "discount_value" DECIMAL(10,2) NOT NULL,
  "min_order_amount" DECIMAL(10,2) DEFAULT 0.00,
  "max_uses" INTEGER,
  "uses_count" INTEGER DEFAULT 0,
  "valid_from" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "valid_until" TIMESTAMP,
  "is_active" SMALLINT DEFAULT 1,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("code")
);

ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_discount_type_check" CHECK ("discount_type" IN ('percentage', 'fixed'));

-- Table: news
CREATE TABLE IF NOT EXISTS "news" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "date" VARCHAR(100),
  "image_url" VARCHAR(500),
  "icon" VARCHAR(10) DEFAULT '?',
  "gradient" VARCHAR(100) DEFAULT 'from-purple-500 to-indigo-600',
  "bg_pattern" VARCHAR(255),
  "size" VARCHAR(255) DEFAULT 'normal',
  "is_visible" SMALLINT DEFAULT 1,
  "is_active" SMALLINT DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "is_new" SMALLINT DEFAULT 0,
  PRIMARY KEY ("id")
);

ALTER TABLE "news" ADD CONSTRAINT "news_size_check" CHECK ("size" IN ('normal', 'large', 'extra-large'));

-- ============================================================================
-- ÉTAPE 2 : Table users (nécessaire pour les autres tables)
-- ============================================================================

-- Table: users
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(100) NOT NULL,
  "last_name" VARCHAR(100) NOT NULL,
  "client_identifier" VARCHAR(11),
  "phone" VARCHAR(20),
  "role" VARCHAR(255) NOT NULL DEFAULT 'client',
  "loyalty_points" INTEGER DEFAULT 0,
  "avatar_url" VARCHAR(500),
  "is_active" SMALLINT DEFAULT 1,
  "email_verified" SMALLINT DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "last_login" TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("email"),
  UNIQUE ("client_identifier")
);

ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('client', 'manager', 'admin', 'kiosk'));

-- Mettre à jour settings pour ajouter la clé étrangère vers users
ALTER TABLE "settings" ADD CONSTRAINT "settings_ibfk_1" FOREIGN KEY ("updated_by") REFERENCES "users" ("id");

-- ============================================================================
-- ÉTAPE 3 : Tables dépendant de categories
-- ============================================================================

-- Table: ingredients
CREATE TABLE IF NOT EXISTS "ingredients" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "category_id" INTEGER,
  "category_inventory" VARCHAR(50) DEFAULT 'Autres',
  "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "unit" VARCHAR(20) NOT NULL DEFAULT 'kg',
  "price_per_unit" DECIMAL(10,2) DEFAULT 0.00,
  "min_quantity" DECIMAL(10,2) DEFAULT 0.00,
  "supplier" VARCHAR(255),
  "description" TEXT,
  "is_available" SMALLINT DEFAULT 1,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("slug"),
  CONSTRAINT "ingredients_ibfk_1" FOREIGN KEY ("category_id") REFERENCES "categories" ("id")
);

-- Table: products
CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL NOT NULL,
  "category_id" INTEGER NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "slug" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "image_url" VARCHAR(500),
  "stock" INTEGER DEFAULT 0,
  "is_available" SMALLINT DEFAULT 1,
  "is_featured" SMALLINT DEFAULT 0,
  "calories" INTEGER,
  "preparation_time" INTEGER,
  "allergens" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "min_stock" INTEGER DEFAULT 0,
  "deleted_at" TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("slug"),
  CONSTRAINT "products_ibfk_1" FOREIGN KEY ("category_id") REFERENCES "categories" ("id")
);

-- ============================================================================
-- ÉTAPE 4 : Tables dépendant de users et products
-- ============================================================================

-- Table: favorites
CREATE TABLE IF NOT EXISTS "favorites" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "favorites_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
  CONSTRAINT "favorites_ibfk_2" FOREIGN KEY ("product_id") REFERENCES "products" ("id")
);

-- Table: refresh_tokens
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "token" VARCHAR(500) NOT NULL,
  "expires_at" DATE NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" DATE,
  PRIMARY KEY ("id"),
  UNIQUE ("token"),
  CONSTRAINT "refresh_tokens_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

-- Table: shopping_list
CREATE TABLE IF NOT EXISTS "shopping_list" (
  "id" SERIAL NOT NULL,
  "ingredient_id" INTEGER NOT NULL,
  "quantity_needed" DECIMAL(10,2) NOT NULL,
  "unit" VARCHAR(50),
  "added_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "added_by" INTEGER,
  "status" VARCHAR(255) DEFAULT 'pending',
  "notes" TEXT,
  "priority" VARCHAR(255) DEFAULT 'medium',
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "shopping_list_ibfk_1" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id")
);

ALTER TABLE "shopping_list" ADD CONSTRAINT "shopping_list_status_check" CHECK ("status" IN ('pending', 'ordered', 'received'));
ALTER TABLE "shopping_list" ADD CONSTRAINT "shopping_list_priority_check" CHECK ("priority" IN ('low', 'medium', 'high', 'urgent'));

-- Table: loyalty_rewards
CREATE TABLE IF NOT EXISTS "loyalty_rewards" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "points_required" INTEGER NOT NULL DEFAULT 0,
  "reward_type" VARCHAR(255) NOT NULL DEFAULT 'percentage',
  "discount_value" DECIMAL(10,2) DEFAULT 0.00,
  "product_id" INTEGER,
  "is_active" SMALLINT DEFAULT 1,
  "sort_order" INTEGER DEFAULT 0,
  "icon" VARCHAR(50) DEFAULT '?',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "loyalty_rewards_ibfk_1" FOREIGN KEY ("product_id") REFERENCES "products" ("id")
);

ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_reward_type_check" CHECK ("reward_type" IN ('percentage', 'product', 'fixed'));

-- Table: inventory_logs
CREATE TABLE IF NOT EXISTS "inventory_logs" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "previous_stock" INTEGER NOT NULL,
  "new_stock" INTEGER NOT NULL,
  "change_amount" INTEGER NOT NULL,
  "change_type" VARCHAR(255) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "inventory_logs_ibfk_1" FOREIGN KEY ("product_id") REFERENCES "products" ("id"),
  CONSTRAINT "inventory_logs_ibfk_2" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_change_type_check" CHECK ("change_type" IN ('purchase', 'sale', 'adjustment', 'return', 'waste'));

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER,
  "action" VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" INTEGER NOT NULL,
  "old_values" JSONB,
  "new_values" JSONB,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "audit_logs_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

-- ============================================================================
-- ÉTAPE 5 : Tables dépendant de users et promo_codes (orders)
-- ============================================================================

-- Table: orders
CREATE TABLE IF NOT EXISTS "orders" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "order_number" VARCHAR(50) NOT NULL,
  "order_type" VARCHAR(255) NOT NULL,
  "status" VARCHAR(255) NOT NULL DEFAULT 'pending',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "discount_amount" DECIMAL(10,2) DEFAULT 0.00,
  "tax_amount" DECIMAL(10,2) DEFAULT 0.00,
  "total_amount" DECIMAL(10,2) NOT NULL,
  "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "change_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "promo_code_id" INTEGER,
  "payment_method" VARCHAR(255) NOT NULL DEFAULT 'cash',
  "payment_status" VARCHAR(255) NOT NULL DEFAULT 'pending',
  "payment_details" JSONB,
  "notes" TEXT,
  "table_number" VARCHAR(20),
  "delivery_address" TEXT,
  "estimated_ready_time" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "taken_at" TIMESTAMP,
  "prepared_at" TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "orders_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
  CONSTRAINT "orders_ibfk_2" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes" ("id")
);

ALTER TABLE "orders" ADD CONSTRAINT "orders_order_type_check" CHECK ("order_type" IN ('dine-in', 'takeaway', 'delivery'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_check" CHECK ("status" IN ('pending', 'preparing', 'ready', 'served', 'cancelled'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_check" CHECK ("payment_method" IN ('cash', 'card', 'stripe', 'paypal', 'mixed'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_status_check" CHECK ("payment_status" IN ('pending', 'completed', 'failed', 'refunded'));

-- ============================================================================
-- ÉTAPE 6 : Tables dépendant de orders
-- ============================================================================

-- Table: order_items
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" SERIAL NOT NULL,
  "order_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "product_name" VARCHAR(200) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "special_instructions" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "order_items_ibfk_1" FOREIGN KEY ("order_id") REFERENCES "orders" ("id"),
  CONSTRAINT "order_items_ibfk_2" FOREIGN KEY ("product_id") REFERENCES "products" ("id")
);

-- Table: order_payments
CREATE TABLE IF NOT EXISTS "order_payments" (
  "id" SERIAL NOT NULL,
  "order_id" INTEGER NOT NULL,
  "method" VARCHAR(255) NOT NULL DEFAULT 'cash',
  "amount" DECIMAL(10,2) NOT NULL,
  "reference" VARCHAR(100),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "order_payments_ibfk_1" FOREIGN KEY ("order_id") REFERENCES "orders" ("id")
);

ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_method_check" CHECK ("method" IN ('cash', 'card', 'stripe', 'paypal', 'mixed', 'voucher', 'other', 'check', 'transfer'));

-- Table: notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(255) NOT NULL DEFAULT 'info',
  "is_read" SMALLINT DEFAULT 0,
  "related_order_id" INTEGER,
  "action_url" VARCHAR(500),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "notifications_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
  CONSTRAINT "notifications_ibfk_2" FOREIGN KEY ("related_order_id") REFERENCES "orders" ("id")
);

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_type_check" CHECK ("type" IN ('info', 'success', 'warning', 'error', 'order'));

-- Table: loyalty_transactions
CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "order_id" INTEGER,
  "points" INTEGER NOT NULL,
  "transaction_type" VARCHAR(255) NOT NULL,
  "description" VARCHAR(255),
  "balance_after" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "loyalty_transactions_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
  CONSTRAINT "loyalty_transactions_ibfk_2" FOREIGN KEY ("order_id") REFERENCES "orders" ("id")
);

ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_transaction_type_check" CHECK ("transaction_type" IN ('earned', 'redeemed', 'bonus', 'expired', 'adjustment'));

-- Table: reviews
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "order_id" INTEGER,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "is_verified_purchase" SMALLINT DEFAULT 0,
  "is_approved" SMALLINT DEFAULT 1,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "reviews_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
  CONSTRAINT "reviews_ibfk_2" FOREIGN KEY ("product_id") REFERENCES "products" ("id"),
  CONSTRAINT "reviews_ibfk_3" FOREIGN KEY ("order_id") REFERENCES "orders" ("id")
);

