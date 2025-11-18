const mysql = require('mysql2/promise');

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
    ['blossom_cafe', table, column]
  );
  return rows.length > 0;
}

async function runMigration() {
  let connection;

  try {
    // Utiliser la configuration centralisée depuis config.js
    require('dotenv').config();
    const configModule = require('../config');
    connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });

    console.log('🚀 Migration payment_workflow : démarrage');

    if (!(await columnExists(connection, 'orders', 'amount_paid'))) {
      console.log('➕ Ajout colonne orders.amount_paid');
      await connection.query(
        'ALTER TABLE orders ADD COLUMN amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER total_amount'
      );
    }

    if (!(await columnExists(connection, 'orders', 'change_amount'))) {
      console.log('➕ Ajout colonne orders.change_amount');
      await connection.query(
        'ALTER TABLE orders ADD COLUMN change_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER amount_paid'
      );
    }

    if (!(await columnExists(connection, 'orders', 'payment_details'))) {
      console.log('➕ Ajout colonne orders.payment_details');
      await connection.query(
        'ALTER TABLE orders ADD COLUMN payment_details JSON NULL AFTER payment_status'
      );
    }

    console.log('🛠️ Mise à jour de la colonne orders.payment_method');
    await connection.query(
      "ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cash','card','stripe','paypal','mixed') NOT NULL DEFAULT 'cash'"
    );

    console.log('🧾 Vérification de la table order_payments');
    await connection.query(`
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
    `);

    console.log('🧮 Mise à jour des montants existants');
    await connection.query(`
      UPDATE orders
      SET amount_paid = total_amount,
          change_amount = 0
      WHERE payment_status = 'completed'
        AND (amount_paid IS NULL OR amount_paid = 0)
    `);

    console.log('✅ Migration terminée avec succès.');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();

