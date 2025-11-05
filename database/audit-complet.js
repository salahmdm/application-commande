/**
 * AUDIT COMPLET - Vérification de toutes les tables et données
 */

const mysql = require('mysql2/promise');

async function auditComplet() {
  console.log('========================================');
  console.log('  AUDIT COMPLET - Blossom Café');
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

    // 1. VÉRIFIER LES TABLES
    console.log('📋 TABLES EXISTANTES:');
    console.log('─'.repeat(80));
    
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const tablesRequises = [
      'users',
      'categories', 
      'products',
      'orders',
      'order_items',
      'promo_codes',
      'favorites',
      'loyalty_transactions',
      'notifications',
      'reviews',
      'inventory_logs',
      'settings',
      'audit_logs'
    ];
    
    console.log(`Total tables trouvées: ${tableNames.length}\n`);
    
    tablesRequises.forEach(tableName => {
      const exists = tableNames.includes(tableName);
      const status = exists ? '✅' : '❌ MANQUANTE';
      console.log(`  ${status} ${tableName}`);
    });
    
    const tablesManquantes = tablesRequises.filter(t => !tableNames.includes(t));
    
    if (tablesManquantes.length > 0) {
      console.log(`\n⚠️  ${tablesManquantes.length} table(s) manquante(s):`);
      tablesManquantes.forEach(t => console.log(`     - ${t}`));
    }
    
    console.log('\n');
    
    // 2. VÉRIFIER LES DONNÉES
    console.log('📊 CONTENU DES TABLES:');
    console.log('─'.repeat(80));
    
    for (const tableName of tableNames.filter(t => t !== 'v_product_stats')) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  ${tableName.padEnd(25)} ${rows[0].count} lignes`);
    }
    
    console.log('\n');
    
    // 3. VÉRIFIER LES UTILISATEURS
    console.log('👥 UTILISATEURS:');
    console.log('─'.repeat(80));
    
    const [users] = await connection.query('SELECT email, first_name, last_name, role FROM users');
    users.forEach(u => {
      console.log(`  • ${u.email.padEnd(30)} ${u.first_name} ${u.last_name.padEnd(15)} [${u.role}]`);
    });
    
    console.log('\n');
    
    // 4. VÉRIFIER LES CATÉGORIES
    console.log('🏷️  CATÉGORIES:');
    console.log('─'.repeat(80));
    
    const [categories] = await connection.query('SELECT id, name, slug FROM categories ORDER BY display_order');
    categories.forEach(c => {
      console.log(`  [${c.id}] ${c.name.padEnd(20)} (${c.slug})`);
    });
    
    console.log('\n');
    
    // 5. VÉRIFIER LES PRODUITS
    console.log('🛍️  PRODUITS PAR CATÉGORIE:');
    console.log('─'.repeat(80));
    
    for (const cat of categories) {
      const [products] = await connection.query(
        'SELECT name, price, stock FROM products WHERE category_id = ?',
        [cat.id]
      );
      
      console.log(`\n  ${cat.name}:`);
      products.forEach(p => {
        console.log(`    • ${p.name.padEnd(30)} ${p.price}€  Stock: ${p.stock}`);
      });
    }
    
    console.log('\n');
    
    // 6. RÉSUMÉ
    console.log('========================================');
    console.log('  RÉSUMÉ');
    console.log('========================================\n');
    
    const [summary] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM promo_codes) as promo_codes
    `);
    
    console.log(`  Utilisateurs: ${summary[0].users}`);
    console.log(`  Catégories: ${summary[0].categories}`);
    console.log(`  Produits: ${summary[0].products}`);
    console.log(`  Commandes: ${summary[0].orders}`);
    console.log(`  Codes promo: ${summary[0].promo_codes}\n`);
    
    // 7. RECOMMANDATIONS
    console.log('📝 RECOMMANDATIONS:');
    console.log('─'.repeat(80));
    
    if (tablesManquantes.length > 0) {
      console.log('  ⚠️  Créer les tables manquantes');
    } else {
      console.log('  ✅ Toutes les tables requises sont présentes');
    }
    
    if (summary[0].products < 10) {
      console.log('  💡 Ajouter plus de produits pour un catalogue complet');
    }
    
    if (summary[0].orders === 0) {
      console.log('  💡 Aucune commande - normal si c\'est une nouvelle installation');
    }
    
    console.log('\n');

  } catch (error) {
    console.log('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

auditComplet();


