/**
 * Script pour vérifier le contenu des tables avant suppression
 */

const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe'
};

async function checkTableContent(tableName) {
  const pool = mysql.createPool(config);
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const [data] = await pool.query(`SELECT * FROM ${tableName} LIMIT 5`);
    await pool.end();
    return {
      count: rows[0].count,
      sample: data
    };
  } catch (error) {
    await pool.end();
    return { error: error.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('🔍 VÉRIFICATION DONNÉES TABLES');
  console.log('========================================\n');
  
  const tablesToCheck = ['inventory', 'settings', 'v_product_stats'];
  
  for (const table of tablesToCheck) {
    console.log(`📦 Table: ${table}`);
    const result = await checkTableContent(table);
    if (result.error) {
      console.log(`   ❌ Erreur: ${result.error}`);
    } else {
      console.log(`   📊 Lignes: ${result.count}`);
      if (result.count > 0) {
        console.log(`   📄 Échantillon (premiers 5):`);
        console.log(JSON.stringify(result.sample, null, 2));
      } else {
        console.log(`   ✅ Table vide`);
      }
    }
    console.log('');
  }
  
  // Vérifier les foreign keys
  console.log('🔗 Vérification des FOREIGN KEYS...\n');
  const pool = mysql.createPool(config);
  try {
    const [fks] = await pool.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = 'blossom_cafe'
      AND REFERENCED_TABLE_NAME IN ('inventory', 'settings', 'favorites', 'reviews', 'audit_logs', 'inventory_logs', 'loyalty_transactions', 'v_product_stats')
    `);
    
    if (fks.length > 0) {
      console.log('⚠️ FOREIGN KEYS trouvées pointant vers les tables à supprimer:');
      fks.forEach(fk => {
        console.log(`   - ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('✅ Aucune FOREIGN KEY ne pointe vers les tables à supprimer');
    }
    await pool.end();
  } catch (error) {
    console.log(`❌ Erreur vérification FK: ${error.message}`);
    await pool.end();
  }
}

main();

