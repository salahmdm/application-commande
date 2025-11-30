/**
 * Script pour vérifier les produits et catégories dans Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function checkData() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VÉRIFICATION DES DONNÉES DANS SUPABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Vérifier les catégories
    console.log('1️⃣ CATÉGORIES:');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('   ❌ Erreur:', categoriesError);
      console.error('   Code:', categoriesError.code);
      console.error('   Message:', categoriesError.message);
    } else {
      console.log(`   Total: ${categories?.length || 0} catégories\n`);
      
      if (categories && categories.length > 0) {
        const activeCategories = categories.filter(c => c.is_active === 1);
        console.log(`   ✅ Actives: ${activeCategories.length}`);
        console.log(`   ❌ Inactives: ${categories.length - activeCategories.length}\n`);
        
        activeCategories.forEach(cat => {
          console.log(`   - ${cat.icon || '📁'} ${cat.name} (${cat.slug}) - Ordre: ${cat.display_order}`);
        });
      } else {
        console.log('   ⚠️  Aucune catégorie trouvée dans la base de données');
      }
    }

    console.log('\n2️⃣ PRODUITS:');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .order('name', { ascending: true })
      .limit(50);

    if (productsError) {
      console.error('   ❌ Erreur:', productsError);
      console.error('   Code:', productsError.code);
      console.error('   Message:', productsError.message);
    } else {
      console.log(`   Total affiché: ${products?.length || 0} produits (limite 50)\n`);
      
      if (products && products.length > 0) {
        const availableProducts = products.filter(p => p.is_available === 1);
        console.log(`   ✅ Disponibles: ${availableProducts.length}`);
        console.log(`   ❌ Indisponibles: ${products.length - availableProducts.length}\n`);
        
        availableProducts.slice(0, 10).forEach(product => {
          const category = Array.isArray(product.categories) 
            ? product.categories[0] 
            : product.categories;
          console.log(`   - ${product.name} - ${product.price}€ - Cat: ${category?.name || 'Sans catégorie'}`);
        });
        
        if (availableProducts.length > 10) {
          console.log(`   ... et ${availableProducts.length - 10} autres produits`);
        }
      } else {
        console.log('   ⚠️  Aucun produit trouvé dans la base de données');
      }
    }

    // 3. Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!categoriesError && categories && categories.length > 0) {
      const activeCategories = categories.filter(c => c.is_active === 1);
      console.log(`✅ Catégories actives: ${activeCategories.length}`);
    } else {
      console.log('❌ Aucune catégorie active trouvée');
    }
    
    if (!productsError && products && products.length > 0) {
      const availableProducts = products.filter(p => p.is_available === 1);
      console.log(`✅ Produits disponibles: ${availableProducts.length}`);
    } else {
      console.log('❌ Aucun produit disponible trouvé');
    }
    
    console.log('\n💡 Si aucun produit/catégorie n\'est affiché, il faut en créer dans Supabase');
    console.log('   ou vérifier que les colonnes is_active/is_available sont bien à 1\n');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkData()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

