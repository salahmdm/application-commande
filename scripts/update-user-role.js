/**
 * Script pour mettre à jour le rôle d'un utilisateur Firebase
 * Usage: node scripts/update-user-role.js <email> <role>
 * Exemple: node scripts/update-user-role.js admin@blossom.com admin
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../src/config/firebase.js';

const updateUserRole = async (email, newRole) => {
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
      console.log('   → Lien direct: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=prise-de-commande-pos');
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Mettre à jour tous les documents trouvés (normalement il ne devrait y en avoir qu'un)
    const updates = [];
    
    // Utiliser for...of pour attendre chaque mise à jour
    for (const docSnapshot of querySnapshot.docs) {
      const userData = docSnapshot.data();
      console.log(`\n📋 Utilisateur trouvé:`);
      console.log(`   - UID: ${docSnapshot.id}`);
      console.log(`   - Email: ${userData.email || 'N/A'}`);
      console.log(`   - Rôle actuel: ${userData.role || 'client'}`);
      console.log(`   - Nouveau rôle: ${newRole}`);

      try {
        const userRef = doc(db, 'users', docSnapshot.id);
        await updateDoc(userRef, {
          role: newRole,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`✅ Rôle mis à jour avec succès !`);
        updates.push({ uid: docSnapshot.id, success: true });
      } catch (updateError) {
        console.error(`❌ Erreur lors de la mise à jour:`, updateError);
        console.error(`   Code: ${updateError.code}`);
        console.error(`   Message: ${updateError.message}`);
        updates.push({ uid: docSnapshot.id, success: false, error: updateError.message });
      }
    }

    console.log('\n✅ Mise à jour terminée !');
    console.log(`\n💡 L'utilisateur ${email} a maintenant le rôle: ${newRole}`);
    console.log('   → Déconnectez-vous et reconnectez-vous pour voir les changements.');

    return { success: true, updates };
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.code, error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️ Erreur de permissions Firestore.');
      console.log('   → Vérifiez les règles de sécurité Firestore.');
      console.log('   → Assurez-vous que les règles permettent la mise à jour des documents users.');
    }
    
    return { success: false, error: error.code, message: error.message };
  }
};

// Exécution du script
const email = process.argv[2];
const role = process.argv[3];

if (!email || !role) {
  console.error('❌ Usage: node scripts/update-user-role.js <email> <role>');
  console.error('   Exemple: node scripts/update-user-role.js admin@blossom.com admin');
  console.error('\n   Rôles disponibles: client, manager, admin, kiosk');
  process.exit(1);
}

const validRoles = ['client', 'manager', 'admin', 'kiosk'];
if (!validRoles.includes(role)) {
  console.error(`❌ Rôle invalide: ${role}`);
  console.error(`   Rôles disponibles: ${validRoles.join(', ')}`);
  process.exit(1);
}

updateUserRole(email, role)
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

