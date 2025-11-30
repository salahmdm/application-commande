/**
 * Script pour mettre à jour le rôle d'un utilisateur dans Supabase
 * Usage: node scripts/update-user-role-supabase.js <email> <role>
 * Exemple: node scripts/update-user-role-supabase.js admin@blossom.com admin
 */

import supabaseClient from '../src/services/supabaseClient.js';

const updateUserRole = async (email, newRole) => {
  try {
    console.log('🔧 Connexion à Supabase...');
    const supabase = supabaseClient;

    console.log(`🔍 Recherche de l'utilisateur: ${email}...`);
    
    // Rechercher l'utilisateur par email dans Supabase
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Erreur lors de la recherche:', fetchError.message);
      return { success: false, error: fetchError.message };
    }

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('\n💡 Vérifications:');
      console.log('   1. L\'utilisateur existe-t-il dans la table "users" de Supabase ?');
      console.log('   2. L\'email est-il exactement: ' + email);
      console.log('   3. L\'utilisateur s\'est-il déjà connecté au moins une fois ?');
      console.log('\n💡 Si l\'utilisateur n\'existe pas, connectez-vous une fois avec cet email');
      console.log('   afin qu\'il soit automatiquement créé dans Supabase.');
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    console.log(`\n📋 Utilisateur trouvé:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nom: ${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A');
    console.log(`   - Rôle actuel: ${user.role || 'client'}`);
    console.log(`   - Nouveau rôle: ${newRole}`);

    // Mettre à jour le rôle
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ Erreur lors de la mise à jour:`, updateError);
      console.error(`   Code: ${updateError.code}`);
      console.error(`   Message: ${updateError.message}`);
      return { success: false, error: updateError.message };
    }

    console.log(`\n✅ Rôle mis à jour avec succès !`);
    console.log(`   - Nouveau rôle: ${updatedUser.role}`);
    console.log(`\n✅ Mise à jour terminée !`);
    console.log(`\n💡 L'utilisateur ${email} a maintenant le rôle: ${newRole}`);
    console.log('   → Déconnectez-vous et reconnectez-vous pour voir les changements.');

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    
    if (error.message?.includes('permission') || error.message?.includes('RLS')) {
      console.error('\n⚠️ Erreur de permissions Supabase.');
      console.log('   → Vérifiez les règles RLS (Row Level Security) de Supabase.');
      console.log('   → Assurez-vous que les règles permettent la mise à jour de la table users.');
    }
    
    return { success: false, error: error.message };
  }
};

// Exécution du script
const email = process.argv[2];
const role = process.argv[3];

if (!email || !role) {
  console.error('❌ Usage: node scripts/update-user-role-supabase.js <email> <role>');
  console.error('   Exemple: node scripts/update-user-role-supabase.js admin@blossom.com admin');
  console.error('\n   Rôles disponibles: client, manager, admin, kiosk');
  process.exit(1);
}

const validRoles = ['client', 'manager', 'admin', 'kiosk'];
if (!validRoles.includes(role)) {
  console.error(`❌ Rôle invalide: ${role}`);
  console.error(`   Rôles disponibles: ${validRoles.join(', ')}`);
  process.exit(1);
}

updateUserRole(email, role)
  .then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

