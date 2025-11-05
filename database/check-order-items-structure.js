const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  port: 3306
};

async function checkOrderItemsStructure() {
  console.log('🔍 VÉRIFICATION STRUCTURE ORDER_ITEMS\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion MySQL réussie\n');

    // Structure de order_items
    console.log('📋 Structure de la table order_items:');
    const [columns] = await connection.query('DESCRIBE order_items');
    console.log('\nColonnes:');
    columns.forEach(col => {
      console.log(`  - ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? '(NULL OK)' : '(NOT NULL)'}`);
    });
    console.log('');

    // Exemple de données
    console.log('📦 Exemple de données (3 premières lignes):');
    const [items] = await connection.query('SELECT * FROM order_items LIMIT 3');
    items.forEach((item, i) => {
      console.log(`\n${i + 1}.`, item);
    });
    console.log('');

    await connection.end();
    console.log('✅ Vérification terminée');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkOrderItemsStructure();

