/**
 * Script de vérification de connexion au schéma blossom_cafe
 */

const mysql = require('mysql2/promise');

async function verifyConnection() {
  console.log('=========================================');
  console.log('  Vérification de la connexion');
  console.log('=========================================\n');

  try {
    // Connexion avec les informations fournies
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('✅ Connexion réussie au schéma blossom_cafe!\n');

    // Vérifier les tables existantes
    const [tables] = await connection.query('SHOW TABLES');
    
    console.log(`📊 Nombre de tables trouvées: ${tables.length}\n`);
    
    if (tables.length > 0) {
      console.log('Tables existantes:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  • ${tableName}`);
      });
    } else {
      console.log('⚠️  Aucune table trouvée dans le schéma blossom_cafe');
      console.log('✅ Prêt pour créer de nouvelles tables\n');
    }

    // Informations sur la base de données
    const [dbInfo] = await connection.query(`
      SELECT 
        SCHEMA_NAME as 'Database',
        DEFAULT_CHARACTER_SET_NAME as 'Charset',
        DEFAULT_COLLATION_NAME as 'Collation'
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME = 'blossom_cafe'
    `);

    console.log('\n📋 Informations du schéma:');
    console.log(`  Base de données: ${dbInfo[0].Database}`);
    console.log(`  Charset: ${dbInfo[0].Charset}`);
    console.log(`  Collation: ${dbInfo[0].Collation}\n`);

    await connection.end();
    
    console.log('=========================================');
    console.log('  ✅ Connexion vérifiée avec succès!');
    console.log('=========================================\n');

  } catch (error) {
    console.log('❌ Erreur de connexion:');
    console.log(`  ${error.message}\n`);
    process.exit(1);
  }
}

verifyConnection();


