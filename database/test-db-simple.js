/**
 * Test simple de connexion à la base de données
 */

const mysql = require('mysql2/promise');
const configModule = require('./config');

async function testDB() {
  console.log('========================================');
  console.log('🔍 TEST CONNEXION BASE DE DONNÉES');
  console.log('========================================\n');
  
  try {
    // Connexion
    console.log('📊 Connexion à MySQL...');
    console.log(`   - Host: ${configModule.database.host}`);
    console.log(`   - Port: ${configModule.database.port}`);
    console.log(`   - Database: ${configModule.database.database}`);
    console.log(`   - User: ${configModule.database.user}`);
    
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    
    console.log('✅ Connexion MySQL RÉUSSIE !\n');
    
    // Test simple
    console.log('📋 Test de requête simple...');
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Requête test réussie:', result[0]);
    console.log('');
    
    // Compter les catégories
    console.log('📂 Catégories dans la BDD:');
    const [categories] = await connection.execute(
      'SELECT id, name, slug, icon, is_active FROM categories ORDER BY display_order'
    );
    console.log(`   Total: ${categories.length} catégories`);
    categories.slice(0, 10).forEach(cat => {
      console.log(`   - ${cat.icon || ''} ${cat.name} (${cat.slug}) - ${cat.is_active ? '✅' : '❌'}`);
    });
    console.log('');
    
    // Compter les produits
    console.log('📦 Produits dans la BDD:');
    const [products] = await connection.execute(
      'SELECT COUNT(*) as total FROM products'
    );
    console.log(`   Total: ${products[0].total} produits`);
    
    // Afficher quelques produits
    const [sampleProducts] = await connection.execute(
      `SELECT p.id, p.name, p.price, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       LIMIT 10`
    );
    console.log('   Exemples:');
    sampleProducts.forEach(prod => {
      console.log(`   - ${prod.name} (${prod.category_name}) - ${prod.price}€`);
    });
    console.log('');
    
    // Fermer
    await connection.end();
    
    console.log('========================================');
    console.log('✅ CONNEXION ET TESTS RÉUSSIS !');
    console.log('========================================');
    
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ ERREUR DE CONNEXION');
    console.error('========================================');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('');
    console.error('💡 Vérifications:');
    console.error('   1. MySQL est-il démarré ?');
    console.error('   2. Les identifiants dans database/.env sont-ils corrects ?');
    console.error('   3. La base de données existe-t-elle ?');
    console.error('');
    process.exit(1);
  }
}

testDB();

