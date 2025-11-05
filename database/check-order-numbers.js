/**
 * Script pour vérifier les numéros de commande actuels
 */

const mysql = require('mysql2/promise');

async function checkOrderNumbers() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    const [orders] = await connection.query(`
      SELECT 
        id,
        order_number,
        DATE(created_at) as date_commande,
        created_at
      FROM orders
      ORDER BY created_at ASC
    `);

    console.log('📊 État actuel des numéros de commande:\n');
    orders.forEach(order => {
      console.log(`  ID: ${order.id} | ${order.order_number} | Date: ${order.date_commande}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkOrderNumbers();

