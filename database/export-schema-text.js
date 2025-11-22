/**
 * Script pour exporter le schéma de la base de données en fichier texte
 * Génère un document texte formaté avec toutes les informations sur les tables
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

async function exportSchemaToText() {
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

    logger.log('📊 Génération du schéma de la base de données en texte...\n');
    logger.log(`Base de données: ${config.database}`);
    logger.log(`Host: ${config.host}:${config.port}\n`);

    // Connexion à la base de données
    connection = await mysql.createConnection(config);
    logger.log('✅ Connexion établie\n');

    // Récupérer toutes les tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME, TABLE_COMMENT
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

    // Construire le contenu du fichier texte
    let textContent = '';
    
    // En-tête
    textContent += '='.repeat(80) + '\n';
    textContent += `SCHÉMA DE LA BASE DE DONNÉES: ${config.database.toUpperCase()}\n`;
    textContent += `Date d'export: ${new Date().toLocaleString('fr-FR')}\n`;
    textContent += `Host: ${config.host}:${config.port}\n`;
    textContent += '='.repeat(80) + '\n\n';

    // Table des matières
    textContent += 'TABLE DES MATIÈRES\n';
    textContent += '-'.repeat(80) + '\n';
    tables.forEach((table, index) => {
      textContent += `${(index + 1).toString().padStart(3, ' ')}. ${table.TABLE_NAME}\n`;
    });
    textContent += '\n\n';

    // Pour chaque table, récupérer les informations détaillées
    for (let i = 0; i < tables.length; i++) {
      const tableRow = tables[i];
      const tableName = tableRow.TABLE_NAME;
      const tableComment = tableRow.TABLE_COMMENT || '';
      
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

      // Récupérer les index et clés
      const [indexes] = await connection.query(
        `SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          SEQ_IN_INDEX,
          INDEX_TYPE
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [config.database, tableName]
      );

      // Récupérer les clés étrangères
      const [foreignKeys] = await connection.query(
        `SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [config.database, tableName]
      );

      // Récupérer le nombre de lignes
      const [rowCount] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      const numRows = rowCount[0].count;

      // Section de la table
      textContent += '='.repeat(80) + '\n';
      textContent += `TABLE ${i + 1}/${tables.length}: ${tableName}\n`;
      if (tableComment) {
        textContent += `Description: ${tableComment}\n`;
      }
      textContent += '='.repeat(80) + '\n\n';

      // Informations générales
      textContent += `Nombre de colonnes: ${columns.length}\n`;
      textContent += `Nombre de lignes: ${numRows}\n`;
      textContent += `Nombre d'index: ${new Set(indexes.map(idx => idx.INDEX_NAME)).size}\n`;
      textContent += `Nombre de clés étrangères: ${foreignKeys.length}\n\n`;

      // Colonnes
      textContent += 'COLONNES:\n';
      textContent += '-'.repeat(80) + '\n';
      textContent += 'Nom'.padEnd(25) + 'Type'.padEnd(25) + 'Null'.padEnd(8) + 'Clé'.padEnd(8) + 'Défaut'.padEnd(15) + 'Extra\n';
      textContent += '-'.repeat(80) + '\n';
      
      for (const column of columns) {
        const name = (column.COLUMN_NAME || '').padEnd(25);
        const type = (column.COLUMN_TYPE || '').padEnd(25);
        const nullable = (column.IS_NULLABLE || '').padEnd(8);
        const key = (column.COLUMN_KEY || '').padEnd(8);
        const defaultValue = (column.COLUMN_DEFAULT !== null ? String(column.COLUMN_DEFAULT) : 'NULL').padEnd(15);
        const extra = (column.EXTRA || '');
        
        textContent += `${name}${type}${nullable}${key}${defaultValue}${extra}\n`;
        
        if (column.COLUMN_COMMENT) {
          textContent += `  └─ Commentaire: ${column.COLUMN_COMMENT}\n`;
        }
      }
      textContent += '\n';

      // Index
      if (indexes.length > 0) {
        textContent += 'INDEX:\n';
        textContent += '-'.repeat(80) + '\n';
        
        const indexGroups = {};
        for (const idx of indexes) {
          if (!indexGroups[idx.INDEX_NAME]) {
            indexGroups[idx.INDEX_NAME] = [];
          }
          indexGroups[idx.INDEX_NAME].push(idx);
        }

        for (const [indexName, indexCols] of Object.entries(indexGroups)) {
          const isUnique = indexCols[0].NON_UNIQUE === 0 ? 'UNIQUE' : '';
          const cols = indexCols.map(col => col.COLUMN_NAME).join(', ');
          textContent += `  • ${indexName}${isUnique ? ' (UNIQUE)' : ''}: ${cols}\n`;
        }
        textContent += '\n';
      }

      // Clés étrangères
      if (foreignKeys.length > 0) {
        textContent += 'CLÉS ÉTRANGÈRES:\n';
        textContent += '-'.repeat(80) + '\n';
        
        const fkGroups = {};
        for (const fk of foreignKeys) {
          if (!fkGroups[fk.CONSTRAINT_NAME]) {
            fkGroups[fk.CONSTRAINT_NAME] = [];
          }
          fkGroups[fk.CONSTRAINT_NAME].push(fk);
        }

        for (const [constraintName, fkCols] of Object.entries(fkGroups)) {
          const cols = fkCols.map(fk => fk.COLUMN_NAME).join(', ');
          const refTable = fkCols[0].REFERENCED_TABLE_NAME;
          const refCols = fkCols.map(fk => fk.REFERENCED_COLUMN_NAME).join(', ');
          textContent += `  • ${constraintName}: ${cols} → ${refTable}(${refCols})\n`;
        }
        textContent += '\n';
      }

      textContent += '\n';
    }

    // Pied de page
    textContent += '='.repeat(80) + '\n';
    textContent += `FIN DU SCHÉMA\n`;
    textContent += `Total de tables: ${tables.length}\n`;
    textContent += `Date d'export: ${new Date().toLocaleString('fr-FR')}\n`;
    textContent += '='.repeat(80) + '\n';

    // Créer le nom du fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `schema_${config.database}_${timestamp}.txt`;
    const filepath = path.join(__dirname, filename);

    // Écrire le fichier
    fs.writeFileSync(filepath, textContent, 'utf8');

    const stats = fs.statSync(filepath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    logger.log('\n✅ Export réussi !\n');
    logger.log(`📁 Fichier: ${filepath}`);
    logger.log(`📊 Taille: ${fileSizeKB} KB`);
    logger.log(`📋 Tables documentées: ${tables.length}`);
    logger.log(`\n💡 Le fichier texte contient toutes les informations sur le schéma de la base de données.`);

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
exportSchemaToText()
  .then(() => {
    logger.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

