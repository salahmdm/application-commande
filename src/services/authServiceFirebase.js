/**
 * Service d'authentification Firebase
 * Remplace le système MySQL par Firebase Authentication + Firestore
 */
import firebaseService from './firebaseService';
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
        
        // ✅ OPTIMISATION: Vérifier le cache Firestore d'abord (instantané)
        const cacheKey = `firestore_user_${uid}`;
        let userData = null;
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            userData = JSON.parse(cached);
            // Vérifier que le cache n'est pas trop ancien (max 5 minutes)
            const cacheTime = localStorage.getItem(`${cacheKey}_time`);
            if (cacheTime && Date.now() - parseInt(cacheTime) < 300000) {
              logger.log('⚡ authServiceFirebase.login - Utilisation du cache Firestore');
            } else {
              userData = null; // Cache expiré
            }
          }
        } catch (e) {
          // Ignorer les erreurs de cache
        }
        
        // Si pas de cache valide, récupérer depuis Firestore
        if (!userData) {
          userData = await firebaseService.getDocument('users', uid);
          
          // Mettre en cache
          if (userData) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(userData));
              localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
            } catch (e) {
              // Ignorer les erreurs de cache
            }
          }
        }
        
        // Si l'utilisateur n'existe pas dans Firestore, créer un profil par défaut
        if (!userData) {
          logger.warn('⚠️ Utilisateur non trouvé dans Firestore, création du profil par défaut');
          const defaultProfile = {
            email: result.user.email,
            displayName: result.user.displayName || '',
            role: 'client',
            loyalty_points: 0,
            points: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // ✅ OPTIMISATION: Créer le profil sans attendre la confirmation
          firebaseService.setDocument('users', uid, defaultProfile).catch(err => {
            logger.warn('⚠️ Erreur création profil Firestore:', err);
          });
          
          userData = defaultProfile;
        }
        
        // Construire l'objet utilisateur avec les données Firestore
        const user = {
          id: uid,
          uid: uid,
          email: result.user.email,
          firstName: userData.firstName || userData.displayName?.split(' ')[0] || '',
          lastName: userData.lastName || userData.displayName?.split(' ').slice(1).join(' ') || '',
          name: userData.displayName || result.user.displayName || '',
          role: userData.role || 'client',
          loyalty_points: userData.loyalty_points || userData.points || 0,
          points: userData.points || userData.loyalty_points || 0,
          emailVerified: result.user.emailVerified,
          photoURL: result.user.photoURL || userData.photoURL,
          phone: userData.phone || null,
          address: userData.address || null
        };
        
        // Stocker dans localStorage pour compatibilité
        localStorage.setItem('user', JSON.stringify(user));
        
        logger.log('✅ authServiceFirebase.login - Connexion réussie');
        return {
          success: true,
          user
        };
      }
      
      throw new Error('Échec de la connexion');
    } catch (error) {
      logger.error('❌ authServiceFirebase.login - Erreur:', error);
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
        // Créer le profil utilisateur dans Firestore
        const userProfile = {
          email: result.user.email,
          displayName: displayName,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: 'client', // Rôle par défaut pour les nouveaux utilisateurs
          loyalty_points: 0,
          points: 0,
          phone: userData.phone || null,
          address: userData.address || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerified: false
        };
        
        await firebaseService.setDocument('users', result.user.uid, userProfile);
        
        // Construire l'objet utilisateur
        const user = {
          id: result.user.uid,
          uid: result.user.uid,
          email: result.user.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          name: displayName,
          role: 'client',
          loyalty_points: 0,
          points: 0,
          emailVerified: false,
          phone: userData.phone || null
        };
        
        // Stocker dans localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        logger.log('✅ authServiceFirebase.register - Inscription réussie');
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
      
      // Déconnexion Firebase
      await firebaseService.signOut();
      
      // Nettoyer localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      logger.log('✅ authServiceFirebase.logout - Déconnexion réussie');
      return { success: true };
    } catch (error) {
      logger.error('❌ authServiceFirebase.logout - Erreur:', error);
      // Nettoyer quand même localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
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
   * Update profile - Mettre à jour le profil dans Firestore
   */
  async updateProfile(userId, updates) {
    try {
      logger.log('📝 authServiceFirebase.updateProfile - Début');
      
      const firebaseUser = firebaseService.getCurrentUser();
      if (!firebaseUser) {
        throw new Error('Utilisateur non connecté');
      }
      
      // Mettre à jour dans Firestore
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await firebaseService.updateDocument('users', firebaseUser.uid, updatedData);
      
      // Mettre à jour le profil Firebase Auth si nécessaire
      if (updates.displayName || (updates.firstName && updates.lastName)) {
        const displayName = updates.displayName || 
          (updates.firstName && updates.lastName ? `${updates.firstName} ${updates.lastName}` : null);
        if (displayName) {
          await firebaseService.updateUserProfile({ displayName });
        }
      }
      
      // Récupérer les données mises à jour
      const updatedUserData = await firebaseService.getDocument('users', firebaseUser.uid);
      
      // Construire l'objet utilisateur
      const user = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: updatedUserData.firstName || '',
        lastName: updatedUserData.lastName || '',
        name: updatedUserData.displayName || firebaseUser.displayName || '',
        role: updatedUserData.role || 'client',
        loyalty_points: updatedUserData.loyalty_points || updatedUserData.points || 0,
        points: updatedUserData.points || updatedUserData.loyalty_points || 0,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL || updatedUserData.photoURL,
        phone: updatedUserData.phone || null,
        address: updatedUserData.address || null
      };
      
      // Mettre à jour localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      logger.log('✅ authServiceFirebase.updateProfile - Profil mis à jour');
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
        // Récupérer les données depuis Firestore
        try {
          const userData = await firebaseService.getDocument('users', firebaseUser.uid);
          if (userData) {
            const user = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              name: userData.displayName || firebaseUser.displayName || '',
              role: userData.role || 'client',
              loyalty_points: userData.loyalty_points || userData.points || 0,
              points: userData.points || userData.loyalty_points || 0,
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL || userData.photoURL
            };
            localStorage.setItem('user', JSON.stringify(user));
            callback(user);
          } else {
            callback(firebaseUser);
          }
        } catch (error) {
          logger.error('❌ Erreur récupération données Firestore:', error);
          callback(firebaseUser);
        }
      } else {
        localStorage.removeItem('user');
        callback(null);
      }
    });
  }
};

export default authServiceFirebase;

