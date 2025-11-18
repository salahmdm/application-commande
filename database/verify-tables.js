/**
 * Script de vérification des tables de la base de données
 * Vérifie que toutes les tables nécessaires existent et ont les bonnes colonnes
 */

const mysql = require('mysql2/promise');

// Utiliser la configuration centralisée depuis config.js
require('dotenv').config();
const configModule = require('./config');
const config = configModule.database;

async function verifyTables() {
  let connection;
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VÉRIFICATION DES TABLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion à la base de données réussie\n');
    
    // Vérifier que la base de données existe
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', ['blossom_cafe']);
    if (databases.length === 0) {
      console.error('❌ La base de données "blossom_cafe" n\'existe pas !');
      process.exit(1);
    }
    console.log('✅ Base de données "blossom_cafe" existe\n');
    
    // Liste des tables requises
    const requiredTables = ['users', 'orders', 'order_items', 'loyalty_transactions'];
    
    // Vérifier chaque table
    for (const tableName of requiredTables) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 Vérification de la table: ${tableName}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Vérifier que la table existe
      const [tables] = await connection.query('SHOW TABLES LIKE ?', [tableName]);
      if (tables.length === 0) {
        console.error(`❌ La table "${tableName}" n'existe pas !`);
        continue;
      }
      console.log(`✅ Table "${tableName}" existe`);
      
      // Afficher les colonnes
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      console.log(`\n📋 Colonnes (${columns.length}):`);
      columns.forEach(col => {
        console.log(`   • ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Compter les lignes
      const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\n📈 Nombre de lignes: ${count[0].count}`);
      
      console.log('');
    }
    
    // Vérifier les relations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 Vérification des relations');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Vérifier que les commandes ont des utilisateurs valides
    const [ordersWithUsers] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
    `);
    console.log(`✅ Commandes avec utilisateurs valides: ${ordersWithUsers[0].count}`);
    
    // Vérifier que les items de commande ont des commandes valides
    const [itemsWithOrders] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
    `);
    console.log(`✅ Items de commande avec commandes valides: ${itemsWithOrders[0].count}`);
    
    // Vérifier que les transactions de fidélité ont des utilisateurs valides
    const [loyaltyWithUsers] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM loyalty_transactions lt
      INNER JOIN users u ON lt.user_id = u.id
    `);
    console.log(`✅ Transactions de fidélité avec utilisateurs valides: ${loyaltyWithUsers[0].count}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VÉRIFICATION TERMINÉE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await connection.end();
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERREUR LORS DE LA VÉRIFICATION');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Exécuter la vérification
verifyTables();

