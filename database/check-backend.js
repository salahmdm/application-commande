/**
 * Vérification rapide que le backend est démarré
 */

const http = require('http');

console.log('🔍 Vérification du backend...\n');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Backend démarré avec succès !`);
  console.log(`   - Status: ${res.statusCode}`);
  console.log(`   - URL: http://localhost:5000/api`);
  
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`   - Réponse: ${JSON.stringify(json, null, 2)}`);
      console.log('\n✅ Backend opérationnel et connecté à la BDD !');
      process.exit(0);
    } catch {
      console.log(`   - Réponse: ${data}`);
      console.log('\n✅ Backend opérationnel !');
      process.exit(0);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Backend non accessible:', error.message);
  console.error('\n💡 Vérifications:');
  console.error('   1. Le backend est-il démarré ? (npm run backend)');
  console.error('   2. Y a-t-il des erreurs dans la console du backend ?');
  console.error('   3. Le port 5000 est-il libre ?');
  console.error('\n💡 Pour démarrer le backend:');
  console.error('   Depuis la racine: npm run backend');
  console.error('   Ou depuis database/: node admin-api.js');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Timeout: Le backend ne répond pas');
  req.destroy();
  process.exit(1);
});

req.end();



