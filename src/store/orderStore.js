import { create } from 'zustand';
import orderService from '../services/orderService';
import logger from '../utils/logger';

/**
 * Store des commandes
 * Connecté à la base de données MySQL via API
 */
const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  
  // Charger toutes les commandes depuis MySQL
  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('📋 orderStore.fetchOrders - Début chargement');
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const response = await orderService.getUserOrders();
      
      logger.log('📋 orderStore.fetchOrders - Réponse reçue');
      logger.log('   - success:', response?.success);
      logger.log('   - data type:', typeof response?.data);
      logger.log('   - data is array:', Array.isArray(response?.data));
      logger.log('   - nombre de commandes:', response?.data?.length || 0);
      
      if (response && response.success && Array.isArray(response.data)) {
        logger.log('✅ orderStore.fetchOrders - Commandes récupérées:', response.data.length);
        if (response.data.length > 0) {
          logger.log('   - Première commande:', {
            id: response.data[0].id,
            order_number: response.data[0].order_number,
            user_id: response.data[0].user_id,
            total: response.data[0].total_amount,
            status: response.data[0].status
          });
        }
        set({ orders: response.data, isLoading: false, error: null });
        return response.data;
      } else {
        logger.warn('⚠️ orderStore.fetchOrders - Réponse invalide ou tableau vide');
        logger.warn('   - response:', JSON.stringify(response, null, 2));
        set({ orders: [], isLoading: false, error: null });
        return [];
      }
    } catch (error) {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ orderStore.fetchOrders - Erreur');
      logger.error('   Message:', error.message);
      logger.error('   Stack:', error.stack);
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      set({ error: error.message, isLoading: false, orders: [] });
      return [];
    }
  },
  
  // Créer une commande - Sauvegarde dans MySQL
  createOrder: async (orderData) => {
    try {
      logger.log('📍 orderStore.createOrder - Appel service');
      const response = await orderService.createOrder(orderData);
      
      logger.log('📍 orderStore.createOrder - Réponse:', response);
      logger.log('   - response.success:', response?.success);
      logger.log('   - response.data:', response?.data);
      logger.log('   - response.error:', response?.error);
      
      if (response && response.success && response.data) {
        const newOrder = response.data;
        set(state => ({
          orders: [newOrder, ...state.orders],
          currentOrder: newOrder
        }));
        logger.log('✅ orderStore.createOrder - Commande ajoutée au store');
        return newOrder;
      }
      
      // Si le backend retourne success: false avec un message d'erreur
      const errorMessage = response?.error || response?.message || 'Échec de la création de commande';
      logger.error('❌ orderStore.createOrder - Échec:', errorMessage);
      throw new Error(errorMessage);
    } catch (error) {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ orderStore.createOrder - Exception capturée');
      logger.error('   Type:', error?.name);
      logger.error('   Message:', error?.message);
      logger.error('   Stack:', error?.stack);
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      throw error;
    }
  },
  
  // Mettre à jour le statut d'une commande - Sauvegarde dans MySQL
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
              : order
          )
        }));
        return response;
      }
    } catch (error) {
      logger.error('Erreur updateOrderStatus:', error);
      throw error;
    }
  },
  
  // Annuler une commande
  cancelOrder: async (orderId) => {
    return await get().updateOrderStatus(orderId, 'cancelled');
  },
  
  // Récupérer une commande par ID
  getOrderById: (orderId) => {
    return get().orders.find(order => order.id === parseInt(orderId));
  },
  
  // Récupérer les commandes par utilisateur
  getOrdersByUser: (userId) => {
    return get().orders.filter(order => order.user_id === parseInt(userId));
  },
  
  // Récupérer les commandes par statut
  getOrdersByStatus: (status) => {
    return get().orders.filter(order => order.status === status);
  },
  
  // Récupérer les commandes en attente/préparation
  getPendingOrders: () => {
    return get().orders.filter(order => 
      ['pending', 'preparing'].includes(order.status)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },
  
  // Analytics - Commandes du jour
  getTodayOrders: () => {
    const today = new Date().toDateString();
    return get().orders.filter(order => 
      new Date(order.created_at).toDateString() === today
    );
  },
  
  // Revenus du jour
  getTodayRevenue: () => {
    return get().getTodayOrders().reduce((sum, order) => 
      order.status !== 'cancelled' ? sum + parseFloat(order.total_amount || 0) : sum, 0
    );
  },
  
  // Statistiques des commandes
  getOrderStats: () => {
    const orders = get().orders;
    const today = get().getTodayOrders();
    
    return {
      total: orders.length,
      today: today.length,
      pending: get().getOrdersByStatus('pending').length,
      preparing: get().getOrdersByStatus('preparing').length,
      ready: get().getOrdersByStatus('ready').length,
      served: get().getOrdersByStatus('served').length,
      cancelled: get().getOrdersByStatus('cancelled').length,
      revenue: orders.reduce((sum, o) => 
        o.status !== 'cancelled' ? sum + parseFloat(o.total_amount || 0) : sum, 0
      ),
      todayRevenue: get().getTodayRevenue()
    };
  }
}));

export default useOrderStore;
