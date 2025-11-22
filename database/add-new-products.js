/**
 * Script pour ajouter les nouveaux produits à la base de données
 * Usage: node database/add-new-products.js
 */

const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./utils/logger');

// Fonction pour générer un slug à partir du nom
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Liste des nouveaux produits avec leurs catégories
// Les catégories sont : "Boissons Chaudes", "Boissons Froides", "Délices Salés", "Délices Sucrés"
const newProducts = [
  // Boissons Chaudes
  { name: 'Thé menthe', category: 'Boissons Chaudes', price: 4.50, description: 'Thé à la menthe fraîche et rafraîchissante', calories: 0, prepTime: 5 },
  { name: 'Thé gingembre citron', category: 'Boissons Chaudes', price: 4.50, description: 'Thé au gingembre et citron pour réveiller vos sens', calories: 0, prepTime: 5 },
  { name: 'Espresso', category: 'Boissons Chaudes', price: 3.50, description: 'Espresso italien corsé et intense', calories: 5, prepTime: 3 },
  { name: 'Cappuccino', category: 'Boissons Chaudes', price: 4.50, description: 'Espresso avec mousse de lait crémeuse', calories: 120, prepTime: 5 },
  { name: 'Latte', category: 'Boissons Chaudes', price: 4.50, description: 'Espresso avec lait vapeur onctueux', calories: 150, prepTime: 5 },
  { name: 'Latte Spéculoos Caramel', category: 'Boissons Chaudes', price: 5.50, description: 'Latte aromatisé spéculoos et caramel', calories: 250, prepTime: 6 },
  { name: 'Latte Pistache', category: 'Boissons Chaudes', price: 5.50, description: 'Latte à la pistache gourmande', calories: 220, prepTime: 6 },
  { name: 'Latte noisettes', category: 'Boissons Chaudes', price: 5.50, description: 'Latte parfumé aux noisettes', calories: 230, prepTime: 6 },
  { name: 'Latte Cinnamon Roll', category: 'Boissons Chaudes', price: 5.50, description: 'Latte aux saveurs de cannelle et brioche', calories: 240, prepTime: 6 },
  { name: 'Chocolat chaud', category: 'Boissons Chaudes', price: 4.20, description: 'Chocolat chaud maison réconfortant', calories: 250, prepTime: 7 },
  { name: 'Chocolat, caramel', category: 'Boissons Chaudes', price: 4.50, description: 'Chocolat chaud avec caramel onctueux', calories: 280, prepTime: 7 },
  { name: 'Chocolat blanc, chocolat au lait, noisettes', category: 'Boissons Chaudes', price: 5.00, description: 'Chocolat blanc et au lait avec noisettes', calories: 300, prepTime: 7 },
  { name: 'Chocolat blanc, chocolat au lait, barres', category: 'Boissons Chaudes', price: 5.00, description: 'Chocolat blanc et au lait avec barres chocolatées', calories: 320, prepTime: 7 },
  { name: 'Ginger beer', category: 'Boissons Chaudes', price: 4.00, description: 'Boisson au gingembre pétillante', calories: 80, prepTime: 3 },
  { name: 'Dalgona', category: 'Boissons Chaudes', price: 4.50, description: 'Café dalgona mousseux à la coréenne', calories: 180, prepTime: 8 },
  
  // Boissons Froides
  { name: 'Mojito Classique', category: 'Boissons Froides', price: 5.50, description: 'Mojito classique à la menthe fraîche', calories: 150, prepTime: 5 },
  { name: 'Mojito Fraise', category: 'Boissons Froides', price: 5.50, description: 'Mojito à la fraise', calories: 160, prepTime: 5 },
  { name: 'Mojito Violette', category: 'Boissons Froides', price: 5.50, description: 'Mojito à la violette', calories: 155, prepTime: 5 },
  { name: 'Mojito Litchi', category: 'Boissons Froides', price: 5.50, description: 'Mojito au litchi exotique', calories: 165, prepTime: 5 },
  { name: 'Mojito Kiwi', category: 'Boissons Froides', price: 5.50, description: 'Mojito au kiwi', calories: 160, prepTime: 5 },
  { name: 'Mojito Framboise', category: 'Boissons Froides', price: 5.50, description: 'Mojito à la framboise', calories: 160, prepTime: 5 },
  { name: 'Mojito Myrtille', category: 'Boissons Froides', price: 5.50, description: 'Mojito à la myrtille', calories: 155, prepTime: 5 },
  { name: 'Ice Latte', category: 'Boissons Froides', price: 4.50, description: 'Latte glacé rafraîchissant', calories: 140, prepTime: 4 },
  { name: 'Fuze Tea', category: 'Boissons Froides', price: 3.50, description: 'Thé glacé parfumé', calories: 50, prepTime: 2 },
  { name: 'Power booster', category: 'Boissons Froides', price: 6.00, description: 'Jus orange, citron et spiruline pour un boost d\'énergie', calories: 100, prepTime: 6 },
  { name: 'Pomme, kiwi, framboise', category: 'Boissons Froides', price: 5.50, description: 'Smoothie pomme, kiwi et framboise', calories: 120, prepTime: 5 },
  { name: 'Orange, mangue, ananas', category: 'Boissons Froides', price: 5.50, description: 'Smoothie exotique orange, mangue et ananas', calories: 130, prepTime: 5 },
  { name: 'Fraise', category: 'Boissons Froides', price: 5.00, description: 'Jus de fraise frais', calories: 90, prepTime: 4 },
  { name: 'Framboise', category: 'Boissons Froides', price: 5.00, description: 'Jus de framboise frais', calories: 85, prepTime: 4 },
  { name: 'Concombre', category: 'Boissons Froides', price: 4.50, description: 'Jus de concombre frais et désaltérant', calories: 20, prepTime: 4 },
  { name: 'Blue lagoon', category: 'Boissons Froides', price: 5.50, description: 'Cocktail bleu rafraîchissant', calories: 140, prepTime: 5 },
  { name: 'Sirop d\'érable myrtilles', category: 'Boissons Froides', price: 5.00, description: 'Boisson au sirop d\'érable et myrtilles', calories: 150, prepTime: 4 },
  
  // Délices Sucrés (Pâtisseries)
  { name: 'Tarte aux Fraises', category: 'Délices Sucrés', price: 6.50, description: 'Tarte aux fraises fraîches maison', calories: 320, prepTime: 0 },
  { name: 'Spéculoos', category: 'Délices Sucrés', price: 3.00, description: 'Biscuit spéculoos artisanal', calories: 120, prepTime: 0 },
  { name: 'Pancakes Spéculoos', category: 'Délices Sucrés', price: 7.50, description: 'Pancakes aux spéculoos et caramel', calories: 450, prepTime: 15 },
  { name: 'Caramel, spéculoos', category: 'Délices Sucrés', price: 4.00, description: 'Dessert caramel et spéculoos', calories: 280, prepTime: 0 },
  { name: 'Kinder Bueno', category: 'Délices Sucrés', price: 4.50, description: 'Dessert inspiré du Kinder Bueno', calories: 350, prepTime: 0 },
  { name: 'Pistache, framboise', category: 'Délices Sucrés', price: 5.50, description: 'Dessert pistache et framboise', calories: 280, prepTime: 0 },
  { name: 'Brioche Brûlée', category: 'Délices Sucrés', price: 5.00, description: 'Brioche perdue caramélisée', calories: 380, prepTime: 12 },
  
  // Délices Salés (Snacks / Plats)
  { name: 'Toast saumon', category: 'Délices Salés', price: 8.50, description: 'Toast au saumon fumé et fromage frais', calories: 280, prepTime: 10 },
  { name: 'Bagel saumon', category: 'Délices Salés', price: 9.50, description: 'Bagel au saumon fumé, fromage frais et câpres', calories: 420, prepTime: 10 },
  { name: 'Menu poulet', category: 'Délices Salés', price: 12.00, description: 'Menu complet au poulet avec accompagnements', calories: 650, prepTime: 15 },
  { name: 'Burger poulet', category: 'Délices Salés', price: 10.50, description: 'Burger au poulet croustillant', calories: 580, prepTime: 12 },
  { name: 'Brioche poulet', category: 'Délices Salés', price: 9.50, description: 'Brioche au poulet et légumes', calories: 450, prepTime: 12 },
  { name: 'Dynamite Chicken', category: 'Délices Salés', price: 11.00, description: 'Poulet épicé et croustillant', calories: 520, prepTime: 15 },
  { name: 'Frites cheddar', category: 'Délices Salés', price: 6.50, description: 'Frites croustillantes au cheddar fondu', calories: 450, prepTime: 10 },
  { name: 'Pop Corn', category: 'Délices Salés', price: 4.00, description: 'Popcorn salé ou sucré', calories: 200, prepTime: 5 }
];

async function addNewProducts() {
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
    
    // Récupérer les catégories
    logger.log('📊 Récupération des catégories...');
    const [categories] = await connection.query('SELECT id, name FROM categories');
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id;
    });
    
    logger.log('📋 Catégories trouvées:');
    Object.entries(categoryMap).forEach(([name, id]) => {
      logger.log(`   - ${name}: ${id}`);
    });
    logger.log('');
    
    // Vérifier quels produits existent déjà
    logger.log('🔍 Vérification des produits existants...');
    const [existingProducts] = await connection.query('SELECT slug FROM products');
    const existingSlugs = new Set(existingProducts.map(p => p.slug));
    
    // Ajouter les nouveaux produits
    logger.log('➕ Ajout des nouveaux produits...\n');
    let added = 0;
    let skipped = 0;
    let errors = 0;
    
    await connection.beginTransaction();
    
    try {
      for (const product of newProducts) {
        const slug = generateSlug(product.name);
        const categoryName = product.category.toLowerCase();
        const categoryId = categoryMap[categoryName];
        
        if (!categoryId) {
          logger.error(`❌ Catégorie non trouvée: ${product.category}`);
          errors++;
          continue;
        }
        
        if (existingSlugs.has(slug)) {
          logger.log(`⏭️  Produit déjà existant: ${product.name} (${slug})`);
          skipped++;
          continue;
        }
        
        try {
          await connection.query(
            `INSERT INTO products 
            (category_id, name, slug, description, price, stock, is_available, is_featured, calories, preparation_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              categoryId,
              product.name,
              slug,
              product.description,
              product.price,
              50, // Stock par défaut
              true, // is_available
              false, // is_featured
              product.calories,
              product.prepTime
            ]
          );
          
          logger.log(`✅ Ajouté: ${product.name} (${product.category}) - ${product.price}€`);
          added++;
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            logger.log(`⏭️  Doublon détecté: ${product.name} (${slug})`);
            skipped++;
          } else {
            logger.error(`❌ Erreur pour ${product.name}:`, error.message);
            errors++;
          }
        }
      }
      
      await connection.commit();
      
      logger.log('\n📊 Résumé:');
      logger.log(`   ✅ Ajoutés: ${added}`);
      logger.log(`   ⏭️  Ignorés: ${skipped}`);
      logger.log(`   ❌ Erreurs: ${errors}`);
      logger.log(`   📦 Total: ${newProducts.length}\n`);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
    await connection.end();
    logger.log('✅ Opération terminée avec succès !');
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    
    logger.error('\n❌ Erreur lors de l\'ajout des produits:');
    logger.error(`   Code: ${error.code}`);
    logger.error(`   Message: ${error.message}`);
    
    if (error.sqlMessage) {
      logger.error(`   SQL Message: ${error.sqlMessage}`);
    }
    
    process.exit(1);
  }
}

// Exécuter l'ajout des produits
addNewProducts();

