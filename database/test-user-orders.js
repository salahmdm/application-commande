/**
 * Script de test pour vérifier les commandes d'un utilisateur spécifique
 * Usage: node test-user-orders.js [email]
 */

const mysql = require('mysql2/promise');

// Utiliser la configuration centralisée depuis config.js
require('dotenv').config();
const configModule = require('./config');
const logger = require('./utils/logger');
const config = configModule.database;

async function testUserOrders(email = 'pascal.dupont@example.com') {
  let connection;
  
  try {
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🔍 TEST COMMANDES UTILISATEUR');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    logger.log('📧 Email recherché:', email);
    logger.log('');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(config);
    logger.log('✅ Connexion à la base de données réussie\n');
    
    // 1. Trouver l'utilisateur
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('1️⃣ RECHERCHE UTILISATEUR');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const [users] = await connection.query(`
      SELECT id, email, first_name, last_name, role, loyalty_points
      FROM users 
      WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?
    `, [`%${email}%`, `%${email}%`, `%${email}%`]);
    
    if (users.length === 0) {
      logger.error('❌ Aucun utilisateur trouvé avec cet email/nom');
      process.exit(1);
    }
    
    logger.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
    users.forEach(user => {
      logger.log(`   ID: ${user.id}`);
      logger.log(`   Email: ${user.email}`);
      logger.log(`   Nom: ${user.first_name} ${user.last_name}`);
      logger.log(`   Rôle: ${user.role}`);
      logger.log(`   Points: ${user.loyalty_points}`);
      logger.log('');
    });
    
    // Pour chaque utilisateur, vérifier les commandes
    for (const user of users) {
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log(`2️⃣ COMMANDES POUR ${user.first_name} ${user.last_name} (ID: ${user.id})`);
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Compter les commandes
      const [count] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE user_id = ?
      `, [user.id]);
      
      logger.log(`📊 Nombre total de commandes: ${count[0].count}\n`);
      
      if (count[0].count === 0) {
        logger.log('⚠️ Aucune commande trouvée pour cet utilisateur\n');
        continue;
      }
      
      // Récupérer les commandes (comme dans l'endpoint)
      const [orders] = await connection.query(`
        SELECT 
          o.id, 
          o.order_number, 
          o.order_type,
          o.status, 
          o.subtotal,
          o.discount_amount,
          o.tax_amount,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.notes,
          o.table_number,
          o.delivery_address,
          o.estimated_ready_time,
          o.completed_at,
          o.created_at,
          o.updated_at
        FROM orders o
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        LIMIT 100
      `, [user.id]);
      
      logger.log(`✅ ${orders.length} commande(s) récupérée(s):\n`);
      
      // Afficher les 5 premières commandes
      orders.slice(0, 5).forEach((order, index) => {
        logger.log(`   Commande #${index + 1}:`);
        logger.log(`      ID: ${order.id}`);
        logger.log(`      Numéro: ${order.order_number}`);
        logger.log(`      Type: ${order.order_type}`);
        logger.log(`      Statut: ${order.status}`);
        logger.log(`      Montant: ${order.total_amount}€`);
        logger.log(`      Paiement: ${order.payment_status}`);
        logger.log(`      Date: ${order.created_at}`);
        logger.log('');
      });
      
      // Pour chaque commande, vérifier les items
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log(`3️⃣ ITEMS POUR LES COMMANDES`);
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      for (const order of orders.slice(0, 3)) {
        const [items] = await connection.query(`
          SELECT 
            oi.id,
            oi.product_id,
            oi.product_name,
            oi.quantity,
            oi.unit_price,
            oi.subtotal,
            oi.special_instructions
          FROM order_items oi
          WHERE oi.order_id = ?
          ORDER BY oi.id ASC
        `, [order.id]);
        
        logger.log(`\n   Commande #${order.order_number} (${items.length} items):`);
        items.forEach(item => {
          logger.log(`      - ${item.product_name} x${item.quantity} = ${item.subtotal}€`);
        });
      }
      
      // Statistiques
      logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log(`4️⃣ STATISTIQUES`);
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const [stats] = await connection.query(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE 0 END), 0) as total_spent,
          COALESCE(AVG(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE NULL END), 0) as average_order,
          MAX(o.created_at) as last_order_date
        FROM orders o
        WHERE o.user_id = ?
      `, [user.id]);
      
      logger.log(`   Total commandes: ${stats[0].total_orders}`);
      logger.log(`   CA total: ${stats[0].total_spent}€`);
      logger.log(`   Panier moyen: ${stats[0].average_order}€`);
      logger.log(`   Dernière commande: ${stats[0].last_order_date || 'Aucune'}`);
      logger.log('');
    }
    
    await connection.end();
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('✅ TEST TERMINÉ');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ ERREUR');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('Message:', error.message);
    logger.error('Code:', error.code);
    logger.error('SQL State:', error.sqlState);
    logger.error('Stack:', error.stack);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Exécuter le test
const email = process.argv[2] || 'pascal';
testUserOrders(email);

