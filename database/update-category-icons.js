/**
 * Script pour mettre à jour les icônes des catégories
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10
});

async function updateIcons() {
  try {
    console.log('🎨 Mise à jour des icônes de catégories...\n');
    
    await pool.query(`
      UPDATE categories SET icon = '☕' WHERE slug = 'boissons-chaudes'
    `);
    console.log('✅ Boissons Chaudes → ☕');
    
    await pool.query(`
      UPDATE categories SET icon = '🧊' WHERE slug = 'boissons-froides'
    `);
    console.log('✅ Boissons Froides → 🧊');
    
    await pool.query(`
      UPDATE categories SET icon = '🥪' WHERE slug = 'delices-sales'
    `);
    console.log('✅ Délices Salés → 🥪');
    
    await pool.query(`
      UPDATE categories SET icon = '🍰' WHERE slug = 'delices-sucres'
    `);
    console.log('✅ Délices Sucrés → 🍰');
    
    console.log('\n✅ Icônes mises à jour avec succès !\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

updateIcons();

