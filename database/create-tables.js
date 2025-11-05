/**
 * Script pour créer les nouvelles tables dans blossom_cafe
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function createTables() {
  console.log('=========================================');
  console.log('  Création des nouvelles tables');
  console.log('=========================================\n');

  let connection;

  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe',
      multipleStatements: true  // Important pour exécuter plusieurs requêtes
    });

    console.log('✅ Connexion établie au schéma blossom_cafe\n');

    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'create-new-tables.sql');
    const sqlContent = await fs.readFile(sqlFile, 'utf8');

    console.log('📄 Lecture du fichier SQL...\n');
    console.log('⏳ Exécution des requêtes...\n');

    // Exécuter le script SQL
    await connection.query(sqlContent);

    console.log('=========================================');
    console.log('  ✅ SUCCÈS !');
    console.log('=========================================\n');

    // Vérifier les tables créées
    const [tables] = await connection.query('SHOW TABLES');
    
    console.log(`📊 Nombre de tables: ${tables.length}\n`);
    console.log('Tables créées:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  ✓ ${tableName}`);
    });

    // Afficher les statistiques
    console.log('\n📈 Données insérées:');
    
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`  • Utilisateurs: ${users[0].count}`);
    
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log(`  • Catégories: ${categories[0].count}`);
    
    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log(`  • Produits: ${products[0].count}`);
    
    const [promoCodes] = await connection.query('SELECT COUNT(*) as count FROM promo_codes');
    console.log(`  • Codes promo: ${promoCodes[0].count}`);

    console.log('\n✨ Base de données prête à l\'emploi !\n');

  } catch (error) {
    console.log('=========================================');
    console.log('  ❌ ERREUR');
    console.log('=========================================\n');
    console.log(`Message: ${error.message}\n`);
    
    if (error.sql) {
      console.log('Requête SQL en cause:');
      console.log(error.sql.substring(0, 200) + '...\n');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connexion fermée.\n');
    }
  }
}

createTables();


