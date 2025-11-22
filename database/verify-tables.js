/**
 * Script de vérification des tables de la base de données
 * Vérifie que toutes les tables nécessaires existent et ont les bonnes colonnes
 */

const mysql = require('mysql2/promise');

// Utiliser la configuration centralisée depuis config.js
require('dotenv').config();
const configModule = require('./config');
const logger = require('./utils/logger');
const config = configModule.database;

async function verifyTables() {
  let connection;
  
  try {
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🔍 VÉRIFICATION DES TABLES');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(config);
    logger.log('✅ Connexion à la base de données réussie\n');
    
    // Vérifier que la base de données existe
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', ['blossom_cafe']);
    if (databases.length === 0) {
      logger.error('❌ La base de données "blossom_cafe" n\'existe pas !');
      process.exit(1);
    }
    logger.log('✅ Base de données "blossom_cafe" existe\n');
    
    // Liste des tables requises
    const requiredTables = ['users', 'orders', 'order_items', 'loyalty_transactions'];
    
    // Vérifier chaque table
    for (const tableName of requiredTables) {
      logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      logger.log(`📊 Vérification de la table: ${tableName}`);
      logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Vérifier que la table existe
      const [tables] = await connection.query('SHOW TABLES LIKE ?', [tableName]);
      if (tables.length === 0) {
        logger.error(`❌ La table "${tableName}" n'existe pas !`);
        continue;
      }
      logger.log(`✅ Table "${tableName}" existe`);
      
      // Afficher les colonnes
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      logger.log(`\n📋 Colonnes (${columns.length}):`);
      columns.forEach(col => {
        logger.log(`   • ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Compter les lignes
      const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      logger.log(`\n📈 Nombre de lignes: ${count[0].count}`);
      
      logger.log('');
    }
    
    // Vérifier les relations
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🔗 Vérification des relations');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Vérifier que les commandes ont des utilisateurs valides
    const [ordersWithUsers] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
    `);
    logger.log(`✅ Commandes avec utilisateurs valides: ${ordersWithUsers[0].count}`);
    
    // Vérifier que les items de commande ont des commandes valides
    const [itemsWithOrders] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
    `);
    logger.log(`✅ Items de commande avec commandes valides: ${itemsWithOrders[0].count}`);
    
    // Vérifier que les transactions de fidélité ont des utilisateurs valides
    const [loyaltyWithUsers] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM loyalty_transactions lt
      INNER JOIN users u ON lt.user_id = u.id
    `);
    logger.log(`✅ Transactions de fidélité avec utilisateurs valides: ${loyaltyWithUsers[0].count}`);
    
    logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('✅ VÉRIFICATION TERMINÉE');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await connection.end();
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ ERREUR LORS DE LA VÉRIFICATION');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('Message:', error.message);
    logger.error('Code:', error.code);
    logger.error('SQL State:', error.sqlState);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Exécuter la vérification
verifyTables();

