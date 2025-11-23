# 🔍 Tester Supabase depuis la console du navigateur

## Méthode 1 : Utiliser la fonction exposée (après redéploiement)

Une fois que vous avez redéployé sur Vercel avec les modifications, tapez simplement dans la console :

```javascript
testSupabaseConnection()
```

## Méthode 2 : Script à copier-coller directement (fonctionne immédiatement)

Si la fonction n'est pas disponible, copiez-collez ce script complet dans la console du navigateur :

```javascript
(async function testSupabaseConnection() {
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

  const supabaseUrl = viteUrl || nextUrl || 'https://brygzpxiemwthickhuqb.supabase.co';
  const supabaseKey = viteKey || nextKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

  if (!viteUrl && !nextUrl) {
    console.warn('⚠️ Aucune variable d\'environnement trouvée, utilisation des valeurs par défaut');
  }

  // 2. Tester la connexion Supabase
  console.log('\n2️⃣ Test de connexion Supabase...');
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
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
    } else {
      console.log(`   ✅ Catégories récupérées : ${categories?.length || 0} trouvées`);
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
    } else {
      console.log(`   ✅ Produits récupérés : ${products?.length || 0} trouvés`);
    }

    // Résumé
    console.log('\n📊 Résumé :');
    if (categoriesError || productsError) {
      console.error('❌ Connexion Supabase : ÉCHEC');
      if (categoriesError?.code === 'PGRST301' || productsError?.code === 'PGRST301') {
        console.error('   → Problème : Policies RLS bloquent l\'accès');
        console.error('   → Solution : Exécutez SUPABASE_RLS_POLICIES_SIMPLE.sql dans Supabase');
      }
    } else {
      console.log('✅ Connexion Supabase : SUCCÈS');
      console.log(`   Catégories : ${categories?.length || 0}`);
      console.log(`   Produits : ${products?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  }
})();
```

## 📝 Instructions

1. **Ouvrez** votre application sur Vercel (ou en local)
2. **Ouvrez la console** du navigateur (F12)
3. **Copiez-collez** le script de la Méthode 2 ci-dessus
4. **Appuyez sur Entrée**
5. **Observez** les résultats dans la console

## 🔍 Ce que vous devriez voir

### ✅ Si tout fonctionne :
```
✅ Connexion Supabase : SUCCÈS
   Catégories : X
   Produits : Y
```

### ❌ Si les variables ne sont pas détectées :
```
⚠️ Aucune variable d'environnement trouvée, utilisation des valeurs par défaut
✅ Connexion Supabase : SUCCÈS (grâce aux valeurs par défaut)
```

### ❌ Si les policies RLS bloquent :
```
❌ Erreur produits: {code: 'PGRST301', ...}
→ Solution : Exécutez SUPABASE_RLS_POLICIES_SIMPLE.sql dans Supabase
```

