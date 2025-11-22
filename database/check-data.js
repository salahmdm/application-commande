/**
 * Script pour vérifier les produits et catégories dans la base de données
 */

const mysql = require('mysql2/promise');
const configModule = require('./config');
const logger = require('./utils/logger');

async function checkData() {
  logger.log('========================================');
  logger.log('🔍 VÉRIFICATION DES DONNÉES BDD');
  logger.log('========================================\n');
  
  try {
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    
    logger.log('✅ Connexion MySQL réussie\n');
    
    // 1. Vérifier les catégories
    logger.log('1️⃣ CATÉGORIES:');
    const [categories] = await connection.execute(
      'SELECT id, name, slug, icon, display_order, is_active FROM categories ORDER BY display_order'
    );
    
    logger.log(`   Total: ${categories.length} catégories`);
    categories.forEach(cat => {
      logger.log(`   - ${cat.icon || ''} ${cat.name} (${cat.slug}) - ${cat.is_active ? '✅ Actif' : '❌ Inactif'}`);
    });
    logger.log('');
    
    // 2. Vérifier les produits
    logger.log('2️⃣ PRODUITS:');
    const [products] = await connection.execute(
      `SELECT p.id, p.name, p.description, p.price, p.stock, p.is_available, 
              c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY c.display_order, p.name
       LIMIT 20`
    );
    
    logger.log(`   Total (affiche 20 premiers): ${products.length} produits`);
    products.forEach(prod => {
      logger.log(`   - ${prod.name} (${prod.category_name})`);
      logger.log(`     Description: ${prod.description || 'N/A'}`);
      logger.log(`     Prix: ${prod.price}€ - Stock: ${prod.stock} - ${prod.is_available ? '✅ Disponible' : '❌ Indisponible'}`);
    });
    logger.log('');
    
    // 3. Compter tous les produits
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM products');
    logger.log(`3️⃣ TOTAL PRODUITS DANS LA BDD: ${count[0].total}`);
    logger.log('');
    
    // 4. Vérifier des produits spécifiques mentionnés
    logger.log('4️⃣ PRODUITS SPÉCIFIQUES MENTIONNÉS:');
    const specificProducts = [
      'Thé Vert Sencha',
      'Croissant au Beurre',
      'Cappuccino',
      'Thé Noir Earl Grey',
      'Macaron Framboise',
      'Chocolat Chaud',
      'Salade César',
      'Cookie Chocolat'
    ];
    
    for (const productName of specificProducts) {
      const [found] = await connection.execute(
        'SELECT id, name, price, category_id FROM products WHERE name LIKE ?',
        [`%${productName}%`]
      );
      
      if (found.length > 0) {
        logger.log(`   ✅ ${productName}: Trouvé - Prix: ${found[0].price}€ - ID: ${found[0].id}`);
      } else {
        logger.log(`   ❌ ${productName}: NON TROUVÉ dans la BDD`);
      }
    }
    logger.log('');
    
    // 5. Vérifier les catégories spécifiques
    logger.log('5️⃣ CATÉGORIES SPÉCIFIQUES MENTIONNÉES:');
    const specificCategories = [
      'Thés',
      'Pâtisseries',
      'Boissons Chaudes',
      'Salades',
      'Snacks'
    ];
    
    for (const catName of specificCategories) {
      const [found] = await connection.execute(
        'SELECT id, name, slug FROM categories WHERE name LIKE ?',
        [`%${catName}%`]
      );
      
      if (found.length > 0) {
        logger.log(`   ✅ ${catName}: Trouvé - Slug: ${found[0].slug} - ID: ${found[0].id}`);
      } else {
        logger.log(`   ❌ ${catName}: NON TROUVÉ dans la BDD`);
      }
    }
    logger.log('');
    
    await connection.end();
    
    logger.log('========================================');
    logger.log('✅ VÉRIFICATION TERMINÉE');
    logger.log('========================================');
    logger.log('');
    logger.log('💡 CONCLUSION:');
    logger.log('   Si les produits sont dans la BDD: Données enregistrées en base');
    logger.log('   Si les produits ne sont pas dans la BDD: Données de secours (fallback) utilisées');
    logger.log('');
    
  } catch (error) {
    logger.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkData();

