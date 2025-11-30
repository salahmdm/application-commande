/**
 * Script pour simuler exactement le processus de login du backend
 * Teste toutes les étapes: recherche utilisateur, normalisation email, vérification mot de passe
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration Supabase (identique au backend)
const supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    'https://brygzpxiemwthickhuqb.supabase.co';

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.SUPABASE_KEY ||
                           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Simuler pool.query pour Supabase
const pool = {
  query: async (sql, params) => {
    // Parser SQL simple: SELECT * FROM users WHERE email = ? AND is_active = TRUE
    if (sql.includes('SELECT') && sql.includes('FROM users') && sql.includes('WHERE email = ?')) {
      const normalizedEmail = params[0];
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return [[data || null]];
    }
    return [[]];
  },
  getClient: () => supabase
};

const email = 'admin@blossom.com';
const password = 'admin123';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔐 SIMULATION DU PROCESSUS DE LOGIN BACKEND');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function simulateLogin() {
  try {
    console.log('1️⃣ Normalisation de l\'email...');
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    console.log(`   Email original: "${email}"`);
    console.log(`   Email normalisé: "${normalizedEmail}"`);
    
    if (!normalizedEmail || !password) {
      console.error('   ❌ Email ou mot de passe manquant');
      return;
    }
    console.log('   ✅ Normalisation OK\n');

    console.log('2️⃣ Recherche de l\'utilisateur dans la base...');
    console.log(`   Requête: SELECT * FROM users WHERE email = '${normalizedEmail}' AND is_active = TRUE`);
    
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [normalizedEmail]
    );
    
    let user = users[0];
    console.log(`   Résultat: ${user ? 'Utilisateur trouvé ✅' : 'Utilisateur non trouvé ❌'}`);
    
    // Fallback Supabase (comme dans le backend)
    if (!user && typeof pool.getClient === 'function') {
      console.log('\n   🔄 Tentative fallback Supabase (recherche insensible à la casse)...');
      const supabaseClient = pool.getClient();
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .ilike('email', normalizedEmail)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error(`   ❌ Erreur Supabase: ${error.message}`);
        throw error;
      }
      
      if (data) {
        user = data;
        users[0] = data;
        console.log('   ✅ Utilisateur trouvé via fallback Supabase');
      } else {
        console.log('   ❌ Utilisateur non trouvé même avec fallback');
      }
    }
    
    if (!user) {
      console.error('\n❌ ÉCHEC: Utilisateur non trouvé');
      console.error('   Message backend: "Email ou mot de passe incorrect"');
      return;
    }
    
    console.log(`\n   ✅ Utilisateur trouvé:`);
    console.log(`      - ID: ${user.id}`);
    console.log(`      - Email: ${user.email}`);
    console.log(`      - Rôle: ${user.role}`);
    console.log(`      - Actif: ${user.is_active ? 'Oui' : 'Non'}`);
    console.log(`      - Hash présent: ${user.password_hash ? 'Oui' : 'Non'}\n`);

    console.log('3️⃣ Vérification du mot de passe avec bcrypt...');
    console.log(`   Mot de passe testé: "${password}"`);
    console.log(`   Hash (début): ${user.password_hash ? user.password_hash.substring(0, 30) + '...' : 'AUCUN'}`);
    
    if (!user.password_hash) {
      console.error('   ❌ PROBLÈME: Aucun password_hash dans la base !');
      return;
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      console.error('   ❌ ÉCHEC: Le mot de passe ne correspond pas');
      console.error('   Message backend: "Email ou mot de passe incorrect"');
      
      // Tester avec quelques variations
      console.log('\n   🔍 Test avec variations du mot de passe:');
      const variations = [
        password.trim(),
        password.toLowerCase(),
        password.toUpperCase(),
        password + ' ',
        ' ' + password,
      ];
      
      for (const variant of variations) {
        if (variant !== password) {
          const variantValid = await bcrypt.compare(variant, user.password_hash);
          if (variantValid) {
            console.log(`   ✅ Variante trouvée: "${variant}"`);
          }
        }
      }
      return;
    }
    
    console.log('   ✅ MOT DE PASSE VALIDE !');
    console.log('\n✅ LOGIN RÉUSSI - Le processus devrait fonctionner\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTIC');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Toutes les étapes sont OK côté base de données');
    console.log('⚠️  Si le login échoue encore, vérifiez:');
    console.log('   1. Le backend est-il démarré ? (npm run backend)');
    console.log('   2. Les logs du backend lors de la tentative de connexion');
    console.log('   3. Les cookies sont-ils bien envoyés ?');
    console.log('   4. Y a-t-il des erreurs CORS ou de réseau ?\n');
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('Stack:', error.stack);
  }
}

simulateLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

