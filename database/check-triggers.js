/**
 * Script pour vérifier les triggers MySQL qui pourraient modifier order_number
 */

const mysql = require('mysql2/promise');

async function checkTriggers() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('🔍 Vérification des triggers MySQL...\n');

    // Vérifier les triggers
    const [triggers] = await connection.query('SHOW TRIGGERS');
    
    console.log(`📊 ${triggers.length} trigger(s) trouvé(s)\n`);
    
    for (const trigger of triggers) {
      console.log(`Trigger: ${trigger.Trigger}`);
      console.log(`  - Event: ${trigger.Event}`);
      console.log(`  - Table: ${trigger.Table}`);
      console.log(`  - Timing: ${trigger.Timing}`);
      console.log('');
    }

    // Vérifier les triggers qui touchent orders
    const orderTriggers = triggers.filter(t => t.Table === 'orders');
    if (orderTriggers.length > 0) {
      console.log('⚠️ Triggers sur la table orders:');
      for (const trigger of orderTriggers) {
        console.log(`  - ${trigger.Trigger} (${trigger.Event})`);
        // Récupérer le code du trigger
        const [triggerCode] = await connection.query(
          `SHOW CREATE TRIGGER ${trigger.Trigger}`
        );
        if (triggerCode.length > 0) {
          const code = triggerCode[0]['SQL Original Statement'];
          if (code.includes('order_number')) {
            console.log(`    ⚠️ Ce trigger modifie order_number!`);
            console.log(`    Code: ${code.substring(0, 200)}...`);
          }
        }
      }
    } else {
      console.log('✅ Aucun trigger sur la table orders\n');
    }

    // Vérifier les dernières commandes
    console.log('\n📋 Dernières commandes créées:');
    const [recentOrders] = await connection.query(
      `SELECT id, order_number, created_at 
       FROM orders 
       ORDER BY id DESC 
       LIMIT 5`
    );
    
    for (const order of recentOrders) {
      const format = order.order_number.startsWith('CMD-') ? '✅ CMD-XXXX' : '❌ ORD-YYYY-...';
      console.log(`  ID ${order.id}: ${order.order_number} (${format}) - ${order.created_at}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTriggers()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
