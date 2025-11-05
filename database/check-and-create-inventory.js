const mysql = require('mysql2/promise');

async function checkAndCreateInventory() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Muheko,1991@',
    database: 'blossom_cafe',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('🔍 Vérification de la table inventory...\n');

    // Vérifier si la table existe
    const [tables] = await pool.query("SHOW TABLES LIKE 'inventory'");
    
    if (tables.length === 0) {
      console.log('❌ La table inventory n\'existe PAS !');
      console.log('📝 Création de la table inventory...\n');
      
      // Créer la table
      await pool.query(`
        CREATE TABLE inventory (
          id INT PRIMARY KEY AUTO_INCREMENT,
          ingredient_name VARCHAR(100) NOT NULL,
          quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
          unit VARCHAR(20) NOT NULL DEFAULT 'kg',
          threshold DECIMAL(10, 2) NOT NULL DEFAULT 5,
          price_per_unit DECIMAL(10, 2) DEFAULT 0,
          supplier VARCHAR(100),
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Table inventory créée !\n');
      console.log('📦 Insertion des données de test...\n');
      
      // Insérer des données de test
      await pool.query(`
        INSERT INTO inventory (ingredient_name, quantity, unit, threshold, price_per_unit, supplier) VALUES
        ('Thé vert (feuilles)', 50.00, 'kg', 10.00, 25.00, 'Thés du Monde'),
        ('Thé noir (feuilles)', 45.00, 'kg', 10.00, 22.00, 'Thés du Monde'),
        ('Café (grains)', 30.00, 'kg', 8.00, 18.00, 'Café Premium'),
        ('Lait', 80.00, 'L', 20.00, 1.20, 'Laiterie Bio'),
        ('Sucre', 25.00, 'kg', 5.00, 1.50, 'Sucre & Co'),
        ('Farine', 40.00, 'kg', 10.00, 0.80, 'Moulin Artisanal'),
        ('Beurre', 15.00, 'kg', 5.00, 8.00, 'Laiterie Bio'),
        ('Œufs', 120.00, 'unités', 30.00, 0.25, 'Ferme du Village'),
        ('Chocolat', 20.00, 'kg', 5.00, 12.00, 'Chocolat Gourmet'),
        ('Fruits frais', 25.00, 'kg', 8.00, 4.50, 'Marché Local'),
        ('Miel', 10.00, 'kg', 3.00, 15.00, 'Ruche Dorée'),
        ('Amandes', 8.00, 'kg', 2.00, 18.00, 'Fruits Secs Bio'),
        ('Crème fraîche', 12.00, 'L', 5.00, 3.50, 'Laiterie Bio'),
        ('Vanille (gousses)', 0.50, 'kg', 0.10, 250.00, 'Épices Rares')
      `);
      
      console.log('✅ 14 ingrédients ajoutés !\n');
      
    } else {
      console.log('✅ La table inventory existe déjà !\n');
    }
    
    // Afficher le contenu
    const [inventory] = await pool.query('SELECT * FROM inventory');
    console.log(`📊 Contenu de la table inventory : ${inventory.length} ingrédients\n`);
    
    if (inventory.length > 0) {
      console.log('Aperçu des 5 premiers ingrédients :');
      inventory.slice(0, 5).forEach(item => {
        console.log(`  • ${item.ingredient_name} : ${item.quantity} ${item.unit} (seuil: ${item.threshold})`);
      });
      console.log('');
    }
    
    // Vérifier les stocks faibles
    const [lowStock] = await pool.query('SELECT * FROM inventory WHERE quantity <= threshold');
    if (lowStock.length > 0) {
      console.log(`⚠️  ${lowStock.length} ingrédient(s) en stock faible :`);
      lowStock.forEach(item => {
        console.log(`  • ${item.ingredient_name} : ${item.quantity} ${item.unit} (seuil: ${item.threshold})`);
      });
      console.log('');
    }
    
    console.log('✅ TOUT EST PRÊT !');
    console.log('');
    console.log('🚀 Vous pouvez maintenant :');
    console.log('   1. Actualiser (F5) le navigateur');
    console.log('   2. Aller dans "Inventaire"');
    console.log('   3. Ajouter/Modifier des ingrédients');
    console.log('');
    
  } catch (error) {
    console.error('❌ ERREUR :', error.message);
    console.error('');
    console.error('Vérifications :');
    console.error('  • MySQL est-il démarré ?');
    console.error('  • La base blossom_cafe existe-t-elle ?');
    console.error('  • Le mot de passe est-il correct ?');
    console.error('');
  } finally {
    await pool.end();
  }
}

checkAndCreateInventory();















