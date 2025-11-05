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

async function testTopProductsQuery() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔍 Test de la requête Top Products...\n');
    
    // Requête actuelle
    const [topProducts] = await connection.query(`
      SELECT 
        p.id, p.name, p.description, p.price, p.image_url,
        COUNT(DISTINCT oi.order_id) as order_count,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.description, p.price, p.image_url
      ORDER BY total_sold DESC, order_count DESC, p.id ASC
      LIMIT 10
    `);
    
    console.log('📊 Résultats:');
    topProducts.forEach(p => {
      console.log(`\n${p.name}:`);
      console.log(`  ID: ${p.id}`);
      console.log(`  Prix: ${p.price}€`);
      console.log(`  Total vendu: ${p.total_sold}`);
      console.log(`  Nombre de commandes: ${p.order_count}`);
    });
    
    console.log('\n---\n');
    
    // Requête alternative (directement depuis order_items)
    const [directQuery] = await connection.query(`
      SELECT 
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as total_sold,
        COUNT(DISTINCT oi.order_id) as order_count,
        p.price,
        p.description,
        p.image_url
      FROM order_items oi
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name, p.price, p.description, p.image_url
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    
    console.log('📊 Requête alternative (depuis order_items):');
    directQuery.forEach(p => {
      console.log(`\n${p.product_name}:`);
      console.log(`  ID: ${p.product_id}`);
      console.log(`  Prix: ${p.price}€`);
      console.log(`  Total vendu: ${p.total_sold}`);
      console.log(`  Nombre de commandes: ${p.order_count}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

testTopProductsQuery();

