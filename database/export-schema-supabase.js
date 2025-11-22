/**
 * Script pour exporter le schéma de la base de données au format Supabase (PostgreSQL)
 * Génère un fichier SQL avec les CREATE TABLE statements convertis pour PostgreSQL
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

// Conversion des types MySQL vers PostgreSQL
const typeMapping = {
  'int': 'INTEGER',
  'bigint': 'BIGINT',
  'smallint': 'SMALLINT',
  'tinyint': 'SMALLINT',
  'mediumint': 'INTEGER',
  'decimal': 'DECIMAL',
  'numeric': 'NUMERIC',
  'float': 'REAL',
  'double': 'DOUBLE PRECISION',
  'varchar': 'VARCHAR',
  'char': 'CHAR',
  'text': 'TEXT',
  'longtext': 'TEXT',
  'mediumtext': 'TEXT',
  'tinytext': 'TEXT',
  'date': 'DATE',
  'time': 'TIME',
  'datetime': 'TIMESTAMP',
  'timestamp': 'TIMESTAMP',
  'year': 'INTEGER',
  'json': 'JSONB',
  'jsonb': 'JSONB',
  'boolean': 'BOOLEAN',
  'bool': 'BOOLEAN',
  'enum': 'VARCHAR', // Les ENUM MySQL deviennent VARCHAR en PostgreSQL
  'set': 'TEXT'
};

function convertMySQLTypeToPostgres(mysqlType) {
  const typeLower = mysqlType.toLowerCase();
  
  // Gérer les types avec longueur (ex: VARCHAR(255))
  if (typeLower.includes('varchar')) {
    const match = typeLower.match(/varchar\((\d+)\)/);
    if (match) {
      return `VARCHAR(${match[1]})`;
    }
    return 'VARCHAR';
  }
  
  if (typeLower.includes('char')) {
    const match = typeLower.match(/char\((\d+)\)/);
    if (match) {
      return `CHAR(${match[1]})`;
    }
    return 'CHAR';
  }
  
  if (typeLower.includes('decimal') || typeLower.includes('numeric')) {
    const match = typeLower.match(/(decimal|numeric)\((\d+),(\d+)\)/);
    if (match) {
      return `${match[1].toUpperCase()}(${match[2]},${match[3]})`;
    }
    return 'DECIMAL';
  }
  
  if (typeLower.includes('enum')) {
    // Convertir ENUM en VARCHAR avec CHECK constraint
    return 'VARCHAR(255)';
  }
  
  // Types simples
  for (const [mysqlType, postgresType] of Object.entries(typeMapping)) {
    if (typeLower.startsWith(mysqlType)) {
      return postgresType;
    }
  }
  
  return 'TEXT'; // Par défaut
}

async function exportSchemaForSupabase() {
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

    logger.log('📊 Génération du schéma pour Supabase (PostgreSQL)...\n');
    logger.log(`Base de données source: ${config.database}`);
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

    // Construire le contenu SQL
    let sqlContent = '';
    
    // En-tête
    sqlContent += '-- ============================================================================\n';
    sqlContent += `-- SCHÉMA DE LA BASE DE DONNÉES: ${config.database.toUpperCase()}\n`;
    sqlContent += `-- Exporté pour Supabase (PostgreSQL)\n`;
    sqlContent += `-- Date d'export: ${new Date().toLocaleString('fr-FR')}\n`;
    sqlContent += `-- Source: MySQL (${config.host}:${config.port})\n`;
    sqlContent += '-- ============================================================================\n\n';
    sqlContent += '-- Note: Ce schéma a été converti depuis MySQL vers PostgreSQL\n';
    sqlContent += '-- Certains types et contraintes peuvent nécessiter des ajustements manuels\n\n';

    // Pour chaque table
    for (let i = 0; i < tables.length; i++) {
      const tableRow = tables[i];
      const tableName = tableRow.TABLE_NAME;
      const tableComment = tableRow.TABLE_COMMENT || '';
      
      logger.log(`  📋 Traitement de la table: ${tableName}`);

      // Récupérer les colonnes
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

      // Commentaire de la table
      if (tableComment) {
        sqlContent += `-- Table: ${tableName} - ${tableComment}\n`;
      } else {
        sqlContent += `-- Table: ${tableName}\n`;
      }
      
      sqlContent += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

      // Colonnes
      const columnDefinitions = [];
      const primaryKeys = [];
      const uniqueConstraints = [];
      const enumConstraints = [];

      for (const column of columns) {
        const colName = column.COLUMN_NAME;
        const colType = convertMySQLTypeToPostgres(column.COLUMN_TYPE);
        const isNullable = column.IS_NULLABLE === 'YES';
        const isPrimaryKey = column.COLUMN_KEY === 'PRI';
        const isUnique = column.COLUMN_KEY === 'UNI';
        const defaultValue = column.COLUMN_DEFAULT;
        const isAutoIncrement = column.EXTRA && column.EXTRA.includes('auto_increment');
        const isEnum = column.COLUMN_TYPE.toLowerCase().includes('enum');

        let colDef = `  "${colName}" ${colType}`;

        // Auto increment devient SERIAL en PostgreSQL
        if (isAutoIncrement) {
          if (colType === 'INTEGER') {
            colDef = `  "${colName}" SERIAL`;
          } else if (colType === 'BIGINT') {
            colDef = `  "${colName}" BIGSERIAL`;
          }
        }

        // NULL / NOT NULL
        if (!isNullable) {
          colDef += ' NOT NULL';
        }

        // Valeur par défaut
        if (defaultValue !== null && !isAutoIncrement) {
          if (defaultValue === 'CURRENT_TIMESTAMP' || defaultValue.includes('CURRENT_TIMESTAMP')) {
            colDef += ' DEFAULT CURRENT_TIMESTAMP';
          } else if (typeof defaultValue === 'string' && defaultValue.match(/^['"]/)) {
            colDef += ` DEFAULT ${defaultValue}`;
          } else if (typeof defaultValue === 'string') {
            colDef += ` DEFAULT '${defaultValue.replace(/'/g, "''")}'`;
          } else {
            colDef += ` DEFAULT ${defaultValue}`;
          }
        }

        columnDefinitions.push(colDef);

        // Collecter les clés primaires
        if (isPrimaryKey) {
          primaryKeys.push(colName);
        }

        // Collecter les contraintes UNIQUE
        if (isUnique && !isPrimaryKey) {
          uniqueConstraints.push(colName);
        }

        // Gérer les ENUM (convertir en CHECK constraint)
        if (isEnum) {
          const enumMatch = column.COLUMN_TYPE.match(/enum\(([^)]+)\)/i);
          if (enumMatch) {
            const enumValues = enumMatch[1].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
            enumConstraints.push({
              column: colName,
              values: enumValues
            });
          }
        }
      }

      sqlContent += columnDefinitions.join(',\n');

      // Clés primaires
      if (primaryKeys.length > 0) {
        sqlContent += ',\n  PRIMARY KEY ("' + primaryKeys.join('", "') + '")';
      }

      // Contraintes UNIQUE
      for (const uniqueCol of uniqueConstraints) {
        sqlContent += `,\n  UNIQUE ("${uniqueCol}")`;
      }

      // Clés étrangères
      const fkGroups = {};
      for (const fk of foreignKeys) {
        if (!fkGroups[fk.CONSTRAINT_NAME]) {
          fkGroups[fk.CONSTRAINT_NAME] = [];
        }
        fkGroups[fk.CONSTRAINT_NAME].push(fk);
      }

      for (const [constraintName, fkCols] of Object.entries(fkGroups)) {
        const cols = fkCols.map(fk => fk.COLUMN_NAME).join('", "');
        const refTable = fkCols[0].REFERENCED_TABLE_NAME;
        const refCols = fkCols.map(fk => fk.REFERENCED_COLUMN_NAME).join('", "');
        sqlContent += `,\n  CONSTRAINT "${constraintName}" FOREIGN KEY ("${cols}") REFERENCES "${refTable}" ("${refCols}")`;
      }

      sqlContent += '\n);\n\n';

      // Commentaires sur les colonnes
      for (const column of columns) {
        if (column.COLUMN_COMMENT) {
          sqlContent += `COMMENT ON COLUMN "${tableName}"."${column.COLUMN_NAME}" IS '${column.COLUMN_COMMENT.replace(/'/g, "''")}';\n`;
        }
      }

      // Contraintes CHECK pour les ENUM
      for (const enumConstraint of enumConstraints) {
        const values = enumConstraint.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
        sqlContent += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_${enumConstraint.column}_check" CHECK ("${enumConstraint.column}" IN (${values}));\n`;
      }

      sqlContent += '\n';
    }

    // Créer le nom du fichier
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `schema_supabase_${config.database}_${timestamp}.sql`;
    const filepath = path.join(__dirname, filename);

    // Écrire le fichier
    fs.writeFileSync(filepath, sqlContent, 'utf8');

    const stats = fs.statSync(filepath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    logger.log('\n✅ Export réussi !\n');
    logger.log(`📁 Fichier SQL: ${filepath}`);
    logger.log(`📊 Taille: ${fileSizeKB} KB`);
    logger.log(`📋 Tables exportées: ${tables.length}`);
    logger.log(`\n💡 Ce fichier SQL peut être importé dans Supabase via:`);
    logger.log(`   1. L'éditeur SQL de Supabase`);
    logger.log(`   2. La ligne de commande: psql < fichier.sql`);
    logger.log(`   3. L'interface web de Supabase (SQL Editor)`);

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
exportSchemaForSupabase()
  .then(() => {
    logger.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

