/**
 * Script de synchronisation complète Firebase Authentication ↔ Supabase
 * 
 * Ce script :
 * 1. Récupère tous les utilisateurs depuis Firebase Authentication
 * 2. Synchronise avec Supabase (création/mise à jour)
 * 3. Nettoie Supabase (supprime les utilisateurs non-Firebase, sauf comptes système)
 * 
 * ⚠️ IMPORTANT : Ce script nécessite Firebase Admin SDK ou des règles Firestore permissives
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import firebaseConfig from '../src/config/firebase.js';

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
 * Récupérer les utilisateurs depuis Firebase Authentication via Firestore
 * (Firebase Auth n'expose pas directement une API pour lister tous les utilisateurs)
 */
const getFirebaseAuthUsers = async () => {
  try {
    console.log('1️⃣ Initialisation Firebase...');
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    const db = getFirestore(app);
    const auth = getAuth(app);
    console.log('✅ Firebase initialisé\n');

    // Méthode 1 : Essayer de récupérer depuis Firestore (collection 'users')
    console.log('2️⃣ Récupération des utilisateurs depuis Firestore...');
    const usersRef = collection(db, 'users');
    const firestoreSnapshot = await getDocs(usersRef);
    
    const firebaseUsers = [];
    firestoreSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.email) {
        firebaseUsers.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName || userData.name || '',
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          phone: userData.phone || null,
          photoURL: userData.photoURL || userData.avatar_url || null,
          emailVerified: userData.emailVerified || false,
          loyalty_points: userData.loyalty_points || userData.loyaltyPoints || 0,
          role: userData.role || determineRole(userData.email)
        });
      }
    });
    
    console.log(`✅ ${firebaseUsers.length} utilisateur(s) trouvé(s) dans Firestore\n`);
    
    // Si aucun utilisateur dans Firestore, essayer de récupérer depuis l'état d'authentification
    if (firebaseUsers.length === 0) {
      console.log('⚠️ Aucun utilisateur dans Firestore. Vérification de l\'état d\'authentification...');
      const currentUser = auth.currentUser;
      if (currentUser) {
        firebaseUsers.push({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || '',
          emailVerified: currentUser.emailVerified || false,
          photoURL: currentUser.photoURL || null
        });
        console.log(`✅ 1 utilisateur trouvé dans l'état d'authentification: ${currentUser.email}\n`);
      }
    }
    
    return firebaseUsers;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs Firebase:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️ ERREUR DE PERMISSIONS FIRESTORE');
      console.error('Les règles Firestore bloquent l\'accès à la collection "users".');
      console.error('\n📋 SOLUTION :');
      console.error('1. Ouvrez : https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules');
      console.error('2. Utilisez des règles temporaires permissives (voir CONFIGURER_REGLES_FIRESTORE_TEMPORAIRE.md)');
      console.error('3. Réessayez le script\n');
    }
    throw error;
  }
};

/**
 * Synchronisation complète Firebase Authentication ↔ Supabase
 */
const syncFirebaseAuthToSupabase = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 SYNCHRONISATION COMPLÈTE Firebase Auth ↔ Supabase');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Récupérer les utilisateurs Firebase
    const firebaseUsers = await getFirebaseAuthUsers();

    if (firebaseUsers.length === 0) {
      console.log('⚠️ Aucun utilisateur Firebase trouvé. Vérifiez que Firestore contient des utilisateurs.');
      console.log('   → Les utilisateurs doivent être dans la collection "users" de Firestore');
      console.log('   → Ou utilisez Firebase Admin SDK pour récupérer directement depuis Firebase Auth\n');
      return { success: true, message: 'Aucun utilisateur à synchroniser' };
    }

    // 2. Récupérer tous les utilisateurs depuis Supabase
    console.log('3️⃣ Récupération des utilisateurs depuis Supabase...');
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('users')
      .select('id, email, role');

    if (supabaseError) {
      throw new Error(`Erreur Supabase: ${supabaseError.message}`);
    }

    console.log(`✅ ${supabaseUsers?.length || 0} utilisateur(s) trouvé(s) dans Supabase\n`);

    // 3. Créer un Map des emails Supabase pour recherche rapide
    const supabaseEmailsMap = new Map();
    (supabaseUsers || []).forEach(user => {
      if (user.email) {
        supabaseEmailsMap.set(user.email.toLowerCase(), { id: user.id, role: user.role });
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
      const email = firebaseUser.email;
      if (!email) {
        console.warn(`⚠️ Utilisateur Firebase sans email (UID: ${firebaseUser.uid}), ignoré`);
        results.errors.push({ uid: firebaseUser.uid, error: 'Email manquant' });
        continue;
      }

      const emailLower = email.toLowerCase();
      const supabaseUser = supabaseEmailsMap.get(emailLower);
      const role = firebaseUser.role || determineRole(email);

      try {
        const userData = {
          email: email,
          first_name: firebaseUser.firstName || firebaseUser.displayName?.split(' ')[0] || '',
          last_name: firebaseUser.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          phone: firebaseUser.phone || null,
          role: supabaseUser?.role || role, // Préserver le rôle existant dans Supabase si présent
          loyalty_points: firebaseUser.loyalty_points || 0,
          avatar_url: firebaseUser.photoURL || null,
          is_active: 1,
          email_verified: firebaseUser.emailVerified ? 1 : 0,
          firebase_uid: firebaseUser.uid,
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

    // 5. Nettoyer les utilisateurs Supabase qui ne sont pas dans Firebase (sauf comptes système)
    console.log('\n5️⃣ Nettoyage des utilisateurs Supabase non présents dans Firebase...\n');
    
    const firebaseEmails = new Set(firebaseUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
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

    // 6. Résumé
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
      results.errors.forEach(e => console.log(`   - ${e.email || e.uid}: ${e.error}`));
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
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    
    return { success: false, error: error.message };
  }
};

// Exécuter le script
syncFirebaseAuthToSupabase()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

