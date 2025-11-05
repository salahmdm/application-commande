import { apiCall } from './api';

/**
 * Service pour les fonctionnalités Admin
 * Connecté au backend MySQL
 */

export const adminService = {
  /**
   * Récupérer tous les utilisateurs
   */
  async getAllUsers() {
    try {
      const response = await apiCall('/admin/users');
      return response;
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      throw error;
    }
  },

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(userId) {
    try {
      const response = await apiCall(`/admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Erreur getUserById:', error);
      throw error;
    }
  },

  /**
   * Créer un utilisateur
   */
  async createUser(userData) {
    try {
      const response = await apiCall('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return response;
    } catch (error) {
      console.error('Erreur createUser:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId, userData) {
    try {
      const response = await apiCall(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      return response;
    } catch (error) {
      console.error('Erreur updateUser:', error);
      throw error;
    }
  },

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId) {
    try {
      const response = await apiCall(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erreur deleteUser:', error);
      throw error;
    }
  },

  /**
   * Récupérer toutes les commandes (avec filtres)
   */
  async getAllOrders(filters = {}) {
    try {
      let endpoint = '/admin/orders';
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.orderType) params.append('orderType', filters.orderType);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Erreur getAllOrders:', error);
      throw error;
    }
  },

  /**
   * Récupérer le dashboard admin (statistiques)
   */
  async getDashboard() {
    try {
      const response = await apiCall('/admin/dashboard');
      return response;
    } catch (error) {
      console.error('Erreur getDashboard:', error);
      throw error;
    }
  },

  /**
   * Récupérer l'inventaire
   */
  async getInventory() {
    try {
      const response = await apiCall('/admin/inventory');
      return response;
    } catch (error) {
      console.error('Erreur getInventory:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour l'inventaire d'un produit
   */
  async updateInventory(productId, quantity, operation = 'add') {
    try {
      const response = await apiCall(`/admin/inventory/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity, operation })
      });
      return response;
    } catch (error) {
      console.error('Erreur updateInventory:', error);
      throw error;
    }
  },

  /**
   * Récupérer les codes promo
   */
  async getPromoCodes() {
    try {
      const response = await apiCall('/admin/promo-codes');
      return response;
    } catch (error) {
      console.error('Erreur getPromoCodes:', error);
      throw error;
    }
  },

  /**
   * Créer un code promo
   */
  async createPromoCode(promoData) {
    try {
      const response = await apiCall('/admin/promo-codes', {
        method: 'POST',
        body: JSON.stringify(promoData)
      });
      return response;
    } catch (error) {
      console.error('Erreur createPromoCode:', error);
      throw error;
    }
  },

  /**
   * Supprimer un code promo
   */
  async deletePromoCode(promoId) {
    try {
      const response = await apiCall(`/admin/promo-codes/${promoId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erreur deletePromoCode:', error);
      throw error;
    }
  },

  /**
   * Récupérer les rapports/analytics
   */
  async getAnalytics(period = 'today') {
    try {
      const response = await apiCall(`/admin/analytics?period=${period}`);
      return response;
    } catch (error) {
      console.error('Erreur getAnalytics:', error);
      throw error;
    }
  }
};

export default adminService;
