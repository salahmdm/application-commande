/**
 * Script pour tester le mot de passe du compte admin@blossom.com
 * Vérifie si le hash stocké correspond à un mot de passe donné
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

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
console.log('🔐 TEST DU MOT DE PASSE: admin@blossom.com');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testPassword() {
  try {
    // Récupérer l'utilisateur
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, password_hash')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }

    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Hash présent: ${user.password_hash ? 'Oui' : 'Non'}`);
    
    if (!user.password_hash) {
      console.error('\n❌ PROBLÈME: Aucun hash de mot de passe trouvé !');
      console.log('   Le compte ne peut pas se connecter sans password_hash.');
      console.log('\n💡 Solution: Réinitialiser le mot de passe');
      return;
    }

    console.log(`   Hash (premiers 20 caractères): ${user.password_hash.substring(0, 20)}...`);
    console.log(`   Format hash: ${user.password_hash.startsWith('$2') ? 'bcrypt ✅' : 'Format inconnu ⚠️'}\n`);

    // Tester avec les mots de passe courants
    const commonPasswords = [
      'admin123',
      'Admin123',
      'admin',
      'password',
      'blossom',
      'Blossom123',
      'admin@blossom.com',
    ];

    console.log('🔍 Test avec les mots de passe courants:\n');
    
    let found = false;
    for (const testPassword of commonPasswords) {
      try {
        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        if (isValid) {
          console.log(`   ✅ MOT DE PASSE TROUVÉ: "${testPassword}"`);
          found = true;
          break;
        } else {
          console.log(`   ❌ "${testPassword}" - Incorrect`);
        }
      } catch (compareError) {
        console.log(`   ⚠️  "${testPassword}" - Erreur de comparaison: ${compareError.message}`);
      }
    }

    if (!found) {
      console.log('\n❌ Aucun des mots de passe testés ne correspond');
      console.log('\n💡 Solutions possibles:');
      console.log('   1. Vérifier le mot de passe dans vos notes/documentation');
      console.log('   2. Réinitialiser le mot de passe avec un script');
      console.log('   3. Vérifier si le hash est dans un format différent');
    }

    // Vérifier le format du hash
    console.log('\n📋 Analyse du hash:');
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2y$')) {
      const parts = user.password_hash.split('$');
      if (parts.length >= 4) {
        const rounds = parts[2];
        console.log(`   Format: bcrypt (${parts[1]})`);
        console.log(`   Rounds: ${rounds}`);
        console.log(`   Hash valide: Oui ✅`);
      }
    } else {
      console.log('   ⚠️  Format de hash non reconnu (pas bcrypt)');
      console.log(`   Hash complet: ${user.password_hash}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

