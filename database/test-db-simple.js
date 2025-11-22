/**
 * Test simple de connexion à la base de données
 */

const mysql = require('mysql2/promise');
const configModule = require('./config');
const logger = require('./utils/logger');

async function testDB() {
  logger.log('========================================');
  logger.log('🔍 TEST CONNEXION BASE DE DONNÉES');
  logger.log('========================================\n');
  
  try {
    // Connexion
    logger.log('📊 Connexion à MySQL...');
    logger.log(`   - Host: ${configModule.database.host}`);
    logger.log(`   - Port: ${configModule.database.port}`);
    logger.log(`   - Database: ${configModule.database.database}`);
    logger.log(`   - User: ${configModule.database.user}`);
    
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    
    logger.log('✅ Connexion MySQL RÉUSSIE !\n');
    
    // Test simple
    logger.log('📋 Test de requête simple...');
    const [result] = await connection.execute('SELECT 1 as test');
    logger.log('✅ Requête test réussie:', result[0]);
    logger.log('');
    
    // Compter les catégories
    logger.log('📂 Catégories dans la BDD:');
    const [categories] = await connection.execute(
      'SELECT id, name, slug, icon, is_active FROM categories ORDER BY display_order'
    );
    logger.log(`   Total: ${categories.length} catégories`);
    categories.slice(0, 10).forEach(cat => {
      logger.log(`   - ${cat.icon || ''} ${cat.name} (${cat.slug}) - ${cat.is_active ? '✅' : '❌'}`);
    });
    logger.log('');
    
    // Compter les produits
    logger.log('📦 Produits dans la BDD:');
    const [products] = await connection.execute(
      'SELECT COUNT(*) as total FROM products'
    );
    logger.log(`   Total: ${products[0].total} produits`);
    
    // Afficher quelques produits
    const [sampleProducts] = await connection.execute(
      `SELECT p.id, p.name, p.price, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       LIMIT 10`
    );
    logger.log('   Exemples:');
    sampleProducts.forEach(prod => {
      logger.log(`   - ${prod.name} (${prod.category_name}) - ${prod.price}€`);
    });
    logger.log('');
    
    // Fermer
    await connection.end();
    
    logger.log('========================================');
    logger.log('✅ CONNEXION ET TESTS RÉUSSIS !');
    logger.log('========================================');
    
  } catch (error) {
    logger.error('');
    logger.error('========================================');
    logger.error('❌ ERREUR DE CONNEXION');
    logger.error('========================================');
    logger.error('Message:', error.message);
    logger.error('Code:', error.code);
    logger.error('');
    logger.error('💡 Vérifications:');
    logger.error('   1. MySQL est-il démarré ?');
    logger.error('   2. Les identifiants dans database/.env sont-ils corrects ?');
    logger.error('   3. La base de données existe-t-elle ?');
    logger.error('');
    process.exit(1);
  }
}

testDB();

