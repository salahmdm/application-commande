import { apiCall } from './api';

/**
 * Service de commandes
 * Connecté à MySQL via API Backend
 */

const orderService = {
  /**
   * Créer une commande - Sauvegardée dans MySQL
   */
  async createOrder(orderData) {
    try {
      console.log('🚀 orderService.createOrder appelé');
      console.log('📦 Données à envoyer:', orderData);
      console.log('🔗 URL:', 'POST /api/orders');
      
      // Ajouter le nom invité si présent dans les données
      const orderPayload = { ...orderData };
      
      // Récupérer le nom invité depuis localStorage si c'est un invité
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.isGuest && user.first_name) {
          orderPayload.guestName = user.first_name;
        }
      }
      
      const response = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });
      
      console.log('📊 Réponse reçue:', response);
      return response;
    } catch (error) {
      console.error('❌❌❌ Erreur createOrder:', error);
      console.error('   Type:', error.name);
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  },
  
  /**
   * Mettre à jour le statut d'une commande
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      console.error('Erreur updateOrderStatus:', error);
      throw error;
    }
  },
  
  /**
   * Récupérer une commande par ID
   */
  async getOrderById(orderId) {
    try {
      const response = await apiCall(`/admin/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('Erreur getOrderById:', error);
      throw error;
    }
  },
  
  /**
   * Récupérer les commandes d'un utilisateur
   */
  async getUserOrders() {
    try {
      const response = await apiCall('/orders');
      return response;
    } catch (error) {
      console.error('Erreur getUserOrders:', error);
      throw error;
    }
  },
  
  /**
   * Récupérer toutes les commandes (admin/manager)
   */
  async getAllOrders(filters = {}) {
    try {
      let endpoint = '/admin/orders';
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.orderType) params.append('orderType', filters.orderType);
      
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
   * Annuler une commande
   */
  async cancelOrder(orderId, reason) {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled', reason })
      });
      return response;
    } catch (error) {
      console.error('Erreur cancelOrder:', error);
      throw error;
    }
  },
  
  /**
   * Obtenir les statistiques des commandes
   */
  async getOrderStats() {
    try {
      const response = await apiCall('/admin/dashboard');
      return response;
    } catch (error) {
      console.error('Erreur getOrderStats:', error);
      throw error;
    }
  },
  
  /**
   * Valider un code promo
   */
  async validatePromoCode(code, orderAmount) {
    try {
      const response = await apiCall('/admin/promo-codes');
      
      if (response.success && response.data) {
        const promo = response.data.find(p => 
          p.code === code.toUpperCase() && 
          p.is_active &&
          (!p.min_order_amount || orderAmount >= parseFloat(p.min_order_amount)) &&
          (!p.max_uses || p.uses_count < p.max_uses) &&
          (!p.valid_until || new Date(p.valid_until) > new Date())
        );
        
        if (!promo) {
          throw new Error('Code promo invalide ou expiré');
        }
        
        return {
          success: true,
          data: promo
        };
      }
      
      throw new Error('Code promo invalide');
    } catch (error) {
      console.error('Erreur validatePromoCode:', error);
      throw error;
    }
  }
};

export default orderService;
