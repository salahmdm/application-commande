/**
 * Script pour exporter le schéma de la base de données en CSV
 * Exporte la structure des tables (colonnes, types, contraintes, etc.)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const configModule = require('./config');
const logger = require('./utils/logger');

async function exportSchemaToCSV() {
  let connection;
  
  try {
    // Configuration de connexion
    const config = {
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    };

    logger.log('📊 Export du schéma de la base de données en CSV...\n');
    logger.log(`Base de données: ${config.database}`);
    logger.log(`Host: ${config.host}:${config.port}\n`);

    // Connexion à la base de données
    connection = await mysql.createConnection(config);
    logger.log('✅ Connexion établie\n');

    // Récupérer toutes les tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? 
       ORDER BY TABLE_NAME ASC`,
      [config.database]
    );

    if (tables.length === 0) {
      logger.log('ℹ️ Aucune table trouvée dans la base de données.');
      return;
    }

    logger.log(`📋 ${tables.length} tables trouvées\n`);

    // Préparer les données CSV
    const csvRows = [];
    
    // En-tête CSV
    csvRows.push([
      'Table',
      'Colonne',
      'Type',
      'Null',
      'Clé',
      'Défaut',
      'Extra',
      'Commentaire'
    ].join(','));

    // Pour chaque table, récupérer les colonnes
    for (const tableRow of tables) {
      const tableName = tableRow.TABLE_NAME;
      logger.log(`  📋 Traitement de la table: ${tableName}`);

      // Récupérer les colonnes de la table
      const [columns] = await connection.query(
        `SELECT 
          COLUMN_NAME,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          COLUMN_DEFAULT,
          EXTRA,
          COLUMN_COMMENT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`,
        [config.database, tableName]
      );

      // Ajouter chaque colonne au CSV
      for (const column of columns) {
        const row = [
          escapeCSV(tableName),
          escapeCSV(column.COLUMN_NAME),
          escapeCSV(column.COLUMN_TYPE),
          escapeCSV(column.IS_NULLABLE),
          escapeCSV(column.COLUMN_KEY || ''),
          escapeCSV(column.COLUMN_DEFAULT !== null ? String(column.COLUMN_DEFAULT) : ''),
          escapeCSV(column.EXTRA || ''),
          escapeCSV(column.COLUMN_COMMENT || '')
        ];
        csvRows.push(row.join(','));
      }
    }

    // Créer le nom du fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `schema_${config.database}_${timestamp}.csv`;
    const filepath = path.join(__dirname, filename);

    // Écrire le fichier CSV
    const csvContent = csvRows.join('\n');
    fs.writeFileSync(filepath, csvContent, 'utf8');

    const stats = fs.statSync(filepath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    logger.log('\n✅ Export réussi !\n');
    logger.log(`📁 Fichier: ${filepath}`);
    logger.log(`📊 Taille: ${fileSizeKB} KB`);
    logger.log(`📋 Tables exportées: ${tables.length}`);
    logger.log(`📝 Colonnes exportées: ${csvRows.length - 1}`); // -1 pour l'en-tête
    logger.log(`\n💡 Le fichier CSV est prêt à être ouvert dans Excel ou tout autre tableur.`);

  } catch (error) {
    logger.error('❌ Erreur lors de l\'export:', error.message);
    logger.error('   Stack:', error.stack);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Échapper les valeurs pour CSV (gérer les virgules et guillemets)
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Si la valeur contient une virgule, un guillemet ou un saut de ligne, l'entourer de guillemets
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Échapper les guillemets en les doublant
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

// Exécuter l'export
exportSchemaToCSV()
  .then(() => {
    logger.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

