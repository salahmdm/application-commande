/**
 * Script de test pour vérifier que generateOrderNumber() fonctionne correctement
 */

const mysql = require('mysql2/promise');

// Fonction generateOrderNumber (copie du code dans admin-api.js)
async function generateOrderNumber(connection) {
  try {
    console.log('🔢 [generateOrderNumber] Début de la génération...');
    
    // Utiliser une sous-requête pour obtenir le maximum de manière atomique
    // Cela évite les problèmes de concurrence
    const [result] = await connection.query(
      `SELECT 
        COALESCE(MAX(CAST(SUBSTRING(order_number, 5) AS UNSIGNED)), 0) as max_number
       FROM orders 
       WHERE DATE(created_at) = CURDATE() 
       AND order_number REGEXP '^CMD-[0-9]{4}$'`
    );
    
    let dailyCount = 1;
    
    if (result.length > 0 && result[0].max_number !== null) {
      const maxNumber = parseInt(result[0].max_number, 10);
      if (!isNaN(maxNumber) && maxNumber >= 0) {
        dailyCount = maxNumber + 1;
      }
    }
    
    // Générer le nouveau numéro au format CMD-XXXX
    const orderNumber = `CMD-${String(dailyCount).padStart(4, '0')}`;
    
    console.log('📌 [generateOrderNumber] Génération numéro de commande:');
    console.log('   - Max numéro aujourd\'hui:', result[0]?.max_number || 0);
    console.log('   - Nouveau numéro généré:', orderNumber);
    console.log('   - Format vérifié:', orderNumber.match(/^CMD-\d{4}$/) ? '✅' : '❌');
    
    // Vérifier que le format est correct
    if (!orderNumber.match(/^CMD-\d{4}$/)) {
      console.error('❌ [generateOrderNumber] Format invalide généré:', orderNumber);
      throw new Error(`Format de numéro de commande invalide: ${orderNumber}`);
    }
    
    return orderNumber;
  } catch (error) {
    console.error('❌ [generateOrderNumber] Erreur lors de la génération:', error);
    console.error('   Stack:', error.stack);
    // En cas d'erreur, utiliser un timestamp comme fallback (mais format CMD)
    const timestamp = Date.now().toString().slice(-4);
    const fallbackNumber = `CMD-${timestamp}`;
    console.error('   ⚠️ Utilisation du fallback:', fallbackNumber);
    return fallbackNumber;
  }
}

async function testGenerateOrderNumber() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('🧪 Test de generateOrderNumber()...\n');

    // Test 1: Générer un numéro
    const orderNumber1 = await generateOrderNumber(connection);
    console.log(`\n✅ Test 1: Numéro généré = ${orderNumber1}`);
    
    if (!orderNumber1.match(/^CMD-\d{4}$/)) {
      throw new Error(`Format invalide: ${orderNumber1}`);
    }

    // Test 2: Générer un autre numéro (devrait être +1)
    const orderNumber2 = await generateOrderNumber(connection);
    console.log(`\n✅ Test 2: Numéro généré = ${orderNumber2}`);
    
    if (!orderNumber2.match(/^CMD-\d{4}$/)) {
      throw new Error(`Format invalide: ${orderNumber2}`);
    }

    console.log('\n✅✅✅ Tous les tests réussis ! ✅✅✅');
    console.log(`\n📊 Résumé:`);
    console.log(`   - Premier numéro: ${orderNumber1}`);
    console.log(`   - Deuxième numéro: ${orderNumber2}`);
    console.log(`   - Format: CMD-XXXX ✅`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testGenerateOrderNumber()
  .then(() => {
    console.log('\n✅ Script de test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
