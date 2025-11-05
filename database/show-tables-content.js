/**
 * Script pour afficher le contenu des tables
 */

const mysql = require('mysql2/promise');

async function showTablesContent() {
  console.log('=========================================');
  console.log('  Contenu des Tables - Blossom Café');
  console.log('=========================================\n');

  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('✅ Connecté à blossom_cafe\n');

    // USERS
    console.log('👥 UTILISATEURS:');
    console.log('─'.repeat(80));
    const [users] = await connection.query('SELECT id, email, first_name, last_name, role, loyalty_points FROM users');
    users.forEach(user => {
      console.log(`  ${user.id}. ${user.first_name} ${user.last_name}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Rôle: ${user.role} | Points: ${user.loyalty_points}`);
    });

    // CATEGORIES
    console.log('\n\n🏷️  CATÉGORIES:');
    console.log('─'.repeat(80));
    const [categories] = await connection.query('SELECT * FROM categories ORDER BY display_order');
    categories.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.name} (${cat.slug})`);
      console.log(`     ${cat.description}`);
    });

    // PRODUCTS
    console.log('\n\n🛍️  PRODUITS:');
    console.log('─'.repeat(80));
    const [products] = await connection.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      ORDER BY c.display_order, p.name
    `);
    products.forEach(prod => {
      console.log(`  ${prod.id}. ${prod.name} - ${prod.price}€`);
      console.log(`     Catégorie: ${prod.category_name}`);
      console.log(`     Stock: ${prod.stock} | Dispo: ${prod.is_available ? '✅' : '❌'} | Featured: ${prod.is_featured ? '⭐' : ''}`);
    });

    // PROMO CODES
    console.log('\n\n🎫 CODES PROMO:');
    console.log('─'.repeat(80));
    const [promoCodes] = await connection.query('SELECT * FROM promo_codes');
    promoCodes.forEach(promo => {
      const discount = promo.discount_type === 'percentage' 
        ? `${promo.discount_value}%` 
        : `${promo.discount_value}€`;
      console.log(`  ${promo.id}. ${promo.code} - ${discount} de réduction`);
      console.log(`     ${promo.description}`);
      console.log(`     Min: ${promo.min_order_amount}€ | Utilisé: ${promo.uses_count} fois`);
    });

    // SETTINGS
    console.log('\n\n⚙️  PARAMÈTRES:');
    console.log('─'.repeat(80));
    const [settings] = await connection.query('SELECT * FROM settings');
    settings.forEach(setting => {
      console.log(`  ${setting.setting_key}: ${setting.setting_value}`);
      if (setting.description) {
        console.log(`     ${setting.description}`);
      }
    });

    // STATISTICS
    console.log('\n\n📊 STATISTIQUES:');
    console.log('─'.repeat(80));
    
    const [tableStats] = await connection.query(`
      SELECT 
        table_name,
        table_rows,
        ROUND((data_length + index_length) / 1024, 2) AS size_kb
      FROM information_schema.tables
      WHERE table_schema = 'blossom_cafe'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n  Table                    Lignes    Taille');
    console.log('  ' + '─'.repeat(50));
    tableStats.forEach(stat => {
      const name = stat.table_name.padEnd(25);
      const rows = String(stat.table_rows).padStart(5);
      const size = String(stat.size_kb) + ' KB';
      console.log(`  ${name} ${rows}    ${size}`);
    });

    console.log('\n');

  } catch (error) {
    console.log('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

showTablesContent();


