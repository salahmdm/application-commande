const mysql = require('mysql2/promise');

// Configuration de la base de données
const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  port: 3306
};

async function fixInventoryError() {
  console.log('🔧 Correction de l\'erreur d\'inventaire...\n');
  
  try {
    // Connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à MySQL réussie\n');

    // 1. Vérifier les colonnes de la table products
    console.log('📋 Colonnes actuelles de la table products:');
    const [columns] = await connection.query('DESCRIBE products');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // 2. Vérifier si min_stock existe
    const hasMinStock = columns.some(col => col.Field === 'min_stock');
    
    if (!hasMinStock) {
      console.log('⚠️  La colonne min_stock n\'existe pas. Ajout en cours...');
      await connection.query('ALTER TABLE products ADD COLUMN min_stock INT DEFAULT 0');
      console.log('✅ Colonne min_stock ajoutée\n');
    } else {
      console.log('✅ La colonne min_stock existe déjà\n');
    }

    // 3. Mettre à jour les valeurs NULL
    console.log('🔄 Mise à jour des valeurs NULL...');
    await connection.query('UPDATE products SET min_stock = 0 WHERE min_stock IS NULL');
    console.log('✅ Valeurs NULL mises à jour\n');

    // 4. Tester la requête d'inventaire
    console.log('🧪 Test de la requête d\'inventaire...');
    const [inventory] = await connection.query(`
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
      LIMIT 5
    `);
    
    console.log(`✅ Requête réussie ! ${inventory.length} produits récupérés:\n`);
    inventory.forEach(item => {
      console.log(`  📦 ${item.name}`);
      console.log(`     Catégorie: ${item.category || 'N/A'}`);
      console.log(`     Stock: ${item.quantity}, Min: ${item.minQuantity}`);
      console.log(`     Prix: ${item.price}€`);
      console.log(`     Statut: ${item.status}\n`);
    });

    await connection.end();
    console.log('✅ Correction terminée avec succès !');
    console.log('\n💡 Vous pouvez maintenant actualiser la page Inventaire dans l\'application');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n🔍 Détails de l\'erreur:', error);
    process.exit(1);
  }
}

// Exécuter
fixInventoryError();

