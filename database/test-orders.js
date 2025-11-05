const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('🔍 Vérification des commandes dans MySQL...\n');
    
    // Toutes les commandes
    const [allOrders] = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log('📦 Total commandes:', allOrders[0].count);
    
    // Commandes complétées
    const [completed] = await pool.query(`
      SELECT COUNT(*) as count, SUM(total_amount) as total 
      FROM orders 
      WHERE payment_status = 'completed' AND status != 'cancelled'
    `);
    console.log('✅ Commandes complétées:', completed[0].count);
    console.log('💰 CA Total:', completed[0].total, '€');
    
    // Par statut
    const [byStatus] = await pool.query(`
      SELECT status, COUNT(*) as count, SUM(total_amount) as total
      FROM orders
      GROUP BY status
    `);
    console.log('\n📊 Par statut:');
    byStatus.forEach(row => {
      console.log(`   ${row.status}: ${row.count} commandes, ${row.total || 0} €`);
    });
    
    // Par payment_status
    const [byPayment] = await pool.query(`
      SELECT payment_status, COUNT(*) as count, SUM(total_amount) as total
      FROM orders
      GROUP BY payment_status
    `);
    console.log('\n💳 Par payment_status:');
    byPayment.forEach(row => {
      console.log(`   ${row.payment_status}: ${row.count} commandes, ${row.total || 0} €`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
})();

