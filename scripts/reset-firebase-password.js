/**
 * Script pour réinitialiser le mot de passe Firebase
 * 
 * Usage: node scripts/reset-firebase-password.js <email>
 * 
 * Ce script envoie un email de réinitialisation de mot de passe.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import firebaseConfig from '../src/config/firebase.js';

const resetPassword = async (email) => {
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
    
    console.log(`📧 Envoi de l'email de réinitialisation pour: ${email}...`);
    await sendPasswordResetEmail(auth, email);
    
    console.log('✅ Email de réinitialisation envoyé avec succès !');
    console.log(`   → Vérifiez la boîte email de ${email}`);
    console.log('   → Cliquez sur le lien dans l\'email pour réinitialiser votre mot de passe.');
    console.log('\n💡 Après avoir réinitialisé, vous pourrez vous connecter.');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error.code, error.message);
    
    switch (error.code) {
      case 'auth/user-not-found':
        console.log('\n💡 SOLUTION: Aucun utilisateur trouvé avec cet email.');
        console.log('   → Créez d\'abord l\'utilisateur:');
        console.log('   → node scripts/create-firebase-user.js <email> <password>');
        break;
      case 'auth/invalid-email':
        console.log('\n💡 SOLUTION: L\'email est invalide.');
        console.log('   → Vérifiez le format de l\'email.');
        break;
      default:
        console.log('\n💡 SOLUTION: Vérifiez la configuration Firebase.');
    }
    
    return { success: false, error: error.code, message: error.message };
  }
};

// Exécution du script
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/reset-firebase-password.js <email>');
  console.error('   Exemple: node scripts/reset-firebase-password.js user@example.com');
  process.exit(1);
}

resetPassword(email)
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

