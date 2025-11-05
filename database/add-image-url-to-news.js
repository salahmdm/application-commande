/**
 * Script pour ajouter la colonne image_url à la table news si elle n'existe pas
 */
const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe'
};

async function addImageUrlColumn() {
  let connection;
  
  try {
    console.log('🔍 Vérification de la structure de la table news...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion à la base de données établie\n');
    
    // Vérifier les colonnes existantes
    const [columns] = await connection.query('DESCRIBE news');
    const columnNames = columns.map(col => col.Field);
    
    console.log('📊 Colonnes actuelles:', columnNames.join(', '));
    
    // Vérifier si image_url existe
    if (!columnNames.includes('image_url')) {
      console.log('\n⚠️  La colonne image_url n\'existe pas. Ajout en cours...\n');
      
      // Ajouter la colonne image_url
      await connection.query(`
        ALTER TABLE news 
        ADD COLUMN image_url VARCHAR(500) NULL 
        AFTER date
      `);
      
      console.log('✅ Colonne image_url ajoutée avec succès !\n');
    } else {
      console.log('\n✅ La colonne image_url existe déjà.\n');
    }
    
    // Vérifier aussi bg_pattern (peut être bgPattern dans le code)
    if (!columnNames.includes('bg_pattern')) {
      console.log('⚠️  La colonne bg_pattern n\'existe pas. Ajout en cours...\n');
      
      await connection.query(`
        ALTER TABLE news 
        ADD COLUMN bg_pattern VARCHAR(255) NULL 
        AFTER gradient
      `);
      
      console.log('✅ Colonne bg_pattern ajoutée avec succès !\n');
    }
    
    // Afficher la structure finale
    const [finalColumns] = await connection.query('DESCRIBE news');
    console.log('\n📋 Structure finale de la table news:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    await connection.end();
    console.log('\n✅ Opération terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Exécuter le script
addImageUrlColumn();

