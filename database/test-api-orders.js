/**
 * Script de test pour vérifier l'API /api/admin/orders
 */

const http = require('http');

async function testAPI() {
  console.log('🔍 Test de l\'API /api/admin/orders...\n');

  // Test 1: Sans token (devrait échouer)
  console.log('📋 Test 1: Appel sans token...');
  try {
    const response1 = await fetch('http://localhost:5000/api/admin/orders');
    const data1 = await response1.json();
    console.log('   Status:', response1.status);
    console.log('   Réponse:', JSON.stringify(data1, null, 2));
  } catch (error) {
    console.error('   Erreur:', error.message);
  }
  console.log('');

  // Test 2: Avec un token invalide
  console.log('📋 Test 2: Appel avec token invalide...');
  try {
    const response2 = await fetch('http://localhost:5000/api/admin/orders', {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    });
    const data2 = await response2.json();
    console.log('   Status:', response2.status);
    console.log('   Réponse:', JSON.stringify(data2, null, 2));
  } catch (error) {
    console.error('   Erreur:', error.message);
  }
  console.log('');

  // Test 3: Vérifier que le serveur répond
  console.log('📋 Test 3: Vérification du serveur...');
  try {
    const response3 = await fetch('http://localhost:5000/api/health');
    console.log('   Status:', response3.status);
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('   Réponse:', JSON.stringify(data3, null, 2));
    } else {
      console.log('   Le serveur répond mais /api/health n\'existe pas (normal)');
    }
  } catch (error) {
    console.error('   ❌ Le serveur ne répond pas !');
    console.error('   Erreur:', error.message);
    console.error('   💡 Vérifiez que le backend est démarré sur le port 5000');
  }
}

// Utiliser fetch si disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ fetch n\'est pas disponible. Utilisez Node.js 18+ ou installez node-fetch');
  process.exit(1);
}

testAPI()
  .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
