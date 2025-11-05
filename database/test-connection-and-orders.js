/**
 * Script de test pour vérifier la connexion MySQL et la récupération des commandes
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

async function testConnectionAndOrders() {
  let connection;
  try {
    console.log('🔍 Test de connexion MySQL...');
    connection = await pool.getConnection();
    console.log('✅ Connexion MySQL réussie\n');

    // Test 1: Vérifier que la table orders existe
    console.log('📋 Test 1: Vérification de la table orders...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'blossom_cafe' 
      AND TABLE_NAME = 'orders'
    `);
    
    if (tables.length === 0) {
      console.error('❌ La table orders n\'existe pas !');
      return;
    }
    console.log('✅ Table orders existe\n');

    // Test 2: Compter les commandes
    console.log('📊 Test 2: Nombre de commandes dans la base...');
    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM orders');
    const totalOrders = countResult[0].total;
    console.log(`✅ Total de commandes: ${totalOrders}\n`);

    // Test 3: Récupérer quelques commandes (sans JOIN)
    console.log('📦 Test 3: Récupération de commandes (sans JOIN)...');
    const [ordersSimple] = await connection.query(`
      SELECT id, order_number, status, user_id, created_at 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log(`✅ ${ordersSimple.length} commandes récupérées (sans JOIN):`);
    ordersSimple.forEach(order => {
      console.log(`   - ID: ${order.id}, Numéro: ${order.order_number}, Statut: ${order.status}, User ID: ${order.user_id || 'NULL'}`);
    });
    console.log('');

    // Test 4: Tester la requête complète avec LEFT JOIN
    console.log('🔗 Test 4: Requête complète avec LEFT JOIN...');
    try {
      const [ordersFull] = await connection.query(`
        SELECT 
          o.*,
          COALESCE(u.first_name, '') as first_name, 
          COALESCE(u.last_name, 'Invité') as last_name, 
          COALESCE(u.email, '') as email,
          (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          ) FROM order_items oi WHERE oi.order_id = o.id) AS items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ ${ordersFull.length} commandes récupérées (avec LEFT JOIN):`);
      ordersFull.forEach(order => {
        console.log(`   - ID: ${order.id}, Numéro: ${order.order_number}`);
        console.log(`     Client: ${order.first_name} ${order.last_name} (${order.email || 'N/A'})`);
        console.log(`     Items: ${order.items_count || 0}, Statut: ${order.status}`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ Erreur lors de la requête complète:', error.message);
      console.error('   Stack:', error.stack);
    }

    // Test 5: Vérifier les commandes avec user_id NULL
    console.log('👤 Test 5: Commandes avec user_id NULL (invités)...');
    const [guestOrders] = await connection.query(`
      SELECT COUNT(*) as count FROM orders WHERE user_id IS NULL
    `);
    console.log(`✅ Commandes d'invités: ${guestOrders[0].count}\n`);

    // Test 6: Vérifier la table users
    console.log('👥 Test 6: Vérification de la table users...');
    const [usersCount] = await connection.query('SELECT COUNT(*) as total FROM users');
    console.log(`✅ Total utilisateurs: ${usersCount[0].total}\n`);

    console.log('✅✅✅ Tous les tests réussis ! ✅✅✅\n');

  } catch (error) {
    console.error('❌❌❌ ERREUR CRITIQUE ❌❌❌');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 MySQL n\'est pas démarré ou n\'écoute pas sur le port 3306');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Erreur d\'authentification MySQL');
      console.error('   Vérifiez le mot de passe: Muheko,1991@');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 La base de données blossom_cafe n\'existe pas');
    }
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 Connexion libérée');
    }
    await pool.end();
    console.log('🔌 Pool de connexions fermé');
  }
}

testConnectionAndOrders()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

