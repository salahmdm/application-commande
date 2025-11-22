/**
 * Script de diagnostic pour vérifier les commandes d'un utilisateur
 * Usage: node diagnostic-user-orders.js [email]
 */

const mysql = require('mysql2/promise');

// Utiliser la configuration centralisée depuis config.js
require('dotenv').config();
const configModule = require('./config');
const logger = require('./utils/logger');
const config = {
  db: configModule.database
};

async function diagnosticUserOrders(email = 'client@blossom.com') {
  let connection;
  
  try {
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🔍 DIAGNOSTIC COMMANDES UTILISATEUR');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('📧 Email recherché:', email);
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    });
    
    logger.log('✅ Connexion à la base de données réussie\n');
    
    // 1. Trouver l'utilisateur
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('1️⃣ RECHERCHE UTILISATEUR');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const [users] = await connection.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      logger.error('❌ Utilisateur non trouvé avec l\'email:', email);
      logger.log('\n📋 Liste de tous les utilisateurs:');
      const [allUsers] = await connection.query(
        'SELECT id, email, first_name, last_name, role FROM users LIMIT 10'
      );
      allUsers.forEach((u, idx) => {
        logger.log(`   ${idx + 1}. ID: ${u.id} - Email: ${u.email} - Nom: ${u.first_name} ${u.last_name}`);
      });
      return;
    }
    
    const user = users[0];
    logger.log('✅ Utilisateur trouvé:');
    logger.log('   - ID:', user.id);
    logger.log('   - Email:', user.email);
    logger.log('   - Nom:', `${user.first_name} ${user.last_name}`);
    logger.log('   - Role:', user.role);
    logger.log('');
    
    // 2. Compter les commandes pour cet utilisateur
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('2️⃣ COMPTAGE COMMANDES');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [user.id]
    );
    
    const totalOrders = countResult[0].total;
    logger.log(`📊 Total commandes pour user_id ${user.id}:`, totalOrders);
    logger.log('');
    
    // 3. Lister les commandes
    if (totalOrders > 0) {
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('3️⃣ LISTE DES COMMANDES');
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
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
        logger.log(`\n   ${idx + 1}. Commande #${order.order_number}:`);
        logger.log(`      - ID: ${order.id}`);
        logger.log(`      - Type: ${order.order_type}`);
        logger.log(`      - Status: ${order.status}`);
        logger.log(`      - Total: ${order.total_amount}€`);
        logger.log(`      - Paiement: ${order.payment_status}`);
        logger.log(`      - Items: ${order.items_count}`);
        logger.log(`      - Date: ${order.created_at}`);
      });
      
      // 4. Vérifier les items d'une commande
      if (orders.length > 0) {
        logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.log('4️⃣ DÉTAILS D\'UNE COMMANDE');
        logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
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
        
        logger.log(`\n📦 Items de la commande #${orders[0].order_number} (ID: ${firstOrderId}):`);
        items.forEach((item, idx) => {
          logger.log(`   ${idx + 1}. ${item.product_name} x${item.quantity} - ${item.unit_price}€ = ${item.subtotal}€`);
        });
      }
    } else {
      logger.log('⚠️ Aucune commande trouvée pour cet utilisateur');
      
      // Vérifier s'il y a des commandes dans la base
      const [allOrdersCount] = await connection.query('SELECT COUNT(*) as total FROM orders');
      logger.log(`\n📊 Total commandes dans la base: ${allOrdersCount[0].total}`);
      
      if (allOrdersCount[0].total > 0) {
        logger.log('\n📋 Exemples de commandes (tous utilisateurs):');
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
          logger.log(`   ${idx + 1}. Commande #${order.order_number} - User ID: ${order.user_id} (${order.user_email || 'N/A'}) - Total: ${order.total_amount}€`);
        });
      }
    }
    
    logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('✅ DIAGNOSTIC TERMINÉ');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ ERREUR');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('Message:', error.message);
    logger.error('Code:', error.code);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
  logger.error('Erreur fatale:', error);
  process.exit(1);
});

