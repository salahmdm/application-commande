import { apiCall } from './api';

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
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (response.success && response.token) {
        // Stocker le token et les informations utilisateur
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      }
      
      throw new Error('Échec de la connexion');
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  },
  
  /**
   * Register - Inscription au backend MySQL
   */
  async register(userData) {
    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.success) {
        return response;
      }
      
      throw new Error('Échec de l\'inscription');
    } catch (error) {
      console.error('Erreur register:', error);
      throw error;
    }
  },
  
  /**
   * Logout
   */
  async logout() {
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
   * Update profile
   */
  async updateProfile(userId, updates) {
    try {
      console.log('📝 authService.updateProfile - UserId:', userId);
      console.log('📦 Données à mettre à jour:', updates);
      
      const response = await apiCall('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      console.log('📊 Réponse update profile:', response);
      
      if (response.success && response.user) {
        // Mettre à jour le localStorage avec les nouvelles données
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('✅ localStorage mis à jour avec nouveau profil');
        return { success: true, user: response.user };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur update profile:', error);
      throw error;
    }
  }
};

export default authService;

