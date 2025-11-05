/**
 * Script pour corriger les commandes récentes avec l'ancien format image.png
 */

const mysql = require('mysql2/promise');

async function fixRecentOrders() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('🔄 Correction des commandes récentes avec format ORD-...\n');

    // Récupérer toutes les commandes avec format ORD- d'aujourd'hui
    const [ordersWithOldFormat] = await connection.query(
      `SELECT id, order_number, created_at 
       FROM orders 
       WHERE DATE(created_at) = CURDATE() 
       AND order_number LIKE 'ORD-%'
       ORDER BY created_at ASC`
    );

    if (ordersWithOldFormat.length === 0) {
      console.log('✅ Aucune commande avec format ORD- trouvée aujourd\'hui');
      return;
    }

    console.log(`📊 ${ordersWithOldFormat.length} commande(s) avec format ORD- trouvée(s)\n`);

    // Récupérer le dernier numéro CMD- d'aujourd'hui
    const [lastCMD] = await connection.query(
      `SELECT MAX(CAST(SUBSTRING(order_number, 5) AS UNSIGNED)) as max_num
       FROM orders 
       WHERE DATE(created_at) = CURDATE() 
       AND order_number REGEXP '^CMD-[0-9]{4}$'`
    );

    let nextNumber = 1;
    if (lastCMD.length > 0 && lastCMD[0].max_num !== null) {
      nextNumber = parseInt(lastCMD[0].max_num, 10) + 1;
    }

    console.log(`📌 Prochain numéro CMD- à utiliser: CMD-${String(nextNumber).padStart(4, '0')}\n`);

    // Corriger chaque commande
    for (let i = 0; i < ordersWithOldFormat.length; i++) {
      const order = ordersWithOldFormat[i];
      const newOrderNumber = `CMD-${String(nextNumber + i).padStart(4, '0')}`;
      
      await connection.query(
        'UPDATE orders SET order_number = ? WHERE id = ?',
        [newOrderNumber, order.id]
      );
      
      console.log(`  ✅ ID ${order.id}: ${order.order_number} → ${newOrderNumber}`);
    }

    console.log(`\n✅✅✅ ${ordersWithOldFormat.length} commande(s) corrigée(s) ! ✅✅✅\n`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixRecentOrders()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
