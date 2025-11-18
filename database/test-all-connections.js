/**
 * Test complet de connexion : BDD + API Backend
 */

const mysql = require('mysql2/promise');
const http = require('http');
const configModule = require('./config');

async function testAllConnections() {
  console.log('========================================');
  console.log('🔍 TEST COMPLET DE CONNEXION');
  console.log('========================================\n');
  
  const results = {
    database: { ok: false, message: '' },
    backend: { ok: false, message: '' }
  };
  
  // 1. Test Base de données MySQL
  console.log('1️⃣ Test de connexion à la base de données MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    
    // Test simple
    await connection.execute('SELECT 1 as test');
    
    // Compter les tables
    const [tables] = await connection.execute('SHOW TABLES');
    
    // Compter les produits et catégories
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    
    await connection.end();
    
    results.database = {
      ok: true,
      message: `✅ Base de données connectée\n   - Tables: ${tables.length}\n   - Produits: ${products[0].count}\n   - Catégories: ${categories[0].count}\n   - Utilisateurs actifs: ${users[0].count}`
    };
    console.log(results.database.message);
  } catch (error) {
    results.database = {
      ok: false,
      message: `❌ Erreur de connexion MySQL: ${error.message}\n   Code: ${error.code}`
    };
    console.error(results.database.message);
  }
  console.log('');
  
  // 2. Test Backend API
  console.log('2️⃣ Test de connexion au Backend API...');
  try {
    const backendTest = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout - Le backend ne répond pas'));
      });
      
      req.end();
    });
    
    results.backend = {
      ok: true,
      message: `✅ Backend API accessible\n   - Status: ${backendTest.status}\n   - Port: 5000\n   - URL: http://localhost:5000/api`
    };
    console.log(results.backend.message);
  } catch (error) {
    results.backend = {
      ok: false,
      message: `❌ Backend API non accessible\n   - Erreur: ${error.message}\n   - Port: 5000\n   - Solution: Démarrez le backend avec "npm run backend"`
    };
    console.error(results.backend.message);
  }
  console.log('');
  
  // 3. Test connexion Backend -> BDD
  if (results.backend.ok && results.database.ok) {
    console.log('3️⃣ Test de connexion Backend -> Base de données...');
    try {
      const apiTest = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/categories',
          method: 'GET',
          timeout: 5000
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve({ status: res.statusCode, data: json });
            } catch {
              resolve({ status: res.statusCode, data });
            }
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.end();
      });
      
      if (apiTest.status === 200 && apiTest.data.success) {
        console.log(`✅ Backend peut accéder à la BDD\n   - Catégories récupérées: ${apiTest.data.data?.length || 0}`);
      } else {
        console.log(`⚠️ Backend répond mais avec un code: ${apiTest.status}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du test Backend -> BDD: ${error.message}`);
    }
    console.log('');
  }
  
  // Résumé
  console.log('========================================');
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('========================================\n');
  
  Object.entries(results).forEach(([name, result]) => {
    console.log(`${name.toUpperCase()}:`);
    console.log(result.message);
    console.log('');
  });
  
  const allOk = Object.values(results).every(r => r.ok);
  if (allOk) {
    console.log('✅ TOUTES LES CONNEXIONS SONT OPÉRATIONNELLES !');
    console.log('');
    console.log('🌐 URLs:');
    console.log('   - Backend API: http://localhost:5000/api');
    console.log('   - Frontend:    http://localhost:3000 (si démarré)');
    console.log('   - BDD MySQL:   Port 3306');
  } else {
    console.log('❌ CERTAINES CONNEXIONS NE SONT PAS ÉTABLIES');
    console.log('');
    console.log('💡 Actions à effectuer:');
    if (!results.database.ok) {
      console.log('');
      console.log('🔹 Problème Base de données:');
      console.log('   1. Vérifiez que MySQL est démarré');
      console.log('   2. Vérifiez les identifiants dans database/.env:');
      console.log('      - DB_HOST');
      console.log('      - DB_PORT');
      console.log('      - DB_USER');
      console.log('      - DB_PASSWORD');
      console.log('      - DB_NAME');
    }
    if (!results.backend.ok) {
      console.log('');
      console.log('🔹 Problème Backend API:');
      console.log('   1. Démarrez le backend: npm run backend');
      console.log('   2. Vérifiez que le port 5000 est libre');
      console.log('   3. Vérifiez les logs du backend pour les erreurs');
    }
    console.log('');
    console.log('💡 Pour démarrer les serveurs:');
    console.log('   npm run start  (démarre backend + frontend)');
  }
  
  console.log('');
}

testAllConnections().catch(error => {
  console.error('❌ Erreur lors des tests:', error);
  process.exit(1);
});



