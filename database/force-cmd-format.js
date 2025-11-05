/**
 * Script pour forcer le format CMD-XXXX sur toutes les nouvelles commandes
 * Vérifie et corrige automatiquement les commandes avec format ORD-
 */

const mysql = require('mysql2/promise');

async function forceCMDFormat() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('🔒 Vérification du format CMD-XXXX...\n');

    // Vérifier les commandes d'aujourd'hui avec format ORD-
    const [ordersWithOldFormat] = await connection.query(
      `SELECT id, order_number, created_at 
       FROM orders 
       WHERE DATE(created_at) = CURDATE() 
       AND order_number LIKE 'ORD-%'
       ORDER BY created_at DESC`
    );

    if (ordersWithOldFormat.length > 0) {
      console.log(`⚠️ ${ordersWithOldFormat.length} commande(s) avec format ORD- trouvée(s) aujourd'hui\n`);
      
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

      console.log(`📌 Correction des commandes...\n`);

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
    } else {
      console.log('✅ Toutes les commandes d\'aujourd\'hui utilisent le format CMD-XXXX\n');
    }

    // Vérification finale
    const [finalCheck] = await connection.query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN order_number LIKE 'CMD-%' THEN 1 END) as cmd_format,
              COUNT(CASE WHEN order_number LIKE 'ORD-%' THEN 1 END) as ord_format
       FROM orders 
       WHERE DATE(created_at) = CURDATE()`
    );

    console.log('📊 État actuel des commandes d\'aujourd\'hui:');
    console.log(`   - Total: ${finalCheck[0].total}`);
    console.log(`   - Format CMD-XXXX: ${finalCheck[0].cmd_format} ✅`);
    console.log(`   - Format ORD-YYYY-...: ${finalCheck[0].ord_format} ${finalCheck[0].ord_format > 0 ? '❌' : '✅'}`);

    if (finalCheck[0].ord_format > 0) {
      console.log('\n⚠️ ATTENTION: Il reste des commandes avec format ORD-');
      console.log('   Le serveur backend doit être redémarré pour éviter de nouvelles commandes avec ce format.');
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

forceCMDFormat()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
