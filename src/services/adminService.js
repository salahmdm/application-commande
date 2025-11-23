import { apiCall } from './api';
import logger from '../utils/logger';
import supabaseService from './supabaseService';

/**
 * Service pour les fonctionnalités Admin
 * Utilise Supabase directement si le backend n'est pas disponible
 */

const shouldUseSupabase = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return !apiUrl || apiUrl === '';
};

export const adminService = {
  /**
   * Récupérer tous les utilisateurs
   */
  async getAllUsers() {
    try {
      if (shouldUseSupabase()) {
        logger.log('🔄 adminService.getAllUsers - Utilisation Supabase direct');
        const { data, error } = await supabaseService.getClient()
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
      }

      const response = await apiCall('/admin/users');
      return response;
    } catch (error) {
      logger.error('Erreur getAllUsers:', error);
      throw error;
    }
  },

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(userId) {
    try {
      if (shouldUseSupabase()) {
        logger.log(`🔄 adminService.getUserById - Utilisation Supabase direct pour ID ${userId}`);
        const { data, error } = await supabaseService.getClient()
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return { success: true, data };
      }

      const response = await apiCall(`/admin/users/${userId}`);
      return response;
    } catch (error) {
      logger.error('Erreur getUserById:', error);
      throw error;
    }
  },

  /**
   * Créer un utilisateur
   */
  async createUser(userData) {
    try {
      if (shouldUseSupabase()) {
        logger.log('🔄 adminService.createUser - Utilisation Supabase direct');
        
        // Convertir le format des données pour Supabase
        const supabaseUserData = {
          email: userData.email,
          password_hash: userData.password ? `$2b$10$TEMP_HASH_${Date.now()}` : '$2b$10$FIREBASE_USER_NO_PASSWORD_REQUIRED',
          first_name: userData.firstName || userData.first_name || '',
          last_name: userData.lastName || userData.last_name || '',
          phone: userData.phone || null,
          role: userData.role || 'client',
          loyalty_points: userData.loyaltyPoints || userData.loyalty_points || 0,
          is_active: userData.isActive !== undefined ? (userData.isActive ? 1 : 0) : 1,
          email_verified: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const result = await supabaseService.createUser(supabaseUserData);
        if (result.success) {
          logger.log('✅ adminService.createUser - Utilisateur créé via Supabase');
          return { success: true, data: result.data };
        } else {
          throw new Error(result.error || 'Erreur création utilisateur Supabase');
        }
      }

      const response = await apiCall('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur createUser:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId, userData) {
    try {
      if (shouldUseSupabase()) {
        logger.log(`🔄 adminService.updateUser - Utilisation Supabase direct pour ID ${userId}`);
        
        // Convertir le format des données pour Supabase
        const supabaseUpdates = {
          email: userData.email,
          first_name: userData.firstName || userData.first_name,
          last_name: userData.lastName || userData.last_name,
          phone: userData.phone,
          role: userData.role,
          loyalty_points: userData.loyaltyPoints || userData.loyalty_points,
          is_active: userData.isActive !== undefined ? (userData.isActive ? 1 : 0) : undefined,
          updated_at: new Date().toISOString()
        };

        // Supprimer les champs undefined
        Object.keys(supabaseUpdates).forEach(key => {
          if (supabaseUpdates[key] === undefined) {
            delete supabaseUpdates[key];
          }
        });

        // Si un nouveau mot de passe est fourni, le hasher (nécessiterait bcrypt côté client)
        // Pour l'instant, on ne met pas à jour le mot de passe via Supabase depuis le frontend
        if (userData.password) {
          logger.warn('⚠️ adminService.updateUser - Mise à jour du mot de passe non supportée via Supabase depuis le frontend');
        }

        const result = await supabaseService.updateUser(userId, supabaseUpdates);
        if (result.success) {
          logger.log('✅ adminService.updateUser - Utilisateur mis à jour via Supabase');
          return { success: true, data: result.data };
        } else {
          throw new Error(result.error || 'Erreur mise à jour utilisateur Supabase');
        }
      }

      const response = await apiCall(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur updateUser:', error);
      throw error;
    }
  },

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId) {
    try {
      if (shouldUseSupabase()) {
        logger.log(`🔄 adminService.deleteUser - Utilisation Supabase direct pour ID ${userId}`);
        const result = await supabaseService.deleteUser(userId);
        if (result.success) {
          logger.log('✅ adminService.deleteUser - Utilisateur supprimé via Supabase');
          return { success: true };
        } else {
          throw new Error(result.error || 'Erreur suppression utilisateur Supabase');
        }
      }

      const response = await apiCall(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      logger.error('Erreur deleteUser:', error);
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
      logger.error('Erreur getAllOrders:', error);
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
      logger.error('Erreur getDashboard:', error);
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
      logger.error('Erreur getInventory:', error);
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
      logger.error('Erreur updateInventory:', error);
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
      logger.error('Erreur getPromoCodes:', error);
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
      logger.error('Erreur createPromoCode:', error);
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
      logger.error('Erreur deletePromoCode:', error);
      throw error;
    }
  },

  /**
   * Récupérer toutes les récompenses de fidélité
   */
  async getLoyaltyRewards() {
    try {
      const response = await apiCall('/admin/loyalty-rewards', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      logger.error('Erreur getLoyaltyRewards:', error);
      throw error;
    }
  },

  /**
   * Créer une récompense de fidélité
   */
  async createLoyaltyReward(rewardData) {
    try {
      const response = await apiCall('/admin/loyalty-rewards', {
        method: 'POST',
        body: JSON.stringify(rewardData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur createLoyaltyReward:', error);
      throw error;
    }
  },

  /**
   * Modifier une récompense de fidélité
   */
  async updateLoyaltyReward(rewardId, rewardData) {
    try {
      const response = await apiCall(`/admin/loyalty-rewards/${rewardId}`, {
        method: 'PUT',
        body: JSON.stringify(rewardData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur updateLoyaltyReward:', error);
      throw error;
    }
  },

  /**
   * Supprimer une récompense de fidélité
   */
  async deleteLoyaltyReward(rewardId) {
    try {
      const response = await apiCall(`/admin/loyalty-rewards/${rewardId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      logger.error('Erreur deleteLoyaltyReward:', error);
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
      logger.error('Erreur getAnalytics:', error);
      throw error;
    }
  }
};

export default adminService;
