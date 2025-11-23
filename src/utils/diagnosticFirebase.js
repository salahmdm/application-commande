/**
 * Script de diagnostic Firebase Authentication
 * À exécuter dans la console du navigateur pour diagnostiquer les problèmes
 */

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import logger from './logger';

/**
 * Diagnostic complet de Firebase Authentication
 */
export const diagnosticFirebase = async () => {
  console.log('🔍 === DIAGNOSTIC FIREBASE AUTHENTICATION ===\n');
  
  // 1. Vérifier la configuration
  console.log('1️⃣ Vérification de la configuration Firebase...');
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCwEpdpe1krv8lvFqz_WVo1yYSbKlSdqQ8',
    authDomain: 'prise-de-commande-pos.firebaseapp.com',
    projectId: 'prise-de-commande-pos'
  };
  console.log('   ✅ API Key:', config.apiKey ? 'définie' : '❌ manquante');
  console.log('   ✅ Auth Domain:', config.authDomain);
  console.log('   ✅ Project ID:', config.projectId);
  
  // 2. Vérifier que Firebase Auth est initialisé
  console.log('\n2️⃣ Vérification de l\'initialisation Firebase Auth...');
  if (!auth) {
    console.error('   ❌ Firebase Auth n\'est pas initialisé !');
    return { success: false, error: 'Firebase Auth non initialisé' };
  }
  console.log('   ✅ Firebase Auth est initialisé');
  
  // 3. Vérifier l'état actuel
  console.log('\n3️⃣ État actuel de l\'authentification...');
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log('   ✅ Utilisateur connecté:', currentUser.email);
  } else {
    console.log('   ⚠️ Aucun utilisateur connecté');
  }
  
  return { success: true, config, auth: !!auth, currentUser: currentUser?.email || null };
};

/**
 * Tester la connexion avec un email et mot de passe
 */
export const testFirebaseLogin = async (email, password) => {
  console.log(`🔐 Test de connexion Firebase pour ${email}...`);
  
  if (!auth) {
    console.error('❌ Firebase Auth n\'est pas initialisé');
    return { success: false, error: 'Firebase Auth non initialisé' };
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Connexion réussie !');
    console.log('   - UID:', userCredential.user.uid);
    console.log('   - Email:', userCredential.user.email);
    console.log('   - Email vérifié:', userCredential.user.emailVerified);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.code, error.message);
    
    // Suggestions selon le code d'erreur
    switch (error.code) {
      case 'auth/user-not-found':
        console.log('\n💡 SOLUTION: L\'utilisateur n\'existe pas dans Firebase.');
        console.log('   → Créez l\'utilisateur dans Firebase Console:');
        console.log('   → https://console.firebase.google.com/project/prise-de-commande-pos/authentication/users');
        console.log('   → OU utilisez createFirebaseUser(email, password) dans la console');
        break;
      case 'auth/wrong-password':
        console.log('\n💡 SOLUTION: Le mot de passe est incorrect.');
        console.log('   → Utilisez resetFirebasePassword(email) pour réinitialiser');
        break;
      case 'auth/too-many-requests':
        console.log('\n💡 SOLUTION: Trop de tentatives. Firebase a temporairement bloqué.');
        console.log('   → Attendez 15-30 minutes');
        console.log('   → OU utilisez resetFirebasePassword(email) pour débloquer');
        break;
      case 'auth/invalid-email':
        console.log('\n💡 SOLUTION: L\'email est invalide.');
        console.log('   → Vérifiez le format de l\'email');
        break;
      case 'auth/operation-not-allowed':
        console.log('\n💡 SOLUTION: L\'authentification par email/mot de passe n\'est pas activée.');
        console.log('   → Activez-la dans Firebase Console:');
        console.log('   → https://console.firebase.google.com/project/prise-de-commande-pos/authentication/providers');
        break;
    }
    
    return { success: false, error: error.code, message: error.message };
  }
};

/**
 * Créer un utilisateur dans Firebase
 */
export const createFirebaseUser = async (email, password) => {
  console.log(`📝 Création d'un utilisateur Firebase: ${email}...`);
  
  if (!auth) {
    console.error('❌ Firebase Auth n\'est pas initialisé');
    return { success: false, error: 'Firebase Auth non initialisé' };
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Utilisateur créé avec succès !');
    console.log('   - UID:', userCredential.user.uid);
    console.log('   - Email:', userCredential.user.email);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.code, error.message);
    return { success: false, error: error.code, message: error.message };
  }
};

/**
 * Réinitialiser le mot de passe
 */
export const resetFirebasePassword = async (email) => {
  console.log(`📧 Réinitialisation du mot de passe pour ${email}...`);
  
  if (!auth) {
    console.error('❌ Firebase Auth n\'est pas initialisé');
    return { success: false, error: 'Firebase Auth non initialisé' };
  }
  
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Email de réinitialisation envoyé !');
    console.log('   → Vérifiez votre boîte email');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur:', error.code, error.message);
    return { success: false, error: error.code, message: error.message };
  }
};

// Exposer les fonctions globalement pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.diagnosticFirebase = diagnosticFirebase;
  window.testFirebaseLogin = testFirebaseLogin;
  window.createFirebaseUser = createFirebaseUser;
  window.resetFirebasePassword = resetFirebasePassword;
  
  console.log('💡 Fonctions de diagnostic Firebase disponibles:');
  console.log('   - diagnosticFirebase() : Diagnostic complet');
  console.log('   - testFirebaseLogin(email, password) : Tester une connexion');
  console.log('   - createFirebaseUser(email, password) : Créer un utilisateur');
  console.log('   - resetFirebasePassword(email) : Réinitialiser le mot de passe');
}

