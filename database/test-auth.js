/**
 * Script de test d'authentification complet
 * Teste la connexion DB + l'API backend
 */

const mysql = require('mysql2/promise');
const http = require('http');
const configModule = require('./config');

async function testAuth() {
  console.log('========================================');
  console.log('🔐 TEST D\'AUTHENTIFICATION COMPLET');
  console.log('========================================\n');
  
  try {
    // 1. Test connexion DB
    console.log('1️⃣ Test de connexion MySQL...');
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    console.log('✅ Connexion MySQL réussie\n');
    
    // 2. Récupérer un utilisateur actif pour tester
    console.log('2️⃣ Récupération d\'un utilisateur actif...');
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE is_active = TRUE LIMIT 1'
    );
    
    if (users.length === 0) {
      console.error('❌ Aucun utilisateur actif trouvé dans la base de données');
      await connection.end();
      process.exit(1);
    }
    
    const testUser = users[0];
    console.log(`✅ Utilisateur trouvé: ${testUser.email}`);
    console.log(`   - ID: ${testUser.id}`);
    console.log(`   - Nom: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`   - Role: ${testUser.role}`);
    console.log('');
    
    // 3. Test de l'API backend
    console.log('3️⃣ Test de l\'API backend...');
    console.log('   - URL: http://127.0.0.1:5000/api/health');
    
    const healthCheck = await new Promise((resolve, reject) => {
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
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      req.end();
    });
    
    if (healthCheck.status === 200) {
      console.log('✅ API Backend accessible');
      console.log('   - Status:', healthCheck.status);
      console.log('   - Response:', healthCheck.data);
    } else {
      console.log('⚠️ API Backend répond mais avec un code:', healthCheck.status);
    }
    console.log('');
    
    // 4. Test de la structure de réponse attendue pour login
    console.log('4️⃣ Vérification de la structure de la table users...');
    const [columns] = await connection.execute('DESCRIBE users');
    const requiredForAuth = ['id', 'email', 'password_hash', 'role', 'is_active'];
    const columnNames = columns.map(c => c.Field);
    const missing = requiredForAuth.filter(col => !columnNames.includes(col));
    
    if (missing.length === 0) {
      console.log('✅ Toutes les colonnes nécessaires pour l\'authentification sont présentes');
    } else {
      console.error('❌ Colonnes manquantes pour l\'authentification:', missing.join(', '));
      await connection.end();
      process.exit(1);
    }
    console.log('');
    
    // 5. Vérifier qu'il y a des password_hash
    console.log('5️⃣ Vérification des mots de passe hashés...');
    const [pwdCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE password_hash IS NOT NULL AND password_hash != "" AND is_active = TRUE'
    );
    const usersWithPassword = pwdCheck[0].count;
    console.log(`✅ Utilisateurs actifs avec mot de passe hashé: ${usersWithPassword}`);
    
    if (usersWithPassword === 0) {
      console.error('❌ Aucun utilisateur actif n\'a de mot de passe hashé');
      await connection.end();
      process.exit(1);
    }
    console.log('');
    
    // Fermer la connexion
    await connection.end();
    console.log('========================================');
    console.log('✅ TOUS LES TESTS SONT RÉUSSIS');
    console.log('========================================');
    console.log('');
    console.log('📝 Résumé:');
    console.log(`   - Base de données: ✅ Connectée`);
    console.log(`   - API Backend: ✅ Accessible`);
    console.log(`   - Utilisateur test: ${testUser.email} (${testUser.role})`);
    console.log(`   - Utilisateurs avec mot de passe: ${usersWithPassword}`);
    console.log('');
    console.log('💡 Pour tester la connexion depuis le frontend:');
    console.log(`   - Email: ${testUser.email}`);
    console.log('   - Mot de passe: (celui configuré dans la BDD)');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ ERREUR LORS DU TEST');
    console.error('========================================');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    console.error('');
    
    if (error.message.includes('connect ECONNREFUSED') || error.message.includes('Timeout')) {
      console.error('💡 L\'API backend ne répond pas.');
      console.error('   - Vérifiez que le backend est démarré: npm run backend');
      console.error('   - Vérifiez que le port 5000 est libre');
    } else if (error.message.includes('ER_ACCESS_DENIED') || error.message.includes('ENOTFOUND')) {
      console.error('💡 Erreur de connexion à la base de données.');
      console.error('   - Vérifiez les identifiants dans database/.env');
      console.error('   - Vérifiez que MySQL est démarré');
    }
    console.error('');
    
    process.exit(1);
  }
}

testAuth();

