const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  port: 3306
};

async function testInventoryAPI() {
  console.log('🧪 TEST ROUTE API INVENTAIRE\n');
  console.log('═══════════════════════════════════════\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion MySQL réussie\n');

    // 1. Vérifier la structure de la table products
    console.log('📋 1. Structure de la table products:');
    const [columns] = await connection.query('DESCRIBE products');
    const columnNames = columns.map(c => c.Field);
    console.log('   Colonnes:', columnNames.join(', '));
    console.log('');

    // Vérifier les colonnes nécessaires
    const requiredColumns = ['id', 'name', 'stock', 'min_stock', 'deleted_at', 'category_id', 'price'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('⚠️  Colonnes manquantes:', missingColumns.join(', '));
      console.log('');
    } else {
      console.log('✅ Toutes les colonnes nécessaires sont présentes\n');
    }

    // 2. Tester la requête exacte utilisée par l'API
    console.log('📊 2. Test de la requête API:');
    const query = `
      SELECT 
        p.id,
        p.name,
        c.name as category,
        p.stock as quantity,
        p.price,
        COALESCE(p.min_stock, 0) as minQuantity,
        p.created_at as dateAdded,
        CASE 
          WHEN p.stock = 0 THEN 'out'
          WHEN p.stock <= COALESCE(p.min_stock, 0) THEN 'low'
          ELSE 'available'
        END as status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.name ASC
    `;
    
    console.log('   Exécution de la requête...');
    const [inventory] = await connection.query(query);
    
    console.log(`\n✅ Requête réussie ! ${inventory.length} produits récupérés\n`);
    
    // 3. Afficher quelques exemples
    if (inventory.length > 0) {
      console.log('📦 3. Premiers produits (max 5):');
      inventory.slice(0, 5).forEach((item, index) => {
        console.log(`\n   ${index + 1}. ${item.name}`);
        console.log(`      - ID: ${item.id}`);
        console.log(`      - Catégorie: ${item.category || 'N/A'}`);
        console.log(`      - Stock: ${item.quantity}, Min: ${item.minQuantity}`);
        console.log(`      - Prix: ${item.price}€`);
        console.log(`      - Statut: ${item.status}`);
        console.log(`      - Date: ${item.dateAdded}`);
      });
      console.log('');
    } else {
      console.log('⚠️  Aucun produit trouvé dans la base de données');
      console.log('');
    }

    // 4. Simuler la réponse JSON de l'API
    console.log('📤 4. Format JSON retourné par l\'API:');
    const apiResponse = {
      success: true,
      data: inventory
    };
    console.log(JSON.stringify(apiResponse, null, 2).substring(0, 500) + '...\n');

    // 5. Statistiques
    console.log('📊 5. Statistiques:');
    const stats = {
      total: inventory.length,
      available: inventory.filter(i => i.status === 'available').length,
      low: inventory.filter(i => i.status === 'low').length,
      out: inventory.filter(i => i.status === 'out').length,
      withCategory: inventory.filter(i => i.category !== null).length,
      withoutCategory: inventory.filter(i => i.category === null).length
    };
    
    console.log(`   Total produits: ${stats.total}`);
    console.log(`   ✅ Disponibles: ${stats.available}`);
    console.log(`   ⚠️  Stock bas: ${stats.low}`);
    console.log(`   ❌ Rupture: ${stats.out}`);
    console.log(`   Avec catégorie: ${stats.withCategory}`);
    console.log(`   Sans catégorie: ${stats.withoutCategory}`);
    console.log('');

    await connection.end();
    
    console.log('═══════════════════════════════════════');
    console.log('✅ TEST TERMINÉ AVEC SUCCÈS !');
    console.log('═══════════════════════════════════════\n');
    console.log('💡 La route API devrait fonctionner correctement.');
    console.log('   Si l\'erreur persiste côté frontend, le problème est');
    console.log('   dans le composant React ou la fonction apiCall().\n');

  } catch (error) {
    console.error('❌ ERREUR LORS DU TEST:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   SQL State:', error.sqlState);
    console.error('\n🔍 Détails complets:', error);
    process.exit(1);
  }
}

testInventoryAPI();

