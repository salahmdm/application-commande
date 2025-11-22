/**
 * Script pour exporter les données de la base de données en CSV pour Supabase
 * Format compatible avec l'import Supabase :
 * - En-têtes sans caractères spéciaux (sauf - et _)
 * - Dates au format AAAA-MM-JJ HH:mm:ss
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

/**
 * Nettoyer le nom de colonne pour Supabase (pas de caractères spéciaux sauf - et _)
 */
function cleanColumnName(name) {
  // Remplacer les espaces et caractères spéciaux par des underscores
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_')  // Remplacer tout sauf lettres, chiffres, - et _
    .replace(/_{2,}/g, '_')            // Remplacer les underscores multiples par un seul
    .replace(/^_+|_+$/g, '');          // Supprimer les underscores en début/fin
}

/**
 * Formater une date pour Supabase (AAAA-MM-JJ HH:mm:ss)
 */
function formatDateForSupabase(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Si c'est déjà une date MySQL (format YYYY-MM-DD HH:mm:ss)
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    // S'assurer que c'est au format complet
    if (value.length === 10) {
      return value + ' 00:00:00';
    }
    return value.substring(0, 19); // Prendre les 19 premiers caractères (YYYY-MM-DD HH:mm:ss)
  }

  // Si c'est un objet Date
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // Sinon, retourner tel quel
  return String(value);
}

/**
 * Échapper les valeurs pour CSV
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Si la valeur contient une virgule, un guillemet, un saut de ligne ou un retour chariot
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Échapper les guillemets en les doublant
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Détecter si une colonne est de type date/heure
 */
function isDateTimeColumn(columnType) {
  if (!columnType) return false;
  const typeLower = columnType.toLowerCase();
  return typeLower.includes('date') || 
         typeLower.includes('time') || 
         typeLower.includes('timestamp') ||
         typeLower.includes('datetime');
}

async function exportDataForSupabase() {
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

    logger.log('📊 Export des données pour Supabase (format CSV compatible)...\n');
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
    const exportDir = path.join(__dirname, `export_supabase_csv_${timestamp}`);
    
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

        // Récupérer les informations sur les colonnes (pour détecter les types date)
        const [columnInfo] = await connection.query(
          `SELECT COLUMN_NAME, COLUMN_TYPE
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
           ORDER BY ORDINAL_POSITION`,
          [config.database, tableName]
        );

        // Créer un map des types de colonnes
        const columnTypes = {};
        for (const col of columnInfo) {
          columnTypes[col.COLUMN_NAME] = col.COLUMN_TYPE;
        }

        // Récupérer toutes les données de la table
        const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);

        if (rows.length === 0) {
          logger.log(`     ⚠️ Table vide: ${tableName}`);
          // Créer quand même un fichier CSV avec juste les en-têtes nettoyés
          const headers = Object.keys(columnTypes).map(col => cleanColumnName(col));
          const csvContent = headers.join(',') + '\n';
          
          const filepath = path.join(exportDir, `${tableName}.csv`);
          fs.writeFileSync(filepath, csvContent, 'utf8');
          totalFiles++;
          continue;
        }

        // Récupérer les noms des colonnes (première ligne)
        const columns = Object.keys(rows[0]);
        
        // Nettoyer les noms de colonnes pour Supabase
        const cleanHeaders = columns.map(col => cleanColumnName(col));
        
        // Créer le contenu CSV
        const csvRows = [];
        
        // En-tête (noms des colonnes nettoyés)
        csvRows.push(cleanHeaders.join(','));
        
        // Données
        for (const row of rows) {
          const values = columns.map(col => {
            let value = row[col];
            
            // Formater les dates/heures pour Supabase
            if (isDateTimeColumn(columnTypes[col])) {
              value = formatDateForSupabase(value);
            }
            
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
    logger.log(`\n💡 Format compatible Supabase:`);
    logger.log(`   - En-têtes sans caractères spéciaux (sauf - et _)`);
    logger.log(`   - Dates au format AAAA-MM-JJ HH:mm:ss`);
    logger.log(`   - Prêt pour l'import dans Supabase`);

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

// Exécuter l'export
exportDataForSupabase()
  .then(() => {
    logger.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

