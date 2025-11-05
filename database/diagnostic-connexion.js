/**
 * Script de diagnostic complet pour identifier le problème de connexion
 */

const mysql = require('mysql2/promise');

async function diagnostic() {
  console.log('========================================');
  console.log('  DIAGNOSTIC DE CONNEXION');
  console.log('========================================\n');

  let connection;

  try {
    // 1. Test connexion MySQL
    console.log('1️⃣  Test connexion MySQL...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });
    console.log('   ✅ MySQL connecté\n');

    // 2. Vérifier que la base existe
    console.log('2️⃣  Vérification de la base de données...');
    const [databases] = await connection.query("SHOW DATABASES LIKE 'blossom_cafe'");
    if (databases.length > 0) {
      console.log('   ✅ Base de données "blossom_cafe" existe\n');
    } else {
      console.log('   ❌ Base de données "blossom_cafe" n\'existe pas!\n');
      return;
    }

    // 3. Vérifier la table users
    console.log('3️⃣  Vérification de la table users...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    if (tables.length > 0) {
      console.log('   ✅ Table "users" existe\n');
    } else {
      console.log('   ❌ Table "users" n\'existe pas!\n');
      return;
    }

    // 4. Vérifier l'utilisateur admin
    console.log('4️⃣  Vérification de l\'utilisateur admin...');
    const [users] = await connection.query(
      "SELECT * FROM users WHERE email = 'admin@blossom.com'"
    );

    if (users.length === 0) {
      console.log('   ❌ PROBLÈME TROUVÉ : L\'utilisateur admin n\'existe pas dans MySQL!\n');
      console.log('   SOLUTION : Création de l\'utilisateur admin...\n');
      
      // Créer l'utilisateur admin
      await connection.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, is_active)
        VALUES ('admin@blossom.com', '$2a$10$AdminHashedPassword', 'Admin', 'Blossom', 'admin', TRUE, TRUE)
      `);
      
      console.log('   ✅ Utilisateur admin créé!\n');
      
      const [newUsers] = await connection.query(
        "SELECT * FROM users WHERE email = 'admin@blossom.com'"
      );
      
      if (newUsers.length > 0) {
        console.log('   ✅ Vérification : Admin existe maintenant\n');
      }
    } else {
      console.log('   ✅ Utilisateur admin existe\n');
      console.log('   Détails:');
      console.log(`      ID: ${users[0].id}`);
      console.log(`      Email: ${users[0].email}`);
      console.log(`      Nom: ${users[0].first_name} ${users[0].last_name}`);
      console.log(`      Rôle: ${users[0].role}`);
      console.log(`      Actif: ${users[0].is_active ? 'Oui' : 'Non'}`);
      console.log(`      Email vérifié: ${users[0].email_verified ? 'Oui' : 'Non'}\n`);
    }

    // 5. Lister tous les utilisateurs
    console.log('5️⃣  Liste de tous les utilisateurs dans MySQL:');
    const [allUsers] = await connection.query('SELECT id, email, first_name, last_name, role FROM users');
    console.log('   Total:', allUsers.length, 'utilisateurs\n');
    
    allUsers.forEach(user => {
      console.log(`   • [${user.id}] ${user.email}`);
      console.log(`     ${user.first_name} ${user.last_name} - Rôle: ${user.role}`);
    });
    console.log('');

    // 6. Test de l'API
    console.log('6️⃣  Test de l\'API Backend...');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@blossom.com',
          password: 'admin123'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ API Backend répond correctement!');
        console.log(`   Token généré: ${data.token.substring(0, 30)}...`);
        console.log(`   Utilisateur: ${data.user.first_name} ${data.user.last_name}\n`);
      } else {
        const error = await response.json();
        console.log('   ❌ API répond avec une erreur:', error);
      }
    } catch (apiError) {
      console.log('   ❌ API Backend non accessible!');
      console.log('   Erreur:', apiError.message);
      console.log('   \n   SOLUTION: Démarrez le backend avec:');
      console.log('   cd database');
      console.log('   node admin-api.js\n');
    }

    // 7. Résumé
    console.log('========================================');
    console.log('  RÉSUMÉ DU DIAGNOSTIC');
    console.log('========================================\n');

    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [productCount] = await connection.query('SELECT COUNT(*) as count FROM products');
    
    console.log('✅ Base de données: blossom_cafe');
    console.log(`✅ Utilisateurs: ${userCount[0].count}`);
    console.log(`✅ Produits: ${productCount[0].count}\n`);

    console.log('📝 Pour vous connecter:');
    console.log('   1. Assurez-vous que le backend tourne (node admin-api.js)');
    console.log('   2. Ouvrez http://localhost:3001');
    console.log('   3. Email: admin@blossom.com');
    console.log('   4. Password: admin123\n');

  } catch (error) {
    console.log('❌ Erreur:', error.message);
    console.log('\nVérifiez que MySQL Server est démarré.\n');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

diagnostic();


