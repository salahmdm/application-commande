/**
 * Script pour exporter la base de données en fichier SQL
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function exportDatabase() {
  try {
    const config = {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    };

    console.log('📊 Export de la base de données...\n');
    console.log(`Base de données: ${config.database}`);
    console.log(`Host: ${config.host}:${config.port}\n`);

    // Vérifier si mysqldump est disponible
    try {
      await execAsync('mysqldump --version');
    } catch (error) {
      console.error('❌ mysqldump n\'est pas installé ou n\'est pas dans le PATH');
      console.error('   Installez MySQL Client pour utiliser mysqldump');
      console.error('   Ou utilisez une alternative comme phpMyAdmin\n');
      
      // Alternative : export manuel via connexion
      console.log('🔄 Tentative d\'export via connexion directe...\n');
      await exportViaConnection(config);
      return;
    }

    // Créer le nom du fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `blossom_cafe_backup_${timestamp}.sql`;
    const filepath = path.join(__dirname, filename);

    // Commande mysqldump
    const command = `mysqldump -h ${config.host} -P ${config.port} -u ${config.user} -p${config.password} ${config.database} > "${filepath}"`;

    console.log('⏳ Export en cours...');
    await execAsync(command);

    // Vérifier que le fichier existe et a du contenu
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('✅ Export réussi !\n');
      console.log(`📁 Fichier: ${filepath}`);
      console.log(`📊 Taille: ${fileSizeMB} MB`);
      console.log(`\n💡 Vous pouvez maintenant sauvegarder ce fichier en lieu sûr.`);
    } else {
      throw new Error('Le fichier de sauvegarde n\'a pas été créé');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error.message);
    
    // Si mysqldump échoue, essayer l'export via connexion
    if (error.message.includes('mysqldump') || error.code === 'ENOENT') {
      console.log('\n🔄 Tentative d\'export via connexion directe...\n');
      try {
        const config = {
          host: '127.0.0.1',
          port: 3306,
          user: 'root',
          password: 'Muheko,1991@',
          database: 'blossom_cafe'
        };
        await exportViaConnection(config);
      } catch (err) {
        console.error('❌ Erreur export via connexion:', err.message);
      }
    }
  }
}

async function exportViaConnection(config) {
  const connection = await mysql.createConnection(config);
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `blossom_cafe_backup_${timestamp}.sql`;
    const filepath = path.join(__dirname, filename);
    
    console.log('⏳ Récupération de la structure et des données...');
    
    let sqlContent = `-- Export de la base de données ${config.database}\n`;
    sqlContent += `-- Date: ${new Date().toISOString()}\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    
    // Récupérer toutes les tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableKey = `Tables_in_${config.database}`;
    
    for (const table of tables) {
      const tableName = table[tableKey];
      console.log(`  📋 Export de la table: ${tableName}`);
      
      // Structure de la table
      const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      sqlContent += `\n-- Structure de la table ${tableName}\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += createTable[0]['Create Table'] + ';\n\n';
      
      // Données de la table
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        sqlContent += `-- Données de la table ${tableName}\n`;
        sqlContent += `LOCK TABLES \`${tableName}\` WRITE;\n`;
        sqlContent += `/*!40000 ALTER TABLE \`${tableName}\` DISABLE KEYS */;\n`;
        
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') {
              return connection.escape(value);
            }
            return value;
          });
          
          sqlContent += `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
        }
        
        sqlContent += `/*!40000 ALTER TABLE \`${tableName}\` ENABLE KEYS */;\n`;
        sqlContent += `UNLOCK TABLES;\n\n`;
      }
    }
    
    sqlContent += `SET FOREIGN_KEY_CHECKS=1;\n`;
    
    // Écrire le fichier
    fs.writeFileSync(filepath, sqlContent, 'utf8');
    
    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n✅ Export réussi !\n');
    console.log(`📁 Fichier: ${filepath}`);
    console.log(`📊 Taille: ${fileSizeMB} MB`);
    console.log(`📋 Tables exportées: ${tables.length}`);
    console.log(`\n💡 Vous pouvez maintenant sauvegarder ce fichier en lieu sûr.`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Exécuter l'export
exportDatabase().catch(console.error);

