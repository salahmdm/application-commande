import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../src/config/firebase.js';

/**
 * Lister tous les utilisateurs Firebase depuis Firestore
 */
const listFirebaseUsers = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LISTE DES COMPTES FIREBASE');
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
        uid: doc.id, // UID Firebase
        email: userData.email || 'N/A',
        displayName: userData.displayName || userData.name || 'N/A',
        firstName: userData.firstName || userData.first_name || '',
        lastName: userData.lastName || userData.last_name || '',
        phone: userData.phone || 'N/A',
        role: userData.role || 'client',
        emailVerified: userData.emailVerified || false,
        loyalty_points: userData.loyalty_points || userData.loyaltyPoints || userData.points || 0,
        photoURL: userData.photoURL || userData.avatar_url || 'N/A',
        is_active: userData.is_active !== undefined ? userData.is_active : 1,
        created_at: userData.createdAt || userData.created_at || 'N/A',
        updated_at: userData.updatedAt || userData.updated_at || 'N/A'
      });
    });
    
    console.log(`✅ ${firebaseUsers.length} utilisateur(s) trouvé(s) dans Firebase\n`);

    if (firebaseUsers.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé dans Firebase Firestore.');
      console.log('   → Vérifiez que Firestore contient des utilisateurs dans la collection "users"');
      return { success: true, users: [] };
    }

    // 3. Afficher la liste des utilisateurs
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LISTE DES COMPTES FIREBASE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    firebaseUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   └─ UID: ${user.uid}`);
      console.log(`   └─ Nom: ${user.firstName} ${user.lastName}`.trim() || user.displayName);
      console.log(`   └─ Rôle: ${user.role}`);
      console.log(`   └─ Téléphone: ${user.phone}`);
      console.log(`   └─ Email vérifié: ${user.emailVerified ? '✅ Oui' : '❌ Non'}`);
      console.log(`   └─ Points de fidélité: ${user.loyalty_points}`);
      console.log(`   └─ Actif: ${user.is_active ? '✅ Oui' : '❌ Non'}`);
      console.log(`   └─ Photo: ${user.photoURL !== 'N/A' ? '✅ Oui' : '❌ Non'}`);
      console.log('');
    });

    // 4. Statistiques
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 STATISTIQUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total d'utilisateurs: ${firebaseUsers.length}`);
    console.log(`Admins: ${firebaseUsers.filter(u => u.role === 'admin').length}`);
    console.log(`Managers: ${firebaseUsers.filter(u => u.role === 'manager').length}`);
    console.log(`Clients: ${firebaseUsers.filter(u => u.role === 'client').length}`);
    console.log(`Emails vérifiés: ${firebaseUsers.filter(u => u.emailVerified).length}`);
    console.log(`Comptes actifs: ${firebaseUsers.filter(u => u.is_active).length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 5. Export JSON (optionnel)
    console.log('💾 Export JSON disponible dans la variable `users`');
    
    return {
      success: true,
      total: firebaseUsers.length,
      users: firebaseUsers,
      stats: {
        total: firebaseUsers.length,
        admins: firebaseUsers.filter(u => u.role === 'admin').length,
        managers: firebaseUsers.filter(u => u.role === 'manager').length,
        clients: firebaseUsers.filter(u => u.role === 'client').length,
        emailVerified: firebaseUsers.filter(u => u.emailVerified).length,
        active: firebaseUsers.filter(u => u.is_active).length
      }
    };
  } catch (error) {
    console.error('\n❌ Erreur lors de la récupération des utilisateurs Firebase:', error);
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
      console.error('4. Réessayez : npm run list-firebase-users');
      console.error('\n📖 Guide détaillé : GUIDE_RAPIDE_SYNCHRONISATION.md');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    return { success: false, error: error.message };
  }
};

// Exécuter le script
listFirebaseUsers()
  .then(result => {
    if (result.success) {
      // Exporter les utilisateurs pour utilisation dans la console
      if (typeof global !== 'undefined') {
        global.firebaseUsers = result.users;
        console.log('💡 Les utilisateurs sont disponibles dans `global.firebaseUsers`');
      }
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

