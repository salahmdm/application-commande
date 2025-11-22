import { apiCall } from './api';
import logger from '../utils/logger';

/**
 * Service de commandes
 * Connecté à MySQL via API Backend (endpoints réels uniquement)
 */

const orderService = {
  /**
   * Créer une commande - Sauvegardée dans MySQL
   * POST /api/orders
   */
  async createOrder(orderData) {
    try {
      const response = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      return response;
    } catch (error) {
      logger.error('❌ createOrder - Erreur:', error?.message);
      return { success: false, error: error?.message || 'Erreur création commande' };
    }
  },

  /**
   * Mettre à jour le statut d'une commande (admin/manager)
   * PUT /api/admin/orders/:id/status
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      logger.error('❌ updateOrderStatus - Erreur:', error?.message);
      return { success: false, error: error?.message || 'Erreur mise à jour statut' };
    }
  },

  /**
   * Récupérer une commande par ID (admin/manager)
   * GET /api/admin/orders/:id
   */
  async getOrderById(orderId) {
    try {
      const response = await apiCall(`/admin/orders/${orderId}`);
      return response;
    } catch (error) {
      logger.error('❌ getOrderById - Erreur:', error?.message);
      return { success: false, error: error?.message || 'Erreur récupération commande' };
    }
  },

  /**
   * Récupérer les commandes de l'utilisateur courant (client)
   * GET /api/orders
   */
  async getUserOrders(options = {}) {
    try {
      const response = await apiCall('/orders', { ...(options || {}) });
      return response;
    } catch (error) {
      logger.error('❌ getUserOrders - Erreur:', error?.message);
      return {
        success: false,
        error: error?.message || 'Erreur récupération commandes utilisateur'
      };
    }
  },

  /**
   * Récupérer toutes les commandes (admin/manager)
   * GET /api/admin/orders
   * filters: { status?, orderType? }
   */
  async getAllOrders(filters = {}, options = {}) {
    try {
      let endpoint = '/admin/orders';
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.orderType) params.append('orderType', filters.orderType);

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      logger.log('🔍 [DIAGNOSTIC orderService] Appel API:', endpoint);
      logger.log('🔍 [DIAGNOSTIC orderService] Filtres:', filters);
      logger.log('🔍 [DIAGNOSTIC orderService] Options:', options);

      const response = await apiCall(endpoint, { ...(options || {}) });
      
      logger.log('🔍 [DIAGNOSTIC orderService] Réponse API brute:', {
        success: response?.success,
        hasData: !!response?.data,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
        error: response?.error
      });
      
      return response;
    } catch (error) {
      logger.error('❌ [DIAGNOSTIC orderService] Erreur:', error?.message);
      logger.error('❌ [DIAGNOSTIC orderService] Type erreur:', error?.name);
      logger.error('❌ [DIAGNOSTIC orderService] Stack:', error?.stack);
      return {
        success: false,
        error: error?.message || 'Erreur récupération commandes (admin)'
      };
    }
  },

  /**
   * Annuler une commande (admin/manager)
   * PUT /api/admin/orders/:id/status  { status: 'cancelled', reason }
   */
  async cancelOrder(orderId, reason) {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled', reason })
      });
      return response;
    } catch (error) {
      logger.error('❌ cancelOrder - Erreur:', error?.message);
      return {
        success: false,
        error: error?.message || 'Erreur annulation commande'
      };
    }
  },

  /**
   * Statistiques (admin/manager)
   * GET /api/admin/dashboard
   */
  async getOrderStats() {
    try {
      const response = await apiCall('/admin/dashboard');
      return response;
    } catch (error) {
      logger.error('❌ getOrderStats - Erreur:', error?.message);
      return {
        success: false,
        error: error?.message || 'Erreur récupération statistiques'
      };
    }
  },

  /**
   * Mettre à jour le statut de paiement (admin/manager)
   * PUT /api/admin/orders/:id/payment-status
   */
  async updatePaymentStatus(orderId, status, paymentMethod) {
    try {
      const payload = { status };
      if (paymentMethod) {
        payload.paymentMethod = paymentMethod;
      }

      const response = await apiCall(`/admin/orders/${orderId}/payment-status`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      return response;
    } catch (error) {
      logger.error('❌ updatePaymentStatus - Erreur:', error?.message);
      return {
        success: false,
        error: error?.message || 'Erreur mise à jour paiement'
      };
    }
  },

  /**
   * Workflow de paiement complet (admin/manager)
   * PUT /api/admin/orders/:id/payment-workflow
   */
  async completePaymentWorkflow(orderId, payload) {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/payment-workflow`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      return response;
    } catch (error) {
      logger.error('❌ completePaymentWorkflow - Erreur:', error?.message);
      return {
        success: false,
        error: error?.message || 'Erreur workflow paiement'
      };
    }
  }
};

export default orderService;
