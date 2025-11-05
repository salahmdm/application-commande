/**
 * Script pour créer la table news dans la base de données
 */
const mysql = require('mysql2/promise');

async function createNewsTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });

    console.log('📊 Création de la table news...\n');

    // Créer la table news
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date VARCHAR(100),
        image_url VARCHAR(500),
        icon VARCHAR(10) DEFAULT '🍃',
        gradient VARCHAR(100) DEFAULT 'from-emerald-400 via-teal-500 to-cyan-600',
        bg_pattern VARCHAR(255),
        \`order\` INT DEFAULT 0 COMMENT 'Ordre d''affichage',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order (\`order\`),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Table news créée avec succès !\n');

    // Vérifier si des données existent
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM news');
    console.log(`📊 Nombre d'actualités: ${rows[0].count}\n`);

    // Insérer des données par défaut si la table est vide
    if (rows[0].count === 0) {
      console.log('📝 Insertion des actualités par défaut...\n');
      
      await connection.query(`
        INSERT INTO news (title, description, date, icon, gradient, bg_pattern, \`order\`) VALUES
        ('Atelier dégustation de thés', 'Découvrez nos thés rares lors de notre atelier dégustation', 'Samedi 24 Octobre', '🍃', 'from-emerald-400 via-teal-500 to-cyan-600', 'bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.15),transparent_50%)]', 0),
        ('Nouveau gâteau Matcha et Yuzu', 'Notre nouvelle création est maintenant disponible !', NULL, '🍰', 'from-pink-400 via-rose-500 to-purple-600', 'bg-[radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.15),transparent_50%)]', 1),
        ('Happy Hour spécial', 'Réductions sur tous nos desserts de 15h à 17h', NULL, '🎉', 'from-violet-400 via-purple-500 to-indigo-600', 'bg-[radial-gradient(circle_at_50%_70%,rgba(139,92,246,0.15),transparent_50%)]', 2)
      `);
      
      console.log('✅ Actualités par défaut insérées !\n');
    }

    await connection.end();
    console.log('✅ Script terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

createNewsTable();
