const mysql = require('mysql2/promise');
const config = require('./config.js');

(async () => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    console.log('🔍 Vérification des produits dans la base de données...\n');
    
    // Vérifier le nombre total de produits
    const [count] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`📊 Total de produits: ${count[0].total}`);
    
    // Vérifier les produits disponibles
    const [available] = await connection.query('SELECT COUNT(*) as total FROM products WHERE is_available = TRUE');
    console.log(`✅ Produits disponibles (is_available = TRUE): ${available[0].total}`);
    
    // Vérifier les produits non disponibles
    const [unavailable] = await connection.query('SELECT COUNT(*) as total FROM products WHERE is_available = FALSE');
    console.log(`❌ Produits non disponibles (is_available = FALSE): ${unavailable[0].total}`);
    
    // Afficher les 10 premiers produits
    const [products] = await connection.query(`
      SELECT id, name, price, is_available, 
             CASE WHEN is_available = 1 THEN 'TRUE' 
                  WHEN is_available = 0 THEN 'FALSE' 
                  ELSE 'NULL' END as is_available_str
      FROM products 
      LIMIT 10
    `);
    
    console.log('\n📦 Liste des 10 premiers produits:');
    products.forEach(p => {
      console.log(`  - ID: ${p.id}, Nom: ${p.name}, Prix: ${p.price}€, Disponible: ${p.is_available_str} (${p.is_available})`);
    });
    
    await connection.end();
    console.log('\n✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();

