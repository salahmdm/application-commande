/**
 * Test complet de la chaîne : MySQL → API → Frontend
 */

const mysql = require('mysql2/promise');
const http = require('http');

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

async function testFullChain() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 TEST COMPLET DE LA CHAÎNE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let connection;
  try {
    // Test 1: Connexion MySQL
    console.log('📋 Test 1: Connexion MySQL...');
    connection = await pool.getConnection();
    console.log('✅ Connexion MySQL réussie\n');

    // Test 2: Vérifier la table orders
    console.log('📋 Test 2: Vérification de la table orders...');
    const [tableCheck] = await connection.query(`
      SELECT COUNT(*) as total FROM orders
    `);
    console.log(`✅ Table orders: ${tableCheck[0].total} commandes\n`);

    // Test 3: Test de la requête exacte utilisée par l'API
    console.log('📋 Test 3: Test de la requête SQL complète...');
    try {
      const [orders] = await connection.query(`
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
              'subtotal', oi.subtotal,
              'image_url', (SELECT p.image_url FROM products p WHERE p.id = oi.product_id LIMIT 1),
              'category_type', (SELECT c.type FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = oi.product_id LIMIT 1),
              'category_name', (SELECT c.name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = oi.product_id LIMIT 1)
            )
          ) FROM order_items oi WHERE oi.order_id = o.id) AS items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Requête SQL réussie: ${orders.length} commandes récupérées`);
      if (orders.length > 0) {
        console.log(`   Première commande: ID ${orders[0].id}, Numéro: ${orders[0].order_number}`);
        console.log(`   Client: ${orders[0].first_name} ${orders[0].last_name}`);
        console.log(`   Items: ${orders[0].items_count || 0}`);
      }
      console.log('');
    } catch (sqlError) {
      console.error('❌ Erreur SQL:', sqlError.message);
      console.error('   Code:', sqlError.code);
      console.error('   SQL State:', sqlError.sqlState);
      console.error('   Stack:', sqlError.stack);
      console.log('');
    }

    // Test 4: Vérifier que le backend répond
    console.log('📋 Test 4: Vérification du backend API...');
    try {
      const response = await fetch('http://localhost:5000/api/admin/orders', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test_token'
        }
      });
      console.log(`   Status: ${response.status}`);
      const data = await response.json().catch(() => ({}));
      if (response.status === 403) {
        console.log('   ✅ Backend répond (403 attendu sans token valide)');
      } else if (response.status === 200) {
        console.log('   ✅ Backend répond avec succès');
        console.log(`   Commandes: ${data.data?.length || 0}`);
      } else {
        console.log(`   ⚠️ Backend répond avec status: ${response.status}`);
      }
      console.log('');
    } catch (fetchError) {
      console.error('❌ Backend ne répond pas !');
      console.error('   Erreur:', fetchError.message);
      console.error('   💡 Vérifiez que le backend est démarré: npm start');
      console.log('');
    }

    // Test 5: Vérifier les utilisateurs manager/admin
    console.log('📋 Test 5: Vérification des utilisateurs manager/admin...');
    const [users] = await connection.query(`
      SELECT id, email, first_name, last_name, role 
      FROM users 
      WHERE role IN ('manager', 'admin')
    `);
    console.log(`✅ ${users.length} utilisateur(s) manager/admin trouvé(s):`);
    users.forEach(user => {
      console.log(`   - ID ${user.id}: ${user.email} (${user.role})`);
    });
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅✅✅ TOUS LES TESTS TERMINÉS ✅✅✅');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌❌❌ ERREUR CRITIQUE ❌❌❌');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

testFullChain()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

