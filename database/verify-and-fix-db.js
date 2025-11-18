const mysql = require('mysql2/promise');

/**
 * Script de vérification et correction de la base de données
 * Corrige automatiquement les problèmes de structure
 */

async function verifyAndFixDatabase() {
  console.log('========================================');
  console.log('🔍 VÉRIFICATION ET CORRECTION DB');
  console.log('========================================\n');

  try {
    // 1. CONNEXION À MYSQL
    console.log('📊 1. Test de connexion MySQL...');
    require('dotenv').config();
    const configModule = require('./config');
    const connection = await mysql.createConnection({
      host: configModule.database.host,
      port: configModule.database.port,
      user: configModule.database.user,
      password: configModule.database.password,
      database: configModule.database.database
    });
    
    console.log('✅ Connexion MySQL réussie\n');

    // 2. VÉRIFIER LES TABLES EXISTANTES
    console.log('📋 2. Vérification des tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log(`✅ Tables trouvées: ${tableNames.length}`);
    tableNames.forEach(table => console.log(`   - ${table}`));
    console.log('');

    // 3. VÉRIFIER LA STRUCTURE DE CHAQUE TABLE IMPORTANTE
    console.log('🔍 3. Vérification de la structure des tables...\n');
    
    const tablesToCheck = {
      'users': ['id', 'email', 'password_hash', 'first_name', 'last_name', 'phone', 'role', 'is_active'],
      'categories': ['id', 'name', 'slug', 'icon', 'display_order', 'is_active'],
      'products': ['id', 'category_id', 'name', 'slug', 'description', 'price', 'image_url', 'stock', 'is_available', 'is_featured'],
      'orders': ['id', 'user_id', 'order_number', 'order_type', 'status', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount'],
      'order_items': ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'total_price']
    };

    const issues = [];
    const fixes = [];

    for (const [tableName, requiredColumns] of Object.entries(tablesToCheck)) {
      if (!tableNames.includes(tableName)) {
        issues.push(`❌ Table '${tableName}' manquante`);
        continue;
      }

      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      const existingColumns = columns.map(c => c.Field);

      console.log(`✅ Table '${tableName}':`);
      
      // Vérifier les colonnes manquantes
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      if (missingColumns.length > 0) {
        console.log(`   ⚠️  Colonnes manquantes: ${missingColumns.join(', ')}`);
        issues.push(`Table '${tableName}' - colonnes manquantes: ${missingColumns.join(', ')}`);
      } else {
        console.log(`   ✅ Toutes les colonnes requises présentes`);
      }

      // Afficher les colonnes existantes
      console.log(`   📋 Colonnes: ${existingColumns.slice(0, 5).join(', ')}${existingColumns.length > 5 ? '...' : ''}`);
      console.log('');
    }

    // 4. VÉRIFIER LES DONNÉES DE TEST
    console.log('📊 4. Vérification des données...\n');
    
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');

    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Categories: ${categoryCount[0].count}`);
    console.log(`   Products: ${productCount[0].count}`);
    console.log(`   Orders: ${orderCount[0].count}`);
    console.log('');

    // 5. AJOUTER DES DONNÉES DE TEST SI NÉCESSAIRE
    if (userCount[0].count === 0) {
      console.log('⚠️  Aucun utilisateur trouvé - Ajout d\'utilisateurs de test...');
      
      const bcrypt = require('bcrypt');
      const adminPassword = await bcrypt.hash('admin123', 10);
      const managerPassword = await bcrypt.hash('manager123', 10);
      const clientPassword = await bcrypt.hash('client123', 10);

      await connection.execute(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, points) VALUES
         ('admin@blossom.com', ?, 'Admin', 'Blossom', '0123456789', 'admin', TRUE, 0),
         ('manager@blossom.com', ?, 'Manager', 'Blossom', '0123456790', 'manager', TRUE, 0),
         ('client@blossom.com', ?, 'Client', 'Test', '0123456791', 'client', TRUE, 100)`,
        [adminPassword, managerPassword, clientPassword]
      );
      
      console.log('✅ Utilisateurs de test ajoutés');
      fixes.push('Utilisateurs de test créés');
    }

    if (categoryCount[0].count === 0) {
      console.log('⚠️  Aucune catégorie trouvée - Ajout de catégories...');
      
      await connection.execute(
        `INSERT INTO categories (name, slug, icon, display_order, is_active) VALUES
         ('Thés', 'thes', '🫖', 1, TRUE),
         ('Pâtisseries', 'patisseries', '🥐', 2, TRUE),
         ('Boissons Chaudes', 'boissons-chaudes', '☕', 3, TRUE),
         ('Salades', 'salades', '🥗', 4, TRUE),
         ('Snacks', 'snacks', '🍪', 5, TRUE)`
      );
      
      console.log('✅ Catégories ajoutées');
      fixes.push('Catégories créées');
    }

    if (productCount[0].count === 0) {
      console.log('⚠️  Aucun produit trouvé - Ajout de produits de test...');
      
      await connection.execute(
        `INSERT INTO products (category_id, name, slug, description, price, image_url, stock, is_available, is_featured, calories, preparation_time, allergens) VALUES
         (1, 'Thé Vert Sencha', 'the-vert-sencha', 'Thé vert japonais de qualité supérieure', 4.50, '🍵', 50, TRUE, TRUE, 0, 5, '[]'),
         (1, 'Thé Noir Earl Grey', 'the-noir-earl-grey', 'Thé noir parfumé à la bergamote', 4.00, '☕', 45, TRUE, FALSE, 0, 5, '[]'),
         (2, 'Croissant au Beurre', 'croissant-beurre', 'Croissant pur beurre artisanal', 2.80, '🥐', 25, TRUE, TRUE, 220, 15, '["gluten","lactose"]'),
         (2, 'Macaron Framboise', 'macaron-framboise', 'Macaron à la framboise', 3.20, '🍰', 40, TRUE, FALSE, 85, 10, '["oeufs","amandes"]'),
         (3, 'Cappuccino', 'cappuccino', 'Espresso avec mousse de lait', 3.80, '☕', 100, TRUE, TRUE, 120, 7, '["lactose"]'),
         (3, 'Chocolat Chaud', 'chocolat-chaud', 'Chocolat chaud maison', 4.20, '🍫', 80, TRUE, FALSE, 250, 8, '["lactose"]'),
         (4, 'Salade César', 'salade-cesar', 'Salade romaine, poulet, parmesan', 8.90, '🥗', 20, TRUE, FALSE, 350, 12, '["gluten","lactose"]'),
         (5, 'Cookie Chocolat', 'cookie-chocolat', 'Cookie aux pépites de chocolat', 2.50, '🍪', 50, TRUE, FALSE, 180, 5, '["gluten","oeufs"]')`
      );
      
      console.log('✅ Produits de test ajoutés');
      fixes.push('Produits de test créés');
    }

    // 6. RÉSUMÉ
    console.log('');
    console.log('========================================');
    console.log('📊 RÉSUMÉ');
    console.log('========================================\n');

    if (issues.length === 0 && fixes.length === 0) {
      console.log('✅ Base de données complète et fonctionnelle !');
    } else {
      if (issues.length > 0) {
        console.log('⚠️  Problèmes détectés:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        console.log('');
      }
      
      if (fixes.length > 0) {
        console.log('✅ Corrections appliquées:');
        fixes.forEach(fix => console.log(`   - ${fix}`));
        console.log('');
      }
    }

    console.log('✅ Vérification terminée !');
    console.log('');

    await connection.end();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('');
    console.error('Solutions possibles:');
    console.error('1. Vérifiez que MySQL est démarré');
    console.error('2. Vérifiez votre fichier .env (DB_PASSWORD)');
    console.error('   Copiez database/.env.example en database/.env et configurez vos valeurs');
    console.error('3. Vérifiez que la base blossom_cafe existe');
    process.exit(1);
  }
}

// Exécuter
verifyAndFixDatabase();

