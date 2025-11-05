/**
 * Script pour ajouter des produits d'inventaire au salon de thé
 * 10 produits par catégorie
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addInventoryProducts() {
  console.log('🌸 Ajout des produits d\'inventaire pour le salon de thé...');
  console.log('');

  try {
    // Boissons Chaudes (10 produits)
    console.log('☕ Ajout des Boissons Chaudes...');
    const boissonsChaudesData = [
      ['Thé Vert Sencha', 'Boissons Chaudes', 'Thé vert japonais traditionnel', 4.50, 45, 10],
      ['Thé Noir Earl Grey', 'Boissons Chaudes', 'Thé noir aromatisé à la bergamote', 4.50, 38, 10],
      ['Thé Jasmin', 'Boissons Chaudes', 'Thé vert parfumé au jasmin', 5.00, 32, 10],
      ['Thé Blanc Pai Mu Tan', 'Boissons Chaudes', 'Thé blanc délicat aux notes florales', 6.50, 25, 8],
      ['Matcha Latte', 'Boissons Chaudes', 'Latte au thé matcha premium', 5.50, 28, 10],
      ['Café Espresso', 'Boissons Chaudes', 'Espresso italien corsé', 3.50, 50, 15],
      ['Cappuccino', 'Boissons Chaudes', 'Espresso avec mousse de lait', 4.50, 42, 12],
      ['Chocolat Chaud', 'Boissons Chaudes', 'Chocolat chaud onctueux', 4.00, 35, 10],
      ['Infusion Menthe', 'Boissons Chaudes', 'Infusion fraîche à la menthe', 3.50, 40, 10],
      ['Chai Latte', 'Boissons Chaudes', 'Latte épicé aux saveurs indiennes', 5.00, 30, 10]
    ];

    // Boissons Froides (10 produits)
    console.log('🧊 Ajout des Boissons Froides...');
    const boissonsFroidesData = [
      ['Thé Glacé Pêche', 'Boissons Froides', 'Thé noir glacé à la pêche', 4.50, 55, 12],
      ['Limonade Maison', 'Boissons Froides', 'Limonade fraîche artisanale', 4.00, 48, 12],
      ['Smoothie Fraise Banane', 'Boissons Froides', 'Smoothie onctueux aux fruits', 6.00, 30, 10],
      ['Jus d\'Orange Pressé', 'Boissons Froides', 'Jus d\'orange 100% naturel', 5.00, 42, 10],
      ['Thé Glacé Citron', 'Boissons Froides', 'Thé vert glacé au citron', 4.50, 50, 12],
      ['Frappé Caramel', 'Boissons Froides', 'Café frappé au caramel', 5.50, 35, 10],
      ['Milkshake Vanille', 'Boissons Froides', 'Milkshake crémeux à la vanille', 5.50, 28, 8],
      ['Eau Pétillante Aromatisée', 'Boissons Froides', 'Eau gazeuse aux fruits', 3.50, 60, 15],
      ['Kombucha Gingembre', 'Boissons Froides', 'Boisson fermentée au gingembre', 6.00, 25, 8],
      ['Thé Glacé Hibiscus', 'Boissons Froides', 'Infusion glacée aux fleurs d\'hibiscus', 4.50, 38, 10]
    ];

    // Délices Salés (10 produits)
    console.log('🥐 Ajout des Délices Salés...');
    const delicesSalesData = [
      ['Croissant Jambon Fromage', 'Délices Salés', 'Croissant garni au jambon et emmental', 4.50, 20, 5],
      ['Quiche Lorraine', 'Délices Salés', 'Quiche traditionnelle aux lardons', 6.00, 15, 5],
      ['Sandwich Poulet Avocat', 'Délices Salés', 'Sandwich complet au poulet et avocat', 7.50, 18, 5],
      ['Wrap Végétarien', 'Délices Salés', 'Wrap aux légumes grillés', 6.50, 22, 5],
      ['Tarte Saumon Épinards', 'Délices Salés', 'Tarte fine au saumon fumé', 7.00, 12, 4],
      ['Bagel Cream Cheese', 'Délices Salés', 'Bagel au fromage frais et saumon', 6.00, 16, 5],
      ['Croque Monsieur', 'Délices Salés', 'Croque-monsieur traditionnel', 5.50, 25, 6],
      ['Salade César', 'Délices Salés', 'Salade romaine au poulet grillé', 8.50, 10, 4],
      ['Pizza Margherita', 'Délices Salés', 'Pizza tomate mozzarella basilic', 7.50, 14, 4],
      ['Soupe du Jour', 'Délices Salés', 'Soupe maison quotidienne', 5.00, 8, 3]
    ];

    // Délices Sucrés (10 produits)
    console.log('🍰 Ajout des Délices Sucrés...');
    const delicesSucresData = [
      ['Croissant au Beurre', 'Délices Sucrés', 'Croissant pur beurre artisanal', 2.50, 30, 8],
      ['Pain au Chocolat', 'Délices Sucrés', 'Viennoiserie au chocolat noir', 2.80, 28, 8],
      ['Éclair au Chocolat', 'Délices Sucrés', 'Éclair fourré à la crème pâtissière', 4.50, 18, 6],
      ['Macaron Assortiment', 'Délices Sucrés', 'Boîte de 6 macarons variés', 12.00, 25, 8],
      ['Tarte Citron Meringuée', 'Délices Sucrés', 'Tarte au citron avec meringue', 5.50, 12, 4],
      ['Millefeuille', 'Délices Sucrés', 'Millefeuille crème vanille', 5.00, 15, 5],
      ['Cookie Chocolat', 'Délices Sucrés', 'Cookie moelleux aux pépites', 3.00, 40, 10],
      ['Brownie Chocolat Noix', 'Délices Sucrés', 'Brownie fondant aux noix', 4.00, 22, 6],
      ['Cheesecake Fruits Rouges', 'Délices Sucrés', 'Cheesecake coulis de fruits', 6.00, 10, 4],
      ['Muffin Myrtille', 'Délices Sucrés', 'Muffin moelleux aux myrtilles', 3.50, 35, 8]
    ];

    // Combiner toutes les données
    const allProducts = [
      ...boissonsChaudesData,
      ...boissonsFroidesData,
      ...delicesSalesData,
      ...delicesSucresData
    ];

    // Insérer tous les produits
    for (const product of allProducts) {
      const [name, category, description, price, stock, minStock] = product;
      
      await pool.query(
        `INSERT INTO products (name, category, description, price, stock, min_stock, available, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
        [name, category, description, price, stock, minStock]
      );
      
      console.log(`  ✅ ${name} ajouté`);
    }

    console.log('');
    console.log('🎉 Succès ! 40 produits d\'inventaire ajoutés :');
    console.log('  ☕ Boissons Chaudes : 10 produits');
    console.log('  🧊 Boissons Froides : 10 produits');
    console.log('  🥐 Délices Salés : 10 produits');
    console.log('  🍰 Délices Sucrés : 10 produits');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des produits:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
addInventoryProducts();

