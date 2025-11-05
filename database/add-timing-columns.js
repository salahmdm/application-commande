/**
 * Script pour ajouter les colonnes de temps de prise en charge et préparation
 * - taken_at : Timestamp de prise en charge (passage de pending à preparing)
 * - prepared_at : Timestamp de fin de préparation (passage de preparing à served)
 */

const mysql = require('mysql2/promise');

async function addTimingColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('🔄 Ajout des colonnes de temps...\n');

    // Ajouter la colonne taken_at (temps de prise en charge)
    try {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN taken_at TIMESTAMP NULL COMMENT 'Timestamp de prise en charge (passage à preparing)'
      `);
      console.log('✅ Colonne taken_at ajoutée');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Colonne taken_at existe déjà');
      } else {
        throw error;
      }
    }

    // Ajouter la colonne prepared_at (temps de fin de préparation)
    try {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN prepared_at TIMESTAMP NULL COMMENT 'Timestamp de fin de préparation (passage à served)'
      `);
      console.log('✅ Colonne prepared_at ajoutée');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Colonne prepared_at existe déjà');
      } else {
        throw error;
      }
    }

    // Ajouter des index pour améliorer les performances
    try {
      await connection.query('CREATE INDEX idx_taken_at ON orders(taken_at)');
      console.log('✅ Index idx_taken_at créé');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ Index idx_taken_at existe déjà');
      } else {
        console.log('⚠️ Erreur création index idx_taken_at:', error.message);
      }
    }

    try {
      await connection.query('CREATE INDEX idx_prepared_at ON orders(prepared_at)');
      console.log('✅ Index idx_prepared_at créé');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ Index idx_prepared_at existe déjà');
      } else {
        console.log('⚠️ Erreur création index idx_prepared_at:', error.message);
      }
    }

    console.log('\n✅✅✅ Colonnes ajoutées avec succès ! ✅✅✅\n');

    // Vérifier la structure
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'blossom_cafe' 
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME IN ('taken_at', 'prepared_at')
    `);

    console.log('📋 Colonnes ajoutées:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      if (col.COLUMN_COMMENT) {
        console.log(`    Commentaire: ${col.COLUMN_COMMENT}`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le script
addTimingColumns()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'exécution:', error);
    process.exit(1);
  });

