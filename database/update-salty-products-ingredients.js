/**
 * Script pour mettre à jour les ingrédients des produits de la catégorie "Délices Salés"
 * Analyse chaque produit et ajoute des ingrédients appropriés
 */

const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe'
};

// Mapping des ingrédients par produit
const productIngredients = {
  'Bagel saumon': 'Bagel, Saumon fumé, Fromage frais, Salade, Concombre, Oignon rouge, Câpres',
  'Brioche poulet': 'Brioche, Poulet grillé, Salade, Tomate, Mayonnaise, Cornichons',
  'Burger poulet': 'Pain burger, Poulet pané, Salade, Tomate, Oignon, Fromage, Sauce spéciale',
  'Dynamite Chicken': 'Poulet épicé, Pain brioche, Salade, Tomate, Oignon rouge, Sauce dynamite',
  'Frites cheddar': 'Pommes de terre, Fromage cheddar, Oignons frits, Sauce',
  'Menu poulet': 'Poulet grillé, Frites, Salade, Sauce',
  'Toast saumon': 'Pain de campagne, Saumon fumé, Fromage frais, Salade, Citron, Aneth'
};

async function updateSaltyProductsIngredients() {
  let connection;
  
  try {
    console.log('🔍 Analyse des produits de la catégorie "Délices Salés"...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion à la base de données établie\n');
    
    // Récupérer tous les produits de la catégorie "Délices Salés"
    const [products] = await connection.query(`
      SELECT p.id, p.name, p.description, p.allergens, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.name = 'Délices Salés' OR c.slug = 'delices-sales'
      ORDER BY p.name
    `);
    
    console.log(`📦 ${products.length} produit(s) trouvé(s) dans "Délices Salés"\n`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      let ingredients = productIngredients[product.name];
      
      // Si pas dans le mapping, analyser le nom et la description
      if (!ingredients) {
        ingredients = analyzeProductIngredients(product.name, product.description);
      }
      
      // Convertir en tableau JSON pour la base de données
      const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(Boolean);
      const allergensJson = JSON.stringify(ingredientsArray);
      
      // Mettre à jour le produit
      await connection.query(
        'UPDATE products SET allergens = ? WHERE id = ?',
        [allergensJson, product.id]
      );
      
      console.log(`✅ [ID: ${product.id}] ${product.name}`);
      console.log(`   Ingrédients: ${ingredients}\n`);
      
      updatedCount++;
    }
    
    console.log(`\n✅ ${updatedCount} produit(s) mis à jour avec succès !`);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Fonction pour analyser et déduire les ingrédients à partir du nom et de la description
function analyzeProductIngredients(name, description) {
  const nameLower = name.toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  // Base d'ingrédients communs
  const baseIngredients = [];
  
  // Analyser le nom du produit
  if (nameLower.includes('bagel')) {
    baseIngredients.push('Bagel');
    if (nameLower.includes('saumon')) {
      baseIngredients.push('Saumon fumé');
      baseIngredients.push('Fromage frais');
      baseIngredients.push('Salade');
      baseIngredients.push('Concombre');
    }
  }
  
  if (nameLower.includes('brioche')) {
    baseIngredients.push('Brioche');
    if (nameLower.includes('poulet')) {
      baseIngredients.push('Poulet grillé');
      baseIngredients.push('Salade');
      baseIngredients.push('Tomate');
      baseIngredients.push('Mayonnaise');
    }
  }
  
  if (nameLower.includes('burger')) {
    baseIngredients.push('Pain burger');
    if (nameLower.includes('poulet')) {
      baseIngredients.push('Poulet pané');
      baseIngredients.push('Salade');
      baseIngredients.push('Tomate');
      baseIngredients.push('Oignon');
      baseIngredients.push('Fromage');
      baseIngredients.push('Sauce spéciale');
    }
  }
  
  if (nameLower.includes('dynamite')) {
    baseIngredients.push('Poulet épicé');
    baseIngredients.push('Pain brioche');
    baseIngredients.push('Salade');
    baseIngredients.push('Tomate');
    baseIngredients.push('Oignon rouge');
    baseIngredients.push('Sauce dynamite');
  }
  
  if (nameLower.includes('frites')) {
    baseIngredients.push('Pommes de terre');
    if (nameLower.includes('cheddar')) {
      baseIngredients.push('Fromage cheddar');
      baseIngredients.push('Oignons frits');
      baseIngredients.push('Sauce');
    }
  }
  
  if (nameLower.includes('menu')) {
    if (nameLower.includes('poulet')) {
      baseIngredients.push('Poulet grillé');
      baseIngredients.push('Frites');
      baseIngredients.push('Salade');
      baseIngredients.push('Sauce');
    }
  }
  
  if (nameLower.includes('toast')) {
    baseIngredients.push('Pain de campagne');
    if (nameLower.includes('saumon')) {
      baseIngredients.push('Saumon fumé');
      baseIngredients.push('Fromage frais');
      baseIngredients.push('Salade');
      baseIngredients.push('Citron');
      baseIngredients.push('Aneth');
    }
  }
  
  // Si aucun ingrédient trouvé, utiliser des ingrédients par défaut
  if (baseIngredients.length === 0) {
    return 'Ingrédients à définir';
  }
  
  return baseIngredients.join(', ');
}

// Exécuter le script
updateSaltyProductsIngredients();

