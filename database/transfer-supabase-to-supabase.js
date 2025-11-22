/**
 * Script de transfert de données entre deux comptes Supabase
 * Transfère toutes les données de l'ancien compte vers le nouveau compte
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// ANCIEN COMPTE SUPABASE (source) - Compte actuel avec les données
// ============================================================================
const OLD_SUPABASE_URL = 'https://brygzpxiemwthickhuqb.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

// ============================================================================
// NOUVEAU COMPTE SUPABASE (destination)
// ============================================================================
const NEW_SUPABASE_URL = 'https://uvwvfotlvhsplahmnzll.supabase.co';
const NEW_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d3Zmb3RsdmhzcGxhaG1uemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjkzNzEsImV4cCI6MjA3OTQwNTM3MX0.djKzu2ZNwJeSrv8DOGkl7_8WnkMnWFpbFYmPBZtLFgg';

// Créer les clients Supabase
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

console.log('✅ Clients Supabase créés');
console.log(`   Ancien compte: ${OLD_SUPABASE_URL}`);
console.log(`   Nouveau compte: ${NEW_SUPABASE_URL}`);

// Liste des tables à transférer (dans l'ordre des dépendances)
const TABLES_TO_TRANSFER = [
  // Tables sans dépendances
  'categories',
  'settings',
  'app_settings',
  'inventory',
  'promo_codes',
  'news',
  
  // Table users (nécessaire pour les autres)
  'users',
  
  // Tables dépendant de categories
  'ingredients',
  'products',
  
  // Tables dépendant de users et products
  'favorites',
  'refresh_tokens',
  'shopping_list',
  'loyalty_rewards',
  'inventory_logs',
  'audit_logs',
  
  // Tables dépendant de users et promo_codes
  'orders',
  
  // Tables dépendant de orders
  'order_items',
  'order_payments',
  'notifications',
  'loyalty_transactions',
  'reviews',
];

/**
 * Transférer les données d'une table
 */
async function transferTable(tableName) {
  console.log(`\n📦 Transfert de la table "${tableName}"...`);
  
  try {
    // 1. Récupérer toutes les données de l'ancien compte
    const { data: oldData, error: fetchError } = await oldSupabase
      .from(tableName)
      .select('*');
    
    if (fetchError) {
      console.error(`❌ Erreur lors de la récupération de "${tableName}":`, fetchError);
      return { success: false, error: fetchError };
    }
    
    if (!oldData || oldData.length === 0) {
      console.log(`   ℹ️ Aucune donnée à transférer pour "${tableName}"`);
      return { success: true, count: 0 };
    }
    
    console.log(`   📊 ${oldData.length} enregistrements trouvés`);
    
    // 2. Vérifier si des données existent déjà dans le nouveau compte
    const { data: existingData } = await newSupabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (existingData && existingData.length > 0) {
      console.log(`   ⚠️ Des données existent déjà dans "${tableName}". Voulez-vous les remplacer ?`);
      console.log(`   💡 Pour remplacer, supprimez d'abord les données existantes dans Supabase Dashboard`);
      return { success: false, error: 'Données existantes' };
    }
    
    // 3. Insérer les données dans le nouveau compte
    // Pour les grandes tables, insérer par lots de 100
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < oldData.length; i += batchSize) {
      const batch = oldData.slice(i, i + batchSize);
      
      const { data: insertedData, error: insertError } = await newSupabase
        .from(tableName)
        .insert(batch)
        .select();
      
      if (insertError) {
        console.error(`   ❌ Erreur lors de l'insertion du lot ${Math.floor(i / batchSize) + 1}:`, insertError);
        return { success: false, error: insertError };
      }
      
      insertedCount += insertedData ? insertedData.length : 0;
      console.log(`   ✅ Lot ${Math.floor(i / batchSize) + 1}: ${insertedData ? insertedData.length : 0} enregistrements insérés`);
    }
    
    console.log(`   ✅ Transfert terminé: ${insertedCount}/${oldData.length} enregistrements transférés`);
    return { success: true, count: insertedCount };
    
  } catch (error) {
    console.error(`❌ Erreur lors du transfert de "${tableName}":`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Début du transfert de données entre comptes Supabase');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📤 Source: ${OLD_SUPABASE_URL}`);
  console.log(`📥 Destination: ${NEW_SUPABASE_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const results = {
    success: [],
    failed: [],
    skipped: [],
  };
  
  // Transférer chaque table dans l'ordre
  for (const tableName of TABLES_TO_TRANSFER) {
    const result = await transferTable(tableName);
    
    if (result.success) {
      results.success.push({ table: tableName, count: result.count });
    } else if (result.error === 'Données existantes') {
      results.skipped.push({ table: tableName, reason: 'Données existantes' });
    } else {
      results.failed.push({ table: tableName, error: result.error });
    }
    
    // Petite pause entre les tables pour éviter les limites de taux
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Résumé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RÉSUMÉ DU TRANSFERT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Tables transférées avec succès: ${results.success.length}`);
  results.success.forEach(({ table, count }) => {
    console.log(`   - ${table}: ${count} enregistrements`);
  });
  
  if (results.skipped.length > 0) {
    console.log(`\n⚠️ Tables ignorées (données existantes): ${results.skipped.length}`);
    results.skipped.forEach(({ table }) => {
      console.log(`   - ${table}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Tables en erreur: ${results.failed.length}`);
    results.failed.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error.message || error}`);
    });
  }
  
  console.log('\n✅ Transfert terminé !');
}

// Exécuter le script
main().catch(console.error);

