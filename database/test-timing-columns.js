/**
 * Script pour tester et vérifier les colonnes de temps
 */

const mysql = require('mysql2/promise');

async function testTimingColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('📊 Test des colonnes de temps...\n');

    // Vérifier les colonnes
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'blossom_cafe' 
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME IN ('taken_at', 'prepared_at', 'created_at')
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 Colonnes de temps:');
    columns.forEach(col => {
      console.log(`  ✅ ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Vérifier quelques commandes récentes
    const [orders] = await connection.query(`
      SELECT 
        id,
        order_number,
        status,
        created_at,
        taken_at,
        prepared_at,
        CASE 
          WHEN taken_at IS NOT NULL AND created_at IS NOT NULL 
          THEN TIMESTAMPDIFF(SECOND, created_at, taken_at)
          ELSE NULL
        END as prise_en_charge_secondes,
        CASE 
          WHEN prepared_at IS NOT NULL AND taken_at IS NOT NULL 
          THEN TIMESTAMPDIFF(SECOND, taken_at, prepared_at)
          ELSE NULL
        END as preparation_secondes
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('\n📋 Commandes récentes:');
    orders.forEach(order => {
      console.log(`\n  Commande #${order.order_number} (ID: ${order.id})`);
      console.log(`    Statut: ${order.status}`);
      console.log(`    Créée: ${order.created_at}`);
      console.log(`    Prise en charge: ${order.taken_at || 'Non encore prise en charge'}`);
      console.log(`    Préparation terminée: ${order.prepared_at || 'Non encore terminée'}`);
      
      if (order.prise_en_charge_secondes !== null) {
        const minutes = Math.floor(order.prise_en_charge_secondes / 60);
        const secondes = order.prise_en_charge_secondes % 60;
        console.log(`    ⏱️ Temps de prise en charge: ${minutes}m ${secondes}s`);
      }
      
      if (order.preparation_secondes !== null) {
        const minutes = Math.floor(order.preparation_secondes / 60);
        const secondes = order.preparation_secondes % 60;
        console.log(`    ⏱️ Temps de préparation: ${minutes}m ${secondes}s`);
      }
    });

    console.log('\n✅✅✅ Test terminé ! ✅✅✅\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le script
testTimingColumns()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'exécution:', error);
    process.exit(1);
  });

