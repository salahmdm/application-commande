/**
 * Script de diagnostic pour vérifier le rôle admin dans la base de données
 * Usage: node database/scripts/check-admin-role.js
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

async function checkAdminRole() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 DIAGNOSTIC RÔLE ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const email = 'admin@blossom.com';
    const normalizedEmail = email.trim().toLowerCase();

    console.log('1️⃣ Recherche de l\'utilisateur admin...');
    console.log(`   Email: "${email}"`);
    console.log(`   Email normalisé: "${normalizedEmail}"\n`);

    // Rechercher l'utilisateur
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur Supabase:', error.message);
      return;
    }

    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle (raw): "${user.role}"`);
    console.log(`   Type du rôle: ${typeof user.role}`);
    console.log(`   Rôle (JSON): ${JSON.stringify(user.role)}`);
    console.log(`   Rôle (normalisé): "${String(user.role || '').trim().toLowerCase()}"`);
    console.log(`   is_active: ${user.is_active}`);

    // Vérifier le rôle
    const normalizedRole = String(user.role || '').trim().toLowerCase();
    console.log(`\n2️⃣ Vérification du rôle:`);
    console.log(`   Rôle normalisé: "${normalizedRole}"`);
    console.log(`   === "admin": ${normalizedRole === 'admin'}`);
    console.log(`   === "manager": ${normalizedRole === 'manager'}`);
    console.log(`   Includes dans ["manager", "admin"]: ${['manager', 'admin'].includes(normalizedRole)}`);

    if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
      console.log(`\n⚠️ ATTENTION: Le rôle n'est pas 'admin' ou 'manager'`);
      console.log(`   Il est: "${normalizedRole}"`);
      console.log(`   Cela peut causer des problèmes d'accès.`);
    } else {
      console.log(`\n✅ Le rôle est correctement défini.`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DIAGNOSTIC TERMINÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

checkAdminRole();

