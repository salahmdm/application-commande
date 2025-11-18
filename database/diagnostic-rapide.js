/**
 * Diagnostic rapide des connexions API + BDD
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('🔍 DIAGNOSTIC RAPIDE CONNEXIONS');
console.log('========================================\n');

// 1. Vérifier le fichier .env
console.log('1️⃣ Vérification du fichier .env...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ Fichier .env trouvé');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['DB_PASSWORD', 'DB_USER', 'DB_NAME'];
  const missing = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missing.length > 0) {
    console.log(`⚠️ Variables manquantes dans .env: ${missing.join(', ')}`);
  } else {
    console.log('✅ Variables requises présentes');
  }
} else {
  console.log('❌ Fichier .env introuvable');
  console.log('💡 Solution: Copiez env.example.txt en .env et configurez vos valeurs');
}
console.log('');

async function runDiagnostic() {
  // 2. Vérifier les ports
  console.log('2️⃣ Vérification des ports...');
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  try {
    const { stdout: netstat5000 } = await execPromise('netstat -ano | findstr ":5000" | findstr "LISTENING"');
    if (netstat5000.trim()) {
      console.log('✅ Port 5000 (Backend) : En cours d\'utilisation');
    } else {
      console.log('❌ Port 5000 (Backend) : Non utilisé - Backend non démarré');
      console.log('💡 Solution: npm run backend');
    }
  } catch {
    console.log('❌ Port 5000 (Backend) : Non utilisé - Backend non démarré');
    console.log('💡 Solution: npm run backend');
  }

  try {
    const { stdout: netstat3000 } = await execPromise('netstat -ano | findstr ":3000" | findstr "LISTENING"');
    if (netstat3000.trim()) {
      console.log('✅ Port 3000 (Frontend) : En cours d\'utilisation');
    } else {
      console.log('❌ Port 3000 (Frontend) : Non utilisé - Frontend non démarré');
      console.log('💡 Solution: npm run dev');
    }
  } catch {
    console.log('❌ Port 3000 (Frontend) : Non utilisé - Frontend non démarré');
    console.log('💡 Solution: npm run dev');
  }
  console.log('');

  // 3. Vérifier la connexion MySQL
  console.log('3️⃣ Test de connexion MySQL...');
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
    
    console.log('✅ Connexion MySQL réussie');
    console.log(`   - Host: ${configModule.database.host}:${configModule.database.port}`);
    console.log(`   - Database: ${configModule.database.database}`);
  } catch (error) {
    console.log('❌ Erreur de connexion MySQL:', error.message);
    console.log('💡 Vérifications:');
    console.log('   1. MySQL est-il démarré ?');
    console.log('   2. Les identifiants dans .env sont-ils corrects ?');
    console.log('   3. La base de données existe-t-elle ?');
  }
  console.log('');

  // 4. Test Backend API
  console.log('4️⃣ Test de connexion Backend API...');
  const http = require('http');
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
    
    console.log('✅ Backend API accessible');
    console.log(`   - Status: ${backendTest.status}`);
    console.log('   - URL: http://localhost:5000/api');
  } catch (error) {
    console.log('❌ Backend API non accessible:', error.message);
    console.log('💡 Solution: npm run backend');
  }
  console.log('');

  // Résumé
  console.log('========================================');
  console.log('📊 RÉSUMÉ');
  console.log('========================================\n');

  console.log('💡 Pour démarrer les serveurs:');
  console.log('   npm run start  (démarre backend + frontend)');
  console.log('');
  console.log('💡 Ou séparément:');
  console.log('   Terminal 1: npm run backend');
  console.log('   Terminal 2: npm run dev');
  console.log('');
}

// Exécuter le diagnostic
runDiagnostic().catch(error => {
  console.error('❌ Erreur lors du diagnostic:', error);
  process.exit(1);
});

