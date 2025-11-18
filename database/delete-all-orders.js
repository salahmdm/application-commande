/**
 * Script pour supprimer toutes les commandes et leurs données associées
 * ⚠️ ATTENTION : Cette opération est irréversible !
 * 
 * Usage: node database/delete-all-orders.js
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function deleteAllOrders() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    });
    
    console.log('✅ Connecté à la base de données\n');
    
    // Vérifier le nombre de commandes avant suppression
    console.log('📊 Vérification avant suppression...');
    const [beforeCount] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM order_items) as total_order_items,
        (SELECT COUNT(*) FROM order_payments) as total_order_payments
    `);
    
    const before = beforeCount[0];
    console.log(`   - Commandes: ${before.total_orders}`);
    console.log(`   - Items de commandes: ${before.total_order_items}`);
    console.log(`   - Paiements: ${before.total_order_payments}\n`);
    
    if (before.total_orders === 0) {
      console.log('ℹ️ Aucune commande à supprimer.');
      await connection.end();
      return;
    }
    
    // Confirmation
    console.log('⚠️  ATTENTION : Vous êtes sur le point de supprimer TOUTES les commandes !');
    console.log('⚠️  Cette opération est IRRÉVERSIBLE !\n');
    
    // Démarrer la transaction
    await connection.beginTransaction();
    
    console.log('🗑️  Suppression en cours...\n');
    
    // 1. Supprimer tous les items des commandes
    console.log('   1. Suppression des items de commandes...');
    const [resultItems] = await connection.query('DELETE FROM order_items');
    console.log(`      ✅ ${resultItems.affectedRows} items supprimés`);
    
    // 2. Supprimer tous les paiements des commandes
    console.log('   2. Suppression des paiements...');
    const [resultPayments] = await connection.query('DELETE FROM order_payments');
    console.log(`      ✅ ${resultPayments.affectedRows} paiements supprimés`);
    
    // 3. Supprimer toutes les commandes
    console.log('   3. Suppression des commandes...');
    const [resultOrders] = await connection.query('DELETE FROM orders');
    console.log(`      ✅ ${resultOrders.affectedRows} commandes supprimées\n`);
    
    // Valider la transaction
    await connection.commit();
    
    // Vérifier après suppression
    console.log('📊 Vérification après suppression...');
    const [afterCount] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM order_items) as total_order_items,
        (SELECT COUNT(*) FROM order_payments) as total_order_payments
    `);
    
    const after = afterCount[0];
    console.log(`   - Commandes: ${after.total_orders}`);
    console.log(`   - Items de commandes: ${after.total_order_items}`);
    console.log(`   - Paiements: ${after.total_order_payments}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Suppression terminée avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Résumé :`);
    console.log(`   - ${before.total_orders} commandes supprimées`);
    console.log(`   - ${before.total_order_items} items supprimés`);
    console.log(`   - ${before.total_order_payments} paiements supprimés`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Les statistiques de ventes et CA seront réinitialisées.');
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('\n❌ Erreur lors de la suppression:', error.message);
    console.error('   Code:', error.code);
    if (error.sqlState) {
      console.error('   SQL State:', error.sqlState);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécuter la suppression
deleteAllOrders();

