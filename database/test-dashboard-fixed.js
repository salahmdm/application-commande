const mysql = require('mysql2/promise');

async function testDashboardFixed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe'
  });

  try {
    console.log('🧪 TEST ROUTE DASHBOARD CORRIGÉE\n');

    // Simuler la requête exacte de la route API
    const [stats] = await connection.query(`
      SELECT 
        -- Clients
        (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
        (SELECT COUNT(DISTINCT user_id) FROM orders) as active_clients,
        
        -- Produits (CORRIGÉ: is_available = 1/0 au lieu de TRUE/FALSE)
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE is_available = 1) as active_products,
        (SELECT COUNT(*) FROM products WHERE is_available = 0) as inactive_products,
        
        -- Commandes - Totales
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as orders_today,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as orders_yesterday,
        
        -- Commandes par statut
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'preparing') as preparing_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'ready') as ready_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'served') as served_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
        
        -- Revenus - Tous statuts (sauf annulées)
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') as revenue_today,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status != 'cancelled') as revenue_yesterday,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status != 'cancelled') as revenue_7days,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status != 'cancelled') as revenue_30days,
        
        -- Ticket moyen
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status != 'cancelled') as average_order_value,
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') as average_order_value_today,
        
        -- Articles
        (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status != 'cancelled') as total_items_sold,
        (SELECT COALESCE(AVG(items_count), 0) FROM (SELECT COUNT(oi.id) as items_count FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status != 'cancelled' GROUP BY o.id) as subq) as average_items_per_order
    `);
    
    const dashboardStats = stats[0];
    
    console.log('✅ STATISTIQUES RÉCUPÉRÉES:');
    console.log('   total_revenue:', dashboardStats.total_revenue, typeof dashboardStats.total_revenue);
    console.log('   revenue_today:', dashboardStats.revenue_today, typeof dashboardStats.revenue_today);
    console.log('   total_orders:', dashboardStats.total_orders, typeof dashboardStats.total_orders);
    console.log('   orders_today:', dashboardStats.orders_today, typeof dashboardStats.orders_today);
    console.log('   total_products:', dashboardStats.total_products, typeof dashboardStats.total_products);
    console.log('   active_products:', dashboardStats.active_products, typeof dashboardStats.active_products);
    console.log('   inactive_products:', dashboardStats.inactive_products, typeof dashboardStats.inactive_products);
    console.log('   total_clients:', dashboardStats.total_clients, typeof dashboardStats.total_clients);
    console.log('   active_clients:', dashboardStats.active_clients, typeof dashboardStats.active_clients);

    // Test de conversion (comme dans le frontend)
    console.log('\n🔄 TEST CONVERSION FRONTEND:');
    const convertedStats = {
      total_revenue: parseFloat(dashboardStats.total_revenue) || 0,
      revenue_today: parseFloat(dashboardStats.revenue_today) || 0,
      total_orders: parseInt(dashboardStats.total_orders) || 0,
      orders_today: parseInt(dashboardStats.orders_today) || 0,
      total_products: parseInt(dashboardStats.total_products) || 0,
      active_products: parseInt(dashboardStats.active_products) || 0,
      inactive_products: parseInt(dashboardStats.inactive_products) || 0,
      total_clients: parseInt(dashboardStats.total_clients) || 0,
      active_clients: parseInt(dashboardStats.active_clients) || 0
    };
    
    console.log('   Après conversion:');
    console.log('   total_revenue:', convertedStats.total_revenue, typeof convertedStats.total_revenue);
    console.log('   revenue_today:', convertedStats.revenue_today, typeof convertedStats.revenue_today);
    console.log('   total_orders:', convertedStats.total_orders, typeof convertedStats.total_orders);
    console.log('   orders_today:', convertedStats.orders_today, typeof convertedStats.orders_today);
    console.log('   total_products:', convertedStats.total_products, typeof convertedStats.total_products);
    console.log('   active_products:', convertedStats.active_products, typeof convertedStats.active_products);
    console.log('   inactive_products:', convertedStats.inactive_products, typeof convertedStats.inactive_products);
    console.log('   total_clients:', convertedStats.total_clients, typeof convertedStats.total_clients);
    console.log('   active_clients:', convertedStats.active_clients, typeof convertedStats.active_clients);

    // Test formatage
    console.log('\n💰 TEST FORMATAGE:');
    function formatPrice(amount) {
      return parseFloat(amount || 0).toFixed(2) + '€';
    }
    
    console.log('   CA Total formaté:', formatPrice(convertedStats.total_revenue));
    console.log('   CA Aujourd\'hui formaté:', formatPrice(convertedStats.revenue_today));

    console.log('\n✅ ROUTE DASHBOARD FONCTIONNE MAINTENANT !');
    console.log('   → Les statistiques devraient s\'afficher correctement dans le frontend');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

testDashboardFixed();
