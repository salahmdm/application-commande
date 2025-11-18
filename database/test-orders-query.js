/**
 * Script de test pour vérifier la requête SQL des commandes
 * Usage: node database/test-orders-query.js
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function testOrdersQuery() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    });
    
    console.log('✅ Connecté à la base de données');
    
    // Test 1: Vérifier qu'il y a des commandes
    console.log('\n📊 Test 1: Nombre total de commandes');
    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM orders');
    console.log('   Total commandes:', countResult[0].total);
    
    // Test 2: Vérifier les statuts
    console.log('\n📊 Test 2: Commandes par statut');
    const [statusResult] = await connection.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);
    console.table(statusResult);
    
    // Test 3: Vérifier les commandes récentes
    console.log('\n📊 Test 3: 5 dernières commandes (sans items)');
    const [recentOrders] = await connection.query(`
      SELECT id, order_number, status, total_amount, created_at, user_id
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.table(recentOrders);
    
    // Test 4: Vérifier si les commandes ont des items
    console.log('\n📊 Test 4: Commandes avec nombre d\'items');
    const [ordersWithItems] = await connection.query(`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    console.table(ordersWithItems);
    
    // Test 5: Tester la requête complète (version simplifiée)
    console.log('\n📊 Test 5: Requête complète (version simplifiée - 3 premières commandes)');
    const [fullQuery] = await connection.query(`
      SELECT 
        o.*,
        COALESCE(u.first_name, '') as first_name, 
        COALESCE(u.last_name, 'Invité') as last_name, 
        COALESCE(u.email, '') as email,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', op.id,
                'method', op.method,
                'amount', op.amount,
                'reference', op.reference,
                'created_at', op.created_at
              )
            )
            FROM order_payments op
            WHERE op.order_id = o.id
          ),
          JSON_ARRAY()
        ) AS payments,
        (SELECT COUNT(*) FROM order_items oi2 WHERE oi2.order_id = o.id) as items_count,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', COALESCE(oi.product_name, ''),
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'subtotal', oi.subtotal,
                'image_url', COALESCE(p.image_url, ''),
                'category_name', COALESCE(c.name, ''),
                'category_type', CASE 
                  WHEN LOWER(COALESCE(c.name, '')) LIKE '%entrée%' OR LOWER(COALESCE(c.name, '')) LIKE '%entree%' OR LOWER(COALESCE(c.name, '')) LIKE '%starter%' THEN 'entree'
                  WHEN LOWER(COALESCE(c.name, '')) LIKE '%dessert%' OR LOWER(COALESCE(c.name, '')) LIKE '%sweet%' THEN 'dessert'
                  ELSE 'plat'
                END
              )
            )
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE oi.order_id = o.id
          ),
          JSON_ARRAY()
        ) AS items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 3
    `);
    
    console.log('   Nombre de commandes retournées:', fullQuery.length);
    if (fullQuery.length > 0) {
      console.log('   Première commande:');
      console.log('     - ID:', fullQuery[0].id);
      console.log('     - Numéro:', fullQuery[0].order_number);
      console.log('     - Statut:', fullQuery[0].status);
      console.log('     - Items count:', fullQuery[0].items_count);
      console.log('     - Items type:', typeof fullQuery[0].items);
      console.log('     - Items:', Array.isArray(fullQuery[0].items) ? fullQuery[0].items.length : 'N/A');
      
      // Tester le parsing des items
      let items = [];
      if (fullQuery[0].items) {
        try {
          if (typeof fullQuery[0].items === 'string') {
            items = JSON.parse(fullQuery[0].items);
          } else if (Array.isArray(fullQuery[0].items)) {
            items = fullQuery[0].items;
          }
        } catch (e) {
          console.error('   ❌ Erreur parsing items:', e.message);
        }
      }
      console.log('     - Items parsés:', items.length);
    } else {
      console.log('   ⚠️ Aucune commande retournée par la requête !');
    }
    
    console.log('\n✅ Tests terminés');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('   Code:', error.code);
    console.error('   SQL State:', error.sqlState);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécuter les tests
testOrdersQuery();

