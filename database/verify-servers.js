/**
 * Vérification rapide que les serveurs sont démarrés
 */

const http = require('http');
const logger = require('./utils/logger');

logger.log('🔍 Vérification des serveurs...\n');

const testServer = (name, port, path = '/') => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: 'GET',
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ name, port, status: res.statusCode, data: json, ok: true });
        } catch {
          resolve({ name, port, status: res.statusCode, ok: true });
        }
      });
    });
    
    req.on('error', () => resolve({ name, port, ok: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ name, port, ok: false });
    });
    
    req.end();
  });
};

async function verifyServers() {
  const results = await Promise.all([
    testServer('Backend', 5000, '/api/health'),
    testServer('Frontend', 3000, '/')
  ]);

  logger.log('📊 Résultats:');
  results.forEach(result => {
    if (result.ok) {
      logger.log(`✅ ${result.name}: Accessible sur port ${result.port} (Status: ${result.status})`);
      if (result.data) {
        logger.log(`   Réponse: ${JSON.stringify(result.data)}`);
      }
    } else {
      logger.log(`❌ ${result.name}: Non accessible sur port ${result.port}`);
    }
  });

  logger.log('');

  if (results.every(r => r.ok)) {
    logger.log('✅ TOUS LES SERVEURS SONT OPÉRATIONNELS !');
    logger.log('');
    logger.log('🌐 URLs:');
    logger.log('   - Frontend: http://localhost:3000');
    logger.log('   - Backend:  http://localhost:5000/api');
    logger.log('');
  } else {
    logger.log('⚠️ Certains serveurs ne sont pas encore accessibles');
    logger.log('');
    logger.log('💡 Pour démarrer les serveurs:');
    logger.log('   Depuis la racine du projet: npm run start');
    logger.log('');
  }
}

verifyServers().catch(error => {
  logger.error('❌ Erreur lors de la vérification:', error);
  process.exit(1);
});






