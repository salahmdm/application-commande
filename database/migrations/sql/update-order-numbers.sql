-- ================================================================
-- Script pour mettre à jour les numéros de commande
-- Format: ORD-YYYY-XXXX (4 chiffres, réinitialisé chaque jour)
-- ================================================================

-- Mettre à jour les numéros de commande existants
-- Pour chaque jour, on renumérote les commandes séquentiellement

UPDATE orders o
SET o.order_number = CONCAT(
  'ORD-',
  YEAR(o.created_at),
  '-',
  LPAD(
    (
      SELECT COUNT(*) + 1
      FROM orders o2
      WHERE DATE(o2.created_at) = DATE(o.created_at)
      AND o2.id < o.id
    ),
    4,
    '0'
  )
)
WHERE o.order_number NOT LIKE 'ORD-%___-____' 
   OR o.order_number NOT REGEXP '^ORD-[0-9]{4}-[0-9]{4}$';

-- Vérifier le résultat
SELECT 
  DATE(created_at) as date_commande,
  order_number,
  id,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

