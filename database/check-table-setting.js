const mysql = require('mysql2/promise');

async function checkTableSetting() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe',
    port: 3306
  });

  try {
    console.log('🔍 Vérification du paramètre table_number_enabled...\n');
    
    const [rows] = await connection.execute(
      'SELECT * FROM app_settings WHERE setting_key = ?',
      ['table_number_enabled']
    );
    
    if (rows.length > 0) {
      console.log('📊 Paramètre trouvé:');
      console.table(rows);
      console.log('\n📌 Valeur actuelle:', rows[0].setting_value);
      console.log('📌 Type:', rows[0].setting_type);
    } else {
      console.log('❌ Paramètre table_number_enabled NON TROUVÉ dans la base de données !');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

checkTableSetting()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  });

