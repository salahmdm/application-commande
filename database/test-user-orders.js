/**
 * Script de test pour vérifier les commandes d'un utilisateur spécifique
 * Usage: node test-user-orders.js [email]
 */

const mysql = require('mysql2/promise');

// Utiliser la configuration centralisée depuis config.js
require('dotenv').config();
const configModule = require('./config');
const config = configModule.database;

async function testUserOrders(email = 'pascal.dupont@example.com') {
  let connection;
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 TEST COMMANDES UTILISATEUR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 Email recherché:', email);
    console.log('');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion à la base de données réussie\n');
    
    // 1. Trouver l'utilisateur
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣ RECHERCHE UTILISATEUR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const [users] = await connection.query(`
      SELECT id, email, first_name, last_name, role, loyalty_points
      FROM users 
      WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?
    `, [`%${email}%`, `%${email}%`, `%${email}%`]);
    
    if (users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé avec cet email/nom');
      process.exit(1);
    }
    
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
    users.forEach(user => {
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nom: ${user.first_name} ${user.last_name}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Points: ${user.loyalty_points}`);
      console.log('');
    });
    
    // Pour chaque utilisateur, vérifier les commandes
    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`2️⃣ COMMANDES POUR ${user.first_name} ${user.last_name} (ID: ${user.id})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Compter les commandes
      const [count] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE user_id = ?
      `, [user.id]);
      
      console.log(`📊 Nombre total de commandes: ${count[0].count}\n`);
      
      if (count[0].count === 0) {
        console.log('⚠️ Aucune commande trouvée pour cet utilisateur\n');
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
      
      console.log(`✅ ${orders.length} commande(s) récupérée(s):\n`);
      
      // Afficher les 5 premières commandes
      orders.slice(0, 5).forEach((order, index) => {
        console.log(`   Commande #${index + 1}:`);
        console.log(`      ID: ${order.id}`);
        console.log(`      Numéro: ${order.order_number}`);
        console.log(`      Type: ${order.order_type}`);
        console.log(`      Statut: ${order.status}`);
        console.log(`      Montant: ${order.total_amount}€`);
        console.log(`      Paiement: ${order.payment_status}`);
        console.log(`      Date: ${order.created_at}`);
        console.log('');
      });
      
      // Pour chaque commande, vérifier les items
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`3️⃣ ITEMS POUR LES COMMANDES`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
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
        
        console.log(`\n   Commande #${order.order_number} (${items.length} items):`);
        items.forEach(item => {
          console.log(`      - ${item.product_name} x${item.quantity} = ${item.subtotal}€`);
        });
      }
      
      // Statistiques
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`4️⃣ STATISTIQUES`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const [stats] = await connection.query(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE 0 END), 0) as total_spent,
          COALESCE(AVG(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE NULL END), 0) as average_order,
          MAX(o.created_at) as last_order_date
        FROM orders o
        WHERE o.user_id = ?
      `, [user.id]);
      
      console.log(`   Total commandes: ${stats[0].total_orders}`);
      console.log(`   CA total: ${stats[0].total_spent}€`);
      console.log(`   Panier moyen: ${stats[0].average_order}€`);
      console.log(`   Dernière commande: ${stats[0].last_order_date || 'Aucune'}`);
      console.log('');
    }
    
    await connection.end();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST TERMINÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERREUR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Exécuter le test
const email = process.argv[2] || 'pascal';
testUserOrders(email);

