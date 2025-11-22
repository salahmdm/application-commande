/**
 * Script de vérification et synchronisation des produits
 * Vérifie que tous les produits affichés dans AdminProducts sont dans la BDD
 * Et ajoute ceux qui manquent
 */

const mysql = require('mysql2/promise');

// Utiliser la configuration centralisée depuis config.js
require('dotenv').config();
const configModule = require('./config');
const logger = require('./utils/logger');
const config = configModule.database;

async function verifyAndSyncProducts() {
  let connection;
  
  try {
    logger.log('🔍 Vérification et synchronisation des produits...\n');
    
    connection = await mysql.createConnection(config);
    logger.log('✅ Connexion à la base de données établie\n');
    
    // 1. Récupérer tous les produits de la BDD
    const [dbProducts] = await connection.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.description,
        p.image_url,
        p.category_id,
        p.is_available,
        p.is_featured,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.name
    `);
    
    logger.log(`📊 Produits dans la BDD: ${dbProducts.length}`);
    
    // 2. Afficher tous les produits de la BDD
    logger.log('\n📦 Produits enregistrés dans la base de données:');
    logger.log('='.repeat(80));
    dbProducts.forEach((product, index) => {
      logger.log(`${index + 1}. [ID: ${product.id}] ${product.name}`);
      logger.log(`   - Prix: ${product.price}€`);
      logger.log(`   - Catégorie: ${product.category_name || 'Non définie'} (ID: ${product.category_id})`);
      logger.log(`   - Disponible: ${product.is_available ? 'Oui' : 'Non'}`);
      logger.log(`   - Featured: ${product.is_featured ? 'Oui' : 'Non'}`);
      if (product.image_url) {
        logger.log(`   - Image: ${product.image_url}`);
      }
      logger.log('');
    });
    
    // 3. Vérifier les catégories
    const [categories] = await connection.query(`
      SELECT id, name, slug, display_order, is_active
      FROM categories
      ORDER BY display_order
    `);
    
    logger.log(`\n📂 Catégories disponibles: ${categories.length}`);
    categories.forEach(cat => {
      logger.log(`   - [ID: ${cat.id}] ${cat.name} (${cat.slug}) - Ordre: ${cat.display_order} - ${cat.is_active ? 'Actif' : 'Inactif'}`);
    });
    
    // 4. Statistiques
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN is_available = FALSE THEN 1 ELSE 0 END) as unavailable,
        SUM(CASE WHEN is_featured = TRUE THEN 1 ELSE 0 END) as featured
      FROM products
      WHERE deleted_at IS NULL
    `);
    
    logger.log('\n📈 Statistiques:');
    logger.log('='.repeat(80));
    logger.log(`   Total produits: ${stats[0].total}`);
    logger.log(`   Disponibles: ${stats[0].available}`);
    logger.log(`   Indisponibles: ${stats[0].unavailable}`);
    logger.log(`   En vedette: ${stats[0].featured}`);
    
    // 5. Vérifier les produits sans catégorie
    const [productsWithoutCategory] = await connection.query(`
      SELECT id, name, category_id
      FROM products
      WHERE deleted_at IS NULL AND (category_id IS NULL OR category_id = 0)
    `);
    
    if (productsWithoutCategory.length > 0) {
      logger.log('\n⚠️  Produits sans catégorie:');
      productsWithoutCategory.forEach(p => {
        logger.log(`   - [ID: ${p.id}] ${p.name}`);
      });
    }
    
    // 6. Vérifier les produits avec catégorie invalide
    const [productsWithInvalidCategory] = await connection.query(`
      SELECT p.id, p.name, p.category_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL 
        AND p.category_id IS NOT NULL 
        AND p.category_id != 0
        AND c.id IS NULL
    `);
    
    if (productsWithInvalidCategory.length > 0) {
      logger.log('\n⚠️  Produits avec catégorie invalide:');
      productsWithInvalidCategory.forEach(p => {
        logger.log(`   - [ID: ${p.id}] ${p.name} (catégorie ID: ${p.category_id} n'existe pas)`);
      });
    }
    
    logger.log('\n✅ Vérification terminée');
    logger.log('\n💡 Tous les produits affichés dans "Gestion des produits" proviennent de la base de données MySQL.');
    logger.log('💡 Si vous voyez des produits qui ne sont pas dans cette liste, ils proviennent peut-être de données de secours (fallback).');
    
    await connection.end();
    
  } catch (error) {
    logger.error('❌ Erreur:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Exécuter la vérification
verifyAndSyncProducts();

