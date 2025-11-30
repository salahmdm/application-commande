/**
 * Script de diagnostic complet pour le compte admin@blossom.com
 * Vérifie:
 * 1. L'existence dans Supabase Auth (auth.users)
 * 2. L'existence dans la table users
 * 3. Le rôle assigné
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
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

const email = 'admin@blossom.com';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 DIAGNOSTIC COMPLET: admin@blossom.com');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function checkAdminAccount() {
  try {
    // 1. Vérifier dans la table users (base de données)
    console.log('1️⃣ Vérification dans la table users (base de données)...');
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (dbError) {
      console.error('   ❌ Erreur:', dbError.message);
      console.error('   Code:', dbError.code);
    } else if (!dbUser) {
      console.log('   ❌ Utilisateur NON TROUVÉ dans la table users');
      console.log('   💡 L\'utilisateur doit être créé dans la table users');
    } else {
      console.log('   ✅ Utilisateur TROUVÉ dans la table users');
      console.log(`   ┌─────────────────────────────────────────┐`);
      console.log(`   │ ID:              ${String(dbUser.id).padEnd(25)}│`);
      console.log(`   │ Email:           ${String(dbUser.email || 'N/A').padEnd(25)}│`);
      console.log(`   │ Nom:             ${String((dbUser.first_name || '') + ' ' + (dbUser.last_name || '')).trim().padEnd(25) || 'N/A'.padEnd(25)}│`);
      console.log(`   │ Rôle:            ${String(dbUser.role || 'client').padEnd(25)}│`);
      console.log(`   │ Actif:           ${String(dbUser.is_active ? 'Oui ✅' : 'Non ❌').padEnd(25)}│`);
      console.log(`   │ Email vérifié:   ${String(dbUser.email_verified ? 'Oui' : 'Non').padEnd(25)}│`);
      console.log(`   │ Points fidélité: ${String(dbUser.loyalty_points || 0).padEnd(25)}│`);
      console.log(`   │ Créé le:         ${String(dbUser.created_at ? new Date(dbUser.created_at).toLocaleString('fr-FR') : 'N/A').padEnd(25)}│`);
      console.log(`   │ Dernière connexion: ${String(dbUser.last_login ? new Date(dbUser.last_login).toLocaleString('fr-FR') : 'Jamais').padEnd(23)}│`);
      console.log(`   └─────────────────────────────────────────┘\n`);
      
      // Vérifier le rôle
      if (dbUser.role === 'admin') {
        console.log('   ✅ Rôle: ADMIN (correct)');
      } else {
        console.log(`   ❌ Rôle: ${dbUser.role} (attendu: admin)`);
        console.log('   💡 Pour corriger: node scripts/update-user-role-supabase.js admin@blossom.com admin');
      }
      
      // Vérifier is_active
      if (!dbUser.is_active) {
        console.log('   ⚠️  Le compte est INACTIF (is_active = false)');
        console.log('   💡 Pour activer: UPDATE users SET is_active = TRUE WHERE email = \'admin@blossom.com\'');
      }
    }

    console.log('\n2️⃣ Note sur Supabase Auth...');
    console.log('   ℹ️  L\'authentification utilise la table users (pas auth.users)');
    console.log('   ℹ️  Le backend vérifie les mots de passe via bcrypt dans la table users');
    console.log('   ℹ️  Pas besoin d\'un compte dans Supabase Auth pour se connecter\n');

    // 3. Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (dbUser) {
      console.log('✅ Table users: Utilisateur trouvé');
      console.log(`   - Rôle: ${dbUser.role}`);
      console.log(`   - Actif: ${dbUser.is_active ? 'Oui' : 'Non'}`);
      
      if (dbUser.role !== 'admin') {
        console.log('\n❌ PROBLÈME: Le rôle n\'est pas "admin"');
        console.log('   Solution: node scripts/update-user-role-supabase.js admin@blossom.com admin');
      }
      
      if (!dbUser.is_active) {
        console.log('\n❌ PROBLÈME: Le compte est inactif');
        console.log('   Solution: Mettre is_active = TRUE dans la table users');
      }
    } else {
      console.log('❌ Table users: Utilisateur NON TROUVÉ');
      console.log('   Solution: Créer l\'utilisateur dans la table users');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkAdminAccount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

