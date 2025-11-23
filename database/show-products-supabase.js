/**
 * Script pour afficher les produits de la table products dans Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function showProducts() {
  console.log('🔍 Connexion à Supabase...\n');
  console.log('URL:', supabaseUrl);
  console.log('');

  try {
    // Récupérer tous les produits
    console.log('📦 Récupération des produits...\n');
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Détails:', error.details);
      console.error('   Hint:', error.hint);
      return;
    }

    if (!products || products.length === 0) {
      console.log('⚠️ Aucun produit trouvé dans la table products');
      return;
    }

    console.log(`✅ ${products.length} produit(s) trouvé(s)\n`);
    console.log('═'.repeat(100));
    console.log('');

    // Afficher chaque produit
    products.forEach((product, index) => {
      console.log(`📦 Produit #${index + 1}`);
      console.log('─'.repeat(100));
      console.log(`   ID              : ${product.id}`);
      console.log(`   Nom             : ${product.name || 'N/A'}`);
      console.log(`   Slug            : ${product.slug || 'N/A'}`);
      console.log(`   Description     : ${product.description ? product.description.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`   Prix            : ${product.price || 0} €`);
      console.log(`   Stock           : ${product.stock || 0}`);
      console.log(`   Disponible      : ${product.is_available === 1 || product.is_available === true ? '✅ Oui' : '❌ Non'}`);
      console.log(`   En vedette      : ${product.is_featured === 1 || product.is_featured === true ? '⭐ Oui' : 'Non'}`);
      console.log(`   Catégorie ID    : ${product.category_id || 'N/A'}`);
      if (product.categories) {
        console.log(`   Catégorie       : ${product.categories.name || 'N/A'}`);
      }
      console.log(`   Image URL       : ${product.image_url || 'N/A'}`);
      console.log(`   Calories        : ${product.calories || 'N/A'}`);
      console.log(`   Temps préparation: ${product.preparation_time || 'N/A'} min`);
      console.log(`   Allergènes      : ${product.allergens || 'N/A'}`);
      console.log(`   Stock minimum   : ${product.min_stock || 0}`);
      console.log(`   Créé le         : ${product.created_at || 'N/A'}`);
      console.log(`   Modifié le      : ${product.updated_at || 'N/A'}`);
      if (product.deleted_at) {
        console.log(`   ⚠️ Supprimé le   : ${product.deleted_at}`);
      }
      console.log('');
    });

    // Résumé
    console.log('═'.repeat(100));
    console.log('\n📊 Résumé :');
    console.log(`   Total produits     : ${products.length}`);
    console.log(`   Produits disponibles: ${products.filter(p => p.is_available === 1 || p.is_available === true).length}`);
    console.log(`   Produits en vedette: ${products.filter(p => p.is_featured === 1 || p.is_featured === true).length}`);
    console.log(`   Produits supprimés : ${products.filter(p => p.deleted_at).length}`);
    console.log('');

    // Afficher les colonnes disponibles
    if (products.length > 0) {
      console.log('📋 Colonnes disponibles dans la table products :');
      const columns = Object.keys(products[0]);
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Exécuter le script
showProducts()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });


