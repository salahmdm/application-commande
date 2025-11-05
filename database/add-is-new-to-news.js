/**
 * Script pour ajouter la colonne is_new à la table news
 */
const mysql = require('mysql2/promise');

async function addIsNewColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('📊 Ajout de la colonne is_new à la table news...\n');

    // Ajouter la colonne is_new si elle n'existe pas
    try {
      await connection.query(`
        ALTER TABLE news 
        ADD COLUMN is_new BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Colonne is_new ajoutée avec succès !\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ La colonne is_new existe déjà.\n');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addIsNewColumn();

