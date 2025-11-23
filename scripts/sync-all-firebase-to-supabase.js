import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import firebaseConfig from '../src/config/firebase.js';

// Récupérer les variables d'environnement Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Déterminer le rôle d'un utilisateur selon son email
 */
const determineRole = (email) => {
  const emailLower = email.toLowerCase();
  if (emailLower === 'admin@blossom.com') {
    return 'admin';
  }
  if (emailLower === 'manager@blossom.com' || emailLower.includes('manager@')) {
    return 'manager';
  }
  if (emailLower.includes('guest@system') || emailLower.includes('system.local')) {
    return 'client'; // Les comptes système restent clients
  }
  return 'client';
};

/**
 * Récupérer tous les utilisateurs depuis Firebase Firestore
 */
const getFirebaseUsers = async () => {
  try {
    console.log('1️⃣ Initialisation Firebase...');
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
      console.log('⚠️ Firebase déjà initialisé, utilisation de l\'instance existante');
    }
    const db = getFirestore(app);
    const auth = getAuth(app);
    console.log('✅ Firebase initialisé\n');

    // Récupérer les utilisateurs depuis Firestore (collection 'users')
    console.log('2️⃣ Récupération des utilisateurs depuis Firebase Firestore...');
    const usersRef = collection(db, 'users');
    const firebaseSnapshot = await getDocs(usersRef);
    
    const firebaseUsers = [];
    firebaseSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.email) {
        firebaseUsers.push({
          uid: doc.id, // UID Firebase
          email: userData.email,
          displayName: userData.displayName || userData.name || '',
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          phone: userData.phone || null,
          photoURL: userData.photoURL || userData.avatar_url || null,
          emailVerified: userData.emailVerified || false,
          loyalty_points: userData.loyalty_points || userData.loyaltyPoints || userData.points || 0,
          role: userData.role || determineRole(userData.email),
          is_active: userData.is_active !== undefined ? userData.is_active : 1
        });
      }
    });
    
    console.log(`✅ ${firebaseUsers.length} utilisateur(s) trouvé(s) dans Firebase Firestore\n`);
    return firebaseUsers;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs Firebase:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️ Erreur de permissions Firestore.');
      console.error('   → Le script n\'a pas les droits de lecture sur la collection "users" dans Firestore.');
      console.error('   → Veuillez configurer les règles de sécurité Firestore pour permettre la lecture.');
      console.error('   → Lien direct vers les règles Firestore: https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules');
      console.error('   → Pour un dépannage rapide, utilisez les règles temporaires de `CONFIGURER_REGLES_FIRESTORE_TEMPORAIRE.md`.');
    }
    throw error;
  }
};

/**
 * Synchroniser un utilisateur Firebase vers Supabase
 */
const syncUserToSupabase = async (firebaseUser) => {
  try {
    const email = firebaseUser.email;
    if (!email) {
      return { success: false, error: 'Email manquant' };
    }

    // Vérifier si l'utilisateur existe déjà dans Supabase
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, role, loyalty_points')
      .eq('email', email)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    const userData = {
      email: email,
      password_hash: '$2b$10$FIREBASE_USER_NO_PASSWORD_REQUIRED',
      first_name: firebaseUser.firstName || firebaseUser.displayName?.split(' ')[0] || 'Utilisateur',
      last_name: firebaseUser.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'Firebase',
      phone: firebaseUser.phone || null,
      avatar_url: firebaseUser.photoURL || null,
      firebase_uid: firebaseUser.uid || null,
      is_active: firebaseUser.is_active !== undefined ? firebaseUser.is_active : 1,
      email_verified: firebaseUser.emailVerified ? 1 : 0,
      updated_at: new Date().toISOString()
    };

    // Déterminer le rôle (préserver le rôle Supabase s'il existe, sinon utiliser celui de Firebase)
    if (existingUser && existingUser.role) {
      userData.role = existingUser.role; // Garder le rôle existant dans Supabase
    } else {
      userData.role = firebaseUser.role || determineRole(email);
    }

    // Préserver les points de fidélité existants
    if (existingUser && existingUser.loyalty_points !== undefined && existingUser.loyalty_points !== null) {
      userData.loyalty_points = existingUser.loyalty_points;
    } else {
      userData.loyalty_points = firebaseUser.loyalty_points || 0;
    }

    if (existingUser) {
      // Mettre à jour l'utilisateur existant
      const { data, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { success: true, data, isNew: false };
    } else {
      // Créer un nouvel utilisateur
      userData.created_at = new Date().toISOString();
      const { data, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          // Email déjà existant, essayer de mettre à jour
          const { data: updatedData, error: retryError } = await supabase
            .from('users')
            .update(userData)
            .eq('email', email)
            .select()
            .single();
          
          if (retryError) throw retryError;
          return { success: true, data: updatedData, isNew: false };
        }
        throw insertError;
      }
      return { success: true, data, isNew: true };
    }
  } catch (error) {
    console.error(`❌ Erreur synchronisation ${firebaseUser.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Synchronisation complète Firebase → Supabase
 */
const syncAllFirebaseToSupabase = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 SYNCHRONISATION COMPLÈTE Firebase → Supabase');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Récupérer tous les utilisateurs Firebase
    const firebaseUsers = await getFirebaseUsers();

    if (firebaseUsers.length === 0) {
      console.log('⚠️ Aucun utilisateur Firebase trouvé.');
      console.log('   → Vérifiez que Firestore contient des utilisateurs dans la collection "users"');
      return { success: true, message: 'Aucun utilisateur à synchroniser' };
    }

    // 2. Récupérer tous les utilisateurs depuis Supabase
    console.log('3️⃣ Récupération des utilisateurs depuis Supabase...');
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('users')
      .select('id, email, firebase_uid');

    if (supabaseError) {
      throw supabaseError;
    }

    console.log(`✅ ${supabaseUsers?.length || 0} utilisateur(s) trouvé(s) dans Supabase\n`);

    // 3. Créer un Map des emails Firebase pour recherche rapide
    const firebaseEmailsMap = new Map();
    firebaseUsers.forEach(user => {
      if (user.email) {
        firebaseEmailsMap.set(user.email.toLowerCase(), user);
      }
    });

    // 4. Synchroniser chaque utilisateur Firebase vers Supabase
    console.log('4️⃣ Synchronisation des utilisateurs Firebase → Supabase...\n');
    const results = {
      created: [],
      updated: [],
      errors: []
    };

    for (const firebaseUser of firebaseUsers) {
      const syncResult = await syncUserToSupabase(firebaseUser);
      
      if (syncResult.success) {
        if (syncResult.isNew) {
          results.created.push(firebaseUser.email);
          console.log(`➕ Créé: ${firebaseUser.email} (rôle: ${syncResult.data.role})`);
        } else {
          results.updated.push(firebaseUser.email);
          console.log(`🔄 Mis à jour: ${firebaseUser.email} (rôle: ${syncResult.data.role})`);
        }
      } else {
        results.errors.push({ email: firebaseUser.email, error: syncResult.error });
        console.error(`❌ Erreur: ${firebaseUser.email} - ${syncResult.error}`);
      }
    }

    console.log('\n5️⃣ Nettoyage des utilisateurs Supabase non présents dans Firebase...');
    
    // 5. Identifier les utilisateurs Supabase qui ne sont pas dans Firebase
    const firebaseEmails = new Set(firebaseUsers.map(u => u.email.toLowerCase()));
    const usersToDelete = (supabaseUsers || []).filter(sbUser => {
      // Ne pas supprimer les comptes système
      if (sbUser.email && (sbUser.email.includes('@system.local') || sbUser.email.includes('guest@system'))) {
        return false;
      }
      // Ne pas supprimer si l'utilisateur a un firebase_uid mais n'est pas dans la liste Firebase
      // (il pourrait être un utilisateur créé directement dans Supabase)
      if (sbUser.firebase_uid && !firebaseEmails.has(sbUser.email?.toLowerCase() || '')) {
        return false; // Garder les utilisateurs avec firebase_uid même s'ils ne sont pas dans Firestore
      }
      // Supprimer seulement si l'email n'est pas dans Firebase ET n'a pas de firebase_uid
      return sbUser.email && !firebaseEmails.has(sbUser.email.toLowerCase()) && !sbUser.firebase_uid;
    });

    let deletedCount = 0;
    for (const userToDelete of usersToDelete) {
      try {
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userToDelete.id);

        if (deleteError) {
          console.error(`❌ Erreur suppression ${userToDelete.email}:`, deleteError.message);
        } else {
          deletedCount++;
          console.log(`🗑️ Supprimé: ${userToDelete.email} (non présent dans Firebase)`);
        }
      } catch (error) {
        console.error(`❌ Erreur suppression ${userToDelete.email}:`, error.message);
      }
    }

    // 6. Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ DE LA SYNCHRONISATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Créés: ${results.created.length}`);
    console.log(`🔄 Mis à jour: ${results.updated.length}`);
    console.log(`🗑️ Supprimés: ${deletedCount}`);
    console.log(`❌ Erreurs: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Erreurs détaillées:');
      results.errors.forEach(err => {
        console.log(`   - ${err.email}: ${err.error}`);
      });
    }
    
    console.log('\n✅ Synchronisation terminée !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      created: results.created.length,
      updated: results.updated.length,
      deleted: deletedCount,
      errors: results.errors.length
    };
  } catch (error) {
    console.error('❌ Erreur fatale lors de la synchronisation:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️ Erreur de permissions Firestore.');
      console.error('   → Le script n\'a pas les droits de lecture sur la collection "users" dans Firestore.');
      console.error('   → Veuillez configurer les règles de sécurité Firestore pour permettre la lecture.');
      console.error('   → Lien direct vers les règles Firestore: https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules');
    }
    return { success: false, error: error.message };
  }
};

// Exécution du script
syncAllFirebaseToSupabase()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur non gérée:', error);
    process.exit(1);
  });

