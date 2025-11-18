-- ================================================================
-- Migration : Workflow de paiement multi-méthodes
-- Date      : 2025-11-07
-- Objectif  : ajouter le support des paiements multiples et des montants
-- ================================================================

START TRANSACTION;

-- Ajouter des colonnes pour suivre les montants encaissés et le rendu
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER total_amount,
  ADD COLUMN IF NOT EXISTS change_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER amount_paid,
  ADD COLUMN IF NOT EXISTS payment_details JSON NULL AFTER payment_status;

-- Étendre la liste des méthodes de paiement pour inclure le mode mixte
ALTER TABLE orders
  MODIFY COLUMN payment_method ENUM('cash','card','stripe','paypal','mixed') NOT NULL DEFAULT 'cash';

-- Table détaillant les paiements successifs associés à une commande
CREATE TABLE IF NOT EXISTS order_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  method ENUM('cash','card','stripe','paypal','mixed','voucher','other','check','transfer') NOT NULL DEFAULT 'cash',
  amount DECIMAL(10, 2) NOT NULL,
  reference VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_payments_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mise à jour des commandes existantes pour aligner les montants encaissés
UPDATE orders
SET amount_paid = total_amount,
    change_amount = 0
WHERE payment_status = 'completed'
  AND (amount_paid IS NULL OR amount_paid = 0);

COMMIT;

