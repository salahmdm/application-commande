const axios = require('axios');

async function testHomeAPI() {
  try {
    console.log('🧪 Test de l\'API /api/home/stats...\n');
    
    const response = await axios.get('http://localhost:5000/api/home/stats');
    
    console.log('✅ Réponse reçue:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.topProducts) {
      console.log('\n📊 Top Products détaillés:');
      response.data.data.topProducts.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Prix: ${p.price}€`);
        console.log(`   Total vendu: ${p.totalSold}`);
        console.log(`   Commandes: ${p.orderCount}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Réponse serveur:', error.response.data);
    }
  }
}

testHomeAPI();

