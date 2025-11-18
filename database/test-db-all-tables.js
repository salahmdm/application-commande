// Vérifie l'accès à toutes les tables: liste les tables et fait un COUNT(*) sur chacune
// Utilise la même configuration que les autres scripts de test

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function main() {
  console.log('========================================');
  console.log('🔍 TEST ACCÈS À TOUTES LES TABLES MySQL');
  console.log('========================================\n');

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const database = process.env.DB_NAME || 'blossom_cafe';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  console.log('🎛️ Connexion:');
  console.log('   - Host:', host);
  console.log('   - Port:', port);
  console.log('   - Database:', database);
  console.log('   - User:', user);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      // Utiliser connectTimeout uniquement (les autres options non standard provoquent des warnings)
      connectTimeout: 10000,
    });
    console.log('✅ Connexion MySQL établie\n');

    // Lister toutes les tables du schéma
    const [tables] = await connection.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME ASC',
      [database]
    );

    if (!tables.length) {
      console.log('ℹ️ Aucune table trouvée dans la base.');
      return;
    }

    console.log(`📚 ${tables.length} tables trouvées:\n`);
    let okCount = 0;
    let failCount = 0;

    for (const row of tables) {
      const table = row.TABLE_NAME;
      process.stdout.write(`   • ${table} ... `);
      try {
        const [res] = await connection.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
        const cnt = res && res[0] ? res[0].cnt : 0;
        console.log(`OK (count=${cnt})`);
        okCount++;
      } catch (err) {
        console.log(`❌ ${err.code || err.message}`);
        failCount++;
      }
    }

    console.log('\n========================================');
    console.log('✅ Accès OK:', okCount, 'tables');
    console.log('❌ Accès FAIL:', failCount, 'tables');
    console.log('========================================');
  } catch (e) {
    console.error('❌ Erreur de connexion MySQL:', e.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      try { await connection.end(); } catch {}
    }
  }
}

main();

