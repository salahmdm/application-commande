/**
 * Script pour nettoyer les doublons dans la table products
 * Usage: node database/cleanup-duplicates.js
 */

const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./utils/logger');

// Fonction pour normaliser un slug
const normalizeSlug = (slug) => {
  return slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

async function cleanupDuplicates() {
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
    
    // Récupérer tous les produits
    logger.log('📊 Récupération de tous les produits...');
    const [products] = await connection.query(`
      SELECT 
        id,
        name,
        slug,
        description,
        price,
        stock,
        is_available,
        is_featured,
        calories,
        preparation_time,
        category_id,
        created_at
      FROM products
      ORDER BY created_at DESC
    `);
    
    logger.log(`📦 Total de produits: ${products.length}\n`);
    
    // Grouper par slug normalisé
    const productsBySlug = {};
    products.forEach(product => {
      const normalizedSlug = normalizeSlug(product.slug);
      if (!productsBySlug[normalizedSlug]) {
        productsBySlug[normalizedSlug] = [];
      }
      productsBySlug[normalizedSlug].push(product);
    });
    
    // Identifier les doublons
    const duplicates = [];
    Object.entries(productsBySlug).forEach(([normalizedSlug, productList]) => {
      if (productList.length > 1) {
        duplicates.push({
          slug: normalizedSlug,
          products: productList
        });
      }
    });
    
    if (duplicates.length === 0) {
      logger.log('✅ Aucun doublon trouvé !\n');
      await connection.end();
      return;
    }
    
    logger.log(`🔍 ${duplicates.length} doublon(s) trouvé(s):\n`);
    
    // Afficher les doublons
    duplicates.forEach((dup, index) => {
      logger.log(`${index + 1}. "${dup.products[0].name}" (${dup.products.length} versions)`);
      dup.products.forEach((product, i) => {
        const hasDescription = product.description && product.description.trim() && !product.description.toLowerCase().includes('produit ');
        const hasCalories = product.calories !== null && product.calories > 0;
        const hasStock = product.stock > 0;
        const score = (hasDescription ? 10 : 0) + (hasCalories ? 5 : 0) + (hasStock ? 3 : 0) + (product.is_featured ? 2 : 0);
        logger.log(`   ${i + 1}. ID: ${product.id} | Prix: ${product.price}€ | Stock: ${product.stock || 0}`);
        logger.log(`      Description: ${hasDescription ? '✓' : '✗'} | Calories: ${hasCalories ? '✓' : '✗'} | Score: ${score}`);
        logger.log(`      Slug: ${product.slug}`);
        logger.log(`      Créé: ${product.created_at}`);
        logger.log('');
      });
    });
    
    // Vérifier les commandes liées
    logger.log('🔍 Vérification des commandes liées...\n');
    const productIdsToCheck = [];
    duplicates.forEach(dup => {
      dup.products.forEach(product => {
        productIdsToCheck.push(product.id);
      });
    });
    
    const [orderItems] = await connection.query(`
      SELECT product_id, COUNT(*) as count
      FROM order_items
      WHERE product_id IN (?)
      GROUP BY product_id
    `, [productIdsToCheck]);
    
    const orderItemsMap = {};
    orderItems.forEach(item => {
      orderItemsMap[item.product_id] = item.count;
    });
    
    logger.log('📊 Produits utilisés dans des commandes:');
    Object.entries(orderItemsMap).forEach(([productId, count]) => {
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        logger.log(`   - ID ${productId} ("${product.name}"): ${count} commande(s)`);
      }
    });
    logger.log('');
    
    // Déterminer quels produits garder et lesquels supprimer
    const productsToKeep = [];
    const productsToDelete = [];
    
    duplicates.forEach(dup => {
      // Trier par score (meilleur en premier)
      const sorted = dup.products.sort((a, b) => {
        const scoreA = (a.description && a.description.trim() && !a.description.toLowerCase().includes('produit ') ? 10 : 0) +
                      (a.calories !== null && a.calories > 0 ? 5 : 0) +
                      (a.stock > 0 ? 3 : 0) +
                      (a.is_featured ? 2 : 0) +
                      (new Date(a.created_at) > new Date('2024-01-01') ? 1 : 0);
        const scoreB = (b.description && b.description.trim() && !b.description.toLowerCase().includes('produit ') ? 10 : 0) +
                      (b.calories !== null && b.calories > 0 ? 5 : 0) +
                      (b.stock > 0 ? 3 : 0) +
                      (b.is_featured ? 2 : 0) +
                      (new Date(b.created_at) > new Date('2024-01-01') ? 1 : 0);
        
        // Si un produit a des commandes, le garder en priorité
        const ordersA = orderItemsMap[a.id] || 0;
        const ordersB = orderItemsMap[b.id] || 0;
        
        if (ordersA > ordersB) return -1;
        if (ordersB > ordersA) return 1;
        
        return scoreB - scoreA;
      });
      
      // Garder le premier (meilleur)
      productsToKeep.push(sorted[0]);
      
      // Marquer les autres pour suppression
      for (let i = 1; i < sorted.length; i++) {
        const product = sorted[i];
        const hasOrders = orderItemsMap[product.id] > 0;
        
        if (hasOrders) {
          logger.log(`⚠️  ID ${product.id} ("${product.name}") a des commandes mais sera supprimé (doublon)`);
          logger.log(`   → Les commandes utiliseront le produit ID ${sorted[0].id} à la place\n`);
        }
        
        productsToDelete.push(product);
      }
    });
    
    logger.log('📋 Résumé du nettoyage:');
    logger.log(`   ✅ Produits à garder: ${productsToKeep.length}`);
    logger.log(`   ❌ Produits à supprimer: ${productsToDelete.length}\n`);
    
    if (productsToDelete.length === 0) {
      logger.log('✅ Aucun produit à supprimer.\n');
      await connection.end();
      return;
    }
    
    // Afficher les produits à supprimer
    logger.log('🗑️  Produits qui seront supprimés:');
    productsToDelete.forEach(product => {
      const hasOrders = orderItemsMap[product.id] > 0;
      logger.log(`   - ID ${product.id}: "${product.name}" (${hasOrders ? `⚠️ ${orderItemsMap[product.id]} commande(s)` : 'aucune commande'})`);
    });
    logger.log('');
    
    // Supprimer les doublons
    logger.log('🗑️  Suppression des doublons...\n');
    
    await connection.beginTransaction();
    
    try {
      let deleted = 0;
      let errors = 0;
      
      for (const product of productsToDelete) {
        try {
          // Vérifier s'il y a des commandes
          const [items] = await connection.query(
            'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
            [product.id]
          );
          
          if (items[0].count > 0) {
            logger.log(`⚠️  ID ${product.id}: "${product.name}" a ${items[0].count} commande(s) - suppression des items...`);
            
            // Trouver le produit à garder pour ce doublon
            const duplicate = duplicates.find(d => 
              d.products.some(p => p.id === product.id)
            );
            if (duplicate) {
              const toKeep = productsToKeep.find(p => 
                duplicate.products.some(dp => dp.id === p.id && dp.id !== product.id)
              );
              
              if (toKeep) {
                // Mettre à jour les order_items pour pointer vers le produit à garder
                await connection.query(
                  'UPDATE order_items SET product_id = ? WHERE product_id = ?',
                  [toKeep.id, product.id]
                );
                logger.log(`   → Items mis à jour vers le produit ID ${toKeep.id}`);
              }
            }
          }
          
          // Supprimer le produit
          await connection.query('DELETE FROM products WHERE id = ?', [product.id]);
          logger.log(`✅ Supprimé: ID ${product.id} - "${product.name}"`);
          deleted++;
        } catch (error) {
          logger.error(`❌ Erreur pour ID ${product.id}:`, error.message);
          errors++;
        }
      }
      
      await connection.commit();
      
      logger.log('\n📊 Résumé de la suppression:');
      logger.log(`   ✅ Supprimés: ${deleted}`);
      logger.log(`   ❌ Erreurs: ${errors}\n`);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
    // Vérification finale
    const [remainingProducts] = await connection.query('SELECT COUNT(*) as count FROM products');
    logger.log(`✅ Produits restants dans la base: ${remainingProducts[0].count}\n`);
    
    await connection.end();
    logger.log('✅ Nettoyage terminé avec succès !\n');
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    
    logger.error('\n❌ Erreur lors du nettoyage:');
    logger.error(`   Code: ${error.code}`);
    logger.error(`   Message: ${error.message}`);
    
    if (error.sqlMessage) {
      logger.error(`   SQL Message: ${error.sqlMessage}`);
    }
    
    process.exit(1);
  }
}

// Exécuter le nettoyage
cleanupDuplicates();

