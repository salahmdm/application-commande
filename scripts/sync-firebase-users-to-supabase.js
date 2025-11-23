import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import firebaseConfig from '../src/config/firebase.js';

// Note: Ce script nécessite que Firestore soit accessible
// Si vous obtenez une erreur "permission-denied", vous devez :
// 1. Activer Firestore dans Firebase Console
// 2. Configurer les règles Firestore pour permettre la lecture (voir CONFIGURER_REGLES_FIRESTORE.md)
// 3. Ou utiliser l'Admin SDK de Firebase avec une clé de service JSON

// Récupérer les variables d'environnement Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Déterminer le rôle d'un utilisateur selon son email
 */
const determineRole = (email) => {
  if (email === 'admin@blossom.com') {
    return 'admin';
  }
  if (email === 'manager@blossom.com') {
    return 'manager';
  }
  return 'client';
};

/**
 * Synchroniser les utilisateurs Firebase vers Supabase
 */
const syncFirebaseUsersToSupabase = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 Synchronisation Firebase → Supabase');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Initialiser Firebase
    console.log('1️⃣ Initialisation Firebase...');
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
      console.log('⚠️ Firebase déjà initialisé, utilisation de l\'instance existante');
    }
    const db = getFirestore(app);
    console.log('✅ Firebase initialisé\n');

    // 2. Récupérer tous les utilisateurs depuis Firebase Firestore
    console.log('2️⃣ Récupération des utilisateurs depuis Firebase Firestore...');
    const usersRef = collection(db, 'users');
    const firebaseSnapshot = await getDocs(usersRef);
    
    const firebaseUsers = [];
    firebaseSnapshot.forEach((doc) => {
      const userData = doc.data();
      firebaseUsers.push({
        id: doc.id, // UID Firebase
        ...userData
      });
    });
    
    console.log(`✅ ${firebaseUsers.length} utilisateur(s) trouvé(s) dans Firebase\n`);

    if (firebaseUsers.length === 0) {
      console.log('⚠️ Aucun utilisateur dans Firebase. Aucune synchronisation nécessaire.');
      return { success: true, message: 'Aucun utilisateur à synchroniser' };
    }

    // 3. Récupérer tous les utilisateurs depuis Supabase
    console.log('3️⃣ Récupération des utilisateurs depuis Supabase...');
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('users')
      .select('id, email');

    if (supabaseError) {
      throw new Error(`Erreur Supabase: ${supabaseError.message}`);
    }

    console.log(`✅ ${supabaseUsers?.length || 0} utilisateur(s) trouvé(s) dans Supabase\n`);

    // 4. Créer un Map des emails Supabase pour recherche rapide
    const supabaseEmailsMap = new Map();
    (supabaseUsers || []).forEach(user => {
      if (user.email) {
        supabaseEmailsMap.set(user.email.toLowerCase(), user.id);
      }
    });

    // 5. Synchroniser chaque utilisateur Firebase vers Supabase
    console.log('4️⃣ Synchronisation des utilisateurs...\n');
    const results = {
      created: [],
      updated: [],
      errors: []
    };

    for (const firebaseUser of firebaseUsers) {
      const email = firebaseUser.email;
      if (!email) {
        console.warn(`⚠️ Utilisateur Firebase sans email (UID: ${firebaseUser.id}), ignoré`);
        results.errors.push({ uid: firebaseUser.id, error: 'Email manquant' });
        continue;
      }

      const emailLower = email.toLowerCase();
      const supabaseUserId = supabaseEmailsMap.get(emailLower);
      const role = determineRole(email);

      try {
        const userData = {
          email: email,
          first_name: firebaseUser.firstName || firebaseUser.first_name || '',
          last_name: firebaseUser.lastName || firebaseUser.last_name || '',
          phone: firebaseUser.phone || null,
          role: role, // Rôle déterminé selon l'email
          loyalty_points: firebaseUser.loyalty_points || firebaseUser.loyaltyPoints || 0,
          avatar_url: firebaseUser.photoURL || firebaseUser.avatar_url || null,
          is_active: 1, // Toujours actif par défaut
          email_verified: firebaseUser.emailVerified ? 1 : 0,
          firebase_uid: firebaseUser.id, // Stocker l'UID Firebase pour référence
          updated_at: new Date().toISOString()
        };

        if (supabaseUserId) {
          // Mettre à jour l'utilisateur existant
          const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', supabaseUserId)
            .select()
            .single();

          if (error) throw error;
          
          console.log(`✅ Mis à jour: ${email} (rôle: ${role})`);
          results.updated.push({ email, role, supabaseId: supabaseUserId });
        } else {
          // Créer un nouvel utilisateur
          // Générer un mot de passe hashé bidon car Firebase gère l'auth
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

    // 6. Supprimer les utilisateurs Supabase qui ne sont pas dans Firebase
    console.log('\n5️⃣ Nettoyage des utilisateurs Supabase non présents dans Firebase...\n');
    
    const firebaseEmails = new Set(firebaseUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
    const usersToDelete = (supabaseUsers || []).filter(user => {
      if (!user.email) return false;
      return !firebaseEmails.has(user.email.toLowerCase());
    });

    if (usersToDelete.length > 0) {
      console.log(`⚠️ ${usersToDelete.length} utilisateur(s) à supprimer de Supabase:`);
      usersToDelete.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });

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
      console.log('✅ Aucun utilisateur à supprimer');
    }

    // 7. Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ DE LA SYNCHRONISATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Utilisateurs créés: ${results.created.length}`);
    results.created.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    console.log(`\n🔄 Utilisateurs mis à jour: ${results.updated.length}`);
    results.updated.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    console.log(`\n🗑️ Utilisateurs supprimés: ${usersToDelete.length}`);
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
    
    if (error.code === 'permission-denied') {
      console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('⚠️ ERREUR DE PERMISSIONS FIRESTORE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.error('Les règles Firestore bloquent l\'accès à la collection "users".');
      console.error('\n📋 SOLUTION RAPIDE :\n');
      console.error('1. Ouvrez ce lien : https://console.firebase.google.com/project/prise-de-commande-pos/firestore/rules');
      console.error('2. Remplacez les règles par (temporairement) :');
      console.error('\n   rules_version = \'2\';');
      console.error('   service cloud.firestore {');
      console.error('     match /databases/{database}/documents {');
      console.error('       match /users/{userId} {');
      console.error('         allow read, write: if true;');
      console.error('       }');
      console.error('       match /{document=**} {');
      console.error('         allow read, write: if false;');
      console.error('       }');
      console.error('     }');
      console.error('   }');
      console.error('\n3. Cliquez sur "Publier"');
      console.error('4. Réessayez : npm run sync-firebase-users');
      console.error('\n📖 Guide détaillé : GUIDE_RAPIDE_SYNCHRONISATION.md');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    return { success: false, error: error.message };
  }
};

// Exécuter le script
syncFirebaseUsersToSupabase()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

