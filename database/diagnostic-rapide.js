/**
 * Diagnostic rapide des connexions API + BDD
 */

const fs = require('fs');
const path = require('path');

logger.log('========================================');
logger.log('🔍 DIAGNOSTIC RAPIDE CONNEXIONS');
logger.log('========================================\n');

// 1. Vérifier le fichier .env
logger.log('1️⃣ Vérification du fichier .env...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  logger.log('✅ Fichier .env trouvé');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['DB_PASSWORD', 'DB_USER', 'DB_NAME'];
  const missing = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missing.length > 0) {
    logger.log(`⚠️ Variables manquantes dans .env: ${missing.join(', ')}`);
  } else {
    logger.log('✅ Variables requises présentes');
  }
} else {
  logger.log('❌ Fichier .env introuvable');
  logger.log('💡 Solution: Copiez env.example.txt en .env et configurez vos valeurs');
}
logger.log('');

async function runDiagnostic() {
  // 2. Vérifier les ports
  logger.log('2️⃣ Vérification des ports...');
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  try {
    const { stdout: netstat5000 } = await execPromise('netstat -ano | findstr ":5000" | findstr "LISTENING"');
    if (netstat5000.trim()) {
      logger.log('✅ Port 5000 (Backend) : En cours d\'utilisation');
    } else {
      logger.log('❌ Port 5000 (Backend) : Non utilisé - Backend non démarré');
      logger.log('💡 Solution: npm run backend');
    }
  } catch {
    logger.log('❌ Port 5000 (Backend) : Non utilisé - Backend non démarré');
    logger.log('💡 Solution: npm run backend');
  }

  try {
    const { stdout: netstat3000 } = await execPromise('netstat -ano | findstr ":3000" | findstr "LISTENING"');
    if (netstat3000.trim()) {
      logger.log('✅ Port 3000 (Frontend) : En cours d\'utilisation');
    } else {
      logger.log('❌ Port 3000 (Frontend) : Non utilisé - Frontend non démarré');
      logger.log('💡 Solution: npm run dev');
    }
  } catch {
    logger.log('❌ Port 3000 (Frontend) : Non utilisé - Frontend non démarré');
    logger.log('💡 Solution: npm run dev');
  }
  logger.log('');

  // 3. Vérifier la connexion MySQL
  logger.log('3️⃣ Test de connexion MySQL...');
  try {
    const mysql = require('mysql2/promise');
    const configModule = require('./config');
    
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    
    await connection.execute('SELECT 1');
    await connection.end();
    
    logger.log('✅ Connexion MySQL réussie');
    logger.log(`   - Host: ${configModule.database.host}:${configModule.database.port}`);
    logger.log(`   - Database: ${configModule.database.database}`);
  } catch (error) {
    logger.log('❌ Erreur de connexion MySQL:', error.message);
    logger.log('💡 Vérifications:');
    logger.log('   1. MySQL est-il démarré ?');
    logger.log('   2. Les identifiants dans .env sont-ils corrects ?');
    logger.log('   3. La base de données existe-t-elle ?');
  }
  logger.log('');

  // 4. Test Backend API
  logger.log('4️⃣ Test de connexion Backend API...');
  const http = require('http');
const logger = require('./utils/logger');
  try {
    const backendTest = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/health',
        method: 'GET',
        timeout: 3000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, ok: true }));
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      req.end();
    });
    
    logger.log('✅ Backend API accessible');
    logger.log(`   - Status: ${backendTest.status}`);
    logger.log('   - URL: http://localhost:5000/api');
  } catch (error) {
    logger.log('❌ Backend API non accessible:', error.message);
    logger.log('💡 Solution: npm run backend');
  }
  logger.log('');

  // Résumé
  logger.log('========================================');
  logger.log('📊 RÉSUMÉ');
  logger.log('========================================\n');

  logger.log('💡 Pour démarrer les serveurs:');
  logger.log('   npm run start  (démarre backend + frontend)');
  logger.log('');
  logger.log('💡 Ou séparément:');
  logger.log('   Terminal 1: npm run backend');
  logger.log('   Terminal 2: npm run dev');
  logger.log('');
}

// Exécuter le diagnostic
runDiagnostic().catch(error => {
  logger.error('❌ Erreur lors du diagnostic:', error);
  process.exit(1);
});

