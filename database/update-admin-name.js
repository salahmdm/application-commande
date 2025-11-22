/**
 * Script pour renommer l'utilisateur admin
 * Usage: node database/update-admin-name.js
 */

const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./utils/logger');

async function updateAdminName() {
  let connection;
  
  try {
    logger.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    });
    
    logger.log('✅ Connecté à la base de données\n');
    
    // Trouver l'utilisateur admin avec le nom "Sophie Bernard" ou "Sophie Bernzar"
    logger.log('📊 Recherche de l\'utilisateur admin...');
    const [admins] = await connection.query(
      `SELECT id, email, first_name, last_name, role 
       FROM users 
       WHERE role = 'admin' 
       AND email = 'admin@blossom.com'`
    );
    
    if (admins.length === 0) {
      logger.log('⚠️  Aucun utilisateur admin trouvé avec l\'email admin@blossom.com');
      await connection.end();
      return;
    }
    
    const admin = admins[0];
    logger.log('📋 Utilisateur admin trouvé:');
    logger.log(`   - ID: ${admin.id}`);
    logger.log(`   - Email: ${admin.email}`);
    logger.log(`   - Nom actuel: ${admin.first_name} ${admin.last_name}`);
    logger.log('');
    
    // Mettre à jour le nom
    logger.log('✏️  Mise à jour du nom en "Administrateur"...');
    await connection.query(
      'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
      ['Administrateur', '', admin.id]
    );
    
    logger.log('✅ Nom mis à jour avec succès !\n');
    
    // Vérifier le résultat
    const [updated] = await connection.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [admin.id]
    );
    
    if (updated.length > 0) {
      const user = updated[0];
      logger.log('📊 Vérification:');
      logger.log(`   - Email: ${user.email}`);
      logger.log(`   - Nouveau nom: ${user.first_name} ${user.last_name || '(vide)'}`);
      logger.log(`   - Rôle: ${user.role}\n`);
    }
    
    await connection.end();
    logger.log('✅ Mise à jour terminée avec succès !');
    
  } catch (error) {
    if (connection) {
      await connection.end();
    }
    
    logger.error('\n❌ Erreur lors de la mise à jour:');
    logger.error(`   Code: ${error.code}`);
    logger.error(`   Message: ${error.message}`);
    
    if (error.sqlMessage) {
      logger.error(`   SQL Message: ${error.sqlMessage}`);
    }
    
    process.exit(1);
  }
}

// Exécuter la mise à jour
updateAdminName();

