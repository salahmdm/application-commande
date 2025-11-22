/**
 * Script de vérification des serveurs (frontend + backend)
 */

import http from 'http';

console.log('🔍 Vérification des serveurs...\n');

// Test Backend
const testBackend = () => new Promise((resolve) => {
  const req = http.request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 3000
  }, (res) => {
    resolve({ name: 'Backend', status: res.statusCode, ok: true });
  });
  
  req.on('error', () => resolve({ name: 'Backend', ok: false }));
  req.on('timeout', () => {
    req.destroy();
    resolve({ name: 'Backend', ok: false });
  });
  
  req.end();
});

// Test Frontend
const testFrontend = () => new Promise((resolve) => {
  const req = http.request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 3000
  }, (res) => {
    resolve({ name: 'Frontend', status: res.statusCode, ok: true });
  });
  
  req.on('error', () => resolve({ name: 'Frontend', ok: false }));
  req.on('timeout', () => {
    req.destroy();
    resolve({ name: 'Frontend', ok: false });
  });
  
  req.end();
});

const results = await Promise.all([testBackend(), testFrontend()]);

console.log('📊 Résultats:');
results.forEach(result => {
  if (result.ok) {
    console.log(`✅ ${result.name}: Accessible (Status: ${result.status})`);
  } else {
    console.log(`❌ ${result.name}: Non accessible`);
  }
});

console.log('');

if (results.every(r => r.ok)) {
  console.log('✅ Tous les serveurs sont opérationnels !');
  console.log('   - Frontend: http://localhost:3000');
  console.log('   - Backend: http://localhost:5000/api');
} else {
  console.log('❌ Certains serveurs ne sont pas accessibles');
  console.log('');
  if (!results[0].ok) {
    console.log('💡 Pour démarrer le backend: npm run backend');
  }
  if (!results[1].ok) {
    console.log('💡 Pour démarrer le frontend: npm run dev');
  }
}

