const mysql = require('mysql2/promise');
require('dotenv').config();

async function addClientTypeToOrders() {
  let connection;

  try {
    // Créer la connexion
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'blossom_cafe'
    });

    console.log('✅ Connecté à la base de données');

    // Vérifier si les colonnes existent déjà
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME IN ('client_type', 'client_name', 'client_email', 'client_company', 'client_siret')
    `, [process.env.DB_NAME || 'blossom_cafe']);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // Ajouter client_type si elle n'existe pas
    if (!existingColumns.includes('client_type')) {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN client_type ENUM('particulier', 'professionnel') DEFAULT 'particulier' AFTER order_type
      `);
      console.log('✅ Colonne client_type ajoutée');
    } else {
      console.log('ℹ️ Colonne client_type existe déjà');
    }

    // Ajouter client_name si elle n'existe pas
    if (!existingColumns.includes('client_name')) {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN client_name VARCHAR(255) DEFAULT NULL AFTER client_type
      `);
      console.log('✅ Colonne client_name ajoutée');
    } else {
      console.log('ℹ️ Colonne client_name existe déjà');
    }

    // Ajouter client_email si elle n'existe pas
    if (!existingColumns.includes('client_email')) {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN client_email VARCHAR(255) DEFAULT NULL AFTER client_name
      `);
      console.log('✅ Colonne client_email ajoutée');
    } else {
      console.log('ℹ️ Colonne client_email existe déjà');
    }

    // Ajouter client_company si elle n'existe pas
    if (!existingColumns.includes('client_company')) {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN client_company VARCHAR(255) DEFAULT NULL AFTER client_email
      `);
      console.log('✅ Colonne client_company ajoutée');
    } else {
      console.log('ℹ️ Colonne client_company existe déjà');
    }

    // Ajouter client_siret si elle n'existe pas
    if (!existingColumns.includes('client_siret')) {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN client_siret VARCHAR(14) DEFAULT NULL AFTER client_company
      `);
      console.log('✅ Colonne client_siret ajoutée');
    } else {
      console.log('ℹ️ Colonne client_siret existe déjà');
    }

    // Afficher la structure mise à jour
    const [structure] = await connection.query('DESCRIBE orders');
    console.log('\n📋 Structure mise à jour de la table orders:');
    console.table(structure);

    console.log('\n✅ Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Connexion fermée');
    }
  }
}

// Exécuter la migration
addClientTypeToOrders();

