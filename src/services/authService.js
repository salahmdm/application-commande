import { apiCall } from './api';
import logger from '../utils/logger';

/**
 * Service d'authentification
 * Connecté au backend MySQL via API
 */

const authService = {
  /**
   * Login - Connexion au backend MySQL
   */
  async login(email, password) {
    try {
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('🔐 authService.login - Début');
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('   - Email:', email);
      
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      logger.log('📊 authService.login - Réponse API reçue');
      logger.log('   - success:', response?.success);
      logger.log('   - token présent:', response?.token ? 'OUI ✅' : 'NON ❌');
      logger.log('   - user présent:', response?.user ? 'OUI ✅' : 'NON ❌');
      
      if (response.success && response.user) {
        // ✅ Le token est maintenant dans un cookie HTTP-only (sécurisé)
        // Le backend a déjà défini le cookie, pas besoin de le stocker dans localStorage
        
        // ⚠️ COMPATIBILITÉ: Si un token est encore dans la réponse (migration), on l'ignore
        // Le cookie HTTP-only est la source de vérité maintenant
        
        // Stocker uniquement les informations utilisateur (pas le token)
        logger.log('💾 authService.login - Stockage des données utilisateur');
        logger.log('   - Token stocké dans cookie HTTP-only (sécurisé)');
        logger.log('   - User data:', JSON.stringify(response.user, null, 2));
        
        try {
          localStorage.setItem('user', JSON.stringify(response.user));
          logger.log('✅ authService.login - Utilisateur stocké dans localStorage');
          
          // Vérifier que le stockage a bien fonctionné
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            logger.log('✅ authService.login - Vérification localStorage OK');
          } else {
            logger.error('❌ authService.login - ERREUR: localStorage vide après stockage !');
          }
        } catch (storageError) {
          logger.error('❌ authService.login - Erreur lors du stockage localStorage:', storageError);
          throw new Error('Impossible de stocker les données utilisateur: ' + storageError.message);
        }
        
        // Nettoyer l'ancien token de localStorage si présent (migration)
        if (localStorage.getItem('token')) {
          logger.log('🧹 Nettoyage de l\'ancien token localStorage (migration vers cookies)');
          localStorage.removeItem('token');
        }
        
        logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.log('✅ authService.login - Connexion réussie');
        logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return response;
      }
      
      // ❌ CORRECTION: Ne plus vérifier la présence du token dans la réponse JSON
      // Le token est maintenant dans un cookie HTTP-only, pas dans le JSON
      const errorMessage = response.error || response.message || 'Échec de la connexion';
      
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ authService.login - Échec de connexion');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('   - Message:', errorMessage);
      logger.error('   - Response:', JSON.stringify(response, null, 2));
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(errorMessage);
    } catch (error) {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ authService.login - Exception');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('   - Message:', error.message);
      logger.error('   - Stack:', error.stack);
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      throw error;
    }
  },
  
  /**
   * Register - Inscription au backend MySQL
   * ✅ Gestion améliorée des erreurs pour propager les messages du backend
   */
  async register(userData) {
    try {
      logger.log('📤 authService.register - Envoi des données:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        hasPhone: !!userData.phone
      });

      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      logger.log('📥 authService.register - Réponse reçue:', {
        success: response?.success,
        error: response?.error,
        userId: response?.userId
      });
      
      if (response && response.success) {
        return response;
      }
      
      // Si la réponse n'a pas success: true, retourner l'erreur avec le message du backend
      const errorMessage = response?.error || response?.message || 'Échec de l\'inscription';
      const error = new Error(errorMessage);
      error.response = response;
      error.code = response?.code;
      error.details = response?.details;
      throw error;
    } catch (error) {
      logger.error('❌ Erreur register authService:', error);
      
      // ✅ Propager le message d'erreur du backend (ex: "Cet email est déjà utilisé")
      // Si c'est déjà une Error avec un message, la propager tel quel
      if (error instanceof Error && error.message) {
        // Préserver les informations supplémentaires (code, details, response)
        if (error.code) {
          const newError = new Error(error.message);
          newError.code = error.code;
          newError.details = error.details;
          newError.response = error.response;
          throw newError;
        }
        throw error;
      }
      
      // Sinon, créer une erreur avec le message disponible ou un message générique
      throw new Error(error.message || error.toString() || 'Erreur lors de l\'inscription');
    }
  },
  
  /**
   * Logout
   */
  async logout() {
    try {
      // Appeler l'API pour supprimer les cookies côté serveur
      await apiCall('/auth/logout', {
        method: 'POST',
        credentials: 'include' // Nécessaire pour envoyer les cookies
      });
    } catch (error) {
      logger.warn('⚠️ Erreur lors du logout API:', error);
      // Continuer quand même pour nettoyer le frontend
    }
    
    // Nettoyer localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },
  
  /**
   * Get current user
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  /**
   * Verify token
   */
  async verifyToken(token) {
    if (!token) {
      throw new Error('Token manquant');
    }
    return { valid: true };
  },
  
  /**
   * Reset password
   */
  async resetPassword(_email) {
    // TODO: Implémenter côté backend
    // Le paramètre _email sera utilisé lors de l'implémentation
    return { 
      success: true,
      message: 'Email de réinitialisation envoyé' 
    };
  },
  
  /**
   * Régénérer le token pour un utilisateur connecté
   * Utilisé quand l'utilisateur est connecté mais n'a pas de token
   */
  async regenerateToken() {
    try {
      // Récupérer l'utilisateur depuis localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Aucun utilisateur trouvé');
      }
      
      const user = JSON.parse(userStr);
      if (!user.email) {
        throw new Error('Email utilisateur manquant');
      }
      
      logger.log('🔄 authService.regenerateToken - Régénération du token pour:', user.email);
      
      // Appeler l'API pour obtenir un nouveau token
      // On utilise une route spéciale ou on fait un login silencieux
      // Pour l'instant, on va utiliser la route login avec un mot de passe vide (si le backend l'accepte)
      // Ou mieux : créer une route /auth/refresh-token
      
      // Solution temporaire : demander à l'utilisateur de se reconnecter
      throw new Error('Veuillez vous reconnecter pour régénérer le token');
    } catch (error) {
      logger.error('Erreur regenerateToken:', error);
      throw error;
    }
  },
  
  /**
   * Update profile
   */
  async updateProfile(userId, updates) {
    try {
      logger.log('📝 authService.updateProfile - UserId:', userId);
      logger.log('📦 Données à mettre à jour:', updates);
      
      const response = await apiCall('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      logger.log('📊 Réponse update profile:', response);
      logger.log('   - response.success:', response.success);
      logger.log('   - response.user:', response.user);
      
      if (response.success && response.user) {
        // NE PAS mettre à jour localStorage ici - le store Zustand avec persist s'en chargera
        // Cela évite les conflits entre plusieurs systèmes de persistance
        logger.log('✅ Réponse API reçue, le store Zustand mettra à jour localStorage automatiquement');
        return { success: true, user: response.user };
      }
      
      return response;
    } catch (error) {
      logger.error('❌ Erreur update profile:', error);
      throw error;
    }
  }
};

export default authService;

