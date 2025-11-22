/**
 * Script de test pour vérifier l'endpoint API /api/admin/orders
 * Usage: node database/test-api-endpoint.js
 */

const http = require('http');
const logger = require('./utils/logger');

function testAPIEndpoint() {
  logger.log('🔍 Test de l\'endpoint API /api/admin/orders\n');
  
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

  logger.log('📡 Envoi de la requête GET http://localhost:5000/api/admin/orders...\n');

  const req = http.request(options, (res) => {
    logger.log(`📊 Status Code: ${res.statusCode}`);
    logger.log(`📋 Headers:`, res.headers);
    logger.log('');

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      logger.log('📦 Réponse reçue:');
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        const json = JSON.parse(data);
        logger.log('✅ JSON valide');
        logger.log('   success:', json.success);
        logger.log('   hasData:', !!json.data);
        logger.log('   dataType:', Array.isArray(json.data) ? 'array' : typeof json.data);
        logger.log('   dataLength:', Array.isArray(json.data) ? json.data.length : 'N/A');
        
        if (json.error) {
          logger.log('   ❌ error:', json.error);
        }
        
        if (Array.isArray(json.data) && json.data.length > 0) {
          logger.log('\n📋 Première commande:');
          const firstOrder = json.data[0];
          logger.log('   - ID:', firstOrder.id);
          logger.log('   - Numéro:', firstOrder.order_number);
          logger.log('   - Statut:', firstOrder.status);
          logger.log('   - Items:', Array.isArray(firstOrder.items) ? firstOrder.items.length : typeof firstOrder.items);
        } else if (Array.isArray(json.data) && json.data.length === 0) {
          logger.log('   ⚠️ Le tableau data est vide !');
        }
        
        logger.log('\n📄 Réponse complète (premiers 500 caractères):');
        logger.log(JSON.stringify(json, null, 2).substring(0, 500));
        
      } catch (e) {
        logger.error('❌ Erreur parsing JSON:', e.message);
        logger.log('📄 Réponse brute (premiers 500 caractères):');
        logger.log(data.substring(0, 500));
      }
      
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  });

  req.on('error', (error) => {
    logger.error('❌ Erreur de requête:', error.message);
    logger.error('   Vérifiez que le serveur backend est démarré sur le port 5000');
  });

  req.end();
}

// Exécuter le test
testAPIEndpoint();

