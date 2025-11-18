/**
 * Script de diagnostic pour vérifier les commandes d'un utilisateur
 * Usage: node diagnostic-user-orders.js [email]
 */

const mysql = require('mysql2/promise');

// Utiliser la configuration centralisée depuis config.js
require('dotenv').config();
const configModule = require('./config');
const config = {
  db: configModule.database
};

async function diagnosticUserOrders(email = 'client@blossom.com') {
  let connection;
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNOSTIC COMMANDES UTILISATEUR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email recherché:', email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    });
    
    console.log('✅ Connexion à la base de données réussie\n');
    
    // 1. Trouver l'utilisateur
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣ RECHERCHE UTILISATEUR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const [users] = await connection.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.error('❌ Utilisateur non trouvé avec l\'email:', email);
      console.log('\n📋 Liste de tous les utilisateurs:');
      const [allUsers] = await connection.query(
        'SELECT id, email, first_name, last_name, role FROM users LIMIT 10'
      );
      allUsers.forEach((u, idx) => {
        console.log(`   ${idx + 1}. ID: ${u.id} - Email: ${u.email} - Nom: ${u.first_name} ${u.last_name}`);
      });
      return;
    }
    
    const user = users[0];
    console.log('✅ Utilisateur trouvé:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Nom:', `${user.first_name} ${user.last_name}`);
    console.log('   - Role:', user.role);
    console.log('');
    
    // 2. Compter les commandes pour cet utilisateur
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣ COMPTAGE COMMANDES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [user.id]
    );
    
    const totalOrders = countResult[0].total;
    console.log(`📊 Total commandes pour user_id ${user.id}:`, totalOrders);
    console.log('');
    
    // 3. Lister les commandes
    if (totalOrders > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('3️⃣ LISTE DES COMMANDES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const [orders] = await connection.query(
        `SELECT 
          o.id,
          o.order_number,
          o.user_id,
          o.order_type,
          o.status,
          o.total_amount,
          o.payment_status,
          o.created_at,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
        FROM orders o
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        LIMIT 10`,
        [user.id]
      );
      
      orders.forEach((order, idx) => {
        console.log(`\n   ${idx + 1}. Commande #${order.order_number}:`);
        console.log(`      - ID: ${order.id}`);
        console.log(`      - Type: ${order.order_type}`);
        console.log(`      - Status: ${order.status}`);
        console.log(`      - Total: ${order.total_amount}€`);
        console.log(`      - Paiement: ${order.payment_status}`);
        console.log(`      - Items: ${order.items_count}`);
        console.log(`      - Date: ${order.created_at}`);
      });
      
      // 4. Vérifier les items d'une commande
      if (orders.length > 0) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('4️⃣ DÉTAILS D\'UNE COMMANDE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const firstOrderId = orders[0].id;
        const [items] = await connection.query(
          `SELECT 
            oi.id,
            oi.product_id,
            oi.product_name,
            oi.quantity,
            oi.unit_price,
            oi.subtotal
          FROM order_items oi
          WHERE oi.order_id = ?
          LIMIT 5`,
          [firstOrderId]
        );
        
        console.log(`\n📦 Items de la commande #${orders[0].order_number} (ID: ${firstOrderId}):`);
        items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.product_name} x${item.quantity} - ${item.unit_price}€ = ${item.subtotal}€`);
        });
      }
    } else {
      console.log('⚠️ Aucune commande trouvée pour cet utilisateur');
      
      // Vérifier s'il y a des commandes dans la base
      const [allOrdersCount] = await connection.query('SELECT COUNT(*) as total FROM orders');
      console.log(`\n📊 Total commandes dans la base: ${allOrdersCount[0].total}`);
      
      if (allOrdersCount[0].total > 0) {
        console.log('\n📋 Exemples de commandes (tous utilisateurs):');
        const [sampleOrders] = await connection.query(
          `SELECT 
            o.id,
            o.order_number,
            o.user_id,
            u.email as user_email,
            o.total_amount,
            o.created_at
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          ORDER BY o.created_at DESC
          LIMIT 5`
        );
        
        sampleOrders.forEach((order, idx) => {
          console.log(`   ${idx + 1}. Commande #${order.order_number} - User ID: ${order.user_id} (${order.user_email || 'N/A'}) - Total: ${order.total_amount}€`);
        });
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DIAGNOSTIC TERMINÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERREUR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le diagnostic
const email = process.argv[2] || 'client@blossom.com';
diagnosticUserOrders(email).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});

