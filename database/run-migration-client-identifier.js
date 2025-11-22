/**
 * Script pour exécuter la migration: Ajouter client_identifier
 * Usage: node database/run-migration-client-identifier.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');

async function runMigration() {
  let connection;
  
  try {
    logger.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      multipleStatements: true // ✅ Permettre les requêtes multiples
    });
    
    logger.log('✅ Connecté à la base de données\n');
    
    // Vérifier si la colonne existe déjà
    logger.log('📊 Vérification de la colonne client_identifier...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'client_identifier'
    `, [config.database.database]);
    
    if (columns.length > 0) {
      logger.log('✅ La colonne client_identifier existe déjà.\n');
      await connection.end();
      return;
    }
    
    logger.log('📝 La colonne n\'existe pas. Exécution de la migration...\n');
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'migrations', 'sql', 'add-client-identifier.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Démarrer une transaction
    await connection.beginTransaction();
    
    try {
      // Exécuter la migration
      logger.log('🔧 Ajout de la colonne client_identifier...');
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN client_identifier VARCHAR(11) NULL UNIQUE AFTER last_name
      `);
      logger.log('✅ Colonne client_identifier ajoutée');
      
      logger.log('🔧 Création de l\'index...');
      await connection.query(`
        CREATE INDEX idx_client_identifier ON users(client_identifier)
      `);
      logger.log('✅ Index créé');
      
      // Commit de la transaction
      await connection.commit();
      logger.log('\n✅ Migration réussie !\n');
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
    // Vérifier le résultat
    const [verifyColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'client_identifier'
    `, [config.database.database]);
    
    if (verifyColumns.length > 0) {
      const col = verifyColumns[0];
      logger.log('📊 Vérification:');
      logger.log(`   - Colonne: ${col.COLUMN_NAME}`);
      logger.log(`   - Type: ${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})`);
      logger.log(`   - Nullable: ${col.IS_NULLABLE}\n`);
    }
    
    await connection.end();
    logger.log('✅ Migration terminée avec succès !');
    
  } catch (error) {
    if (connection) {
      await connection.end();
    }
    
    logger.error('\n❌ Erreur lors de la migration:');
    logger.error(`   Code: ${error.code}`);
    logger.error(`   Message: ${error.message}`);
    
    if (error.sqlMessage) {
      logger.error(`   SQL Message: ${error.sqlMessage}`);
    }
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      logger.error('\n⚠️  La colonne existe déjà. Migration ignorée.');
    } else {
      process.exit(1);
    }
  }
}

// Exécuter la migration
runMigration();

