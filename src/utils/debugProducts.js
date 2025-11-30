/**
 * Utilitaire de débogage pour forcer le chargement des produits
 * À utiliser dans la console du navigateur pour diagnostiquer les problèmes
 */

import supabaseService from '../services/supabaseService';
import useProductStore from '../store/productStore';
import logger from './logger';

/**
 * Forcer le chargement des produits depuis Supabase
 */
export async function debugLoadProducts() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 DEBUG - FORCE LOAD PRODUCTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // 1. Vérifier l'état actuel du store
    const currentState = useProductStore.getState();
    console.log('1️⃣ État actuel du store:');
    console.log('   - products.length:', currentState.products?.length || 0);
    console.log('   - categories.length:', currentState.categories?.length || 0);
    console.log('   - isLoading:', currentState.isLoading);
    console.log('   - error:', currentState.error);
    console.log('');
    
    // 2. Charger depuis Supabase directement
    console.log('2️⃣ Chargement depuis Supabase...');
    const productsResult = await supabaseService.getProducts({ isActive: 1 });
    console.log('   - productsResult.success:', productsResult.success);
    console.log('   - productsResult.data.length:', productsResult.data?.length || 0);
    
    if (productsResult.success && productsResult.data && productsResult.data.length > 0) {
      console.log('   ✅ Produits récupérés:', productsResult.data.length);
      console.log('   📦 Exemple:', productsResult.data.slice(0, 3).map(p => p.name));
    } else {
      console.log('   ❌ Erreur:', productsResult.error);
      return { success: false, error: productsResult.error };
    }
    
    // 3. Charger les catégories
    console.log('\n3️⃣ Chargement des catégories...');
    const categoriesResult = await supabaseService.getCategories({ isActive: 1 });
    console.log('   - categoriesResult.success:', categoriesResult.success);
    console.log('   - categoriesResult.data.length:', categoriesResult.data?.length || 0);
    
    if (categoriesResult.success && categoriesResult.data && categoriesResult.data.length > 0) {
      console.log('   ✅ Catégories récupérées:', categoriesResult.data.length);
      console.log('   📦 Exemple:', categoriesResult.data.map(c => c.name));
    }
    
    // 4. Mettre à jour le store
    console.log('\n4️⃣ Mise à jour du store...');
    useProductStore.getState().set({
      products: productsResult.data,
      categories: categoriesResult.data || [],
      isLoading: false,
      error: null,
      usingFallback: true
    });
    
    // 5. Vérifier l'état final
    const finalState = useProductStore.getState();
    console.log('\n5️⃣ État final du store:');
    console.log('   - products.length:', finalState.products?.length || 0);
    console.log('   - categories.length:', finalState.categories?.length || 0);
    console.log('   - isLoading:', finalState.isLoading);
    console.log('');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEBUG TERMINÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Rechargez la page pour voir les produits');
    console.log('💡 Ou utilisez: window.debugLoadProducts() à nouveau\n');
    
    return {
      success: true,
      products: productsResult.data,
      categories: categoriesResult.data || []
    };
  } catch (error) {
    console.error('❌ ERREUR:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Afficher l'état actuel du store
 */
export function debugShowStore() {
  const state = useProductStore.getState();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 ÉTAT ACTUEL DU STORE PRODUITS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Produits:', state.products?.length || 0);
  console.log('Catégories:', state.categories?.length || 0);
  console.log('Chargement:', state.isLoading);
  console.log('Erreur:', state.error);
  console.log('Fallback:', state.usingFallback);
  
  if (state.products && state.products.length > 0) {
    console.log('\n📦 Premiers produits:');
    state.products.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id}, Prix: ${p.price}€)`);
    });
  }
  
  if (state.categories && state.categories.length > 0) {
    console.log('\n📁 Catégories:');
    state.categories.forEach(c => {
      console.log(`   - ${c.name} (ID: ${c.id})`);
    });
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Exposer dans window pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.debugLoadProducts = debugLoadProducts;
  window.debugShowStore = debugShowStore;
  console.log('💡 Utilitaires de debug disponibles:');
  console.log('   - debugLoadProducts() : Forcer le chargement des produits depuis Supabase');
  console.log('   - debugShowStore() : Afficher l\'état actuel du store');
}

