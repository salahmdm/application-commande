const fetch = require('node-fetch');

/**
 * Test direct de la route /api/admin/dashboard
 * Pour vérifier si elle retourne les bonnes données
 */

async function testDashboardAPI() {
  try {
    console.log('🧪 TEST DIRECT DE LA ROUTE /api/admin/dashboard\n');
    
    // Vous devez d'abord vous connecter pour avoir un token
    console.log('⚠️ Ce test nécessite un token JWT valide.');
    console.log('   Allez dans votre navigateur (F12 → Application → Local Storage)');
    console.log('   Copiez le token JWT de "blossom-auth-storage"\n');
    
    const token = process.argv[2];
    
    if (!token) {
      console.log('❌ Usage: node database/test-dashboard-api.js <TOKEN_JWT>');
      console.log('\n📋 Pour obtenir le token:');
      console.log('   1. Ouvrez votre navigateur');
      console.log('   2. F12 → Onglet "Application"');
      console.log('   3. Local Storage → http://localhost:3000');
      console.log('   4. Cherchez "blossom-auth-storage"');
      console.log('   5. Copiez la valeur du champ "token"');
      console.log('   6. Relancez: node database/test-dashboard-api.js VOTRE_TOKEN\n');
      return;
    }
    
    console.log('🔑 Token reçu (tronqué):', token.substring(0, 20) + '...\n');
    
    // Appel à l'API
    console.log('📡 Appel GET http://localhost:5000/api/admin/dashboard');
    const response = await fetch('http://localhost:5000/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status, response.statusText);
    
    const data = await response.json();
    
    if (data.success) {
      console.log('\n✅ SUCCÈS - Données reçues:\n');
      console.table(data.data);
      
      console.log('\n💰 Revenus:');
      console.log('   Total:', data.data.total_revenue, '€');
      console.log('   Aujourd\'hui:', data.data.revenue_today, '€');
      console.log('   7 jours:', data.data.revenue_7days, '€');
      console.log('   30 jours:', data.data.revenue_30days, '€');
      
      console.log('\n📦 Commandes:');
      console.log('   Total:', data.data.total_orders);
      console.log('   Aujourd\'hui:', data.data.orders_today);
      
      console.log('\n🎯 Moyennes:');
      console.log('   Ticket moyen:', data.data.average_order_value, '€');
      console.log('   Panier moyen:', data.data.average_items_per_order, 'articles');
    } else {
      console.error('\n❌ ERREUR:', data.error || data.message);
    }
  } catch (error) {
    console.error('\n❌ Exception:', error.message);
  }
}

testDashboardAPI()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  });

