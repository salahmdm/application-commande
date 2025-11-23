/**
 * Script pour vérifier le rôle d'un utilisateur dans Firebase Firestore
 * Usage: node scripts/verify-user-role.js <email>
 * Exemple: node scripts/verify-user-role.js admin@blossom.com
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../src/config/firebase.js';

const verifyUserRole = async (email) => {
  try {
    console.log('🔧 Initialisation Firebase...');
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
      console.log('⚠️ Firebase déjà initialisé, utilisation de l\'instance existante');
    }
    const db = getFirestore(app);

    console.log(`🔍 Recherche de l'utilisateur: ${email}...`);
    
    // Rechercher l'utilisateur par email dans Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('\n💡 Vérifications:');
      console.log('   1. L\'utilisateur existe-t-il dans Firebase Authentication ?');
      console.log('   2. L\'utilisateur a-t-il un document dans Firestore (collection "users") ?');
      console.log('   3. L\'email est-il exactement: ' + email);
      console.log('\n⚠️ Si Firestore n\'est pas activé, consultez ACTIVER_FIRESTORE.md');
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Afficher les informations de tous les utilisateurs trouvés
    console.log(`\n📋 ${querySnapshot.size} utilisateur(s) trouvé(s):\n`);
    
    querySnapshot.forEach((docSnapshot) => {
      const userData = docSnapshot.data();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 Document ID (UID): ${docSnapshot.id}`);
      console.log(`📧 Email: ${userData.email || 'N/A'}`);
      console.log(`👤 Nom: ${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.displayName || 'N/A');
      console.log(`🔑 Rôle: ${userData.role || 'client'}`);
      console.log(`📊 Points de fidélité: ${userData.loyalty_points || userData.points || 0}`);
      console.log(`✅ Actif: ${userData.is_active !== false ? 'Oui' : 'Non'}`);
      console.log(`📅 Créé le: ${userData.createdAt || userData.created_at || 'N/A'}`);
      console.log(`🔄 Mis à jour le: ${userData.updatedAt || userData.updated_at || 'N/A'}`);
      
      // Vérification du rôle
      const role = userData.role || 'client';
      console.log('\n🔍 Vérification du rôle:');
      console.log(`   - Rôle actuel: "${role}"`);
      
      if (role === 'admin') {
        console.log('   ✅ Rôle ADMIN détecté - Accès complet');
        console.log('   → Accès aux routes admin:');
        console.log('      - admin-dashboard');
        console.log('      - admin-products');
        console.log('      - admin-orders');
        console.log('      - admin-inventory');
        console.log('      - admin-accounts');
        console.log('      - admin-settings');
        console.log('      - admin-appearance');
        console.log('   → Accès aux routes manager:');
        console.log('      - manager-pos');
        console.log('      - manager-orders');
        console.log('      - manager-stats');
      } else if (role === 'manager') {
        console.log('   ✅ Rôle MANAGER détecté - Accès gestion');
        console.log('   → Accès aux routes manager:');
        console.log('      - manager-pos');
        console.log('      - manager-orders');
        console.log('      - manager-stats');
        console.log('   → Accès aux routes admin limitées:');
        console.log('      - admin-products');
        console.log('      - admin-inventory');
        console.log('   ❌ Pas d\'accès aux routes admin complètes');
      } else if (role === 'client') {
        console.log('   ✅ Rôle CLIENT détecté - Accès standard');
        console.log('   → Accès aux routes client:');
        console.log('      - home');
        console.log('      - products');
        console.log('      - orders');
        console.log('      - profile');
        console.log('   ❌ Pas d\'accès aux routes admin/manager');
      } else if (role === 'kiosk') {
        console.log('   ⚠️ Rôle KIOSK détecté - Accès limité à la borne');
        console.log('   → Ne peut pas utiliser l\'application principale');
      } else {
        console.log(`   ⚠️ Rôle inconnu: "${role}"`);
        console.log('   → Rôles valides: client, manager, admin, kiosk');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    console.log('✅ Vérification terminée !');
    console.log('\n💡 Pour mettre à jour le rôle, utilisez:');
    console.log(`   node scripts/update-user-role.js ${email} <nouveau_role>`);
    console.log('   Rôles disponibles: client, manager, admin, kiosk');

    return { success: true, users: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.code, error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️ Erreur de permissions Firestore.');
      console.log('   → Vérifiez les règles de sécurité Firestore.');
      console.log('   → Assurez-vous que les règles permettent la lecture des documents users.');
    } else if (error.message?.includes('Firestore API has not been used')) {
      console.error('\n⚠️ Firestore n\'est pas activé.');
      console.log('   → Consultez ACTIVER_FIRESTORE.md pour activer Firestore.');
    }
    
    return { success: false, error: error.code, message: error.message };
  }
};

// Exécution du script
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/verify-user-role.js <email>');
  console.error('   Exemple: node scripts/verify-user-role.js admin@blossom.com');
  process.exit(1);
}

verifyUserRole(email)
  .then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

