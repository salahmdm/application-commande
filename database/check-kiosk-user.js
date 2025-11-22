/**
 * Script pour vérifier et créer l'utilisateur kiosk
 * Usage: node database/check-kiosk-user.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkAndCreateKioskUser() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔍 Vérification de l\'utilisateur kiosk...');
    
    const kioskId = 'kiosk-001@blossom-cafe.local';
    const kioskSecret = 'kiosk-secret-2025';
    
    // Vérifier si l'utilisateur existe
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [kioskId, 'kiosk']
    );
    
    if (users.length > 0) {
      console.log('✅ Utilisateur kiosk existe déjà:', users[0].email);
      console.log('   ID:', users[0].id);
      console.log('   Role:', users[0].role);
      console.log('   Actif:', users[0].is_active);
      
      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(kioskSecret, users[0].password_hash);
      if (isValid) {
        console.log('✅ Mot de passe valide');
      } else {
        console.log('⚠️ Mot de passe invalide, mise à jour...');
        const hashedPassword = await bcrypt.hash(kioskSecret, 10);
        await connection.query(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [hashedPassword, users[0].id]
        );
        console.log('✅ Mot de passe mis à jour');
      }
    } else {
      console.log('❌ Utilisateur kiosk n\'existe pas, création...');
      
      // Créer le hash du mot de passe
      const hashedPassword = await bcrypt.hash(kioskSecret, 10);
      
      // Créer l'utilisateur kiosk
      const [result] = await connection.query(
        `INSERT INTO users (email, password_hash, role, is_active, created_at) 
         VALUES (?, ?, 'kiosk', TRUE, NOW())`,
        [kioskId, hashedPassword]
      );
      
      console.log('✅ Utilisateur kiosk créé avec succès');
      console.log('   ID:', result.insertId);
      console.log('   Email:', kioskId);
      console.log('   Role: kiosk');
    }
    
    // Vérifier les catégories
    console.log('\n🔍 Vérification des catégories...');
    const [categories] = await connection.query(
      'SELECT COUNT(*) as count FROM categories WHERE is_active = TRUE'
    );
    console.log(`✅ ${categories[0].count} catégories actives en BDD`);
    
    if (categories[0].count === 0) {
      console.log('⚠️ Aucune catégorie active trouvée !');
      console.log('   Vérifiez que vous avez des catégories avec is_active = TRUE');
    }
    
    // Vérifier les produits
    console.log('\n🔍 Vérification des produits...');
    const [products] = await connection.query(
      'SELECT COUNT(*) as count FROM products WHERE is_available = TRUE'
    );
    console.log(`✅ ${products[0].count} produits disponibles en BDD`);
    
    if (products[0].count === 0) {
      console.log('⚠️ Aucun produit disponible trouvé !');
      console.log('   Vérifiez que vous avez des produits avec is_available = TRUE');
    }
    
    console.log('\n✅ Vérification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

checkAndCreateKioskUser()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'exécution:', error);
    process.exit(1);
  });

