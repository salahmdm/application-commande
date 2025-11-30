/**
 * Script pour tester l'API de login directement
 * Simule une requête HTTP POST vers /api/auth/login
 */

const http = require('http');

const email = 'admin@blossom.com';
const password = 'admin123';

const postData = JSON.stringify({
  email: email,
  password: password
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔐 TEST API LOGIN');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
console.log(`URL: http://${options.hostname}:${options.port}${options.path}\n`);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`Headers:`, res.headers);
  console.log('\n📥 Réponse:\n');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ LOGIN RÉUSSI !');
        if (json.user) {
          console.log(`   Utilisateur: ${json.user.email}`);
          console.log(`   Rôle: ${json.user.role}`);
        }
      } else {
        console.log(`\n❌ LOGIN ÉCHOUÉ (${res.statusCode})`);
        if (json.error) {
          console.log(`   Erreur: ${json.error}`);
        }
      }
    } catch (e) {
      console.log(data);
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
});

req.on('error', (e) => {
  console.error(`❌ Erreur de connexion: ${e.message}`);
  console.error('\n💡 Vérifiez que le backend est démarré:');
  console.error('   npm run backend');
  console.error('   ou');
  console.error('   cd database && node admin-api.js\n');
});

req.write(postData);
req.end();

