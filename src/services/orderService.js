import { apiCall } from './api';
import logger from '../utils/logger';
import supabaseService from './supabaseService';

/**
 * Vérifier si on doit utiliser Supabase directement (sur Vercel sans backend)
 */
const shouldUseSupabase = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return !apiUrl || apiUrl === '';
};

/**
 * Service de commandes
 * Connecté à MySQL via API Backend ou directement à Supabase (sur Vercel)
 */

const orderService = {
  /**
   * Créer une commande - Sauvegardée dans MySQL ou Supabase
   * POST /api/orders
   */
  async createOrder(orderData) {
    try {
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 orderService.createOrder - Utilisation Supabase direct');
        const result = await supabaseService.createOrder(orderData);
        if (result.success) {
          logger.log('✅ orderService.createOrder - Commande créée via Supabase:', result.data?.order_number);
          return { success: true, order: result.data, data: result.data };
        } else {
          throw new Error(result.error || 'Erreur création commande Supabase');
        }
      }

      // Backend API disponible
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
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 orderService.updateOrderStatus - Utilisation Supabase direct');
        const result = await supabaseService.updateOrder(orderId, { status });
        if (result.success) {
          logger.log('✅ orderService.updateOrderStatus - Statut mis à jour via Supabase');
          return result;
        } else {
          throw new Error(result.error || 'Erreur mise à jour statut Supabase');
        }
      }
      
      // Backend API disponible
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
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 orderService.getOrderById - Utilisation Supabase direct');
        const result = await supabaseService.getOrderById(orderId);
        if (result.success) {
          logger.log('✅ orderService.getOrderById - Commande récupérée via Supabase');
          return result;
        } else {
          throw new Error(result.error || 'Erreur récupération commande Supabase');
        }
      }
      
      // Backend API disponible
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
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 orderService.getUserOrders - Utilisation Supabase direct');
        
        // Récupérer l'UID Firebase depuis localStorage
        let firebaseUid = null;
        if (typeof window !== 'undefined') {
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              if (user && !user.isGuest) {
                firebaseUid = user.uid || user.id;
              }
            }
          } catch (e) {
            logger.warn('⚠️ Erreur récupération user depuis localStorage:', e);
          }
        }
        
        // Filtrer les commandes par UID Firebase dans les notes
        const filters = {};
        if (firebaseUid) {
          // Note: Supabase ne peut pas filtrer directement dans les notes JSON
          // On récupère toutes les commandes et on filtre côté client
          // Ou on utilise user_id NULL pour Firebase
        }
        
        const result = await supabaseService.getOrders(filters);
        if (result.success) {
          // Filtrer par UID Firebase si nécessaire
          let orders = result.data || [];
          if (firebaseUid) {
            orders = orders.filter(order => 
              !order.user_id && 
              order.notes && 
              order.notes.includes(`[Firebase UID: ${firebaseUid}]`)
            );
          } else {
            // Pour les invités, récupérer les commandes sans user_id
            orders = orders.filter(order => !order.user_id);
          }
          
          logger.log(`✅ orderService.getUserOrders - ${orders.length} commandes récupérées via Supabase`);
          return { success: true, data: orders };
        } else {
          throw new Error(result.error || 'Erreur récupération commandes Supabase');
        }
      }
      
      // Backend API disponible
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
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 orderService.getAllOrders - Utilisation Supabase direct');
        const result = await supabaseService.getOrders(filters);
        if (result.success) {
          logger.log(`✅ orderService.getAllOrders - ${result.data?.length || 0} commandes récupérées via Supabase`);
          return result;
        } else {
          throw new Error(result.error || 'Erreur récupération commandes Supabase');
        }
      }
      
      // Backend API disponible
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
