/**
 * Service Firebase pour Blossom Café
 * Gestion du stockage, authentification, base de données Firestore et Analytics
 */
import { storage, auth, db, analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider
} from 'firebase/auth';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import logger from '../utils/logger';

// Vérifier que Firebase est initialisé
const isFirebaseAvailable = () => {
  const available = auth !== null && db !== null;
  if (!available) {
    logger.warn('⚠️ Firebase - Services non disponibles');
    logger.warn('   - Auth:', auth !== null ? '✅' : '❌');
    logger.warn('   - Firestore:', db !== null ? '✅' : '❌');
  }
  return available;
};

const firebaseService = {
  /**
   * ============================================
   * STORAGE (Stockage de fichiers)
   * ============================================
   */

  /**
   * Uploader un fichier vers Firebase Storage
   * @param {File} file - Fichier à uploader
   * @param {string} path - Chemin dans le storage (ex: 'products/image.jpg')
   * @param {Function} onProgress - Callback pour suivre la progression
   * @returns {Promise<string>} URL de téléchargement
   */
  async uploadFile(file, path, onProgress = null) {
    try {
      logger.log(`📤 Firebase - Upload fichier: ${path}`);
      
      const storageRef = ref(storage, path);
      
      // Upload du fichier
      const snapshot = await uploadBytes(storageRef, file);
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      logger.log(`✅ Firebase - Fichier uploadé: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      logger.error('❌ Firebase - Erreur upload:', error);
      throw new Error(`Erreur lors de l'upload: ${error.message}`);
    }
  },

  /**
   * Supprimer un fichier de Firebase Storage
   * @param {string} path - Chemin du fichier à supprimer
   */
  async deleteFile(path) {
    try {
      logger.log(`🗑️ Firebase - Suppression fichier: ${path}`);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      logger.log(`✅ Firebase - Fichier supprimé: ${path}`);
    } catch (error) {
      logger.error('❌ Firebase - Erreur suppression:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  },

  /**
   * Obtenir l'URL d'un fichier
   * @param {string} path - Chemin du fichier
   * @returns {Promise<string>} URL de téléchargement
   */
  async getFileURL(path) {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      logger.error('❌ Firebase - Erreur récupération URL:', error);
      throw new Error(`Erreur lors de la récupération de l'URL: ${error.message}`);
    }
  },

  /**
   * Lister les fichiers dans un dossier
   * @param {string} folderPath - Chemin du dossier
   * @returns {Promise<Array>} Liste des fichiers
   */
  async listFiles(folderPath) {
    try {
      const folderRef = ref(storage, folderPath);
      const result = await listAll(folderRef);
      
      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          return {
            name: itemRef.name,
            url,
            size: metadata.size,
            contentType: metadata.contentType,
            updated: metadata.updated
          };
        })
      );
      
      return files;
    } catch (error) {
      logger.error('❌ Firebase - Erreur liste fichiers:', error);
      throw new Error(`Erreur lors de la liste des fichiers: ${error.message}`);
    }
  },

  /**
   * ============================================
   * FIRESTORE (Base de données)
   * ============================================
   */

  /**
   * Créer ou mettre à jour un document
   * @param {string} collectionName - Nom de la collection
   * @param {string} docId - ID du document
   * @param {Object} data - Données du document
   */
  async setDocument(collectionName, docId, data) {
    try {
      logger.log(`📝 Firebase - Set document: ${collectionName}/${docId}`);
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      logger.log(`✅ Firebase - Document sauvegardé: ${collectionName}/${docId}`);
    } catch (error) {
      logger.error('❌ Firebase - Erreur set document:', error);
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  },

  /**
   * Récupérer un document
   * @param {string} collectionName - Nom de la collection
   * @param {string} docId - ID du document
   * @returns {Promise<Object|null>} Document ou null
   */
  async getDocument(collectionName, docId, options = {}) {
    if (!isFirebaseAvailable() || !db) {
      logger.warn('⚠️ Firebase non disponible pour getDocument');
      return null;
    }
    
    // ✅ OPTIMISATION: Timeout optionnel pour éviter les attentes trop longues
    const timeout = options.timeout || 5000; // 5 secondes par défaut
    
    try {
      const docRef = doc(db, collectionName, docId);
      
      // ✅ OPTIMISATION: Créer une promesse avec timeout
      const getDocPromise = getDoc(docRef);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Firestore prend trop de temps')), timeout);
      });
      
      const docSnap = await Promise.race([getDocPromise, timeoutPromise]);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      // ✅ CORRECTION: Gérer spécifiquement l'erreur "client is offline" et timeout
      if (error.code === 'unavailable' || 
          error.message?.includes('offline') || 
          error.message?.includes('Failed to get document because the client is offline') ||
          error.message?.includes('Timeout')) {
        logger.warn('⚠️ Firebase - Client hors ligne ou timeout, impossible de récupérer le document');
        // Ne pas throw, retourner null pour permettre l'utilisation du cache
        return null;
      }
      
      logger.error('❌ Firebase - Erreur get document:', error);
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }
  },

  /**
   * Mettre à jour un document
   * @param {string} collectionName - Nom de la collection
   * @param {string} docId - ID du document
   * @param {Object} data - Données à mettre à jour
   */
  async updateDocument(collectionName, docId, data) {
    try {
      logger.log(`🔄 Firebase - Update document: ${collectionName}/${docId}`);
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      logger.log(`✅ Firebase - Document mis à jour: ${collectionName}/${docId}`);
    } catch (error) {
      logger.error('❌ Firebase - Erreur update document:', error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  },

  /**
   * Supprimer un document
   * @param {string} collectionName - Nom de la collection
   * @param {string} docId - ID du document
   */
  async deleteDocument(collectionName, docId) {
    try {
      logger.log(`🗑️ Firebase - Delete document: ${collectionName}/${docId}`);
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      logger.log(`✅ Firebase - Document supprimé: ${collectionName}/${docId}`);
    } catch (error) {
      logger.error('❌ Firebase - Erreur delete document:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  },

  /**
   * Récupérer tous les documents d'une collection
   * @param {string} collectionName - Nom de la collection
   * @param {Object} options - Options de requête (where, orderBy, limit)
   * @returns {Promise<Array>} Liste des documents
   */
  async getCollection(collectionName, options = {}) {
    try {
      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef);

      // Appliquer les filtres
      if (options.where) {
        options.where.forEach(({ field, operator, value }) => {
          q = query(q, where(field, operator, value));
        });
      }

      // Appliquer le tri
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
      }

      // Appliquer la limite
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return documents;
    } catch (error) {
      logger.error('❌ Firebase - Erreur get collection:', error);
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }
  },

  /**
   * ============================================
   * AUTHENTIFICATION
   * ============================================
   */

  /**
   * Obtenir l'utilisateur actuellement connecté
   * @returns {Object|null} Utilisateur ou null
   */
  getCurrentUser() {
    if (!isFirebaseAvailable() || !auth) {
      return null;
    }
    return auth.currentUser;
  },

  /**
   * Vérifier si un utilisateur est connecté
   * @returns {boolean}
   */
  isAuthenticated() {
    return auth.currentUser !== null;
  },

  /**
   * Connexion avec email et mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Utilisateur connecté
   */
  async signInWithEmail(email, password) {
    try {
      // ✅ Vérifier que Firebase Auth est initialisé
      if (!auth) {
        logger.error('❌ Firebase Auth - Non initialisé');
        throw new Error('Firebase Authentication n\'est pas initialisé. Vérifiez la configuration Firebase.');
      }
      
      // ✅ Vérifier que l'email et le mot de passe sont fournis
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }
      
      logger.log(`🔐 Firebase Auth - Connexion: ${email}`);
      logger.log(`   - Auth Domain: ${auth.config?.authDomain || 'non défini'}`);
      logger.log(`   - API Key: ${auth.config?.apiKey ? 'définie' : 'non définie'}`);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Enregistrer l'événement Analytics
      this.logEvent('login', {
        method: 'email'
      });
      
      logger.log(`✅ Firebase Auth - Connexion réussie: ${user.email}`);
      logger.log(`   - UID: ${user.uid}`);
      logger.log(`   - Email vérifié: ${user.emailVerified}`);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL
        }
      };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur connexion:', error);
      logger.error('   - Code:', error.code);
      logger.error('   - Message:', error.message);
      
      // ✅ Diagnostic supplémentaire pour les erreurs de configuration
      if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/invalid-api-key') {
        logger.error('❌ Firebase Auth - Clé API invalide. Vérifiez la configuration dans Firebase Console.');
        throw new Error('Configuration Firebase invalide. Contactez l\'administrateur.');
      }
      
      if (error.code === 'auth/operation-not-allowed') {
        logger.error('❌ Firebase Auth - Méthode d\'authentification non autorisée. Activez l\'authentification par email/mot de passe dans Firebase Console.');
        throw new Error('L\'authentification par email/mot de passe n\'est pas activée. Contactez l\'administrateur.');
      }
      
      if (error.code === 'auth/unauthorized-domain') {
        logger.error('❌ Firebase Auth - Domaine non autorisé. Ajoutez ce domaine dans Firebase Console > Authentication > Settings > Authorized domains.');
        throw new Error('Ce domaine n\'est pas autorisé pour l\'authentification. Contactez l\'administrateur.');
      }
      
      let errorMessage = 'Erreur de connexion';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cet email. Créez-le: npm run create-firebase-user <email> <password>';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect. Utilisez "Mot de passe oublié ?" ou: npm run reset-firebase-password <email>';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide. Vérifiez le format de l\'email.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé. Contactez l\'administrateur.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Solutions: 1) Attendez 15-30 min, 2) "Mot de passe oublié ?", 3) Créez l\'utilisateur: npm run create-firebase-user <email> <password>';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'L\'authentification par email/mot de passe n\'est pas activée dans Firebase. Activez-la dans Firebase Console > Authentication > Sign-in method.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'Ce domaine n\'est pas autorisé. Ajoutez ce domaine dans Firebase Console > Authentication > Settings > Authorized domains.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
          break;
        default:
          errorMessage = error.message || 'Erreur de connexion';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Inscription avec email et mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @param {string} displayName - Nom d'affichage (optionnel)
   * @returns {Promise<Object>} Utilisateur créé
   */
  async signUpWithEmail(email, password, displayName = null) {
    try {
      logger.log(`📝 Firebase Auth - Inscription: ${email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Mettre à jour le profil si un nom est fourni
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Envoyer l'email de vérification
      await sendEmailVerification(user);
      
      // Enregistrer l'événement Analytics
      this.logEvent('sign_up', {
        method: 'email'
      });
      
      logger.log(`✅ Firebase Auth - Inscription réussie: ${user.email}`);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL
        }
      };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur inscription:', error);
      let errorMessage = 'Erreur d\'inscription';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cet email est déjà utilisé';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe est trop faible (minimum 6 caractères)';
          break;
        default:
          errorMessage = error.message || 'Erreur d\'inscription';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Déconnexion
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      logger.log('🚪 Firebase Auth - Déconnexion');
      await signOut(auth);
      
      // Enregistrer l'événement Analytics
      this.logEvent('logout');
      
      logger.log('✅ Firebase Auth - Déconnexion réussie');
      return { success: true };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur déconnexion:', error);
      throw new Error(`Erreur de déconnexion: ${error.message}`);
    }
  },

  /**
   * Envoyer un email de réinitialisation de mot de passe
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<void>}
   */
  async sendPasswordReset(email) {
    try {
      logger.log(`📧 Firebase Auth - Envoi réinitialisation mot de passe: ${email}`);
      await sendPasswordResetEmail(auth, email);
      
      logger.log('✅ Firebase Auth - Email de réinitialisation envoyé');
      return { success: true, message: 'Email de réinitialisation envoyé' };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur réinitialisation:', error);
      let errorMessage = 'Erreur lors de l\'envoi de l\'email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cet email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        default:
          errorMessage = error.message || 'Erreur lors de l\'envoi de l\'email';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Mettre à jour le mot de passe de l'utilisateur connecté
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<void>}
   */
  async updateUserPassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }
      
      logger.log('🔑 Firebase Auth - Mise à jour mot de passe');
      await updatePassword(user, newPassword);
      
      logger.log('✅ Firebase Auth - Mot de passe mis à jour');
      return { success: true };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur mise à jour mot de passe:', error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  },

  /**
   * Mettre à jour le profil de l'utilisateur
   * @param {Object} profileData - Données du profil (displayName, photoURL)
   * @returns {Promise<void>}
   */
  async updateUserProfile(profileData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }
      
      logger.log('👤 Firebase Auth - Mise à jour profil');
      await updateProfile(user, profileData);
      
      logger.log('✅ Firebase Auth - Profil mis à jour');
      return { success: true };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur mise à jour profil:', error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  },

  /**
   * Envoyer un email de vérification
   * @returns {Promise<void>}
   */
  async sendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }
      
      logger.log('📧 Firebase Auth - Envoi email de vérification');
      await sendEmailVerification(user);
      
      logger.log('✅ Firebase Auth - Email de vérification envoyé');
      return { success: true, message: 'Email de vérification envoyé' };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur envoi email:', error);
      throw new Error(`Erreur lors de l'envoi: ${error.message}`);
    }
  },

  /**
   * Connexion avec Google
   * @returns {Promise<Object>} Utilisateur connecté
   */
  async signInWithGoogle() {
    try {
      logger.log('🔐 Firebase Auth - Connexion Google');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Enregistrer l'événement Analytics
      this.logEvent('login', {
        method: 'google'
      });
      
      logger.log(`✅ Firebase Auth - Connexion Google réussie: ${user.email}`);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL
        }
      };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur connexion Google:', error);
      throw new Error(`Erreur de connexion Google: ${error.message}`);
    }
  },

  /**
   * Connexion avec Facebook
   * @returns {Promise<Object>} Utilisateur connecté
   */
  async signInWithFacebook() {
    try {
      logger.log('🔐 Firebase Auth - Connexion Facebook');
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Enregistrer l'événement Analytics
      this.logEvent('login', {
        method: 'facebook'
      });
      
      logger.log(`✅ Firebase Auth - Connexion Facebook réussie: ${user.email}`);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL
        }
      };
    } catch (error) {
      logger.error('❌ Firebase Auth - Erreur connexion Facebook:', error);
      throw new Error(`Erreur de connexion Facebook: ${error.message}`);
    }
  },

  /**
   * Écouter les changements d'état d'authentification
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour se désabonner
   */
  onAuthStateChange(callback) {
    if (!isFirebaseAvailable() || !auth) {
      logger.warn('⚠️ Firebase Auth non disponible, callback immédiat avec null');
      // Appeler le callback avec null immédiatement si Firebase n'est pas disponible
      setTimeout(() => callback(null), 0);
      // Retourner une fonction de nettoyage vide
      return () => {};
    }
    
    try {
      return onAuthStateChanged(auth, (user) => {
        if (user) {
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            photoURL: user.photoURL
          });
        } else {
          callback(null);
        }
      });
    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation de onAuthStateChanged:', error);
      setTimeout(() => callback(null), 0);
      return () => {};
    }
  },

  /**
   * ============================================
   * ANALYTICS
   * ============================================
   */

  /**
   * Enregistrer un événement Analytics
   * @param {string} eventName - Nom de l'événement
   * @param {Object} eventParams - Paramètres de l'événement
   */
  logEvent(eventName, eventParams = {}) {
    if (analytics) {
      try {
        logEvent(analytics, eventName, eventParams);
        logger.log(`📊 Firebase Analytics - Événement: ${eventName}`, eventParams);
      } catch (error) {
        logger.error('❌ Firebase Analytics - Erreur log event:', error);
      }
    }
  },

  /**
   * Enregistrer un événement de vue de page
   * @param {string} pageName - Nom de la page
   * @param {string} pageTitle - Titre de la page
   */
  logPageView(pageName, pageTitle = null) {
    this.logEvent('page_view', {
      page_path: pageName,
      page_title: pageTitle || pageName
    });
  },

  /**
   * Enregistrer un événement d'ajout au panier
   * @param {string} productId - ID du produit
   * @param {string} productName - Nom du produit
   * @param {number} price - Prix du produit
   * @param {string} category - Catégorie du produit
   */
  logAddToCart(productId, productName, price, category = null) {
    this.logEvent('add_to_cart', {
      currency: 'EUR',
      value: price,
      items: [{
        item_id: productId,
        item_name: productName,
        price: price,
        category: category
      }]
    });
  },

  /**
   * Enregistrer un événement de commande
   * @param {string} orderId - ID de la commande
   * @param {number} total - Montant total
   * @param {Array} items - Liste des items
   */
  logPurchase(orderId, total, items = []) {
    this.logEvent('purchase', {
      transaction_id: orderId,
      value: total,
      currency: 'EUR',
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  },

  /**
   * Enregistrer un événement de recherche
   * @param {string} searchTerm - Terme de recherche
   */
  logSearch(searchTerm) {
    this.logEvent('search', {
      search_term: searchTerm
    });
  }
};

export default firebaseService;

