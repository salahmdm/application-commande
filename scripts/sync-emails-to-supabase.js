/**
 * Script de synchronisation directe : Emails Firebase → Supabase
 * 
 * Ce script synchronise directement les emails Firebase avec Supabase
 * sans avoir besoin d'accès à Firestore.
 * 
 * Usage: node scripts/sync-emails-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Liste des emails de comptes système à préserver dans Supabase
 */
const SYSTEM_ACCOUNTS = [
  'guest@system.local',
  'guest_marie_dupont@blossomcafe.local',
  'kiosk-001@blossom-cafe.local'
];

/**
 * Vérifier si un email est un compte système
 */
const isSystemAccount = (email) => {
  if (!email) return false;
  const emailLower = email.toLowerCase();
  return SYSTEM_ACCOUNTS.some(sysEmail => emailLower === sysEmail.toLowerCase()) ||
         emailLower.includes('@system.local') ||
         emailLower.includes('@blossomcafe.local') ||
         emailLower.includes('@blossom-cafe.local');
};

/**
 * Déterminer le rôle d'un utilisateur selon son email
 */
const determineRole = (email) => {
  if (!email) return 'client';
  const emailLower = email.toLowerCase();
  
  if (emailLower === 'admin@blossom.com') {
    return 'admin';
  }
  if (emailLower === 'manager@blossom.com') {
    return 'manager';
  }
  if (emailLower.includes('manager@')) {
    return 'manager';
  }
  return 'client';
};

/**
 * Liste des emails Firebase (depuis Firebase Authentication)
 * À mettre à jour selon vos utilisateurs Firebase
 */
const FIREBASE_EMAILS = [
  'tarek@test.com',
  'manager@blossom.com',
  'salaheddine.mokadem@gmail.com',
  'admin@blossom.com',
  'a@a.com'
];

/**
 * Synchronisation directe des emails Firebase vers Supabase
 */
const syncEmailsToSupabase = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 SYNCHRONISATION DIRECTE Emails Firebase → Supabase');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`📋 ${FIREBASE_EMAILS.length} email(s) Firebase à synchroniser:\n`);
    FIREBASE_EMAILS.forEach(email => {
      const role = determineRole(email);
      console.log(`   - ${email} (rôle: ${role})`);
    });
    console.log('');

    // 1. Récupérer tous les utilisateurs depuis Supabase
    console.log('1️⃣ Récupération des utilisateurs depuis Supabase...');
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('users')
      .select('id, email, role');

    if (supabaseError) {
      throw new Error(`Erreur Supabase: ${supabaseError.message}`);
    }

    console.log(`✅ ${supabaseUsers?.length || 0} utilisateur(s) trouvé(s) dans Supabase\n`);

    // 2. Créer un Map des emails Supabase pour recherche rapide
    const supabaseEmailsMap = new Map();
    (supabaseUsers || []).forEach(user => {
      if (user.email) {
        supabaseEmailsMap.set(user.email.toLowerCase(), { id: user.id, role: user.role });
      }
    });

    // 3. Synchroniser chaque email Firebase vers Supabase
    console.log('2️⃣ Synchronisation des emails Firebase → Supabase...\n');
    const results = {
      created: [],
      updated: [],
      errors: []
    };

    for (const email of FIREBASE_EMAILS) {
      const emailLower = email.toLowerCase();
      const supabaseUser = supabaseEmailsMap.get(emailLower);
      const role = determineRole(email);

      try {
        const userData = {
          email: email,
          first_name: email.split('@')[0].split('.')[0] || 'Utilisateur',
          last_name: email.split('@')[0].split('.').slice(1).join(' ') || '',
          role: supabaseUser?.role || role, // Préserver le rôle existant dans Supabase si présent
          loyalty_points: 0,
          is_active: 1,
          email_verified: 0,
          updated_at: new Date().toISOString()
        };

        if (supabaseUser) {
          // Mettre à jour l'utilisateur existant (mais préserver le rôle Supabase)
          userData.role = supabaseUser.role || role;
          
          const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', supabaseUser.id)
            .select()
            .single();

          if (error) throw error;
          
          console.log(`✅ Mis à jour: ${email} (rôle: ${userData.role})`);
          results.updated.push({ email, role: userData.role, supabaseId: supabaseUser.id });
        } else {
          // Créer un nouvel utilisateur
          const passwordHash = `$2b$10$FIREBASE_SYNC_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          
          const userToInsert = {
            ...userData,
            password_hash: passwordHash,
            created_at: new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('users')
            .insert(userToInsert)
            .select()
            .single();

          if (error) throw error;
          
          console.log(`✅ Créé: ${email} (rôle: ${role})`);
          results.created.push({ email, role, supabaseId: data.id });
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${email}:`, error.message);
        results.errors.push({ email, error: error.message });
      }
    }

    // 4. Nettoyer les utilisateurs Supabase qui ne sont pas dans Firebase (sauf comptes système)
    console.log('\n3️⃣ Nettoyage des utilisateurs Supabase non présents dans Firebase...\n');
    
    const firebaseEmails = new Set(FIREBASE_EMAILS.map(e => e.toLowerCase()));
    const usersToDelete = (supabaseUsers || []).filter(user => {
      if (!user.email) return false;
      const emailLower = user.email.toLowerCase();
      // Ne pas supprimer les comptes système
      if (isSystemAccount(emailLower)) {
        return false;
      }
      // Supprimer seulement si l'utilisateur n'est pas dans Firebase
      return !firebaseEmails.has(emailLower);
    });

    if (usersToDelete.length > 0) {
      console.log(`⚠️ ${usersToDelete.length} utilisateur(s) à supprimer de Supabase (non présents dans Firebase):`);
      usersToDelete.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
      console.log('');

      for (const userToDelete of usersToDelete) {
        try {
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userToDelete.id);

          if (error) throw error;
          console.log(`✅ Supprimé: ${userToDelete.email}`);
        } catch (error) {
          console.error(`❌ Erreur lors de la suppression de ${userToDelete.email}:`, error.message);
          results.errors.push({ email: userToDelete.email, error: `Suppression: ${error.message}` });
        }
      }
    } else {
      console.log('✅ Aucun utilisateur à supprimer (tous les utilisateurs Supabase sont dans Firebase ou sont des comptes système)');
    }

    // 5. Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ DE LA SYNCHRONISATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Utilisateurs créés: ${results.created.length}`);
    if (results.created.length > 0) {
      results.created.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    }
    console.log(`\n🔄 Utilisateurs mis à jour: ${results.updated.length}`);
    if (results.updated.length > 0) {
      results.updated.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    }
    console.log(`\n🗑️ Utilisateurs supprimés: ${usersToDelete.length}`);
    if (usersToDelete.length > 0) {
      usersToDelete.forEach(u => console.log(`   - ${u.email}`));
    }
    if (results.errors.length > 0) {
      console.log(`\n❌ Erreurs: ${results.errors.length}`);
      results.errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Synchronisation terminée !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      results: {
        created: results.created.length,
        updated: results.updated.length,
        deleted: usersToDelete.length,
        errors: results.errors.length
      }
    };
  } catch (error) {
    console.error('\n❌ Erreur fatale lors de la synchronisation:', error);
    console.error('   Message:', error.message);
    
    return { success: false, error: error.message };
  }
};

// Exécuter le script
syncEmailsToSupabase()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

