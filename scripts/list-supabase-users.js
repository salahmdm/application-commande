import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Lister tous les utilisateurs depuis Supabase
 */
const listSupabaseUsers = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LISTE DES COMPTES SUPABASE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1️⃣ Récupération des utilisateurs depuis Supabase...');
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`✅ ${users?.length || 0} utilisateur(s) trouvé(s) dans Supabase\n`);

    if (!users || users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé dans Supabase.');
      return { success: true, users: [] };
    }

    // Afficher la liste des utilisateurs
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LISTE DES COMPTES SUPABASE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || 'N/A'}`);
      console.log(`   └─ ID Supabase: ${user.id}`);
      console.log(`   └─ Nom: ${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A');
      console.log(`   └─ Rôle: ${user.role || 'client'}`);
      console.log(`   └─ Téléphone: ${user.phone || 'N/A'}`);
      console.log(`   └─ Email vérifié: ${user.email_verified ? '✅ Oui' : '❌ Non'}`);
      console.log(`   └─ Points de fidélité: ${user.loyalty_points || 0}`);
      console.log(`   └─ Actif: ${user.is_active ? '✅ Oui' : '❌ Non'}`);
      console.log(`   └─ Firebase UID: ${user.firebase_uid || 'N/A'}`);
      console.log(`   └─ Créé le: ${user.created_at || 'N/A'}`);
      console.log('');
    });

    // Statistiques
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 STATISTIQUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total d'utilisateurs: ${users.length}`);
    console.log(`Admins: ${users.filter(u => u.role === 'admin').length}`);
    console.log(`Managers: ${users.filter(u => u.role === 'manager').length}`);
    console.log(`Clients: ${users.filter(u => u.role === 'client').length}`);
    console.log(`Emails vérifiés: ${users.filter(u => u.email_verified).length}`);
    console.log(`Comptes actifs: ${users.filter(u => u.is_active).length}`);
    console.log(`Avec Firebase UID: ${users.filter(u => u.firebase_uid).length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      total: users.length,
      users: users,
      stats: {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        managers: users.filter(u => u.role === 'manager').length,
        clients: users.filter(u => u.role === 'client').length,
        emailVerified: users.filter(u => u.email_verified).length,
        active: users.filter(u => u.is_active).length,
        withFirebaseUID: users.filter(u => u.firebase_uid).length
      }
    };
  } catch (error) {
    console.error('\n❌ Erreur lors de la récupération des utilisateurs Supabase:', error);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    return { success: false, error: error.message };
  }
};

// Exécuter le script
listSupabaseUsers()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

