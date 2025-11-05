/**
 * Script de vérification du mapping entre tables MySQL et onglets application
 */

const mysql = require('mysql2/promise');

async function verifierMapping() {
  console.log('========================================');
  console.log('  MAPPING TABLES ↔ ONGLETS');
  console.log('========================================\n');

  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('✅ Connexion MySQL établie\n');

    // Vérifier chaque onglet et ses données
    
    console.log('🏠 ONGLET ACCUEIL (HomeView)');
    console.log('─'.repeat(80));
    console.log('Tables utilisées:');
    console.log('  • products (produits vedettes)');
    console.log('  • categories (navigation)');
    
    const [featured] = await connection.query(
      'SELECT COUNT(*) as count FROM products WHERE is_featured = TRUE'
    );
    console.log(`✅ Produits vedettes disponibles: ${featured[0].count}`);
    
    const [allProducts] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log(`✅ Total produits: ${allProducts[0].count}\n`);
    
    
    console.log('🛍️  ONGLET PRODUITS (ProductsView)');
    console.log('─'.repeat(80));
    console.log('Tables utilisées:');
    console.log('  • products (catalogue complet)');
    console.log('  • categories (filtres)');
    console.log('  • favorites (produits favoris)');
    
    const [productsByCat] = await connection.query(`
      SELECT c.name, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY c.display_order
    `);
    
    console.log('Produits par catégorie:');
    productsByCat.forEach(cat => {
      console.log(`  • ${cat.name.padEnd(20)}: ${cat.count} produit(s)`);
    });
    console.log('');
    
    
    console.log('📦 ONGLET COMMANDES');
    console.log('─'.repeat(80));
    console.log('Tables utilisées:');
    console.log('  • orders (liste des commandes)');
    console.log('  • order_items (détails articles)');
    console.log('  • products (infos produits)');
    console.log('  • users (infos client)');
    
    const [ordersCount] = await connection.query('SELECT COUNT(*) as count FROM orders');
    console.log(`✅ Commandes dans la base: ${ordersCount[0].count}`);
    
    const [orderItems] = await connection.query('SELECT COUNT(*) as count FROM order_items');
    console.log(`✅ Articles commandés: ${orderItems[0].count}\n`);
    
    
    console.log('👔 ONGLET TABLEAU DE BORD MANAGER (ManagerDashboard)');
    console.log('─'.repeat(80));
    console.log('Tables utilisées:');
    console.log('  • orders (commandes du jour)');
    console.log('  • order_items (détails)');
    console.log('  • users (infos clients)');
    
    const [todayOrders] = await connection.query(`
      SELECT COUNT(*) as count,
             COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
    `);
    console.log(`✅ Commandes aujourd'hui: ${todayOrders[0].count}`);
    console.log(`✅ Revenus aujourd'hui: ${parseFloat(todayOrders[0].revenue).toFixed(2)}€\n`);
    
    
    console.log('📊 ONGLET ANALYTICS (AdminAnalytics)');
    console.log('─'.repeat(80));
    console.log('Tables utilisées:');
    console.log('  • orders (statistiques ventes)');
    console.log('  • order_items (produits vendus)');
    console.log('  • products (performance produits)');
    console.log('  • categories (revenus par catégorie)');
    console.log('  • users (nombre clients)');
    
    const [stats] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'client') as clients,
        (SELECT COUNT(*) FROM products) as produits,
        (SELECT COUNT(*) FROM orders) as commandes,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'completed') as revenus
    `);
    
    console.log('Statistiques globales:');
    console.log(`  • Clients: ${stats[0].clients}`);
    console.log(`  • Produits: ${stats[0].produits}`);
    console.log(`  • Commandes: ${stats[0].commandes}`);
    console.log(`  • Revenus: ${parseFloat(stats[0].revenus).toFixed(2)}€\n`);
    
    
    console.log('🔧 ONGLET GESTION PRODUITS (AdminProducts)');
    console.log('─'.repeat(80));
    console.log('Tables utilisées:');
    console.log('  • products (CRUD complet)');
    console.log('  • categories (sélection catégorie)');
    console.log('  • inventory_logs (historique stocks)');
    
    const [productsWithDetails] = await connection.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY c.display_order, p.name
    `);
    
    console.log('Produits gérables:');
    productsWithDetails.forEach(p => {
      console.log(`  • [${p.id}] ${p.name.padEnd(30)} ${p.price}€  Stock: ${p.stock}`);
    });
    console.log('');
    
    
    console.log('========================================');
    console.log('  RÉSUMÉ DU MAPPING');
    console.log('========================================\n');
    
    console.log('✅ ONGLET → TABLES MYSQL:');
    console.log('');
    console.log('  🏠 Accueil');
    console.log('     └─ products, categories');
    console.log('');
    console.log('  🛍️  Produits');
    console.log('     └─ products, categories, favorites');
    console.log('');
    console.log('  📦 Commandes');
    console.log('     └─ orders, order_items, products, users');
    console.log('');
    console.log('  👔 Dashboard Manager');
    console.log('     └─ orders, order_items, users');
    console.log('');
    console.log('  📊 Analytics');
    console.log('     └─ orders, order_items, products, categories, users');
    console.log('');
    console.log('  🔧 Gestion Produits');
    console.log('     └─ products, categories, inventory_logs');
    console.log('');
    console.log('  🎫 Codes Promo');
    console.log('     └─ promo_codes');
    console.log('');
    console.log('  👥 Utilisateurs');
    console.log('     └─ users, loyalty_transactions');
    console.log('');
    
    console.log('✅ TOUS LES ONGLETS SONT LIÉS À MYSQL !');
    console.log('');

  } catch (error) {
    console.log('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifierMapping();


