const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  port: 3306
};

async function testAddInventoryItem() {
  console.log('🧪 TEST AJOUT ARTICLE INVENTAIRE\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion MySQL réussie\n');

    // 1. Voir la structure de la table
    console.log('📋 Structure de la table products:');
    const [columns] = await connection.query('DESCRIBE products');
    console.log('\nColonnes:');
    columns.forEach(col => {
      const nullable = col.Null === 'YES' ? '(NULL OK)' : '(NOT NULL)';
      const defaultVal = col.Default !== null ? `Default: ${col.Default}` : 'Pas de défaut';
      console.log(`  - ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${nullable.padEnd(15)} ${defaultVal}`);
    });
    console.log('');

    // 2. Tester avec un produit d'exemple
    const testProduct = {
      name: 'Test Import CSV',
      category: 'Boissons Chaudes',
      quantity: 50,
      price: 4.50,
      minQuantity: 10
    };

    console.log('🧪 Test d\'ajout avec:', testProduct);
    console.log('');

    // Trouver l'ID de la catégorie
    const [categories] = await connection.query('SELECT id FROM categories WHERE name = ?', [testProduct.category]);
    const categoryId = categories.length > 0 ? categories[0].id : null;
    
    if (!categoryId) {
      console.error('❌ Catégorie non trouvée:', testProduct.category);
      console.log('\n📂 Catégories disponibles:');
      const [allCats] = await connection.query('SELECT id, name FROM categories');
      allCats.forEach(cat => console.log(`   - ${cat.id}: ${cat.name}`));
      await connection.end();
      return;
    }

    console.log(`✅ Catégorie trouvée: ID ${categoryId}`);
    console.log('');

    // Créer un slug unique
    const slug = testProduct.name.toLowerCase()
      .replace(/[éèê]/g, 'e')
      .replace(/[àâ]/g, 'a')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ùûü]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    console.log('🏷️  Slug généré:', slug);
    console.log('');

    // Tentative d'insertion
    try {
      const [result] = await connection.query(
        `INSERT INTO products (
          name, 
          slug,
          category_id, 
          stock, 
          price, 
          min_stock, 
          is_available,
          description,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          testProduct.name,
          slug,
          categoryId,
          testProduct.quantity || 0,
          testProduct.price || 0,
          testProduct.minQuantity || 0,
          1, // is_available
          `Produit importé depuis CSV` // description
        ]
      );
      
      console.log('✅ INSERTION RÉUSSIE !');
      console.log('   ID du produit créé:', result.insertId);
      console.log('');

      // Vérifier le produit créé
      const [inserted] = await connection.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
      console.log('📦 Produit créé:');
      console.log(inserted[0]);
      console.log('');

      // Supprimer le produit de test
      await connection.query('DELETE FROM products WHERE id = ?', [result.insertId]);
      console.log('🧹 Produit de test supprimé');
      
    } catch (insertError) {
      console.error('❌ ERREUR D\'INSERTION:');
      console.error('   Code:', insertError.code);
      console.error('   Message:', insertError.message);
      console.error('   SQL:', insertError.sql);
    }

    await connection.end();
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ TEST TERMINÉ');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    process.exit(1);
  }
}

testAddInventoryItem();

