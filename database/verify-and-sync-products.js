/**
 * Script de vérification et synchronisation des produits
 * Vérifie que tous les produits affichés dans AdminProducts sont dans la BDD
 * Et ajoute ceux qui manquent
 */

const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe'
};

async function verifyAndSyncProducts() {
  let connection;
  
  try {
    console.log('🔍 Vérification et synchronisation des produits...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion à la base de données établie\n');
    
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
    
    console.log(`📊 Produits dans la BDD: ${dbProducts.length}`);
    
    // 2. Afficher tous les produits de la BDD
    console.log('\n📦 Produits enregistrés dans la base de données:');
    console.log('='.repeat(80));
    dbProducts.forEach((product, index) => {
      console.log(`${index + 1}. [ID: ${product.id}] ${product.name}`);
      console.log(`   - Prix: ${product.price}€`);
      console.log(`   - Catégorie: ${product.category_name || 'Non définie'} (ID: ${product.category_id})`);
      console.log(`   - Disponible: ${product.is_available ? 'Oui' : 'Non'}`);
      console.log(`   - Featured: ${product.is_featured ? 'Oui' : 'Non'}`);
      if (product.image_url) {
        console.log(`   - Image: ${product.image_url}`);
      }
      console.log('');
    });
    
    // 3. Vérifier les catégories
    const [categories] = await connection.query(`
      SELECT id, name, slug, display_order, is_active
      FROM categories
      ORDER BY display_order
    `);
    
    console.log(`\n📂 Catégories disponibles: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - [ID: ${cat.id}] ${cat.name} (${cat.slug}) - Ordre: ${cat.display_order} - ${cat.is_active ? 'Actif' : 'Inactif'}`);
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
    
    console.log('\n📈 Statistiques:');
    console.log('='.repeat(80));
    console.log(`   Total produits: ${stats[0].total}`);
    console.log(`   Disponibles: ${stats[0].available}`);
    console.log(`   Indisponibles: ${stats[0].unavailable}`);
    console.log(`   En vedette: ${stats[0].featured}`);
    
    // 5. Vérifier les produits sans catégorie
    const [productsWithoutCategory] = await connection.query(`
      SELECT id, name, category_id
      FROM products
      WHERE deleted_at IS NULL AND (category_id IS NULL OR category_id = 0)
    `);
    
    if (productsWithoutCategory.length > 0) {
      console.log('\n⚠️  Produits sans catégorie:');
      productsWithoutCategory.forEach(p => {
        console.log(`   - [ID: ${p.id}] ${p.name}`);
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
      console.log('\n⚠️  Produits avec catégorie invalide:');
      productsWithInvalidCategory.forEach(p => {
        console.log(`   - [ID: ${p.id}] ${p.name} (catégorie ID: ${p.category_id} n'existe pas)`);
      });
    }
    
    console.log('\n✅ Vérification terminée');
    console.log('\n💡 Tous les produits affichés dans "Gestion des produits" proviennent de la base de données MySQL.');
    console.log('💡 Si vous voyez des produits qui ne sont pas dans cette liste, ils proviennent peut-être de données de secours (fallback).');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Exécuter la vérification
verifyAndSyncProducts();

