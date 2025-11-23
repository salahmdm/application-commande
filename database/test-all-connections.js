/**
 * Test complet de connexion : BDD + API Backend
 */

const mysql = require('mysql2/promise');
const http = require('http');
const configModule = require('./config');
const logger = require('./utils/logger');

async function testAllConnections() {
  logger.log('========================================');
  logger.log('🔍 TEST COMPLET DE CONNEXION');
  logger.log('========================================\n');
  
  const results = {
    database: { ok: false, message: '' },
    backend: { ok: false, message: '' }
  };
  
  // 1. Test Base de données MySQL
  logger.log('1️⃣ Test de connexion à la base de données MySQL...');
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
    logger.log(results.database.message);
  } catch (error) {
    results.database = {
      ok: false,
      message: `❌ Erreur de connexion MySQL: ${error.message}\n   Code: ${error.code}`
    };
    logger.error(results.database.message);
  }
  logger.log('');
  
  // 2. Test Backend API
  logger.log('2️⃣ Test de connexion au Backend API...');
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
    logger.log(results.backend.message);
  } catch (error) {
    results.backend = {
      ok: false,
      message: `❌ Backend API non accessible\n   - Erreur: ${error.message}\n   - Port: 5000\n   - Solution: Démarrez le backend avec "npm run backend"`
    };
    logger.error(results.backend.message);
  }
  logger.log('');
  
  // 3. Test connexion Backend -> BDD
  if (results.backend.ok && results.database.ok) {
    logger.log('3️⃣ Test de connexion Backend -> Base de données...');
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
        logger.log(`✅ Backend peut accéder à la BDD\n   - Catégories récupérées: ${apiTest.data.data?.length || 0}`);
      } else {
        logger.log(`⚠️ Backend répond mais avec un code: ${apiTest.status}`);
      }
    } catch (error) {
      logger.error(`❌ Erreur lors du test Backend -> BDD: ${error.message}`);
    }
    logger.log('');
  }
  
  // Résumé
  logger.log('========================================');
  logger.log('📊 RÉSUMÉ DES TESTS');
  logger.log('========================================\n');
  
  Object.entries(results).forEach(([name, result]) => {
    logger.log(`${name.toUpperCase()}:`);
    logger.log(result.message);
    logger.log('');
  });
  
  const allOk = Object.values(results).every(r => r.ok);
  if (allOk) {
    logger.log('✅ TOUTES LES CONNEXIONS SONT OPÉRATIONNELLES !');
    logger.log('');
    logger.log('🌐 URLs:');
    logger.log('   - Backend API: http://localhost:5000/api');
    logger.log('   - Frontend:    http://localhost:3000 (si démarré)');
    logger.log('   - BDD MySQL:   Port 3306');
  } else {
    logger.log('❌ CERTAINES CONNEXIONS NE SONT PAS ÉTABLIES');
    logger.log('');
    logger.log('💡 Actions à effectuer:');
    if (!results.database.ok) {
      logger.log('');
      logger.log('🔹 Problème Base de données:');
      logger.log('   1. Vérifiez que MySQL est démarré');
      logger.log('   2. Vérifiez les identifiants dans database/.env:');
      logger.log('      - DB_HOST');
      logger.log('      - DB_PORT');
      logger.log('      - DB_USER');
      logger.log('      - DB_PASSWORD');
      logger.log('      - DB_NAME');
    }
    if (!results.backend.ok) {
      logger.log('');
      logger.log('🔹 Problème Backend API:');
      logger.log('   1. Démarrez le backend: npm run backend');
      logger.log('   2. Vérifiez que le port 5000 est libre');
      logger.log('   3. Vérifiez les logs du backend pour les erreurs');
    }
    logger.log('');
    logger.log('💡 Pour démarrer les serveurs:');
    logger.log('   npm run start  (démarre backend + frontend)');
  }
  
  logger.log('');
}

testAllConnections().catch(error => {
  logger.error('❌ Erreur lors des tests:', error);
  process.exit(1);
});






