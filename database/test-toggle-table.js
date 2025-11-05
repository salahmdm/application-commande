const mysql = require('mysql2/promise');

async function testToggle() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe',
    port: 3306
  });

  try {
    console.log('🧪 TEST TOGGLE NUMÉRO DE TABLE\n');
    
    // 1. État initial
    console.log('1️⃣ État initial:');
    let [rows] = await connection.execute(
      'SELECT setting_value FROM app_settings WHERE setting_key = ?',
      ['table_number_enabled']
    );
    console.log('   Valeur:', rows[0]?.setting_value);
    
    // 2. Passer à false
    console.log('\n2️⃣ Passage à FALSE:');
    await connection.execute(
      'UPDATE app_settings SET setting_value = ? WHERE setting_key = ?',
      ['false', 'table_number_enabled']
    );
    console.log('   ✅ UPDATE exécuté');
    
    // 3. Vérifier
    [rows] = await connection.execute(
      'SELECT setting_value FROM app_settings WHERE setting_key = ?',
      ['table_number_enabled']
    );
    console.log('   Nouvelle valeur:', rows[0]?.setting_value);
    
    // 4. Passer à true
    console.log('\n3️⃣ Passage à TRUE:');
    await connection.execute(
      'UPDATE app_settings SET setting_value = ? WHERE setting_key = ?',
      ['true', 'table_number_enabled']
    );
    console.log('   ✅ UPDATE exécuté');
    
    // 5. Vérifier
    [rows] = await connection.execute(
      'SELECT setting_value FROM app_settings WHERE setting_key = ?',
      ['table_number_enabled']
    );
    console.log('   Nouvelle valeur:', rows[0]?.setting_value);
    
    console.log('\n✅ TEST RÉUSSI - La base de données fonctionne correctement');
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
  } finally {
    await connection.end();
  }
}

testToggle()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  });

