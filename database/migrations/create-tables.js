/**
 * Script pour créer les nouvelles tables dans blossom_cafe
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function createTables() {
  logger.log('=========================================');
  logger.log('  Création des nouvelles tables');
  logger.log('=========================================\n');

  let connection;

  try {
    // Connexion à la base de données - Utiliser la configuration centralisée
    require('dotenv').config();
    const configModule = require('../config');
const logger = require('./utils/logger');
    connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database,
      multipleStatements: true  // Important pour exécuter plusieurs requêtes
    });

    logger.log('✅ Connexion établie au schéma blossom_cafe\n');

    // Lire le fichier SQL (utiliser le schéma complet)
    const sqlFile = path.join(__dirname, 'sql', 'blossom_cafe_schema.sql');
    const sqlContent = await fs.readFile(sqlFile, 'utf8');

    logger.log('📄 Lecture du fichier SQL...\n');
    logger.log('⏳ Exécution des requêtes...\n');

    // Exécuter le script SQL
    await connection.query(sqlContent);

    logger.log('=========================================');
    logger.log('  ✅ SUCCÈS !');
    logger.log('=========================================\n');

    // Vérifier les tables créées
    const [tables] = await connection.query('SHOW TABLES');
    
    logger.log(`📊 Nombre de tables: ${tables.length}\n`);
    logger.log('Tables créées:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      logger.log(`  ✓ ${tableName}`);
    });

    // Afficher les statistiques
    logger.log('\n📈 Données insérées:');
    
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    logger.log(`  • Utilisateurs: ${users[0].count}`);
    
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    logger.log(`  • Catégories: ${categories[0].count}`);
    
    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    logger.log(`  • Produits: ${products[0].count}`);
    
    const [promoCodes] = await connection.query('SELECT COUNT(*) as count FROM promo_codes');
    logger.log(`  • Codes promo: ${promoCodes[0].count}`);

    logger.log('\n✨ Base de données prête à l\'emploi !\n');

  } catch (error) {
    logger.log('=========================================');
    logger.log('  ❌ ERREUR');
    logger.log('=========================================\n');
    logger.log(`Message: ${error.message}\n`);
    
    if (error.sql) {
      logger.log('Requête SQL en cause:');
      logger.log(error.sql.substring(0, 200) + '...\n');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      logger.log('Connexion fermée.\n');
    }
  }
}

createTables();


