/**
 * Script pour exporter TOUTES les données de la base de données en CSV
 * Exporte les données réelles de chaque table sans aucune modification
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const configModule = require('./config');

// Logger simple
const logger = {
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args)
};

async function exportDatabaseToCSV() {
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

    logger.log('📊 Export des données de la base de données en CSV...\n');
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
       AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME ASC`,
      [config.database]
    );

    if (tables.length === 0) {
      logger.log('ℹ️ Aucune table trouvée dans la base de données.');
      return;
    }

    logger.log(`📋 ${tables.length} tables trouvées\n`);

    // Créer un dossier pour les exports
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportDir = path.join(__dirname, `export_csv_${timestamp}`);
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    let totalRows = 0;
    let totalFiles = 0;

    // Exporter chaque table
    for (const tableRow of tables) {
      const tableName = tableRow.TABLE_NAME;
      
      try {
        logger.log(`  📋 Export de la table: ${tableName}`);

        // Récupérer toutes les données de la table
        const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);

        if (rows.length === 0) {
          logger.log(`     ⚠️ Table vide: ${tableName}`);
          // Créer quand même un fichier CSV avec juste les en-têtes
          const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
          const headers = columns.map(col => col.Field);
          const csvContent = headers.join(',') + '\n';
          
          const filepath = path.join(exportDir, `${tableName}.csv`);
          fs.writeFileSync(filepath, csvContent, 'utf8');
          totalFiles++;
          continue;
        }

        // Récupérer les noms des colonnes
        const columns = Object.keys(rows[0]);
        
        // Créer le contenu CSV
        const csvRows = [];
        
        // En-tête (noms des colonnes)
        csvRows.push(columns.map(col => escapeCSV(col)).join(','));
        
        // Données
        for (const row of rows) {
          const values = columns.map(col => {
            const value = row[col];
            return escapeCSV(value);
          });
          csvRows.push(values.join(','));
        }

        // Écrire le fichier CSV
        const csvContent = csvRows.join('\n');
        const filepath = path.join(exportDir, `${tableName}.csv`);
        fs.writeFileSync(filepath, csvContent, 'utf8');

        const stats = fs.statSync(filepath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);

        logger.log(`     ✅ ${rows.length} lignes exportées (${fileSizeKB} KB)`);
        totalRows += rows.length;
        totalFiles++;

      } catch (error) {
        logger.error(`     ❌ Erreur lors de l'export de ${tableName}:`, error.message);
      }
    }

    logger.log('\n✅ Export terminé !\n');
    logger.log(`📁 Dossier: ${exportDir}`);
    logger.log(`📋 Tables exportées: ${totalFiles}`);
    logger.log(`📝 Lignes totales exportées: ${totalRows}`);
    logger.log(`\n💡 Tous les fichiers CSV sont dans le dossier ci-dessus.`);
    logger.log(`   Chaque table a son propre fichier CSV avec toutes ses données.`);

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
 * Échapper les valeurs pour CSV (gérer les virgules, guillemets et sauts de ligne)
 */
function escapeCSV(value) {
  // Gérer null et undefined
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convertir en string
  const stringValue = String(value);
  
  // Si la valeur contient une virgule, un guillemet, un saut de ligne ou un retour chariot, l'entourer de guillemets
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Échapper les guillemets en les doublant
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

// Exécuter l'export
exportDatabaseToCSV()
  .then(() => {
    logger.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

