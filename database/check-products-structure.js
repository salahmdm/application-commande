const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkStructure() {
  try {
    console.log('📋 Structure de la table products:');
    console.log('');
    
    const [columns] = await pool.query('DESCRIBE products');
    
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    console.log('');
    console.log('📊 Nombre de produits actuels:');
    const [count] = await pool.query('SELECT COUNT(*) as total FROM products WHERE deleted_at IS NULL');
    console.log(`  Total: ${count[0].total} produits`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkStructure();
