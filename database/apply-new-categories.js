/**
 * Script pour appliquer les nouvelles catégories
 * Exécuter avec: node database/apply-new-categories.js
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10
});

async function applyNewCategories() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Début de la mise à jour des catégories...\n');
    
    // Désactiver les contraintes de clés étrangères
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Vider les tables
    console.log('🗑️ Suppression des anciennes données...');
    await connection.query('TRUNCATE TABLE order_items');
    await connection.query('TRUNCATE TABLE orders');
    await connection.query('TRUNCATE TABLE products');
    await connection.query('TRUNCATE TABLE categories');
    console.log('✅ Tables vidées\n');
    
    // Réactiver les contraintes
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Créer les nouvelles catégories
    console.log('📂 Création des nouvelles catégories...');
    await connection.query(`
      INSERT INTO categories (id, name, slug, description, icon, display_order, is_active) VALUES
      (1, 'Boissons Chaudes', 'boissons-chaudes', 'Cafés, thés et chocolats chauds', '☕', 1, TRUE),
      (2, 'Boissons Froides', 'boissons-froides', 'Jus, smoothies et boissons glacées', '🥤', 2, TRUE),
      (3, 'Délices Salés', 'delices-sales', 'Sandwichs, salades et quiches', '🥐', 3, TRUE),
      (4, 'Délices Sucrés', 'delices-sucres', 'Pâtisseries, gâteaux et desserts', '🍰', 4, TRUE)
    `);
    console.log('✅ 4 catégories créées\n');
    
    // Créer les produits
    console.log('📦 Création des produits...');
    
    // Boissons Chaudes
    await connection.query(`
      INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured) VALUES
      (1, 'Espresso', 'espresso', 'Café corsé et intense', 2.50, NULL, 100, TRUE, FALSE),
      (1, 'Cappuccino', 'cappuccino', 'Espresso avec mousse de lait onctueuse', 3.80, NULL, 100, TRUE, TRUE),
      (1, 'Latte', 'latte', 'Café doux avec lait chaud', 4.20, NULL, 100, TRUE, FALSE),
      (1, 'Thé Vert', 'the-vert', 'Thé vert bio du Japon', 3.50, NULL, 80, TRUE, FALSE),
      (1, 'Thé Noir', 'the-noir', 'Thé noir Earl Grey premium', 3.50, NULL, 80, TRUE, FALSE),
      (1, 'Chocolat Chaud', 'chocolat-chaud', 'Chocolat belge onctueux', 4.50, NULL, 60, TRUE, TRUE)
    `);
    console.log('✅ 6 boissons chaudes créées');
    
    // Boissons Froides
    await connection.query(`
      INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured) VALUES
      (2, 'Café Glacé', 'cafe-glace', 'Café froid avec glaçons', 4.50, NULL, 80, TRUE, TRUE),
      (2, 'Smoothie Fruits Rouges', 'smoothie-fruits-rouges', 'Fraises, framboises et myrtilles', 5.50, NULL, 50, TRUE, FALSE),
      (2, 'Jus d Orange Pressé', 'jus-orange', 'Oranges fraîches pressées à la commande', 4.80, NULL, 60, TRUE, FALSE),
      (2, 'Limonade Maison', 'limonade-maison', 'Citrons frais, menthe et miel', 4.20, NULL, 70, TRUE, FALSE),
      (2, 'Thé Glacé', 'the-glace', 'Thé vert glacé au citron', 4.00, NULL, 80, TRUE, FALSE)
    `);
    console.log('✅ 5 boissons froides créées');
    
    // Délices Salés
    await connection.query(`
      INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured) VALUES
      (3, 'Croissant Jambon Fromage', 'croissant-jambon-fromage', 'Croissant garni jambon et emmental', 5.50, NULL, 40, TRUE, TRUE),
      (3, 'Sandwich Poulet Avocat', 'sandwich-poulet-avocat', 'Pain complet, poulet grillé et avocat', 7.80, NULL, 30, TRUE, FALSE),
      (3, 'Quiche Lorraine', 'quiche-lorraine', 'Quiche aux lardons et gruyère', 6.50, NULL, 25, TRUE, FALSE),
      (3, 'Salade César', 'salade-cesar', 'Salade verte, poulet, parmesan et croûtons', 8.50, NULL, 20, TRUE, FALSE),
      (3, 'Croque Monsieur', 'croque-monsieur', 'Jambon, fromage et béchamel gratinée', 6.80, NULL, 35, TRUE, FALSE)
    `);
    console.log('✅ 5 délices salés créés');
    
    // Délices Sucrés
    await connection.query(`
      INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured) VALUES
      (4, 'Croissant Nature', 'croissant-nature', 'Croissant pur beurre artisanal', 2.80, NULL, 50, TRUE, TRUE),
      (4, 'Pain au Chocolat', 'pain-au-chocolat', 'Viennoiserie au chocolat noir', 3.20, NULL, 50, TRUE, FALSE),
      (4, 'Éclair au Chocolat', 'eclair-chocolat', 'Pâte à choux, crème pâtissière et glaçage chocolat', 4.50, NULL, 30, TRUE, FALSE),
      (4, 'Tarte aux Fraises', 'tarte-fraises', 'Pâte sablée, crème pâtissière et fraises fraîches', 5.80, NULL, 20, TRUE, TRUE),
      (4, 'Macaron Assortiment', 'macaron-assortiment', 'Assortiment de 6 macarons parfums variés', 8.50, NULL, 40, TRUE, FALSE),
      (4, 'Cheesecake New York', 'cheesecake', 'Cheesecake crémeux sur base spéculoos', 6.50, NULL, 25, TRUE, FALSE),
      (4, 'Brownie au Chocolat', 'brownie', 'Brownie fondant au chocolat belge', 4.80, NULL, 35, TRUE, FALSE)
    `);
    console.log('✅ 7 délices sucrés créés\n');
    
    // Vérification
    console.log('📊 VÉRIFICATION:\n');
    const [categories] = await connection.query(`
      SELECT 
        id, 
        name, 
        slug, 
        icon,
        (SELECT COUNT(*) FROM products WHERE category_id = categories.id) as nb_produits
      FROM categories
      ORDER BY display_order
    `);
    
    console.log('Catégories:');
    categories.forEach(cat => {
      console.log(`  ${cat.icon} ${cat.name} (${cat.nb_produits} produits)`);
    });
    
    const [products] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`\n✅ Total: ${products[0].total} produits créés\n`);
    
    console.log('✅✅✅ MISE À JOUR TERMINÉE AVEC SUCCÈS ! ✅✅✅\n');
    console.log('🔄 Rafraîchissez l\'application (F5) pour voir les changements.\n');
    
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Exécuter
applyNewCategories()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

