/**
 * Script pour afficher les produits avec les IDs 1, 2 et 3
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function showProductsByIds() {
  console.log('🔍 Connexion à Supabase...\n');
  console.log('URL:', supabaseUrl);
  console.log('');

  const productIds = [1, 2, 3];

  try {
    // Récupérer les produits avec les IDs spécifiés
    console.log(`📦 Récupération des produits avec les IDs : ${productIds.join(', ')}\n`);
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .in('id', productIds)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Erreur:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Détails:', error.details);
      console.error('   Hint:', error.hint);
      return;
    }

    if (!products || products.length === 0) {
      console.log('⚠️ Aucun produit trouvé avec ces IDs');
      return;
    }

    console.log(`✅ ${products.length} produit(s) trouvé(s)\n`);
    console.log('═'.repeat(100));
    console.log('');

    // Afficher chaque produit
    products.forEach((product, index) => {
      console.log(`📦 Produit #${index + 1} (ID: ${product.id})`);
      console.log('─'.repeat(100));
      console.log(`   ID              : ${product.id}`);
      console.log(`   Nom             : ${product.name || 'N/A'}`);
      console.log(`   Slug            : ${product.slug || 'N/A'}`);
      console.log(`   Description     : ${product.description || 'N/A'}`);
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
      console.log(`   Allergènes      : ${Array.isArray(product.allergens) ? JSON.stringify(product.allergens) : (product.allergens || 'N/A')}`);
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
    console.log(`   IDs recherchés    : ${productIds.join(', ')}`);
    console.log(`   Produits trouvés  : ${products.length}`);
    
    // Vérifier quels IDs ont été trouvés
    const foundIds = products.map(p => p.id);
    const missingIds = productIds.filter(id => !foundIds.includes(id));
    if (missingIds.length > 0) {
      console.log(`   ⚠️ IDs non trouvés : ${missingIds.join(', ')}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Exécuter le script
showProductsByIds()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });


