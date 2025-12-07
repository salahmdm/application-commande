/**
 * Script de test pour vérifier la connexion Supabase et l'authentification
 * Usage: node database/test-supabase-auth.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    'https://brygzpxiemwthickhuqb.supabase.co';

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_KEY ||
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 Test Connexion Supabase - Authentification');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('📋 Configuration:');
console.log('  URL:', supabaseUrl);
console.log('  Key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY ✅' : 
                              process.env.SUPABASE_KEY ? 'SUPABASE_KEY ⚠️' :
                              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ANON_KEY ⚠️' : 'Défaut hardcodé ⚠️');
console.log('  Key présent:', !!supabaseKey);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣ Test: Connexion à Supabase');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Test 1: Lire les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, is_active, first_name, last_name')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Erreur Supabase:', usersError);
      console.error('   Code:', usersError.code);
      console.error('   Message:', usersError.message);
      console.error('   Details:', usersError.details);
      
      if (usersError.code === 'PGRST301' || usersError.message?.includes('RLS')) {
        console.error('');
        console.error('⚠️ PROBLÈME RLS DÉTECTÉ');
        console.error('   Le backend doit utiliser SUPABASE_SERVICE_ROLE_KEY');
        console.error('   pour bypasser les politiques RLS.');
        console.error('');
        console.error('💡 Solution:');
        console.error('   1. Allez sur Supabase Dashboard → Settings → API');
        console.error('   2. Copiez la "service_role" key');
        console.error('   3. Ajoutez dans database/.env:');
        console.error('      SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key');
      }
      
      return false;
    }
    
    console.log('✅ Connexion réussie');
    console.log('   Utilisateurs trouvés:', users.length);
    console.log('');
    
    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur dans la base de données');
      console.log('   Créez un utilisateur pour tester la connexion');
      return true;
    }
    
    console.log('📋 Liste des utilisateurs:');
    users.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.email}`);
      console.log(`      - ID: ${u.id}`);
      console.log(`      - Role: ${u.role}`);
      console.log(`      - Active: ${u.is_active === 1 ? 'Oui ✅' : 'Non ❌'}`);
      console.log(`      - Nom: ${u.first_name} ${u.last_name}`);
      console.log('');
    });
    
    // Test 2: Chercher un utilisateur spécifique
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣ Test: Recherche utilisateur par email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Prendre le premier utilisateur actif pour le test
    const testUser = users.find(u => u.is_active === 1);
    
    if (!testUser) {
      console.log('⚠️ Aucun utilisateur actif trouvé pour le test');
      return true;
    }
    
    const testEmail = testUser.email.toLowerCase().trim();
    console.log('   Email test:', testEmail);
    console.log('');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .eq('is_active', 1)
      .maybeSingle();
    
    if (userError) {
      console.error('❌ Erreur recherche utilisateur:', userError);
      return false;
    }
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé avec email:', testEmail);
      console.log('   Vérifiez:');
      console.log('   - Email exact (casse, espaces)');
      console.log('   - is_active = 1');
      return false;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    console.log('   - Active:', user.is_active === 1 ? 'Oui ✅' : 'Non ❌');
    console.log('   - Password hash présent:', user.password_hash ? 'Oui ✅' : 'Non ❌');
    console.log('   - Password hash length:', user.password_hash?.length || 0);
    console.log('');
    
    if (!user.password_hash) {
      console.log('⚠️ ATTENTION: L\'utilisateur n\'a pas de password_hash');
      console.log('   La connexion échouera car le mot de passe ne peut pas être vérifié');
      console.log('');
    }
    
    // Test 3: Vérifier la structure de la table
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣ Test: Structure table users');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const requiredFields = ['id', 'email', 'password_hash', 'role', 'is_active'];
    const missingFields = requiredFields.filter(field => !(field in user));
    
    if (missingFields.length > 0) {
      console.error('❌ Champs manquants dans la table users:');
      missingFields.forEach(field => {
        console.error(`   - ${field}`);
      });
      return false;
    }
    
    console.log('✅ Tous les champs requis sont présents');
    console.log('');
    
    // Résumé
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Tous les tests sont passés');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 Si vous ne pouvez toujours pas vous connecter:');
    console.log('   1. Vérifiez que le mot de passe est correct');
    console.log('   2. Vérifiez les logs du backend lors d\'une tentative de connexion');
    console.log('   3. Vérifiez la console du navigateur (F12)');
    console.log('');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    console.error('   Stack:', error.stack);
    return false;
  }
}

// Exécuter le test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

