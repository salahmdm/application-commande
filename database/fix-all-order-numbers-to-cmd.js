/**
 * Script pour corriger TOUTES les commandes au format CMD-XXXX
 * Met à jour même les commandes avec l'ancien format ORD-YYYY-XXXXXXXXXX
 */

const mysql = require('mysql2/promise');

async function fixAllOrderNumbersToCMD() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('🔄 Correction de TOUTES les commandes au format CMD-XXXX...\n');

    // Récupérer toutes les commandes triées par date
    const [allOrders] = await connection.query(
      'SELECT id, order_number, created_at FROM orders ORDER BY created_at ASC'
    );

    console.log(`📊 ${allOrders.length} commandes trouvées\n`);

    // Grouper par date
    const dateGroups = {};
    allOrders.forEach(order => {
      const dateStr = new Date(order.created_at).toISOString().split('T')[0];
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = [];
      }
      dateGroups[dateStr].push(order);
    });

    console.log(`📅 ${Object.keys(dateGroups).length} dates différentes\n`);

    // Traiter chaque date
    const sortedDates = Object.keys(dateGroups).sort();
    
    for (const dateStr of sortedDates) {
      const orders = dateGroups[dateStr];
      console.log(`📅 Date: ${dateStr} (${orders.length} commandes)`);
      
      // Mettre en temporaire toutes les commandes de cette date
      for (const order of orders) {
        const tempNumber = `TEMP-${order.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await connection.query(
          'UPDATE orders SET order_number = ? WHERE id = ?',
          [tempNumber, order.id]
        );
      }
      
      // Réattribuer les numéros CMD-XXXX pour cette date
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const sequence = String(i + 1).padStart(4, '0');
        const newOrderNumber = `CMD-${sequence}`;
        
        await connection.query(
          'UPDATE orders SET order_number = ? WHERE id = ?',
          [newOrderNumber, order.id]
        );
        
        if (i < 3 || i === orders.length - 1 || !order.order_number.startsWith('CMD-')) {
          console.log(`  ✅ ID ${order.id}: ${order.order_number} → ${newOrderNumber}`);
        }
      }
      console.log('');
    }

    console.log('✅✅✅ Toutes les commandes ont été corrigées au format CMD-XXXX ! ✅✅✅\n');

    // Vérifier le résultat
    const [verification] = await connection.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN order_number LIKE "CMD-%" THEN 1 END) as cmd_format FROM orders'
    );
    
    console.log('📊 Vérification:');
    console.log(`   - Total commandes: ${verification[0].total}`);
    console.log(`   - Format CMD-XXXX: ${verification[0].cmd_format}`);
    console.log(`   - Autres formats: ${verification[0].total - verification[0].cmd_format}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAllOrderNumbersToCMD()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'exécution:', error);
    process.exit(1);
  });
