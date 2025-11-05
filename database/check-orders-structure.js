const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10
});

async function checkOrdersStructure() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔍 Vérification de la structure des commandes...\n');
    
    // 1. Vérifier les commandes
    const [orders] = await connection.query('SELECT * FROM orders LIMIT 5');
    console.log('📦 Commandes (5 premières):');
    console.log(orders);
    console.log('');
    
    // 2. Vérifier la structure de orders
    const [ordersStructure] = await connection.query('DESCRIBE orders');
    console.log('📋 Structure table orders:');
    ordersStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });
    console.log('');
    
    // 3. Vérifier si order_items existe
    const [tables] = await connection.query('SHOW TABLES LIKE "order_items"');
    if (tables.length === 0) {
      console.log('⚠️  Table order_items n\'existe pas !');
      console.log('');
      
      // Vérifier les colonnes de orders pour voir si items est stocké dedans
      const [ordersWithItems] = await connection.query('SELECT * FROM orders WHERE items IS NOT NULL LIMIT 1');
      if (ordersWithItems.length > 0) {
        console.log('📝 Les items sont stockés dans la colonne "items" de la table orders');
        console.log('Exemple:', ordersWithItems[0].items);
      }
    } else {
      console.log('✅ Table order_items existe');
      
      // 4. Vérifier order_items
      const [orderItems] = await connection.query('SELECT * FROM order_items LIMIT 5');
      console.log('📦 Order Items (5 premiers):');
      console.log(orderItems);
      console.log('');
      
      // 5. Compter les items
      const [itemCount] = await connection.query('SELECT COUNT(*) as total FROM order_items');
      console.log(`📊 Total items dans order_items: ${itemCount[0].total}`);
    }
    
    // 6. Vérifier le total de commandes
    const [orderCount] = await connection.query('SELECT COUNT(*) as total FROM orders WHERE status != "cancelled"');
    console.log(`📊 Total commandes (non annulées): ${orderCount[0].total}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

checkOrdersStructure();

