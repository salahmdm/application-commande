/**
 * Script pour créer un utilisateur Firebase via l'API REST
 * 
 * Usage: node scripts/create-firebase-user.js <email> <password>
 * 
 * Note: Ce script nécessite que l'authentification par email/mot de passe
 * soit activée dans Firebase Console.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../src/config/firebase.js';

const createUser = async (email, password) => {
  try {
    console.log('🔧 Initialisation Firebase...');
    let app;
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      if (error.code === 'app/duplicate-app') {
        // Firebase est déjà initialisé, récupérer l'instance existante
        const { getApps } = await import('firebase/app');
        const apps = getApps();
        app = apps[0];
        console.log('⚠️ Firebase déjà initialisé, utilisation de l\'instance existante');
      } else {
        throw error;
      }
    }
    const auth = getAuth(app);
    
    console.log(`📝 Création de l'utilisateur: ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Utilisateur créé avec succès !');
    console.log('   - UID:', userCredential.user.uid);
    console.log('   - Email:', userCredential.user.email);
    console.log('   - Email vérifié:', userCredential.user.emailVerified);
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants.');
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.code, error.message);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        console.log('\n💡 SOLUTION: Cet email est déjà utilisé.');
        console.log('   → L\'utilisateur existe déjà dans Firebase.');
        console.log('   → Vous pouvez vous connecter directement.');
        break;
      case 'auth/invalid-email':
        console.log('\n💡 SOLUTION: L\'email est invalide.');
        console.log('   → Vérifiez le format de l\'email.');
        break;
      case 'auth/operation-not-allowed':
        console.log('\n💡 SOLUTION: L\'authentification par email/mot de passe n\'est pas activée.');
        console.log('   → Activez-la dans Firebase Console:');
        console.log('   → https://console.firebase.google.com/project/prise-de-commande-pos/authentication/providers');
        break;
      case 'auth/weak-password':
        console.log('\n💡 SOLUTION: Le mot de passe est trop faible.');
        console.log('   → Utilisez un mot de passe d\'au moins 6 caractères.');
        break;
      default:
        console.log('\n💡 SOLUTION: Vérifiez la configuration Firebase.');
        console.log('   → Firebase Console: https://console.firebase.google.com/project/prise-de-commande-pos');
    }
    
    return { success: false, error: error.code, message: error.message };
  }
};

// Exécution du script
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('❌ Usage: node scripts/create-firebase-user.js <email> <password>');
  console.error('   Exemple: node scripts/create-firebase-user.js user@example.com mypassword123');
  process.exit(1);
}

createUser(email, password)
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

