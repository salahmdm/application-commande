/**
 * Script de synchronisation MySQL → Supabase
 * Synchronise les données de MySQL vers Supabase en temps réel ou par batch
 * 
 * Usage:
 *   node database/sync-mysql-to-supabase.cjs all [--clear]
 *   node database/sync-mysql-to-supabase.cjs table <name> [--clear]
 */

// Utiliser CommonJS pour ce script
const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Charger .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Importer config et logger
const configModule = require('./config.js');
const logger = require('./utils/logger.js');

// Configuration Supabase
const supabaseUrl = 'https://crkpunuoliiqyuxtgqlr.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration MySQL
const mysqlConfig = {
  host: configModule.database.host,
  port: configModule.database.port,
  user: configModule.database.user,
  password: configModule.database.password,
  database: configModule.database.database
};

/**
 * Convertir une ligne MySQL en format Supabase
 */
function convertMySQLRowToSupabase(row, tableName) {
  const converted = { ...row };
  
  // Convertir les dates MySQL en format ISO
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Date) {
      converted[key] = converted[key].toISOString();
    }
    // Convertir les Buffer en string si nécessaire
    if (Buffer.isBuffer(converted[key])) {
      converted[key] = converted[key].toString();
    }
  });
  
  return converted;
}

/**
 * Synchroniser une table complète
 */
async function syncTable(tableName, options = {}) {
  const { 
    batchSize = 100,
    clearBeforeSync = false,
    updateOnly = false 
  } = options;
  
  let mysqlConnection;
  
  try {
    logger.log(`\n📋 Synchronisation de la table: ${tableName}`);
    
    // Connexion MySQL
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    
    // Récupérer toutes les données de MySQL
    const [rows] = await mysqlConnection.query(`SELECT * FROM \`${tableName}\``);
    
    if (rows.length === 0) {
      logger.log(`   ⚠️ Table vide: ${tableName}`);
      return { success: true, synced: 0 };
    }
    
    logger.log(`   📊 ${rows.length} lignes à synchroniser`);
    
    // Vider la table Supabase si demandé
    if (clearBeforeSync) {
      logger.log(`   🗑️  Vidage de la table Supabase...`);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', 0); // Supprimer toutes les lignes
      
      if (deleteError) {
        logger.error(`   ❌ Erreur lors du vidage: ${deleteError.message}`);
        // Ne pas bloquer si la table est vide
        if (!deleteError.message.includes('does not exist')) {
          logger.warn(`   ⚠️  Continuation malgré l'erreur de vidage`);
        }
      } else {
        logger.log(`   ✅ Table vidée avec succès`);
      }
    }
    
    // Synchroniser par batch
    let synced = 0;
    let errors = 0;
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const convertedBatch = batch.map(row => convertMySQLRowToSupabase(row, tableName));
      
      try {
        // Utiliser upsert pour éviter les doublons
        const { data, error } = await supabase
          .from(tableName)
          .upsert(convertedBatch, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          logger.error(`   ❌ Erreur batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)}: ${error.message}`);
          if (error.details) {
            logger.error(`   Détails: ${error.details}`);
          }
          if (error.hint) {
            logger.error(`   Indice: ${error.hint}`);
          }
          errors += batch.length;
        } else {
          synced += batch.length;
          const batchNum = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(rows.length / batchSize);
          logger.log(`   ✅ Batch ${batchNum}/${totalBatches}: ${batch.length} lignes synchronisées`);
        }
      } catch (error) {
        logger.error(`   ❌ Erreur batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        logger.error(`   Stack: ${error.stack}`);
        errors += batch.length;
      }
    }
    
    logger.log(`   ✅ Synchronisation terminée: ${synced} réussies, ${errors} erreurs`);
    
    return { success: true, synced, errors };
    
  } catch (error) {
    logger.error(`❌ Erreur lors de la synchronisation de ${tableName}:`, error.message);
    return { success: false, error: error.message };
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

/**
 * Synchroniser toutes les tables
 */
async function syncAllTables(options = {}) {
  let mysqlConnection;
  
  try {
    logger.log('🔄 Début de la synchronisation complète MySQL → Supabase\n');
    logger.log(`📡 Connexion MySQL: ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);
    logger.log(`📡 Connexion Supabase: ${supabaseUrl}\n`);
    
    // Connexion MySQL
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    logger.log('✅ Connexion MySQL établie\n');
    
    // Récupérer la liste des tables
    const [tables] = await mysqlConnection.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME ASC`,
      [mysqlConfig.database]
    );
    
    logger.log(`📋 ${tables.length} tables trouvées dans MySQL\n`);
    
    const results = {};
    
    // Ordre de synchronisation (tables de référence d'abord)
    const syncOrder = [
      'categories',
      'ingredients',
      'settings',
      'users',
      'products',
      'inventory',
      'orders',
      'order_items',
      'order_payments',
      'favorites',
      'notifications',
      'loyalty_rewards',
      'loyalty_transactions',
      'promo_codes',
      'refresh_tokens',
      'shopping_list',
      'reviews',
      'news',
      'app_settings',
      'audit_logs',
      'inventory_logs'
    ];
    
    // Synchroniser dans l'ordre
    for (const tableName of syncOrder) {
      const tableExists = tables.find(t => t.TABLE_NAME === tableName);
      if (tableExists) {
        results[tableName] = await syncTable(tableName, options);
        // Petite pause entre les tables
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Synchroniser les autres tables non listées
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      if (!syncOrder.includes(tableName)) {
        results[tableName] = await syncTable(tableName, options);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    logger.log('\n✅ Synchronisation complète terminée !\n');
    logger.log('📊 Résumé:');
    
    let totalSynced = 0;
    let totalErrors = 0;
    
    for (const [tableName, result] of Object.entries(results)) {
      if (result.success) {
        logger.log(`   ✅ ${tableName}: ${result.synced} lignes synchronisées`);
        totalSynced += result.synced || 0;
        totalErrors += result.errors || 0;
      } else {
        logger.log(`   ❌ ${tableName}: Erreur - ${result.error}`);
        totalErrors++;
      }
    }
    
    logger.log(`\n📈 Total: ${totalSynced} lignes synchronisées, ${totalErrors} erreurs`);
    
    return { success: true, results, totalSynced, totalErrors };
    
  } catch (error) {
    logger.error('❌ Erreur lors de la synchronisation:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

/**
 * Synchroniser une table spécifique en temps réel (à appeler après chaque modification)
 */
async function syncTableIncremental(tableName, lastSyncTime = null) {
  let mysqlConnection;
  
  try {
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    
    let query = `SELECT * FROM \`${tableName}\``;
    const params = [];
    
    // Si lastSyncTime est fourni, ne synchroniser que les modifications récentes
    if (lastSyncTime) {
      query += ` WHERE updated_at > ? OR created_at > ?`;
      params.push(lastSyncTime, lastSyncTime);
    }
    
    const [rows] = await mysqlConnection.query(query, params);
    
    if (rows.length === 0) {
      return { success: true, synced: 0 };
    }
    
    const convertedRows = rows.map(row => convertMySQLRowToSupabase(row, tableName));
    
    const { data, error } = await supabase
      .from(tableName)
      .upsert(convertedRows, { onConflict: 'id' });
    
    if (error) {
      throw error;
    }
    
    return { success: true, synced: rows.length };
    
  } catch (error) {
    logger.error(`❌ Erreur sync incrémentale ${tableName}:`, error.message);
    return { success: false, error: error.message };
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

// Exécution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'all') {
    // Synchroniser toutes les tables
    syncAllTables({ clearBeforeSync: args.includes('--clear') })
      .then(() => process.exit(0))
      .catch(error => {
        logger.error('❌ Erreur fatale:', error);
        process.exit(1);
      });
  } else if (command === 'table' && args[1]) {
    // Synchroniser une table spécifique
    syncTable(args[1], { clearBeforeSync: args.includes('--clear') })
      .then(() => process.exit(0))
      .catch(error => {
        logger.error('❌ Erreur fatale:', error);
        process.exit(1);
      });
  } else {
    logger.log('Usage:');
    logger.log('  node sync-mysql-to-supabase.js all [--clear]     # Synchroniser toutes les tables');
    logger.log('  node sync-mysql-to-supabase.js table <name> [--clear]  # Synchroniser une table');
    process.exit(1);
  }
}

module.exports = {
  syncTable,
  syncAllTables,
  syncTableIncremental
};

