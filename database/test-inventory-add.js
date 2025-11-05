const mysql = require('mysql2/promise');

async function testInventoryAdd() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('🧪 Test d\'ajout d\'ingrédient dans MySQL...\n');

    // Test d'insertion directe
    const testData = {
      ingredient_name: 'Test Citron',
      quantity: 15.00,
      unit: 'kg',
      threshold: 5.00,
      price_per_unit: 3.50,
      supplier: 'Test Marché'
    };

    console.log('📝 Données de test:', testData);
    console.log('');

    const [result] = await pool.query(
      `INSERT INTO inventory (ingredient_name, quantity, unit, threshold, price_per_unit, supplier)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        testData.ingredient_name,
        testData.quantity,
        testData.unit,
        testData.threshold,
        testData.price_per_unit,
        testData.supplier
      ]
    );

    console.log('✅ Insertion réussie !');
    console.log('   ID créé:', result.insertId);
    console.log('');

    // Vérifier l'insertion
    const [inserted] = await pool.query(
      'SELECT * FROM inventory WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ Vérification:');
    console.log('   Nom:', inserted[0].ingredient_name);
    console.log('   Quantité:', inserted[0].quantity, inserted[0].unit);
    console.log('   Seuil:', inserted[0].threshold);
    console.log('   Prix:', inserted[0].price_per_unit, '€');
    console.log('   Fournisseur:', inserted[0].supplier);
    console.log('');

    // Nettoyer (supprimer le test)
    await pool.query('DELETE FROM inventory WHERE id = ?', [result.insertId]);
    console.log('🧹 Test nettoyé (ingrédient supprimé)');
    console.log('');

    console.log('✅ TEST RÉUSSI !');
    console.log('');
    console.log('La base de données fonctionne correctement.');
    console.log('');
    console.log('Si vous avez toujours une erreur dans l\'application :');
    console.log('  1. Vérifiez que le backend est lancé : node admin-api.js');
    console.log('  2. Vérifiez la console du backend pour les erreurs');
    console.log('  3. Vérifiez la console du navigateur (F12)');
    console.log('  4. Assurez-vous d\'être connecté en admin');
    console.log('');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('');
    console.error('Détails:', error.sqlMessage || error);
    console.error('');
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('➡️  La table inventory n\'existe pas.');
      console.error('    Lancez: node check-and-create-inventory.js');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('➡️  Problème d\'authentification MySQL.');
      console.error('    Vérifiez le mot de passe.');
    } else {
      console.error('➡️  Erreur inattendue.');
      console.error('    Vérifiez que MySQL est démarré.');
    }
    console.error('');
  } finally {
    await pool.end();
  }
}

testInventoryAdd();






