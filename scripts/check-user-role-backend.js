/**
 * Script pour vérifier le rôle d'un utilisateur via le backend
 * Usage: node scripts/check-user-role-backend.js <email>
 * Exemple: node scripts/check-user-role-backend.js admin@blossom.com
 */

import supabaseService from '../database/supabase-backend-service.js';

const checkUserRole = async (email) => {
  try {
    console.log('🔍 Connexion au backend Supabase...');
    console.log(`📧 Recherche de l'utilisateur: ${email}...\n`);
    
    // Rechercher l'utilisateur par email
    const [users] = await supabaseService.select('users', {
      where: { email: email },
      limit: 1
    });

    if (!users || users.length === 0) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('\n💡 Vérifications:');
      console.log('   1. L\'utilisateur existe-t-il dans la table "users" de Supabase ?');
      console.log('   2. L\'email est-il exactement: ' + email);
      console.log('   3. L\'utilisateur s\'est-il déjà connecté au moins une fois ?');
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const user = users[0];

    console.log('✅ Utilisateur trouvé:');
    console.log('   ┌─────────────────────────────────────────┐');
    console.log(`   │ ID:              ${String(user.id).padEnd(25)}│`);
    console.log(`   │ Email:           ${String(user.email || 'N/A').padEnd(25)}│`);
    console.log(`   │ Nom:             ${String((user.first_name || '') + ' ' + (user.last_name || '')).trim().padEnd(25) || 'N/A'.padEnd(25)}│`);
    console.log(`   │ Rôle:            ${String(user.role || 'client').padEnd(25)}│`);
    console.log(`   │ Actif:           ${String(user.is_active ? 'Oui' : 'Non').padEnd(25)}│`);
    console.log(`   │ Email vérifié:   ${String(user.email_verified ? 'Oui' : 'Non').padEnd(25)}│`);
    console.log(`   │ Points fidélité: ${String(user.loyalty_points || 0).padEnd(25)}│`);
    console.log(`   │ Créé le:         ${String(user.created_at ? new Date(user.created_at).toLocaleString('fr-FR') : 'N/A').padEnd(25)}│`);
    console.log(`   │ Dernière connexion: ${String(user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Jamais').padEnd(23)}│`);
    console.log('   └─────────────────────────────────────────┘\n');

    // Vérifier le rôle
    if (user.role === 'admin') {
      console.log('✅ Le compte a bien le rôle ADMIN');
      console.log('   → Le problème d\'accès au dashboard CA doit venir d\'ailleurs.');
      console.log('   → Vérifiez que le rôle est bien synchronisé dans le store Zustand.');
    } else if (user.role === 'manager') {
      console.log('⚠️  Le compte a le rôle MANAGER (pas admin)');
      console.log('\n💡 Pour mettre à jour le rôle en admin, utilisez:');
      console.log(`   node scripts/update-user-role-supabase.js ${email} admin`);
    } else {
      console.log(`❌ Le compte a le rôle: ${user.role} (pas admin)`);
      console.log('\n💡 Pour mettre à jour le rôle en admin, utilisez:');
      console.log(`   node scripts/update-user-role-supabase.js ${email} admin`);
    }

    return { success: true, user };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false, error: error.message };
  }
};

// Exécution du script
const email = process.argv[2] || 'admin@blossom.com';

if (!email) {
  console.error('❌ Usage: node scripts/check-user-role-backend.js <email>');
  console.error('   Exemple: node scripts/check-user-role-backend.js admin@blossom.com');
  process.exit(1);
}

checkUserRole(email)
  .then((result) => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });






