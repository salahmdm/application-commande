/**
 * Script pour corriger TOUTES les commandes au format CMD-XXXX
 * Met à jour même les commandes avec l'ancien format ORD-YYYY-XXXXXXXXXX
 */

const mysql = require('mysql2/promise');

async function fixAllOrderNumbers() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('🔄 Correction de TOUTES les numéros de commande au format CMD-XXXX...\n');

    // Récupérer l'index unique pour le supprimer temporairement
    const [indexInfo] = await connection.query(`
      SHOW INDEX FROM orders WHERE Key_name = 'order_number' OR Column_name = 'order_number'
    `);

    let indexName = null;
    if (indexInfo.length > 0) {
      indexName = indexInfo[0].Key_name || 'order_number';
      console.log(`📋 Index unique trouvé: ${indexName}\n`);
      console.log(`📝 Suppression temporaire de l'index unique...`);
      await connection.query(`ALTER TABLE orders DROP INDEX \`${indexName}\``);
      console.log('✅ Index supprimé\n');
    }

    // Récupérer toutes les commandes triées par date et heure
    const [allOrders] = await connection.query(`
      SELECT id, order_number, created_at
      FROM orders
      ORDER BY DATE(created_at) ASC, created_at ASC
    `);

    console.log(`📊 ${allOrders.length} commandes trouvées\n`);

    // Sauvegarder les anciens numéros
    const oldNumbers = {};
    allOrders.forEach(order => {
      oldNumbers[order.id] = order.order_number;
    });

    // Étape 1: Mettre TOUTES les commandes en temporaire (y compris celles avec CMD-XXXX ou ORD-)
    console.log('📝 Étape 1: Mise en temporaire de TOUTES les commandes...');
    
    for (const order of allOrders) {
      const tempNumber = `TEMP-${order.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await connection.query(
        'UPDATE orders SET order_number = ? WHERE id = ?',
        [tempNumber, order.id]
      );
    }
    
    console.log(`✅ ${allOrders.length} commandes mises en temporaire\n`);

    // Étape 2: Attribuer les nouveaux numéros par date
    console.log('📝 Étape 2: Attribution des nouveaux numéros (CMD-XXXX)...\n');
    
    const dateGroups = {};
    allOrders.forEach(order => {
      const dateStr = new Date(order.created_at).toISOString().split('T')[0];
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = [];
      }
      dateGroups[dateStr].push(order);
    });

    console.log(`📅 ${Object.keys(dateGroups).length} dates différentes\n`);

    const sortedDates = Object.keys(dateGroups).sort();
    
    for (const dateStr of sortedDates) {
      const orders = dateGroups[dateStr];
      console.log(`📅 Date: ${dateStr} (${orders.length} commandes)`);
      
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const sequence = String(i + 1).padStart(4, '0');
        const newOrderNumber = `CMD-${sequence}`;
        
        await connection.query(
          'UPDATE orders SET order_number = ? WHERE id = ?',
          [newOrderNumber, order.id]
        );
        
        const oldNumber = oldNumbers[order.id];
        if (i < 3 || i === orders.length - 1) {
          console.log(`  ✅ ID ${order.id}: ${oldNumber} → ${newOrderNumber}`);
        }
      }
      console.log('');
    }

    // Recréer l'index unique
    if (indexName) {
      console.log(`📝 Recréation de l'index unique...`);
      try {
        await connection.query(`ALTER TABLE orders ADD UNIQUE INDEX \`${indexName}\` (order_number)`);
        console.log('✅ Index recréé\n');
      } catch (error) {
        console.warn(`⚠️ Erreur lors de la recréation de l'index: ${error.message}`);
        console.warn('⚠️ L\'index unique devra être recréé manuellement');
      }
    }

    console.log('✅✅✅ Mise à jour terminée avec succès ! ✅✅✅\n');

    // Vérifier le résultat
    const [sample] = await connection.query(`
      SELECT 
        DATE(created_at) as date_commande,
        order_number,
        id,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log('📋 Résultat final (20 dernières commandes):');
    sample.forEach(order => {
      console.log(`  ${order.order_number} - ${order.date_commande} (ID: ${order.id})`);
    });

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
fixAllOrderNumbers()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'exécution:', error);
    process.exit(1);
  });

