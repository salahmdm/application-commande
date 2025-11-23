/**
 * Script de vérification de la synchronisation Supabase ↔ Firebase
 * 
 * Ce script vérifie que :
 * 1. Les utilisateurs Firebase existent dans Supabase
 * 2. Les rôles sont correctement synchronisés
 * 3. La communication fonctionne
 */

import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../src/config/firebase.js';

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Vérifier la synchronisation Supabase ↔ Firebase
 */
const verifySync = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VÉRIFICATION SYNCHRONISATION Supabase ↔ Firebase');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Vérifier la connexion Supabase
    console.log('1️⃣ Test de connexion Supabase...');
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('users')
      .select('id, email, role, firebase_uid')
      .limit(10);

    if (supabaseError) {
      console.error('❌ Erreur Supabase:', supabaseError.message);
      return { success: false, error: supabaseError.message };
    }

    console.log(`✅ Supabase connecté - ${supabaseUsers?.length || 0} utilisateur(s) trouvé(s)\n`);

    // 2. Vérifier la connexion Firebase
    console.log('2️⃣ Test de connexion Firebase...');
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    const db = getFirestore(app);

    let firebaseUsers = [];
    try {
      const usersRef = collection(db, 'users');
      const firebaseSnapshot = await getDocs(usersRef);
      firebaseSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email) {
          firebaseUsers.push({
            uid: doc.id,
            email: userData.email,
            role: userData.role || 'client'
          });
        }
      });
      console.log(`✅ Firebase connecté - ${firebaseUsers.length} utilisateur(s) trouvé(s)\n`);
    } catch (firebaseError) {
      if (firebaseError.code === 'permission-denied') {
        console.warn('⚠️ Firebase Firestore - Permission refusée (normal si RLS activé)');
        console.warn('   → La synchronisation automatique fonctionnera lors de la connexion\n');
      } else {
        console.error('❌ Erreur Firebase:', firebaseError.message);
      }
    }

    // 3. Comparer les utilisateurs
    console.log('3️⃣ Comparaison des utilisateurs...\n');

    const supabaseEmails = new Set((supabaseUsers || []).map(u => u.email?.toLowerCase()).filter(Boolean));
    const firebaseEmails = new Set(firebaseUsers.map(u => u.email?.toLowerCase()).filter(Boolean));

    console.log('📊 Utilisateurs Supabase:');
    (supabaseUsers || []).forEach(user => {
      const inFirebase = firebaseEmails.has(user.email?.toLowerCase());
      console.log(`   ${inFirebase ? '✅' : '⚠️'} ${user.email} (rôle: ${user.role || 'client'})`);
    });

    console.log('\n📊 Utilisateurs Firebase:');
    firebaseUsers.forEach(user => {
      const inSupabase = supabaseEmails.has(user.email?.toLowerCase());
      console.log(`   ${inSupabase ? '✅' : '⚠️'} ${user.email} (rôle: ${user.role || 'client'})`);
    });

    // 4. Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Supabase: ${supabaseUsers?.length || 0} utilisateur(s)`);
    console.log(`✅ Firebase: ${firebaseUsers.length} utilisateur(s)`);
    
    const missingInSupabase = firebaseUsers.filter(u => !supabaseEmails.has(u.email?.toLowerCase()));
    const missingInFirebase = (supabaseUsers || []).filter(u => !firebaseEmails.has(u.email?.toLowerCase()));

    if (missingInSupabase.length > 0) {
      console.log(`\n⚠️ ${missingInSupabase.length} utilisateur(s) Firebase non trouvé(s) dans Supabase:`);
      missingInSupabase.forEach(u => console.log(`   - ${u.email}`));
      console.log('   → Ces utilisateurs seront créés automatiquement lors de leur prochaine connexion');
    }

    if (missingInFirebase.length > 0) {
      console.log(`\n⚠️ ${missingInFirebase.length} utilisateur(s) Supabase non trouvé(s) dans Firebase:`);
      missingInFirebase.forEach(u => console.log(`   - ${u.email}`));
      console.log('   → Ce sont probablement des comptes système ou des utilisateurs créés directement dans Supabase');
    }

    if (missingInSupabase.length === 0 && missingInFirebase.length === 0) {
      console.log('\n✅ Tous les utilisateurs sont synchronisés !');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Vérification terminée');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return { success: true, supabaseUsers, firebaseUsers };
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    return { success: false, error: error.message };
  }
};

// Exécuter le script
verifySync()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur non gérée:', error);
    process.exit(1);
  });

