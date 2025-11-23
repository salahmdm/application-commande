import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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
 * Migrer les utilisateurs Firebase vers Supabase Auth
 * 
 * ⚠️ IMPORTANT: Ce script crée les utilisateurs dans Supabase Auth
 * mais ils devront réinitialiser leur mot de passe car on ne peut pas
 * récupérer les mots de passe depuis Firebase.
 */
const migrateFirebaseUsersToSupabaseAuth = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 MIGRATION Firebase → Supabase Auth');
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
          loyalty_points: userData.loyalty_points || userData.loyaltyPoints || userData.points || 0,
          role: userData.role || determineRole(userData.email)
        });
      }
    });
    
    console.log(`✅ ${firebaseUsers.length} utilisateur(s) trouvé(s) dans Firebase\n`);

    if (firebaseUsers.length === 0) {
      console.log('⚠️ Aucun utilisateur Firebase trouvé.');
      return { success: true, message: 'Aucun utilisateur à migrer' };
    }

    // 3. Récupérer tous les utilisateurs depuis Supabase (table users)
    console.log('3️⃣ Récupération des utilisateurs depuis Supabase (table users)...');
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('users')
      .select('id, email, role, loyalty_points');

    if (supabaseError) {
      throw supabaseError;
    }

    console.log(`✅ ${supabaseUsers?.length || 0} utilisateur(s) trouvé(s) dans Supabase\n`);

    // 4. Créer un Map des emails Supabase pour recherche rapide
    const supabaseEmailsMap = new Map();
    (supabaseUsers || []).forEach(user => {
      if (user.email) {
        supabaseEmailsMap.set(user.email.toLowerCase(), user);
      }
    });

    // 5. Migrer chaque utilisateur Firebase vers Supabase Auth
    console.log('4️⃣ Migration des utilisateurs Firebase → Supabase Auth...\n');
    console.log('⚠️ ATTENTION: Les utilisateurs devront réinitialiser leur mot de passe');
    console.log('   car on ne peut pas récupérer les mots de passe depuis Firebase.\n');
    
    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };

    for (const firebaseUser of firebaseUsers) {
      const email = firebaseUser.email;
      const emailLower = email.toLowerCase();
      
      // Ignorer les comptes système
      if (emailLower.includes('@system.local') || emailLower.includes('guest@system')) {
        console.log(`⏭️ Ignoré (compte système): ${email}`);
        results.skipped.push({ email, reason: 'Compte système' });
        continue;
      }

      try {
        const existingSupabaseUser = supabaseEmailsMap.get(emailLower);
        
        if (existingSupabaseUser) {
          // Utilisateur existe déjà dans Supabase, mettre à jour seulement les données
          console.log(`🔄 Mise à jour: ${email} (déjà dans Supabase)`);
          
          const updateData = {
            first_name: firebaseUser.firstName || '',
            last_name: firebaseUser.lastName || '',
            phone: firebaseUser.phone || null,
            avatar_url: firebaseUser.photoURL || null,
            role: existingSupabaseUser.role || firebaseUser.role || determineRole(email),
            loyalty_points: existingSupabaseUser.loyalty_points !== undefined ? existingSupabaseUser.loyalty_points : firebaseUser.loyalty_points,
            email_verified: firebaseUser.emailVerified ? 1 : 0,
            updated_at: new Date().toISOString()
          };
          
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', existingSupabaseUser.id);
          
          if (updateError) {
            throw updateError;
          }
          
          results.updated.push({ email, role: updateData.role });
          console.log(`   ✅ Mis à jour (rôle: ${updateData.role})`);
        } else {
          // Créer l'utilisateur dans Supabase Auth
          // ⚠️ Note: On ne peut pas créer directement dans Supabase Auth sans mot de passe
          // On crée seulement dans la table users, l'utilisateur devra s'inscrire via l'interface
          console.log(`📝 Création: ${email}`);
          
          const role = firebaseUser.role || determineRole(email);
          const newUser = {
            email: email,
            password_hash: '$2b$10$MIGRATION_FROM_FIREBASE_PASSWORD_RESET_REQUIRED', // Hash spécial indiquant qu'un reset est requis
            first_name: firebaseUser.firstName || '',
            last_name: firebaseUser.lastName || '',
            phone: firebaseUser.phone || null,
            avatar_url: firebaseUser.photoURL || null,
            role: role,
            loyalty_points: firebaseUser.loyalty_points || 0,
            is_active: 1,
            email_verified: firebaseUser.emailVerified ? 1 : 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: createdUser, error: insertError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();
          
          if (insertError) {
            if (insertError.code === '23505') {
              // Email déjà existant, essayer de mettre à jour
              console.log(`   ⚠️ Email déjà existant, mise à jour...`);
              const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
              
              if (existingUser) {
                const { error: updateError } = await supabase
                  .from('users')
                  .update({
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    phone: newUser.phone,
                    avatar_url: newUser.avatar_url,
                    role: newUser.role,
                    loyalty_points: newUser.loyalty_points,
                    email_verified: newUser.email_verified,
                    updated_at: newUser.updated_at
                  })
                  .eq('id', existingUser.id);
                
                if (updateError) throw updateError;
                results.updated.push({ email, role });
                console.log(`   ✅ Mis à jour (rôle: ${role})`);
              } else {
                throw insertError;
              }
            } else {
              throw insertError;
            }
          } else {
            results.created.push({ email, role });
            console.log(`   ✅ Créé (rôle: ${role})`);
            console.log(`   ⚠️ L'utilisateur devra utiliser "Mot de passe oublié" pour définir un nouveau mot de passe`);
          }
        }
      } catch (error) {
        console.error(`   ❌ Erreur pour ${email}:`, error.message);
        results.errors.push({ email, error: error.message });
      }
    }

    // 6. Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Créés: ${results.created.length}`);
    console.log(`🔄 Mis à jour: ${results.updated.length}`);
    console.log(`⏭️ Ignorés: ${results.skipped.length}`);
    console.log(`❌ Erreurs: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Erreurs détaillées:');
      results.errors.forEach(err => {
        console.log(`   - ${err.email}: ${err.error}`);
      });
    }
    
    console.log('\n⚠️ IMPORTANT:');
    console.log('   Les utilisateurs devront utiliser "Mot de passe oublié"');
    console.log('   pour définir un nouveau mot de passe dans Supabase Auth.');
    console.log('   Les mots de passe Firebase ne peuvent pas être migrés.');
    console.log('\n✅ Migration terminée !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      created: results.created.length,
      updated: results.updated.length,
      skipped: results.skipped.length,
      errors: results.errors.length
    };
  } catch (error) {
    console.error('❌ Erreur fatale lors de la migration:', error);
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
migrateFirebaseUsersToSupabaseAuth()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur non gérée:', error);
    process.exit(1);
  });

