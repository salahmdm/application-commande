const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

/**
 * Script de test : Modification du prix → MySQL
 */

async function testPriceUpdate() {
  console.log('🧪 TEST DE MODIFICATION DE PRIX\n');
  console.log('========================================\n');
  
  try {
    // Connexion à MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });
    
    console.log('✅ Connexion MySQL réussie\n');
    
    // 1. Récupérer le prix actuel du produit ID 1 dans MySQL
    console.log('📊 1. Prix actuel dans MySQL...');
    const [beforeUpdate] = await connection.execute(
      "SELECT id, name, price FROM products WHERE id = 1"
    );
    
    if (beforeUpdate.length === 0) {
      console.log('❌ Produit ID 1 non trouvé !');
      return;
    }
    
    const currentProduct = beforeUpdate[0];
    console.log(`   Produit: ${currentProduct.name}`);
    console.log(`   Prix actuel: ${currentProduct.price}€\n`);
    
    // 2. Se connecter à l'API
    console.log('🔐 2. Connexion à l\'API...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@blossom.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.token) {
      console.log('❌ Connexion échouée');
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Connexion réussie\n');
    
    // 3. Modifier le prix via l'API
    const newPrice = (parseFloat(currentProduct.price) + 0.50).toFixed(2);
    console.log('🔄 3. Modification du prix via l\'API...');
    console.log(`   Ancien prix: ${currentProduct.price}€`);
    console.log(`   Nouveau prix: ${newPrice}€`);
    
    const updatePayload = {
      name: currentProduct.name,
      price: parseFloat(newPrice),
      categoryId: 1,
      stock: 50,
      isAvailable: true,
      isFeatured: true,
      imageUrl: '🫖',
      slug: 'the-vert-sencha',
      description: 'Thé vert japonais de qualité supérieure',
      calories: 0,
      preparationTime: 5,
      allergens: []
    };
    
    console.log('   Données envoyées:', JSON.stringify(updatePayload, null, 2));
    
    const updateResponse = await fetch(`http://localhost:5000/api/admin/products/${currentProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatePayload)
    });
    
    const updateData = await updateResponse.json();
    
    console.log('   Réponse API:', JSON.stringify(updateData, null, 2));
    
    if (!updateData.success) {
      console.log('❌ Modification échouée:', updateData.error);
      if (updateData.details) {
        console.log('   Détails:', updateData.details);
      }
      return;
    }
    
    console.log('✅ Modification envoyée à l\'API\n');
    
    // 4. Vérifier dans MySQL que le prix a bien changé
    console.log('🔍 4. Vérification dans MySQL...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Attendre un peu
    
    const [afterUpdate] = await connection.execute(
      "SELECT id, name, price FROM products WHERE id = 1"
    );
    
    const updatedProduct = afterUpdate[0];
    console.log(`   Produit: ${updatedProduct.name}`);
    console.log(`   Prix après modification: ${updatedProduct.price}€\n`);
    
    // 5. Comparaison
    console.log('📊 RÉSULTAT DU TEST:');
    console.log('========================================');
    console.log(`Prix avant: ${currentProduct.price}€`);
    console.log(`Prix demandé: ${newPrice}€`);
    console.log(`Prix dans MySQL: ${updatedProduct.price}€`);
    
    if (parseFloat(updatedProduct.price) === parseFloat(newPrice)) {
      console.log('\n✅ ✅ ✅ SUCCÈS ! ✅ ✅ ✅');
      console.log('Le prix a été correctement modifié dans MySQL !');
    } else {
      console.log('\n❌ ÉCHEC !');
      console.log('Le prix dans MySQL ne correspond pas au prix demandé.');
    }
    
    console.log('\n========================================');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Le backend API n\'est pas démarré !');
      console.log('   Lancez le backend avec: cd database && node admin-api.js');
    }
  }
}

// Exécuter le test
testPriceUpdate();

