/**
 * Service d'authentification Firebase
 * Remplace le système MySQL par Firebase Authentication + Firestore
 * ✅ SYNCHRONISATION: Les rôles sont maintenant récupérés depuis Supabase
 */
import firebaseService from './firebaseService';
import supabaseService from './supabaseService';
import logger from '../utils/logger';

const authServiceFirebase = {
  /**
   * Login - Connexion avec Firebase Auth
   */
  async login(email, password) {
    try {
      logger.log('🔐 authServiceFirebase.login - Début');
      
      // ✅ OPTIMISATION: Connexion Firebase Auth (rapide)
      const result = await firebaseService.signInWithEmail(email, password);
      
      if (result.success && result.user) {
        const uid = result.user.uid;
        
        // ✅ OPTIMISATION INSTANTANÉE: Vérifier d'abord le cache localStorage 'user' (le plus rapide)
        let userData = null;
        try {
          const cachedUserStr = localStorage.getItem('user');
          if (cachedUserStr) {
            const cachedUser = JSON.parse(cachedUserStr);
            if (cachedUser && cachedUser.uid === uid) {
              // Utiliser immédiatement les données du cache
              userData = {
                email: cachedUser.email,
                displayName: cachedUser.name || cachedUser.displayName || '',
                firstName: cachedUser.firstName || '',
                lastName: cachedUser.lastName || '',
                role: cachedUser.role || 'client',
                loyalty_points: cachedUser.loyalty_points || cachedUser.points || 0,
                points: cachedUser.points || cachedUser.loyalty_points || 0,
                photoURL: cachedUser.photoURL || null,
                phone: cachedUser.phone || null,
                address: cachedUser.address || null
              };
              logger.log('⚡ authServiceFirebase.login - Utilisation IMMÉDIATE du cache localStorage');
            }
          }
        } catch (e) {
          // Ignorer les erreurs de cache
        }
        
        // ✅ Si pas de cache 'user', vérifier le cache Firestore (instantané aussi)
        if (!userData) {
          const cacheKey = `firestore_user_${uid}`;
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const cacheTime = localStorage.getItem(`${cacheKey}_time`);
              // Cache valide jusqu'à 30 minutes (au lieu de 5)
              if (cacheTime && Date.now() - parseInt(cacheTime) < 1800000) {
                userData = JSON.parse(cached);
                logger.log('⚡ authServiceFirebase.login - Utilisation du cache Firestore');
              }
            }
          } catch (e) {
            // Ignorer les erreurs de cache
          }
        }
        
        // ✅ OPTIMISATION: Synchroniser Firestore en arrière-plan (sans bloquer la connexion)
        // Ne pas attendre Firestore pour la connexion initiale
        const syncFirestore = async () => {
          try {
            const firestoreData = await firebaseService.getDocument('users', uid);
            if (firestoreData) {
              // Mettre à jour le cache
              try {
                const cacheKey = `firestore_user_${uid}`;
                localStorage.setItem(cacheKey, JSON.stringify(firestoreData));
                localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
                
                // Mettre à jour localStorage 'user' aussi
                const updatedUser = {
                  id: uid,
                  uid: uid,
                  email: result.user.email,
                  firstName: firestoreData.firstName || firestoreData.displayName?.split(' ')[0] || '',
                  lastName: firestoreData.lastName || firestoreData.displayName?.split(' ').slice(1).join(' ') || '',
                  name: firestoreData.displayName || result.user.displayName || '',
                  role: firestoreData.role || 'client',
                  loyalty_points: firestoreData.loyalty_points || firestoreData.points || 0,
                  points: firestoreData.points || firestoreData.loyalty_points || 0,
                  emailVerified: result.user.emailVerified || false,
                  photoURL: result.user.photoURL || firestoreData.photoURL,
                  phone: firestoreData.phone || null,
                  address: firestoreData.address || null
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                logger.log('✅ authServiceFirebase.login - Firestore synchronisé en arrière-plan');
              } catch (e) {
                // Ignorer les erreurs de cache
              }
            }
          } catch (firestoreError) {
            // Ignorer les erreurs Firestore (hors ligne, timeout, etc.)
            logger.warn('⚠️ authServiceFirebase.login - Firestore non disponible (synchronisation en arrière-plan ignorée)');
          }
        };
        
        // Lancer la synchronisation en arrière-plan (non bloquante)
        syncFirestore().catch(() => {
          // Ignorer les erreurs
        });
        
        // Si pas de données utilisateur trouvées, créer un profil minimal (instantané)
        if (!userData) {
          logger.warn('⚠️ Utilisateur non trouvé dans les caches, création du profil minimal');
          userData = {
            email: result.user.email,
            displayName: result.user.displayName || '',
            firstName: result.user.displayName?.split(' ')[0] || '',
            lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
            role: 'client',
            loyalty_points: 0,
            points: 0,
            photoURL: result.user.photoURL || null,
            phone: null,
            address: null
          };
          
          // ✅ OPTIMISATION: Créer le profil Firestore en arrière-plan (sans bloquer)
          const createProfile = async () => {
            try {
              const defaultProfile = {
                email: result.user.email,
                displayName: result.user.displayName || '',
                role: 'client',
                loyalty_points: 0,
                points: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              await firebaseService.setDocument('users', uid, defaultProfile);
              logger.log('✅ Profil Firestore créé en arrière-plan');
            } catch (err) {
              logger.warn('⚠️ Erreur création profil Firestore (non bloquant):', err);
            }
          };
          createProfile().catch(() => {
            // Ignorer
          });
        }
        
        // ✅ NOUVEAU: Récupérer les données depuis Supabase (source de vérité pour les rôles)
        let supabaseUserData = null;
        try {
          const supabaseResult = await supabaseService.getUserByEmail(result.user.email);
          if (supabaseResult.success && supabaseResult.data) {
            supabaseUserData = supabaseResult.data;
            logger.log('✅ authServiceFirebase.login - Données Supabase récupérées');
          } else {
            // ✅ SYNCHRONISATION AUTOMATIQUE: Si l'utilisateur n'existe pas dans Supabase, le créer
            logger.warn('⚠️ authServiceFirebase.login - Utilisateur non trouvé dans Supabase, synchronisation automatique...');
            const syncResult = await supabaseService.syncFirebaseUser(result.user, {
              firstName: userData?.firstName || result.user.displayName?.split(' ')[0] || '',
              lastName: userData?.lastName || result.user.displayName?.split(' ').slice(1).join(' ') || '',
              role: userData?.role || 'client',
              loyalty_points: userData?.loyalty_points || userData?.points || 0
            });
            
            if (syncResult.success) {
              logger.log('✅ authServiceFirebase.login - Utilisateur créé dans Supabase:', result.user.email);
              supabaseUserData = syncResult.data;
              // Récupérer les données complètes depuis Supabase
              const updatedSupabaseResult = await supabaseService.getUserByEmail(result.user.email);
              if (updatedSupabaseResult.success && updatedSupabaseResult.data) {
                supabaseUserData = updatedSupabaseResult.data;
              }
            } else {
              logger.error('❌ authServiceFirebase.login - Erreur synchronisation Supabase:', syncResult.error);
            }
          }
        } catch (supabaseError) {
          logger.warn('⚠️ authServiceFirebase.login - Erreur récupération Supabase (non bloquant):', supabaseError);
        }
        
        // Construire l'objet utilisateur avec les données Supabase (priorité) ou Firestore (fallback)
        const user = {
          id: supabaseUserData?.id || uid,
          uid: uid,
          email: result.user.email,
          firstName: supabaseUserData?.first_name || userData?.firstName || result.user.displayName?.split(' ')[0] || '',
          lastName: supabaseUserData?.last_name || userData?.lastName || result.user.displayName?.split(' ').slice(1).join(' ') || '',
          name: supabaseUserData ? `${supabaseUserData.first_name || ''} ${supabaseUserData.last_name || ''}`.trim() : (userData?.displayName || result.user.displayName || ''),
          role: supabaseUserData?.role || userData?.role || 'client', // ✅ Rôle depuis Supabase
          loyalty_points: supabaseUserData?.loyalty_points || userData?.loyalty_points || userData?.points || 0,
          points: supabaseUserData?.loyalty_points || userData?.points || userData?.loyalty_points || 0,
          emailVerified: result.user.emailVerified,
          photoURL: supabaseUserData?.avatar_url || result.user.photoURL || userData?.photoURL,
          phone: supabaseUserData?.phone || userData?.phone || null,
          address: userData?.address || null
        };
        
        // Stocker dans localStorage pour compatibilité
        localStorage.setItem('user', JSON.stringify(user));
        
        logger.log('✅ authServiceFirebase.login - Connexion réussie (données Supabase)');
        return {
          success: true,
          user
        };
      }
      
      throw new Error('Échec de la connexion');
    } catch (error) {
      logger.error('❌ authServiceFirebase.login - Erreur:', error);
      
      // ✅ Améliorer les messages d'erreur avec instructions pour les scripts
      if (error.code === 'auth/too-many-requests') {
        const improvedError = new Error('Trop de tentatives. Solutions: 1) Attendez 15-30 min, 2) "Mot de passe oublié ?", 3) Créez l\'utilisateur: npm run create-firebase-user <email> <password>');
        improvedError.code = error.code;
        throw improvedError;
      }
      
      // ✅ Améliorer les autres messages d'erreur courants
      if (error.code === 'auth/user-not-found') {
        const improvedError = new Error('Aucun compte trouvé avec cet email. Créez-le: npm run create-firebase-user <email> <password>');
        improvedError.code = error.code;
        throw improvedError;
      }
      
      if (error.code === 'auth/wrong-password') {
        const improvedError = new Error('Mot de passe incorrect. Utilisez "Mot de passe oublié ?" ou: npm run reset-firebase-password <email>');
        improvedError.code = error.code;
        throw improvedError;
      }
      
      if (error.code === 'auth/invalid-credential') {
        const improvedError = new Error('Email ou mot de passe incorrect. Solutions: 1) Vérifiez vos identifiants, 2) L\'utilisateur n\'existe peut-être pas - créez-le avec: npm run create-firebase-user <email> <password>, 3) Réinitialisez le mot de passe avec: npm run reset-firebase-password <email>');
        improvedError.code = error.code;
        throw improvedError;
      }
      
      throw error;
    }
  },

  /**
   * Register - Inscription avec Firebase Auth + Firestore
   */
  async register(userData) {
    try {
      logger.log('📝 authServiceFirebase.register - Début');
      
      // Validation
      if (!userData.email || !userData.password) {
        throw new Error('Email et mot de passe requis');
      }
      
      if (userData.password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }
      
      // Inscription avec Firebase Auth
      const displayName = userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData.firstName || userData.lastName || '';
      
      const result = await firebaseService.signUpWithEmail(
        userData.email,
        userData.password,
        displayName
      );
      
      if (result.success && result.user) {
        // ✅ NOUVEAU: Synchroniser avec Supabase au lieu de Firestore
        const userProfile = {
          email: result.user.email,
          displayName: displayName,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: 'client', // Rôle par défaut pour les nouveaux utilisateurs
          loyalty_points: 0,
          points: 0,
          photoURL: result.user.photoURL || null,
          phone: userData.phone || null
        };
        
        // ✅ SYNCHRONISATION AUTOMATIQUE: Créer l'utilisateur dans Supabase
        logger.log('🔄 authServiceFirebase.register - Synchronisation automatique Firebase → Supabase...');
        const syncResult = await supabaseService.syncFirebaseUser(result.user, userProfile);
        
        if (!syncResult.success) {
          logger.error('❌ Erreur synchronisation Supabase lors de l\'inscription:', syncResult.error);
          // Continuer quand même avec les données minimales, mais réessayer plus tard
          logger.warn('⚠️ L\'utilisateur sera synchronisé automatiquement lors de la prochaine connexion');
        } else {
          logger.log('✅ authServiceFirebase.register - Utilisateur créé avec succès dans Supabase:', result.user.email);
        }
        
        // Récupérer les données depuis Supabase (pour avoir le rôle correct et l'ID Supabase)
        const supabaseUser = await supabaseService.getUserByEmail(result.user.email);
        const finalRole = supabaseUser.success && supabaseUser.data ? supabaseUser.data.role : 'client';
        const supabaseId = supabaseUser.success && supabaseUser.data ? supabaseUser.data.id : null;
        
        // Construire l'objet utilisateur avec les données Supabase si disponibles
        const user = {
          id: supabaseId || result.user.uid, // ID Supabase si disponible, sinon UID Firebase
          uid: result.user.uid,
          email: result.user.email,
          firstName: supabaseUser.success && supabaseUser.data ? (supabaseUser.data.first_name || userData.firstName || '') : (userData.firstName || ''),
          lastName: supabaseUser.success && supabaseUser.data ? (supabaseUser.data.last_name || userData.lastName || '') : (userData.lastName || ''),
          name: displayName,
          role: finalRole, // ✅ Rôle depuis Supabase
          loyalty_points: supabaseUser.success && supabaseUser.data ? (supabaseUser.data.loyalty_points || 0) : 0,
          points: supabaseUser.success && supabaseUser.data ? (supabaseUser.data.loyalty_points || 0) : 0,
          emailVerified: false,
          photoURL: result.user.photoURL || null,
          phone: supabaseUser.success && supabaseUser.data ? (supabaseUser.data.phone || userData.phone || null) : (userData.phone || null)
        };
        
        // Stocker dans localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        logger.log('✅ authServiceFirebase.register - Inscription réussie et synchronisée avec Supabase');
        return {
          success: true,
          user,
          userId: result.user.uid
        };
      }
      
      throw new Error('Échec de l\'inscription');
    } catch (error) {
      logger.error('❌ authServiceFirebase.register - Erreur:', error);
      
      // Gérer les erreurs Firebase spécifiques
      if (error.message.includes('email-already-in-use')) {
        throw new Error('Cet email est déjà utilisé');
      }
      if (error.message.includes('weak-password')) {
        throw new Error('Le mot de passe est trop faible');
      }
      if (error.message.includes('invalid-email')) {
        throw new Error('Email invalide');
      }
      
      throw error;
    }
  },

  /**
   * Logout - Déconnexion Firebase
   */
  async logout() {
    try {
      logger.log('🚪 authServiceFirebase.logout - Début');
      
      // ✅ SÉCURITÉ: Récupérer l'UID avant la déconnexion pour nettoyer les caches
      const currentUser = firebaseService.getCurrentUser();
      const uid = currentUser?.uid;
      
      // Déconnexion Firebase
      await firebaseService.signOut();
      
      // ✅ SÉCURITÉ: Marquer la déconnexion comme volontaire
      try {
        localStorage.setItem('logout_voluntary', 'true');
        localStorage.setItem('logout_timestamp', Date.now().toString());
      } catch (e) {
        logger.warn('⚠️ Erreur lors du marquage de déconnexion:', e);
      }
      
      // ✅ SÉCURITÉ: Nettoyer TOUS les caches localStorage
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Nettoyer les caches Firestore de cet utilisateur
        if (uid) {
          localStorage.removeItem(`firestore_user_${uid}`);
          localStorage.removeItem(`firestore_user_${uid}_time`);
        }
        
        // Nettoyer tous les caches Firestore (par sécurité)
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('firestore_user_') || key.startsWith('user_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        logger.warn('⚠️ Erreur lors du nettoyage localStorage:', e);
      }
      
      logger.log('✅ authServiceFirebase.logout - Déconnexion réussie et sécurisée');
      return { success: true };
    } catch (error) {
      logger.error('❌ authServiceFirebase.logout - Erreur:', error);
      
      // ✅ SÉCURITÉ: Nettoyer quand même localStorage même en cas d'erreur
      try {
        localStorage.setItem('logout_voluntary', 'true');
        localStorage.setItem('logout_timestamp', Date.now().toString());
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Nettoyer tous les caches Firestore
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('firestore_user_') || key.startsWith('user_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        logger.warn('⚠️ Erreur lors du nettoyage d\'urgence:', e);
      }
      
      return { success: true }; // Retourner succès même en cas d'erreur
    }
  },

  /**
   * Get current user - Récupérer l'utilisateur depuis Firebase + Firestore
   */
  getCurrentUser() {
    try {
      const firebaseUser = firebaseService.getCurrentUser();
      if (!firebaseUser) {
        // Essayer de récupérer depuis localStorage (fallback)
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
      }
      
      // L'utilisateur Firebase est connecté, mais on doit récupérer les données Firestore
      // Pour l'instant, retourner depuis localStorage si disponible
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      logger.error('❌ authServiceFirebase.getCurrentUser - Erreur:', error);
      return null;
    }
  },

  /**
   * Update profile - Mettre à jour le profil dans Supabase
   */
  async updateProfile(userId, updates) {
    try {
      logger.log('📝 authServiceFirebase.updateProfile - Début');
      
      const firebaseUser = firebaseService.getCurrentUser();
      if (!firebaseUser) {
        throw new Error('Utilisateur non connecté');
      }
      
      // ✅ NOUVEAU: Mettre à jour dans Supabase au lieu de Firestore
      // Récupérer l'utilisateur depuis Supabase
      const supabaseUser = await supabaseService.getUserByEmail(firebaseUser.email);
      
      if (!supabaseUser.success || !supabaseUser.data) {
        throw new Error('Utilisateur non trouvé dans Supabase');
      }
      
      // Préparer les mises à jour pour Supabase
      const supabaseUpdates = {
        first_name: updates.firstName || updates.first_name || supabaseUser.data.first_name,
        last_name: updates.lastName || updates.last_name || supabaseUser.data.last_name,
        avatar_url: updates.photoURL || updates.avatar_url || supabaseUser.data.avatar_url,
        phone: updates.phone !== undefined ? updates.phone : supabaseUser.data.phone,
        updated_at: new Date().toISOString()
      };
      
      // Ne mettre à jour le rôle que si explicitement fourni
      if (updates.role) {
        supabaseUpdates.role = updates.role;
      }
      
      // Ne mettre à jour les points que si explicitement fournis
      if (updates.loyalty_points !== undefined || updates.points !== undefined) {
        supabaseUpdates.loyalty_points = updates.loyalty_points || updates.points || supabaseUser.data.loyalty_points;
      }
      
      // Mettre à jour dans Supabase
      const updateResult = await supabaseService.updateUser(supabaseUser.data.id, supabaseUpdates);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Erreur mise à jour Supabase');
      }
      
      // Mettre à jour le profil Firebase Auth si nécessaire
      if (updates.displayName || (updates.firstName && updates.lastName)) {
        const displayName = updates.displayName || 
          (updates.firstName && updates.lastName ? `${updates.firstName} ${updates.lastName}` : null);
        if (displayName) {
          await firebaseService.updateUserProfile({ displayName });
        }
      }
      
      // Récupérer les données mises à jour depuis Supabase
      const updatedUserData = updateResult.data;
      
      // Construire l'objet utilisateur depuis Supabase
      const user = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: updatedUserData.first_name || '',
        lastName: updatedUserData.last_name || '',
        name: `${updatedUserData.first_name || ''} ${updatedUserData.last_name || ''}`.trim() || firebaseUser.displayName || firebaseUser.email,
        role: updatedUserData.role || 'client', // ✅ Rôle depuis Supabase
        loyalty_points: updatedUserData.loyalty_points || 0,
        points: updatedUserData.loyalty_points || 0,
        emailVerified: firebaseUser.emailVerified,
        photoURL: updatedUserData.avatar_url || firebaseUser.photoURL,
        phone: updatedUserData.phone || null,
        address: null // Supabase n'a pas de champ address dans users
      };
      
      // Mettre à jour localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      logger.log('✅ authServiceFirebase.updateProfile - Profil mis à jour dans Supabase');
      return {
        success: true,
        user
      };
    } catch (error) {
      logger.error('❌ authServiceFirebase.updateProfile - Erreur:', error);
      throw error;
    }
  },

  /**
   * Reset password - Réinitialisation de mot de passe
   */
  async resetPassword(email) {
    try {
      logger.log('📧 authServiceFirebase.resetPassword - Début');
      const result = await firebaseService.sendPasswordReset(email);
      return result;
    } catch (error) {
      logger.error('❌ authServiceFirebase.resetPassword - Erreur:', error);
      throw error;
    }
  },

  /**
   * Verify token - Vérifier le token Firebase (toujours valide si l'utilisateur est connecté)
   */
  async verifyToken() {
    try {
      const user = firebaseService.getCurrentUser();
      if (user) {
        // Récupérer le token ID Firebase
        const token = await user.getIdToken();
        return { valid: true, token };
      }
      return { valid: false };
    } catch (error) {
      logger.error('❌ authServiceFirebase.verifyToken - Erreur:', error);
      return { valid: false };
    }
  },

  /**
   * Regenerate token - Régénérer le token Firebase
   */
  async regenerateToken() {
    try {
      const user = firebaseService.getCurrentUser();
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }
      
      // Forcer la régénération du token
      const token = await user.getIdToken(true);
      return { success: true, token };
    } catch (error) {
      logger.error('❌ authServiceFirebase.regenerateToken - Erreur:', error);
      throw error;
    }
  },

  /**
   * Écouter les changements d'authentification
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour se désabonner
   */
  onAuthStateChange(callback) {
    return firebaseService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // ✅ NOUVEAU: Récupérer les données depuis Supabase (source de vérité pour les rôles)
        try {
          const supabaseUser = await supabaseService.getUserByEmail(firebaseUser.email);
          if (supabaseUser.success && supabaseUser.data) {
            const supabaseData = supabaseUser.data;
            const user = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: supabaseData.first_name || '',
              lastName: supabaseData.last_name || '',
              name: `${supabaseData.first_name || ''} ${supabaseData.last_name || ''}`.trim() || firebaseUser.displayName || firebaseUser.email,
              role: supabaseData.role || 'client', // ✅ Rôle depuis Supabase
              loyalty_points: supabaseData.loyalty_points || 0,
              points: supabaseData.loyalty_points || 0,
              emailVerified: firebaseUser.emailVerified,
              photoURL: supabaseData.avatar_url || firebaseUser.photoURL
            };
            localStorage.setItem('user', JSON.stringify(user));
            callback(user);
          } else {
            // Utilisateur non trouvé dans Supabase, utiliser données Firebase minimales
            const user = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              name: firebaseUser.displayName || firebaseUser.email,
              role: 'client', // Rôle par défaut
              loyalty_points: 0,
              points: 0,
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL
            };
            localStorage.setItem('user', JSON.stringify(user));
            callback(user);
            
            // Synchroniser avec Supabase en arrière-plan
            supabaseService.syncFirebaseUser(firebaseUser, {
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            }).catch(err => {
              logger.warn('⚠️ Erreur synchronisation Supabase (non bloquant):', err);
            });
          }
        } catch (error) {
          logger.error('❌ Erreur récupération données Supabase:', error);
          // Fallback: utiliser données Firebase minimales
          const user = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            name: firebaseUser.displayName || firebaseUser.email,
            role: 'client',
            loyalty_points: 0,
            points: 0,
            emailVerified: firebaseUser.emailVerified,
            photoURL: firebaseUser.photoURL
          };
          localStorage.setItem('user', JSON.stringify(user));
          callback(user);
        }
      } else {
        localStorage.removeItem('user');
        callback(null);
      }
    });
  }
};

export default authServiceFirebase;

