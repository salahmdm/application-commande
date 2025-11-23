/**
 * Script de test de connexion Firebase
 * À exécuter dans la console du navigateur pour diagnostiquer les problèmes
 */

export const testFirebaseConnection = async () => {
  console.log('🔥 Test de connexion Firebase...\n');

  try {
    // 1. Vérifier que Firebase est initialisé
    console.log('1️⃣ Vérification de l\'initialisation Firebase...');
    const { auth, db } = await import('../config/firebase');
    
    if (!auth) {
      console.error('❌ Firebase Auth n\'est pas initialisé');
      return;
    }
    
    if (!db) {
      console.error('❌ Firestore n\'est pas initialisé');
      return;
    }
    
    console.log('✅ Firebase est initialisé');

    // 2. Vérifier l'état d'authentification actuel
    console.log('\n2️⃣ État d\'authentification actuel...');
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      console.log('✅ Utilisateur connecté:', currentUser.email);
      console.log('   UID:', currentUser.uid);
      console.log('   Email vérifié:', currentUser.emailVerified);
    } else {
      console.log('❌ Aucun utilisateur connecté');
    }

    // 3. Tester la connexion avec un email/mot de passe
    console.log('\n3️⃣ Test de connexion...');
    console.log('💡 Pour tester la connexion, utilisez :');
    console.log('   testFirebaseLogin("email@example.com", "password")');

    // 4. Vérifier les utilisateurs dans Firestore
    console.log('\n4️⃣ Vérification Firestore...');
    try {
      const { getDocs, collection } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      console.log(`✅ ${snapshot.size} utilisateur(s) trouvé(s) dans Firestore`);
      
      if (snapshot.size > 0) {
        console.log('\n📋 Liste des utilisateurs :');
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`   - ${data.email || 'Email non défini'} (${doc.id})`);
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification Firestore:', error);
    }

    // 5. Résumé
    console.log('\n📊 Résumé :');
    console.log('   Firebase Auth:', auth ? '✅ Initialisé' : '❌ Non initialisé');
    console.log('   Firestore:', db ? '✅ Initialisé' : '❌ Non initialisé');
    console.log('   Utilisateur connecté:', currentUser ? `✅ ${currentUser.email}` : '❌ Aucun');

  } catch (error) {
    console.error('❌ Erreur lors du test Firebase:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }
};

/**
 * Tester la connexion avec email/mot de passe
 */
export const testFirebaseLogin = async (email, password) => {
  console.log(`🔐 Test de connexion avec ${email}...\n`);

  try {
    const { auth } = await import('../config/firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Connexion réussie !');
    console.log('   Email:', user.email);
    console.log('   UID:', user.uid);
    console.log('   Email vérifié:', user.emailVerified);

    return { success: true, user };
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    
    let errorMessage = 'Erreur inconnue';
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Aucun compte trouvé avec cet email';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Mot de passe incorrect';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email invalide';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Identifiants invalides (utilisateur n\'existe pas ou mot de passe incorrect)';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Ce compte a été désactivé';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
        break;
      default:
        errorMessage = error.message;
    }
    
    console.error('   → Solution:', errorMessage);
    console.error('\n💡 Solutions possibles :');
    console.error('   1. Vérifiez que l\'utilisateur existe dans Firebase Authentication');
    console.error('   2. Vérifiez que le mot de passe est correct');
    console.error('   3. Créez l\'utilisateur dans Firebase Console → Authentication → Users');

    return { success: false, error: errorMessage };
  }
};

// Exporter aussi pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.testFirebaseConnection = testFirebaseConnection;
  window.testFirebaseLogin = testFirebaseLogin;
  console.log('💡 Pour tester Firebase, tapez : testFirebaseConnection()');
  console.log('💡 Pour tester la connexion, tapez : testFirebaseLogin("email@example.com", "password")');
}

