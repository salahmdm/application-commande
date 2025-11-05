const mysql = require('mysql2/promise');

/**
 * Script pour créer la table app_settings et insérer les paramètres par défaut
 */

async function applySettingsTable() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe',
    port: 3306
  });

  try {
    console.log('🔄 Connexion à MySQL...');
    
    // Créer la table app_settings
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type ENUM('boolean', 'string', 'number', 'json') DEFAULT 'string',
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table app_settings créée ou existe déjà');

    // Insérer les paramètres par défaut
    const settings = [
      {
        key: 'table_number_enabled',
        value: 'true',
        type: 'boolean',
        description: 'Activer/désactiver le numéro de table pour les commandes sur place'
      },
      {
        key: 'app_name',
        value: 'Blossom Café',
        type: 'string',
        description: 'Nom de l\'application'
      },
      {
        key: 'tax_rate',
        value: '10',
        type: 'number',
        description: 'Taux de TVA en pourcentage'
      }
    ];

    for (const setting of settings) {
      await connection.execute(`
        INSERT INTO app_settings (setting_key, setting_value, setting_type, description)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          setting_value = VALUES(setting_value),
          setting_type = VALUES(setting_type),
          description = VALUES(description)
      `, [setting.key, setting.value, setting.type, setting.description]);
      console.log(`✅ Paramètre "${setting.key}" inséré/mis à jour`);
    }

    // Afficher les paramètres
    const [rows] = await connection.execute('SELECT * FROM app_settings');
    console.log('\n📋 Paramètres actuels:');
    console.table(rows);

    console.log('\n✅ Table app_settings créée et paramétrée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

applySettingsTable()
  .then(() => {
    console.log('\n🎉 Opération terminée');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Échec:', error.message);
    process.exit(1);
  });

