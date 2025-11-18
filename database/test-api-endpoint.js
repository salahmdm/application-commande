/**
 * Script de test pour vérifier l'endpoint API /api/admin/orders
 * Usage: node database/test-api-endpoint.js
 */

const http = require('http');

function testAPIEndpoint() {
  console.log('🔍 Test de l\'endpoint API /api/admin/orders\n');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/orders',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // En dev, le devBypass devrait permettre l'accès sans token
    }
  };

  console.log('📡 Envoi de la requête GET http://localhost:5000/api/admin/orders...\n');

  const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    console.log('');

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📦 Réponse reçue:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        const json = JSON.parse(data);
        console.log('✅ JSON valide');
        console.log('   success:', json.success);
        console.log('   hasData:', !!json.data);
        console.log('   dataType:', Array.isArray(json.data) ? 'array' : typeof json.data);
        console.log('   dataLength:', Array.isArray(json.data) ? json.data.length : 'N/A');
        
        if (json.error) {
          console.log('   ❌ error:', json.error);
        }
        
        if (Array.isArray(json.data) && json.data.length > 0) {
          console.log('\n📋 Première commande:');
          const firstOrder = json.data[0];
          console.log('   - ID:', firstOrder.id);
          console.log('   - Numéro:', firstOrder.order_number);
          console.log('   - Statut:', firstOrder.status);
          console.log('   - Items:', Array.isArray(firstOrder.items) ? firstOrder.items.length : typeof firstOrder.items);
        } else if (Array.isArray(json.data) && json.data.length === 0) {
          console.log('   ⚠️ Le tableau data est vide !');
        }
        
        console.log('\n📄 Réponse complète (premiers 500 caractères):');
        console.log(JSON.stringify(json, null, 2).substring(0, 500));
        
      } catch (e) {
        console.error('❌ Erreur parsing JSON:', e.message);
        console.log('📄 Réponse brute (premiers 500 caractères):');
        console.log(data.substring(0, 500));
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erreur de requête:', error.message);
    console.error('   Vérifiez que le serveur backend est démarré sur le port 5000');
  });

  req.end();
}

// Exécuter le test
testAPIEndpoint();

