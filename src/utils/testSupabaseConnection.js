/**
 * Script de test de connexion Supabase
 * À exécuter dans la console du navigateur pour diagnostiquer les problèmes
 */

export const testSupabaseConnection = async () => {
  console.log('🔍 Test de connexion Supabase...\n');

  // 1. Vérifier les variables d'environnement
  console.log('1️⃣ Vérification des variables d\'environnement :');
  const viteUrl = import.meta.env.VITE_SUPABASE_URL;
  const nextUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const nextKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('   VITE_SUPABASE_URL:', viteUrl || '❌ non défini');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', nextUrl || '❌ non défini');
  console.log('   VITE_SUPABASE_ANON_KEY:', viteKey ? '✅ défini' : '❌ non défini');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', nextKey ? '✅ défini' : '❌ non défini');

  const supabaseUrl = viteUrl || nextUrl || 'https://crkpunuoliiqyuxtgqlr.supabase.co';
  const supabaseKey = viteKey || nextKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0';

  if (!viteUrl && !nextUrl) {
    console.warn('⚠️ Aucune variable d\'environnement trouvée, utilisation des valeurs par défaut');
  }

  // 2. Tester la connexion Supabase
  console.log('\n2️⃣ Test de connexion Supabase...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1 : Récupérer les catégories
    console.log('   Test 1 : Récupération des catégories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      console.error('   ❌ Erreur catégories:', categoriesError);
      console.error('   Code:', categoriesError.code);
      console.error('   Message:', categoriesError.message);
      console.error('   Détails:', categoriesError.details);
      console.error('   Hint:', categoriesError.hint);
    } else {
      console.log(`   ✅ Catégories récupérées : ${categories?.length || 0} trouvées`);
      if (categories && categories.length > 0) {
        console.log('   Exemple:', categories[0]);
      }
    }

    // Test 2 : Récupérer les produits
    console.log('\n   Test 2 : Récupération des produits...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('   ❌ Erreur produits:', productsError);
      console.error('   Code:', productsError.code);
      console.error('   Message:', productsError.message);
      console.error('   Détails:', productsError.details);
      console.error('   Hint:', productsError.hint);
    } else {
      console.log(`   ✅ Produits récupérés : ${products?.length || 0} trouvés`);
      if (products && products.length > 0) {
        console.log('   Exemple:', products[0]);
      }
    }

    // Résumé
    console.log('\n📊 Résumé :');
    if (categoriesError || productsError) {
      console.error('❌ Connexion Supabase : ÉCHEC');
      if (categoriesError?.code === 'PGRST301' || productsError?.code === 'PGRST301') {
        console.error('   → Problème : Policies RLS bloquent l\'accès');
        console.error('   → Solution : Exécutez SUPABASE_RLS_POLICIES_SIMPLE.sql dans Supabase');
      } else if (categoriesError?.code === '42P01' || productsError?.code === '42P01') {
        console.error('   → Problème : Tables n\'existent pas');
        console.error('   → Solution : Exécutez schema_supabase_blossom_cafe_ORDRE_CORRECT.sql dans Supabase');
      } else {
        console.error('   → Problème : Erreur inconnue, vérifiez les logs ci-dessus');
      }
    } else {
      console.log('✅ Connexion Supabase : SUCCÈS');
      console.log(`   Catégories : ${categories?.length || 0}`);
      console.log(`   Produits : ${products?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }
};

// Exporter aussi pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.testSupabaseConnection = testSupabaseConnection;
  console.log('💡 Pour tester la connexion Supabase, tapez : testSupabaseConnection()');
}

