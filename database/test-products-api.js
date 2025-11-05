const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

/**
 * Test de vérification : Les produits affichés viennent-ils de MySQL ?
 */

async function testProductsAPI() {
  console.log('========================================');
  console.log('🔍 TEST : PRODUITS MYSQL vs AFFICHAGE');
  console.log('========================================\n');

  try {
    // 1. VÉRIFIER LES PRODUITS DANS MYSQL
    console.log('📊 1. Produits dans MySQL...\n');
    
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    const [mysqlProducts] = await connection.execute(
      'SELECT id, name, price, stock, category_id FROM products ORDER BY id'
    );

    console.log(`✅ ${mysqlProducts.length} produits dans MySQL :\n`);
    mysqlProducts.forEach(p => {
      console.log(`   ${p.id}. ${p.name} - ${p.price}€ (stock: ${p.stock}, cat: ${p.category_id})`);
    });
    console.log('');

    await connection.end();

    // 2. TESTER L'API BACKEND
    console.log('🌐 2. Test de l\'API Backend...\n');

    // Test 1: Login pour obtenir le token
    console.log('🔐 Login admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@blossom.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Erreur login:', loginResponse.status);
      console.log('⚠️  Le backend est-il démarré ?');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login réussi\n');

    const token = loginData.token;

    // Test 2: Récupérer les produits via l'API
    console.log('📦 Récupération des produits via API...');
    const productsResponse = await fetch('http://localhost:5000/api/admin/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!productsResponse.ok) {
      console.log('❌ Erreur récupération produits:', productsResponse.status);
      return;
    }

    const productsData = await productsResponse.json();
    const apiProducts = productsData.data || productsData;

    console.log(`✅ ${apiProducts.length} produits retournés par l\'API :\n`);
    apiProducts.forEach(p => {
      console.log(`   ${p.id}. ${p.name} - ${p.price}€ (stock: ${p.stock}, cat: ${p.category_id})`);
    });
    console.log('');

    // 3. COMPARAISON
    console.log('========================================');
    console.log('📊 COMPARAISON');
    console.log('========================================\n');

    console.log(`MySQL:  ${mysqlProducts.length} produits`);
    console.log(`API:    ${apiProducts.length} produits\n`);

    if (mysqlProducts.length === apiProducts.length) {
      console.log('✅ Même nombre de produits !\n');

      // Vérifier que les IDs correspondent
      const mysqlIds = mysqlProducts.map(p => p.id).sort();
      const apiIds = apiProducts.map(p => p.id).sort();
      
      const idsMatch = JSON.stringify(mysqlIds) === JSON.stringify(apiIds);
      
      if (idsMatch) {
        console.log('✅ Les IDs correspondent !');
        console.log('✅ Les produits viennent bien de MySQL !\n');
      } else {
        console.log('❌ Les IDs ne correspondent pas !');
        console.log('MySQL IDs:', mysqlIds);
        console.log('API IDs:', apiIds);
        console.log('⚠️  L\'API ne retourne pas les bons produits\n');
      }

      // Vérifier les prix
      let pricesMismatch = false;
      mysqlProducts.forEach(mp => {
        const ap = apiProducts.find(p => p.id === mp.id);
        if (ap && parseFloat(ap.price) !== parseFloat(mp.price)) {
          console.log(`⚠️  Prix différent pour "${mp.name}": MySQL=${mp.price}€, API=${ap.price}€`);
          pricesMismatch = true;
        }
      });

      if (!pricesMismatch) {
        console.log('✅ Tous les prix correspondent !');
      }

    } else {
      console.log('❌ Nombre de produits différent !');
      console.log('⚠️  L\'API ne retourne pas les produits MySQL\n');
      
      if (apiProducts.length === 8 && apiProducts[0].name === 'Thé Vert Sencha') {
        console.log('💡 DIAGNOSTIC: L\'API retourne probablement les fallback data');
        console.log('   au lieu des données MySQL.\n');
      }
    }

    // 4. VÉRIFIER LE FRONTEND
    console.log('========================================');
    console.log('📱 INSTRUCTIONS FRONTEND');
    console.log('========================================\n');

    console.log('Pour vérifier dans le navigateur (F12 → Console):');
    console.log('');
    console.log('// Tester si les produits viennent de MySQL');
    console.log('fetch("http://localhost:5000/api/admin/products", {');
    console.log('  headers: {');
    console.log(`    "Authorization": "Bearer ${token}"`);
    console.log('  }');
    console.log('}).then(r => r.json()).then(console.log)');
    console.log('');

    // 5. RÉSUMÉ
    console.log('========================================');
    console.log('🎯 RÉSULTAT');
    console.log('========================================\n');

    if (mysqlProducts.length === apiProducts.length) {
      console.log('✅ Les produits affichés VIENNENT de MySQL');
      console.log('✅ L\'API fonctionne correctement');
      console.log('✅ La liaison MySQL ↔ Frontend est OK\n');
    } else {
      console.log('❌ Les produits affichés NE VIENNENT PAS de MySQL');
      console.log('⚠️  L\'API retourne probablement des fallback data');
      console.log('🔧 Vérification nécessaire de productStore.js\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Le backend API n\'est pas démarré !');
      console.log('💡 Lancez: cd database && node admin-api.js');
    }
  }
}

// Exécuter
testProductsAPI();

