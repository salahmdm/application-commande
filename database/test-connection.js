/**
 * Script de test de connexion MySQL
 * Usage: node test-connection.js
 */

const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=========================================');
console.log('  Test de Connexion MySQL');
console.log('=========================================\n');

console.log('Configuration:');
console.log('  Host: 127.0.0.1');
console.log('  Port: 3306');
console.log('  User: root\n');

rl.question('Entrez le mot de passe MySQL pour root: ', async (password) => {
  console.log('\n⏳ Test de connexion en cours...\n');

  try {
    // Créer une connexion
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: password
    });

    console.log('=========================================');
    console.log('  ✅ CONNEXION RÉUSSIE !');
    console.log('=========================================\n');

    // Récupérer des informations sur le serveur
    const [rows] = await connection.query('SELECT VERSION() AS version, NOW() AS now');
    console.log('📊 Informations MySQL:');
    console.log(`  Version: ${rows[0].version}`);
    console.log(`  Date/Heure: ${rows[0].now}\n`);

    // Vérifier si la base blossom_cafe existe
    const [databases] = await connection.query("SHOW DATABASES LIKE 'blossom_cafe'");
    
    if (databases.length > 0) {
      console.log('⚠️  La base de données "blossom_cafe" existe déjà');
      console.log('   Le script d\'installation la supprimera et la recréera\n');
      
      // Afficher quelques statistiques
      await connection.query('USE blossom_cafe');
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`📋 Tables existantes: ${tables.length}`);
      
      if (tables.length > 0) {
        console.log('   Tables:');
        tables.forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`     • ${tableName}`);
        });
      }
    } else {
      console.log('✅ La base de données "blossom_cafe" n\'existe pas encore');
      console.log('   Prêt pour l\'installation\n');
    }

    console.log('\n✅ Le serveur MySQL est accessible');
    console.log('✅ Les identifiants sont corrects');
    console.log('✅ Vous pouvez maintenant installer la base de données\n');

    console.log('Prochaine étape:');
    console.log('  npm install  (si pas encore fait)');
    console.log('  npm start    (pour démarrer le backend)\n');

    await connection.end();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.log('=========================================');
    console.log('  ❌ ÉCHEC DE CONNEXION');
    console.log('=========================================\n');

    console.log('Détails de l\'erreur:');
    console.log(`  ${error.message}\n`);

    console.log('Causes possibles:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('  ❌ Le mot de passe est incorrect');
      console.log('     Solution: Vérifiez le mot de passe root MySQL\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('  ❌ Le serveur MySQL n\'est pas démarré');
      console.log('     Solution: Démarrez MySQL Server');
      console.log('     Commande: net start MySQL80\n');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.log('  ❌ Impossible de se connecter à 127.0.0.1:3306');
      console.log('     Solution: Vérifiez que MySQL écoute sur le bon port\n');
    } else {
      console.log('  ❌ Erreur inconnue');
      console.log(`     Code: ${error.code || 'N/A'}\n`);
    }

    rl.close();
    process.exit(1);
  }
});

