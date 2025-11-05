const mysql = require('mysql2/promise');

async function checkDashboardData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe'
  });

  try {
    console.log('🔍 VÉRIFICATION DES DONNÉES DASHBOARD\n');

    // 1. Vérifier les commandes
    const [orders] = await connection.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as orders_today,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) as revenue_today
      FROM orders 
      WHERE status != 'cancelled'
    `);

    console.log('📊 COMMANDES:');
    console.log('   Total commandes:', orders[0].total_orders);
    console.log('   Commandes aujourd\'hui:', orders[0].orders_today);
    console.log('   CA total:', orders[0].total_revenue);
    console.log('   CA aujourd\'hui:', orders[0].revenue_today);
    console.log('   Types:', typeof orders[0].total_revenue, typeof orders[0].revenue_today);

    // 2. Vérifier les statuts de commandes
    const [statusCounts] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      WHERE status != 'cancelled'
      GROUP BY status
    `);

    console.log('\n📋 STATUTS COMMANDES:');
    statusCounts.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

    // 3. Vérifier les clients
    const [clients] = await connection.execute(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(DISTINCT user_id) as active_clients
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
    `);

    console.log('\n👥 CLIENTS:');
    console.log('   Total clients:', clients[0].total_clients);
    console.log('   Clients actifs:', clients[0].active_clients);

    // 4. Vérifier les produits
    const [products] = await connection.execute(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_products,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_products
      FROM products
    `);

    console.log('\n📦 PRODUITS:');
    console.log('   Total produits:', products[0].total_products);
    console.log('   Produits actifs:', products[0].active_products);
    console.log('   Produits inactifs:', products[0].inactive_products);

    // 5. Vérifier les items vendus
    const [itemsSold] = await connection.execute(`
      SELECT 
        SUM(JSON_LENGTH(items)) as total_items_sold
      FROM orders 
      WHERE status != 'cancelled'
    `);

    console.log('\n🛒 ITEMS VENDUS:');
    console.log('   Total items:', itemsSold[0].total_items_sold);

    // 6. Test de la route API directement
    console.log('\n🧪 TEST ROUTE API DIRECTE:');
    console.log('   Simulant la logique de /api/admin/dashboard...');

    const dashboardStats = {
      // Revenus
      total_revenue: orders[0].total_revenue || 0,
      revenue_today: orders[0].revenue_today || 0,
      revenue_yesterday: 0, // Pas implémenté
      revenue_7days: orders[0].total_revenue || 0, // Simplifié
      revenue_30days: orders[0].total_revenue || 0, // Simplifié
      
      // Commandes
      total_orders: orders[0].total_orders || 0,
      orders_today: orders[0].orders_today || 0,
      orders_yesterday: 0, // Pas implémenté
      
      // Statuts
      pending_orders: statusCounts.find(s => s.status === 'pending')?.count || 0,
      preparing_orders: statusCounts.find(s => s.status === 'preparing')?.count || 0,
      ready_orders: statusCounts.find(s => s.status === 'ready')?.count || 0,
      served_orders: statusCounts.find(s => s.status === 'served')?.count || 0,
      cancelled_orders: 0,
      
      // Moyennes
      average_order_value: orders[0].total_orders > 0 ? orders[0].total_revenue / orders[0].total_orders : 0,
      average_order_value_today: orders[0].orders_today > 0 ? orders[0].revenue_today / orders[0].orders_today : 0,
      
      // Clients
      total_clients: clients[0].total_clients || 0,
      active_clients: clients[0].active_clients || 0,
      
      // Produits
      total_products: products[0].total_products || 0,
      active_products: products[0].active_products || 0,
      inactive_products: products[0].inactive_products || 0,
      
      // Items
      total_items_sold: itemsSold[0].total_items_sold || 0,
      average_items_per_order: orders[0].total_orders > 0 ? itemsSold[0].total_items_sold / orders[0].total_orders : 0
    };

    console.log('\n📈 RÉSULTAT DASHBOARD SIMULÉ:');
    console.log('   total_revenue:', dashboardStats.total_revenue, typeof dashboardStats.total_revenue);
    console.log('   revenue_today:', dashboardStats.revenue_today, typeof dashboardStats.revenue_today);
    console.log('   total_orders:', dashboardStats.total_orders, typeof dashboardStats.total_orders);
    console.log('   orders_today:', dashboardStats.orders_today, typeof dashboardStats.orders_today);

    // 7. Test de conversion
    console.log('\n🔄 TEST CONVERSION:');
    const convertedStats = {
      total_revenue: parseFloat(dashboardStats.total_revenue) || 0,
      revenue_today: parseFloat(dashboardStats.revenue_today) || 0,
      total_orders: parseInt(dashboardStats.total_orders) || 0,
      orders_today: parseInt(dashboardStats.orders_today) || 0
    };
    
    console.log('   Après conversion:');
    console.log('   total_revenue:', convertedStats.total_revenue, typeof convertedStats.total_revenue);
    console.log('   revenue_today:', convertedStats.revenue_today, typeof convertedStats.revenue_today);
    console.log('   total_orders:', convertedStats.total_orders, typeof convertedStats.total_orders);
    console.log('   orders_today:', convertedStats.orders_today, typeof convertedStats.orders_today);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

checkDashboardData();
