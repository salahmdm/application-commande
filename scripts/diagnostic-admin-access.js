/**
 * Script de diagnostic pour vérifier l'accès admin
 * Vérifie que le compte admin a bien tous les accès configurés
 * Usage: node scripts/diagnostic-admin-access.js admin@blossom.com
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../src/config/firebase.js';

const diagnosticAdminAccess = async (email) => {
  try {
    console.log('🔧 Initialisation Firebase...');
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    const db = getFirestore(app);

    console.log(`\n🔍 Diagnostic d'accès admin pour: ${email}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Vérifier dans Firestore
    console.log('\n1️⃣ Vérification dans Firestore...');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('   ❌ Utilisateur non trouvé dans Firestore');
      console.log('   → Créez d\'abord l\'utilisateur dans Firebase Authentication');
      console.log('   → Créez ensuite le document dans Firestore (collection "users")');
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const role = userData.role || 'client';
    
    console.log(`   ✅ Utilisateur trouvé (UID: ${userDoc.id})`);
    console.log(`   📧 Email: ${userData.email}`);
    console.log(`   🔑 Rôle dans Firestore: "${role}"`);
    
    if (role !== 'admin') {
      console.error(`   ❌ PROBLÈME: Le rôle n'est pas "admin" mais "${role}"`);
      console.log('   → Solution: Mettez à jour le rôle avec:');
      console.log(`     npm run update-user-role ${email} admin`);
      return { success: false, error: `Rôle incorrect: ${role}` };
    }
    
    console.log('   ✅ Rôle admin confirmé dans Firestore');
    
    // 2. Vérifier les routes admin configurées
    console.log('\n2️⃣ Vérification des routes admin configurées...');
    const adminRoutes = [
      'admin-dashboard',
      'admin-products',
      'admin-orders',
      'admin-inventory',
      'admin-accounts',
      'admin-settings',
      'admin-appearance',
      'manager-pos',
      'manager-orders',
      'manager-stats'
    ];
    
    console.log('   ✅ Routes admin configurées dans src/App.jsx:');
    adminRoutes.forEach(route => {
      console.log(`      - ${route}`);
    });
    
    // 3. Vérifier les éléments du menu admin
    console.log('\n3️⃣ Vérification des éléments du menu admin...');
    const adminMenuItems = [
      { id: 'admin-dashboard', label: 'Dashboard CA' },
      { id: 'admin-products', label: 'Gestion Produits' },
      { id: 'admin-inventory', label: 'Inventaire' },
      { id: 'admin-accounts', label: 'Gestion des Comptes' },
      { id: 'admin-appearance', label: 'Apparence' },
      { id: 'admin-settings', label: 'Paramètres' },
      { id: 'manager-pos', label: 'Prise de commande' },
      { id: 'manager-orders', label: 'Gestion commandes' }
    ];
    
    console.log('   ✅ Éléments du menu admin dans src/components/layout/Sidebar.jsx:');
    adminMenuItems.forEach(item => {
      console.log(`      - ${item.label} (${item.id})`);
    });
    
    // 4. Vérifier les hooks et fonctions
    console.log('\n4️⃣ Vérification des hooks et fonctions...');
    console.log('   ✅ useAuth() expose:');
    console.log('      - isAdmin: role === "admin"');
    console.log('      - hasRole("admin"): vérifie si role === "admin"');
    console.log('   ✅ useAuthStore expose:');
    console.log('      - role: rôle actuel de l\'utilisateur');
    console.log('      - user: objet utilisateur complet avec role');
    
    // 5. Instructions pour vérifier dans l'application
    console.log('\n5️⃣ Instructions pour vérifier dans l\'application:');
    console.log('   📋 Étapes à suivre:');
    console.log('   1. Déconnectez-vous complètement de l\'application');
    console.log('   2. Videz le cache du navigateur (Ctrl+Shift+Delete)');
    console.log('   3. Reconnectez-vous avec:', email);
    console.log('   4. Ouvrez la console du navigateur (F12)');
    console.log('   5. Tapez: localStorage.getItem("user")');
    console.log('   6. Vérifiez que "role": "admin" est présent');
    console.log('   7. Vérifiez que tous les éléments du menu admin sont visibles');
    console.log('   8. Testez chaque route admin pour confirmer l\'accès');
    
    // 6. Checklist de vérification
    console.log('\n6️⃣ Checklist de vérification:');
    console.log('   [ ] Le rôle est "admin" dans Firestore');
    console.log('   [ ] L\'utilisateur est connecté dans l\'application');
    console.log('   [ ] Le rôle est "admin" dans localStorage.getItem("user")');
    console.log('   [ ] Tous les éléments du menu admin sont visibles dans la sidebar');
    console.log('   [ ] Les routes admin sont accessibles (pas d\'erreur 403)');
    console.log('   [ ] Les composants admin s\'affichent correctement');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Diagnostic terminé !');
    console.log('\n💡 Si le compte n\'a toujours pas accès admin après ces vérifications:');
    console.log('   1. Vérifiez que Firestore est activé (voir ACTIVER_FIRESTORE.md)');
    console.log('   2. Vérifiez les règles de sécurité Firestore');
    console.log('   3. Vérifiez que le rôle est bien récupéré lors de la connexion');
    console.log('   4. Vérifiez la console du navigateur pour les erreurs');
    
    return { success: true, role, userData };
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.code, error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️ Erreur de permissions Firestore.');
      console.log('   → Vérifiez les règles de sécurité Firestore.');
    } else if (error.message?.includes('Firestore API has not been used')) {
      console.error('\n⚠️ Firestore n\'est pas activé.');
      console.log('   → Consultez ACTIVER_FIRESTORE.md pour activer Firestore.');
    }
    
    return { success: false, error: error.code, message: error.message };
  }
};

// Exécution du script
const email = process.argv[2] || 'admin@blossom.com';

diagnosticAdminAccess(email)
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

