/**
 * Script pour vérifier les produits et catégories dans la base de données
 */

const mysql = require('mysql2/promise');
const configModule = require('./config');

async function checkData() {
  console.log('========================================');
  console.log('🔍 VÉRIFICATION DES DONNÉES BDD');
  console.log('========================================\n');
  
  try {
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    
    console.log('✅ Connexion MySQL réussie\n');
    
    // 1. Vérifier les catégories
    console.log('1️⃣ CATÉGORIES:');
    const [categories] = await connection.execute(
      'SELECT id, name, slug, icon, display_order, is_active FROM categories ORDER BY display_order'
    );
    
    console.log(`   Total: ${categories.length} catégories`);
    categories.forEach(cat => {
      console.log(`   - ${cat.icon || ''} ${cat.name} (${cat.slug}) - ${cat.is_active ? '✅ Actif' : '❌ Inactif'}`);
    });
    console.log('');
    
    // 2. Vérifier les produits
    console.log('2️⃣ PRODUITS:');
    const [products] = await connection.execute(
      `SELECT p.id, p.name, p.description, p.price, p.stock, p.is_available, 
              c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY c.display_order, p.name
       LIMIT 20`
    );
    
    console.log(`   Total (affiche 20 premiers): ${products.length} produits`);
    products.forEach(prod => {
      console.log(`   - ${prod.name} (${prod.category_name})`);
      console.log(`     Description: ${prod.description || 'N/A'}`);
      console.log(`     Prix: ${prod.price}€ - Stock: ${prod.stock} - ${prod.is_available ? '✅ Disponible' : '❌ Indisponible'}`);
    });
    console.log('');
    
    // 3. Compter tous les produits
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM products');
    console.log(`3️⃣ TOTAL PRODUITS DANS LA BDD: ${count[0].total}`);
    console.log('');
    
    // 4. Vérifier des produits spécifiques mentionnés
    console.log('4️⃣ PRODUITS SPÉCIFIQUES MENTIONNÉS:');
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
        console.log(`   ✅ ${productName}: Trouvé - Prix: ${found[0].price}€ - ID: ${found[0].id}`);
      } else {
        console.log(`   ❌ ${productName}: NON TROUVÉ dans la BDD`);
      }
    }
    console.log('');
    
    // 5. Vérifier les catégories spécifiques
    console.log('5️⃣ CATÉGORIES SPÉCIFIQUES MENTIONNÉES:');
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
        console.log(`   ✅ ${catName}: Trouvé - Slug: ${found[0].slug} - ID: ${found[0].id}`);
      } else {
        console.log(`   ❌ ${catName}: NON TROUVÉ dans la BDD`);
      }
    }
    console.log('');
    
    await connection.end();
    
    console.log('========================================');
    console.log('✅ VÉRIFICATION TERMINÉE');
    console.log('========================================');
    console.log('');
    console.log('💡 CONCLUSION:');
    console.log('   Si les produits sont dans la BDD: Données enregistrées en base');
    console.log('   Si les produits ne sont pas dans la BDD: Données de secours (fallback) utilisées');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkData();

