/**
 * Script pour supprimer toutes les commandes et leurs données associées
 * ⚠️ ATTENTION : Cette opération est irréversible !
 * 
 * Usage: node database/delete-all-orders.js
 */

const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./utils/logger');

async function deleteAllOrders() {
  let connection;
  
  try {
    logger.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    });
    
    logger.log('✅ Connecté à la base de données\n');
    
    // Vérifier le nombre de commandes avant suppression
    logger.log('📊 Vérification avant suppression...');
    const [beforeCount] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM order_items) as total_order_items,
        (SELECT COUNT(*) FROM order_payments) as total_order_payments
    `);
    
    const before = beforeCount[0];
    logger.log(`   - Commandes: ${before.total_orders}`);
    logger.log(`   - Items de commandes: ${before.total_order_items}`);
    logger.log(`   - Paiements: ${before.total_order_payments}\n`);
    
    if (before.total_orders === 0) {
      logger.log('ℹ️ Aucune commande à supprimer.');
      await connection.end();
      return;
    }
    
    // Confirmation
    logger.log('⚠️  ATTENTION : Vous êtes sur le point de supprimer TOUTES les commandes !');
    logger.log('⚠️  Cette opération est IRRÉVERSIBLE !\n');
    
    // Démarrer la transaction
    await connection.beginTransaction();
    
    logger.log('🗑️  Suppression en cours...\n');
    
    // 1. Supprimer tous les items des commandes
    logger.log('   1. Suppression des items de commandes...');
    const [resultItems] = await connection.query('DELETE FROM order_items');
    logger.log(`      ✅ ${resultItems.affectedRows} items supprimés`);
    
    // 2. Supprimer tous les paiements des commandes
    logger.log('   2. Suppression des paiements...');
    const [resultPayments] = await connection.query('DELETE FROM order_payments');
    logger.log(`      ✅ ${resultPayments.affectedRows} paiements supprimés`);
    
    // 3. Supprimer toutes les commandes
    logger.log('   3. Suppression des commandes...');
    const [resultOrders] = await connection.query('DELETE FROM orders');
    logger.log(`      ✅ ${resultOrders.affectedRows} commandes supprimées\n`);
    
    // Valider la transaction
    await connection.commit();
    
    // Vérifier après suppression
    logger.log('📊 Vérification après suppression...');
    const [afterCount] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM order_items) as total_order_items,
        (SELECT COUNT(*) FROM order_payments) as total_order_payments
    `);
    
    const after = afterCount[0];
    logger.log(`   - Commandes: ${after.total_orders}`);
    logger.log(`   - Items de commandes: ${after.total_order_items}`);
    logger.log(`   - Paiements: ${after.total_order_payments}\n`);
    
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('✅ Suppression terminée avec succès !');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log(`📊 Résumé :`);
    logger.log(`   - ${before.total_orders} commandes supprimées`);
    logger.log(`   - ${before.total_order_items} items supprimés`);
    logger.log(`   - ${before.total_order_payments} paiements supprimés`);
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('\n💡 Les statistiques de ventes et CA seront réinitialisées.');
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('\n❌ Erreur lors de la suppression:', error.message);
    logger.error('   Code:', error.code);
    if (error.sqlState) {
      logger.error('   SQL State:', error.sqlState);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      logger.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécuter la suppression
deleteAllOrders();

