/**
 * Vérification rapide que les serveurs sont démarrés
 */

const http = require('http');

console.log('🔍 Vérification des serveurs...\n');

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

  console.log('📊 Résultats:');
  results.forEach(result => {
    if (result.ok) {
      console.log(`✅ ${result.name}: Accessible sur port ${result.port} (Status: ${result.status})`);
      if (result.data) {
        console.log(`   Réponse: ${JSON.stringify(result.data)}`);
      }
    } else {
      console.log(`❌ ${result.name}: Non accessible sur port ${result.port}`);
    }
  });

  console.log('');

  if (results.every(r => r.ok)) {
    console.log('✅ TOUS LES SERVEURS SONT OPÉRATIONNELS !');
    console.log('');
    console.log('🌐 URLs:');
    console.log('   - Frontend: http://localhost:3000');
    console.log('   - Backend:  http://localhost:5000/api');
    console.log('');
  } else {
    console.log('⚠️ Certains serveurs ne sont pas encore accessibles');
    console.log('');
    console.log('💡 Pour démarrer les serveurs:');
    console.log('   Depuis la racine du projet: npm run start');
    console.log('');
  }
}

verifyServers().catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
  process.exit(1);
});



