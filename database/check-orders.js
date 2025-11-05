const mysql = require('mysql2/promise');

async function checkOrders() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe',
    port: 3306
  });

  try {
    console.log('🔍 Vérification des commandes dans MySQL...\n');
    
    // 1. Nombre total de commandes
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM orders');
    console.log('📊 Total commandes:', countResult[0].total);
    
    // 2. Dernières commandes
    const [orders] = await connection.execute(`
      SELECT id, order_number, user_id, status, payment_status, total_amount, created_at
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📋 Dernières 10 commandes:');
    console.table(orders);
    
    // 3. Commandes du jour
    const [todayOrders] = await connection.execute(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);
    
    console.log('\n💰 Aujourd\'hui:');
    console.log('   Commandes:', todayOrders[0].count);
    console.log('   CA:', todayOrders[0].revenue, '€');
    
    // 4. Par statut
    const [byStatus] = await connection.execute(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      GROUP BY status
    `);
    
    console.log('\n📊 Par statut:');
    console.table(byStatus);
    
    // 5. Total revenue (sans annulées)
    const [revenue] = await connection.execute(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM orders 
      WHERE status != 'cancelled'
    `);
    
    console.log('\n💵 Revenus (hors annulées):');
    console.log('   CA Total:', revenue[0].total_revenue, '€');
    console.log('   Commandes:', revenue[0].total_orders);
    
    // 6. Vérifier la requête complète du dashboard
    const [dashStats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as orders_today,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') as revenue_today
    `);
    
    console.log('\n📊 Stats Dashboard:');
    console.table(dashStats);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

checkOrders()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  });

