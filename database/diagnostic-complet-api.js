const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * DIAGNOSTIC COMPLET DE L'APPLICATION
 * Vérifie tous les fichiers liés à l'API et à la base de données
 */

console.log('========================================');
console.log('🔍 DIAGNOSTIC COMPLET - Blossom Café');
console.log('========================================\n');

async function diagnosticComplet() {
  const erreurs = [];
  const avertissements = [];
  const succes = [];

  // ================================================================
  // 1. VÉRIFICATION MYSQL
  // ================================================================
  console.log('📊 1. VÉRIFICATION MYSQL\n');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Muheko,1991@',
      database: 'blossom_cafe'
    });
    
    succes.push('✅ Connexion MySQL réussie');
    
    // Vérifier les tables
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const tablesRequises = [
      'users', 'categories', 'products', 'orders', 
      'order_items', 'promo_codes', 'settings'
    ];
    
    tablesRequises.forEach(table => {
      if (tableNames.includes(table)) {
        succes.push(`✅ Table '${table}' existe`);
      } else {
        erreurs.push(`❌ Table '${table}' manquante`);
      }
    });
    
    // Vérifier la structure de la table products
    const [productsColumns] = await connection.execute("DESCRIBE products");
    const colonnesProducts = productsColumns.map(c => c.Field);
    
    const colonnesRequises = [
      'id', 'category_id', 'name', 'price', 'stock',
      'image_url', 'is_available', 'is_featured'
    ];
    
    colonnesRequises.forEach(col => {
      if (colonnesProducts.includes(col)) {
        succes.push(`✅ Colonne 'products.${col}' existe`);
      } else {
        erreurs.push(`❌ Colonne 'products.${col}' manquante`);
      }
    });
    
    // Compter les produits
    const [countResult] = await connection.execute("SELECT COUNT(*) as count FROM products");
    const nbProduits = countResult[0].count;
    succes.push(`✅ ${nbProduits} produits dans la base`);
    
    await connection.end();
    
  } catch (error) {
    erreurs.push(`❌ Erreur MySQL: ${error.message}`);
  }
  
  console.log('');
  
  // ================================================================
  // 2. VÉRIFICATION FICHIERS BACKEND
  // ================================================================
  console.log('📁 2. VÉRIFICATION FICHIERS BACKEND\n');
  
  const fichiersBackend = [
    'admin-api.js',
    'package.json'
  ];
  
  fichiersBackend.forEach(fichier => {
    const chemin = path.join(__dirname, fichier);
    if (fs.existsSync(chemin)) {
      succes.push(`✅ ${fichier} existe`);
      
      // Vérifier le contenu
      const contenu = fs.readFileSync(chemin, 'utf8');
      
      if (fichier === 'admin-api.js') {
        // Vérifier les éléments essentiels
        if (contenu.includes('app.put(\'/api/admin/products/:id\'')) {
          succes.push('✅ Route PUT /api/admin/products/:id présente');
        } else {
          erreurs.push('❌ Route PUT /api/admin/products/:id manquante');
        }
        
        if (contenu.includes('isAvailableValue') && contenu.includes('? 1 : 0')) {
          succes.push('✅ Conversion booléens correcte');
        } else {
          avertissements.push('⚠️  Conversion booléens pourrait manquer');
        }
        
        if (contenu.includes('app.post(\'/api/auth/login\'')) {
          succes.push('✅ Route POST /api/auth/login présente');
        } else {
          erreurs.push('❌ Route POST /api/auth/login manquante');
        }
      }
    } else {
      erreurs.push(`❌ ${fichier} manquant`);
    }
  });
  
  console.log('');
  
  // ================================================================
  // 3. VÉRIFICATION FICHIERS FRONTEND
  // ================================================================
  console.log('📁 3. VÉRIFICATION FICHIERS FRONTEND\n');
  
  const fichiersFrontend = [
    '../src/services/api.js',
    '../src/services/productService.js',
    '../src/services/authService.js',
    '../src/services/orderService.js',
    '../src/store/productStore.js',
    '../src/store/authStore.js',
    '../src/hooks/useAuth.js',
    '../src/hooks/useProducts.js',
    '../src/views/admin/AdminProducts.jsx'
  ];
  
  fichiersFrontend.forEach(fichier => {
    const chemin = path.join(__dirname, fichier);
    if (fs.existsSync(chemin)) {
      succes.push(`✅ ${path.basename(fichier)} existe`);
      
      const contenu = fs.readFileSync(chemin, 'utf8');
      
      // Vérifications spécifiques
      if (fichier.includes('api.js')) {
        if (contenu.includes('http://localhost:5000/api')) {
          succes.push('✅ API_BASE_URL correct (port 5000)');
        } else {
          erreurs.push('❌ API_BASE_URL incorrect');
        }
      }
      
      if (fichier.includes('productService.js')) {
        if (contenu.includes('updateProduct')) {
          succes.push('✅ Fonction updateProduct présente');
        } else {
          erreurs.push('❌ Fonction updateProduct manquante');
        }
      }
      
      if (fichier.includes('AdminProducts.jsx')) {
        if (contenu.includes('categoryId') && contenu.includes('imageUrl')) {
          succes.push('✅ Mapping champs correct (categoryId, imageUrl)');
        } else {
          avertissements.push('⚠️  Mapping champs pourrait être incorrect');
        }
      }
    } else {
      erreurs.push(`❌ ${path.basename(fichier)} manquant`);
    }
  });
  
  console.log('');
  
  // ================================================================
  // 4. VÉRIFICATION DÉPENDANCES
  // ================================================================
  console.log('📦 4. VÉRIFICATION DÉPENDANCES\n');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const deps = packageJson.dependencies || {};
    
    const depsRequises = ['express', 'mysql2', 'jsonwebtoken', 'bcrypt', 'cors'];
    
    depsRequises.forEach(dep => {
      if (deps[dep]) {
        succes.push(`✅ ${dep} installé (${deps[dep]})`);
      } else {
        erreurs.push(`❌ ${dep} manquant dans package.json`);
      }
    });
  } catch (error) {
    erreurs.push(`❌ Erreur lecture package.json: ${error.message}`);
  }
  
  console.log('');
  
  // ================================================================
  // 5. RÉSUMÉ
  // ================================================================
  console.log('========================================');
  console.log('📊 RÉSUMÉ DU DIAGNOSTIC');
  console.log('========================================\n');
  
  console.log(`✅ Succès: ${succes.length}`);
  console.log(`⚠️  Avertissements: ${avertissements.length}`);
  console.log(`❌ Erreurs: ${erreurs.length}\n`);
  
  if (erreurs.length > 0) {
    console.log('❌ ERREURS TROUVÉES:');
    console.log('----------------------------------------');
    erreurs.forEach(err => console.log(err));
    console.log('');
  }
  
  if (avertissements.length > 0) {
    console.log('⚠️  AVERTISSEMENTS:');
    console.log('----------------------------------------');
    avertissements.forEach(warn => console.log(warn));
    console.log('');
  }
  
  if (erreurs.length === 0) {
    console.log('🎉 AUCUNE ERREUR CRITIQUE !');
    console.log('');
    console.log('✅ L\'application est prête à être lancée !');
    console.log('');
    console.log('Pour démarrer:');
    console.log('  1. Terminal 1: cd database && node admin-api.js');
    console.log('  2. Terminal 2: npm run dev');
    console.log('  3. Navigateur: http://localhost:3000');
  } else {
    console.log('⚠️  CORRECTIONS NÉCESSAIRES AVANT DE LANCER L\'APPLICATION');
  }
  
  console.log('');
  console.log('========================================');
}

// Exécuter le diagnostic
diagnosticComplet().catch(err => {
  console.error('❌ Erreur fatale:', err);
});

