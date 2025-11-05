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

async function testHomeStats() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧪 Test complet de la route /api/home/stats...\n');
    
    // 1. Total commandes
    console.log('1️⃣ Total commandes...');
    const [ordersCount] = await connection.query(
      'SELECT COUNT(*) as total FROM orders WHERE status != ?',
      ['cancelled']
    );
    console.log('✅ Total:', ordersCount[0]?.total);
    
    // 2. Top products (requête simplifiée)
    console.log('\n2️⃣ Top products...');
    const [allProductsWithStats] = await connection.query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.image_url,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      WHERE p.is_available = 1
      GROUP BY p.id, p.name, p.description, p.price, p.image_url
      ORDER BY total_sold DESC, p.created_at DESC
      LIMIT 10
    `);
    
    console.log('✅ Produits récupérés:', allProductsWithStats.length);
    allProductsWithStats.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.name}: ${p.total_sold} vendus (${p.order_count} commandes)`);
    });
    
    // 3. Codes promo
    console.log('\n3️⃣ Codes promo...');
    const [activePromos] = await connection.query(`
      SELECT code, discount_value, discount_type, description, valid_until
      FROM promo_codes
      WHERE is_active = 1 AND (valid_until IS NULL OR valid_until > NOW())
      ORDER BY discount_value DESC
      LIMIT 3
    `);
    console.log('✅ Promos:', activePromos.length);
    
    // 4. Commandes en attente
    console.log('\n4️⃣ Commandes en attente...');
    const [upcomingOrders] = await connection.query(`
      SELECT COUNT(*) as pending_orders
      FROM orders
      WHERE status = 'pending'
    `);
    console.log('✅ Pending:', upcomingOrders[0]?.pending_orders);
    
    // 5. Heures de pointe
    console.log('\n5️⃣ Heures de pointe...');
    const [peakHours] = await connection.query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as order_count
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY HOUR(created_at)
      ORDER BY order_count DESC
      LIMIT 3
    `);
    console.log('✅ Peak hours:', peakHours.length);
    
    // Construction de la réponse
    console.log('\n📦 Construction de la réponse JSON...');
    const response = {
      success: true,
      data: {
        totalOrders: ordersCount[0]?.total || 0,
        topProducts: allProductsWithStats.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: parseFloat(p.price) || 0,
          image_url: p.image_url,
          orderCount: parseInt(p.order_count) || 0,
          totalSold: parseInt(p.total_sold) || 0
        })),
        activePromos: activePromos.map(promo => ({
          code: promo.code,
          discount: parseInt(promo.discount_value),
          discountType: promo.discount_type,
          description: promo.description,
          validUntil: promo.valid_until
        })),
        pendingOrders: upcomingOrders[0]?.pending_orders || 0,
        peakHours: peakHours.map(h => ({
          hour: h.hour,
          orderCount: parseInt(h.order_count)
        }))
      }
    };
    
    console.log('\n✅ Réponse finale:');
    console.log(JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    connection.release();
    process.exit();
  }
}

testHomeStats();

