/**
 * Script pour lister tous les produits de la base de données
 * Usage: node database/list-all-products.js
 */

const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./utils/logger');

async function listAllProducts() {
  let connection;
  
  try {
    logger.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    });
    
    logger.log('✅ Connecté à la base de données\n');
    
    // Récupérer toutes les catégories
    logger.log('📊 Récupération des catégories...');
    const [categories] = await connection.query('SELECT id, name, slug FROM categories ORDER BY display_order');
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });
    
    logger.log('📋 Catégories trouvées:');
    categories.forEach(cat => {
      logger.log(`   - ${cat.id}: ${cat.name} (${cat.slug})`);
    });
    logger.log('');
    
    // Récupérer tous les produits avec leurs catégories
    logger.log('📦 Récupération de tous les produits...\n');
    const [products] = await connection.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock,
        p.is_available,
        p.is_featured,
        p.calories,
        p.preparation_time,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY c.display_order, p.name
    `);
    
    logger.log(`📊 Total de produits: ${products.length}\n`);
    
    // Grouper par catégorie
    const productsByCategory = {};
    products.forEach(product => {
      const catName = product.category_name || 'Sans catégorie';
      if (!productsByCategory[catName]) {
        productsByCategory[catName] = [];
      }
      productsByCategory[catName].push(product);
    });
    
    // Afficher les produits par catégorie
    Object.keys(productsByCategory).sort().forEach(categoryName => {
      const categoryProducts = productsByCategory[categoryName];
      logger.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      logger.log(`📂 ${categoryName} (${categoryProducts.length} produit${categoryProducts.length > 1 ? 's' : ''})`);
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      categoryProducts.forEach((product, index) => {
        const status = product.is_available ? '✅' : '❌';
        const featured = product.is_featured ? '⭐' : '  ';
        logger.log(`${index + 1}. ${featured} ${status} ${product.name}`);
        logger.log(`   ID: ${product.id} | Prix: ${product.price}€ | Stock: ${product.stock || 0}`);
        if (product.description) {
          logger.log(`   ${product.description}`);
        }
        if (product.calories !== null) {
          logger.log(`   Calories: ${product.calories} | Préparation: ${product.preparation_time || 0} min`);
        }
        logger.log(`   Slug: ${product.slug}`);
        logger.log('');
      });
    });
    
    // Résumé par catégorie
    logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('📊 RÉSUMÉ PAR CATÉGORIE');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    Object.keys(productsByCategory).sort().forEach(categoryName => {
      const categoryProducts = productsByCategory[categoryName];
      const available = categoryProducts.filter(p => p.is_available).length;
      const featured = categoryProducts.filter(p => p.is_featured).length;
      logger.log(`${categoryName}:`);
      logger.log(`   Total: ${categoryProducts.length}`);
      logger.log(`   Disponibles: ${available}`);
      logger.log(`   En vedette: ${featured}`);
      logger.log('');
    });
    
    // Liste simple de tous les noms de produits
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('📋 LISTE COMPLÈTE DES PRODUITS');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    products.forEach((product, index) => {
      const category = product.category_name || 'Sans catégorie';
      const status = product.is_available ? '✓' : '✗';
      logger.log(`${(index + 1).toString().padStart(3, ' ')}. [${status}] ${product.name} (${category})`);
    });
    
    logger.log(`\n✅ Total: ${products.length} produits dans la base de données\n`);
    
    await connection.end();
    
  } catch (error) {
    if (connection) {
      await connection.end();
    }
    
    logger.error('\n❌ Erreur lors de la récupération des produits:');
    logger.error(`   Code: ${error.code}`);
    logger.error(`   Message: ${error.message}`);
    
    if (error.sqlMessage) {
      logger.error(`   SQL Message: ${error.sqlMessage}`);
    }
    
    process.exit(1);
  }
}

// Exécuter la liste des produits
listAllProducts();

