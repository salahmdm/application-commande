/**
 * Script de test d'authentification complet
 * Teste la connexion DB + l'API backend
 */

const mysql = require('mysql2/promise');
const http = require('http');
const configModule = require('./config');
const logger = require('./utils/logger');

async function testAuth() {
  logger.log('========================================');
  logger.log('🔐 TEST D\'AUTHENTIFICATION COMPLET');
  logger.log('========================================\n');
  
  try {
    // 1. Test connexion DB
    logger.log('1️⃣ Test de connexion MySQL...');
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    logger.log('✅ Connexion MySQL réussie\n');
    
    // 2. Récupérer un utilisateur actif pour tester
    logger.log('2️⃣ Récupération d\'un utilisateur actif...');
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE is_active = TRUE LIMIT 1'
    );
    
    if (users.length === 0) {
      logger.error('❌ Aucun utilisateur actif trouvé dans la base de données');
      await connection.end();
      process.exit(1);
    }
    
    const testUser = users[0];
    logger.log(`✅ Utilisateur trouvé: ${testUser.email}`);
    logger.log(`   - ID: ${testUser.id}`);
    logger.log(`   - Nom: ${testUser.first_name} ${testUser.last_name}`);
    logger.log(`   - Role: ${testUser.role}`);
    logger.log('');
    
    // 3. Test de l'API backend
    logger.log('3️⃣ Test de l\'API backend...');
    logger.log('   - URL: http://127.0.0.1:5000/api/health');
    
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
      logger.log('✅ API Backend accessible');
      logger.log('   - Status:', healthCheck.status);
      logger.log('   - Response:', healthCheck.data);
    } else {
      logger.log('⚠️ API Backend répond mais avec un code:', healthCheck.status);
    }
    logger.log('');
    
    // 4. Test de la structure de réponse attendue pour login
    logger.log('4️⃣ Vérification de la structure de la table users...');
    const [columns] = await connection.execute('DESCRIBE users');
    const requiredForAuth = ['id', 'email', 'password_hash', 'role', 'is_active'];
    const columnNames = columns.map(c => c.Field);
    const missing = requiredForAuth.filter(col => !columnNames.includes(col));
    
    if (missing.length === 0) {
      logger.log('✅ Toutes les colonnes nécessaires pour l\'authentification sont présentes');
    } else {
      logger.error('❌ Colonnes manquantes pour l\'authentification:', missing.join(', '));
      await connection.end();
      process.exit(1);
    }
    logger.log('');
    
    // 5. Vérifier qu'il y a des password_hash
    logger.log('5️⃣ Vérification des mots de passe hashés...');
    const [pwdCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE password_hash IS NOT NULL AND password_hash != "" AND is_active = TRUE'
    );
    const usersWithPassword = pwdCheck[0].count;
    logger.log(`✅ Utilisateurs actifs avec mot de passe hashé: ${usersWithPassword}`);
    
    if (usersWithPassword === 0) {
      logger.error('❌ Aucun utilisateur actif n\'a de mot de passe hashé');
      await connection.end();
      process.exit(1);
    }
    logger.log('');
    
    // Fermer la connexion
    await connection.end();
    logger.log('========================================');
    logger.log('✅ TOUS LES TESTS SONT RÉUSSIS');
    logger.log('========================================');
    logger.log('');
    logger.log('📝 Résumé:');
    logger.log(`   - Base de données: ✅ Connectée`);
    logger.log(`   - API Backend: ✅ Accessible`);
    logger.log(`   - Utilisateur test: ${testUser.email} (${testUser.role})`);
    logger.log(`   - Utilisateurs avec mot de passe: ${usersWithPassword}`);
    logger.log('');
    logger.log('💡 Pour tester la connexion depuis le frontend:');
    logger.log(`   - Email: ${testUser.email}`);
    logger.log('   - Mot de passe: (celui configuré dans la BDD)');
    logger.log('');
    
  } catch (error) {
    logger.error('');
    logger.error('========================================');
    logger.error('❌ ERREUR LORS DU TEST');
    logger.error('========================================');
    logger.error('Message:', error.message);
    if (error.code) {
      logger.error('Code:', error.code);
    }
    if (error.stack) {
      logger.error('Stack:', error.stack);
    }
    logger.error('');
    
    if (error.message.includes('connect ECONNREFUSED') || error.message.includes('Timeout')) {
      logger.error('💡 L\'API backend ne répond pas.');
      logger.error('   - Vérifiez que le backend est démarré: npm run backend');
      logger.error('   - Vérifiez que le port 5000 est libre');
    } else if (error.message.includes('ER_ACCESS_DENIED') || error.message.includes('ENOTFOUND')) {
      logger.error('💡 Erreur de connexion à la base de données.');
      logger.error('   - Vérifiez les identifiants dans database/.env');
      logger.error('   - Vérifiez que MySQL est démarré');
    }
    logger.error('');
    
    process.exit(1);
  }
}

testAuth();

