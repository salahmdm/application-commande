/**
 * Script pour tester les routes API /api/products et /api/categories
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:5000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${path}`;
    console.log(`🔄 Test de ${url}...`);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          reject(new Error(`Erreur parsing JSON: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function testRoutes() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TEST DES ROUTES API PRODUITS ET CATÉGORIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Test /api/products
    console.log('1️⃣ Test de /api/products...');
    try {
      const productsResponse = await makeRequest('/api/products');
      if (productsResponse.status === 200) {
        const count = productsResponse.data?.data?.length || 0;
        console.log(`   ✅ Status: ${productsResponse.status}`);
        console.log(`   ✅ ${count} produits retournés`);
        if (count > 0) {
          console.log(`   📦 Premier produit: ${productsResponse.data.data[0].name || 'N/A'}`);
        } else {
          console.log(`   ⚠️  Aucun produit retourné !`);
        }
      } else {
        console.log(`   ❌ Status: ${productsResponse.status}`);
        console.log(`   ❌ Erreur: ${JSON.stringify(productsResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 Le backend n'est pas démarré ou ne répond pas sur le port 5000`);
      }
    }
    
    console.log('\n2️⃣ Test de /api/categories...');
    try {
      const categoriesResponse = await makeRequest('/api/categories');
      if (categoriesResponse.status === 200) {
        const count = categoriesResponse.data?.data?.length || 0;
        console.log(`   ✅ Status: ${categoriesResponse.status}`);
        console.log(`   ✅ ${count} catégories retournées`);
        if (count > 0) {
          console.log(`   📦 Première catégorie: ${categoriesResponse.data.data[0].name || 'N/A'}`);
        } else {
          console.log(`   ⚠️  Aucune catégorie retournée !`);
        }
      } else {
        console.log(`   ❌ Status: ${categoriesResponse.status}`);
        console.log(`   ❌ Erreur: ${JSON.stringify(categoriesResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 Le backend n'est pas démarré ou ne répond pas sur le port 5000`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Tests terminés');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

testRoutes();

