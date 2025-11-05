const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  port: 3306
};

async function addDeletedAtColumn() {
  console.log('🔧 Ajout de la colonne deleted_at...\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à MySQL réussie\n');

    // Ajouter la colonne deleted_at
    console.log('➕ Ajout de la colonne deleted_at...');
    try {
      await connection.query('ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL');
      console.log('✅ Colonne deleted_at ajoutée\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ La colonne deleted_at existe déjà\n');
      } else {
        throw error;
      }
    }

    // Tester la requête d'inventaire
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
    process.exit(1);
  }
}

addDeletedAtColumn();

