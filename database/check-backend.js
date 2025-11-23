/**
 * Vérification rapide que le backend est démarré
 */

const http = require('http');
const logger = require('./utils/logger');

logger.log('🔍 Vérification du backend...\n');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  logger.log(`✅ Backend démarré avec succès !`);
  logger.log(`   - Status: ${res.statusCode}`);
  logger.log(`   - URL: http://localhost:5000/api`);
  
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      logger.log(`   - Réponse: ${JSON.stringify(json, null, 2)}`);
      logger.log('\n✅ Backend opérationnel et connecté à la BDD !');
      process.exit(0);
    } catch {
      logger.log(`   - Réponse: ${data}`);
      logger.log('\n✅ Backend opérationnel !');
      process.exit(0);
    }
  });
});

req.on('error', (error) => {
  logger.error('❌ Backend non accessible:', error.message);
  logger.error('\n💡 Vérifications:');
  logger.error('   1. Le backend est-il démarré ? (npm run backend)');
  logger.error('   2. Y a-t-il des erreurs dans la console du backend ?');
  logger.error('   3. Le port 5000 est-il libre ?');
  logger.error('\n💡 Pour démarrer le backend:');
  logger.error('   Depuis la racine: npm run backend');
  logger.error('   Ou depuis database/: node admin-api.js');
  process.exit(1);
});

req.on('timeout', () => {
  logger.error('❌ Timeout: Le backend ne répond pas');
  req.destroy();
  process.exit(1);
});

req.end();






