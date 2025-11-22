/**
 * Script de vérification rapide des serveurs
 */

import http from 'http';

console.log('🔍 Vérification des serveurs...\n');

const testServer = (name, port) => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: name === 'Backend' ? '/api/health' : '/',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      resolve({ name, port, status: res.statusCode, ok: true });
    });
    
    req.on('error', () => resolve({ name, port, ok: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ name, port, ok: false });
    });
    
    req.end();
  });
};

const results = await Promise.all([
  testServer('Backend', 5000),
  testServer('Frontend', 3000)
]);

console.log('📊 Résultats:');
results.forEach(result => {
  if (result.ok) {
    console.log(`✅ ${result.name}: Accessible sur port ${result.port} (Status: ${result.status})`);
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
  console.log('❌ Certains serveurs ne sont pas accessibles');
  console.log('');
  console.log('💡 Pour démarrer les serveurs:');
  console.log('   npm run start');
  console.log('');
}

