import { create } from 'zustand';
import orderService from '../services/orderService';

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
      const response = await orderService.getUserOrders();
      if (response.success && response.data) {
        set({ orders: response.data, isLoading: false });
        return response.data;
      } else {
        set({ orders: [], isLoading: false });
        return [];
      }
    } catch (error) {
      console.error('Erreur fetchOrders:', error);
      set({ error: error.message, isLoading: false, orders: [] });
      return [];
    }
  },
  
  // Créer une commande - Sauvegarde dans MySQL
  createOrder: async (orderData) => {
    try {
      console.log('📍 orderStore.createOrder - Appel service');
      const response = await orderService.createOrder(orderData);
      
      console.log('📍 orderStore.createOrder - Réponse:', response);
      console.log('   - response.success:', response?.success);
      console.log('   - response.data:', response?.data);
      console.log('   - response.error:', response?.error);
      
      if (response && response.success && response.data) {
        const newOrder = response.data;
        set(state => ({
          orders: [newOrder, ...state.orders],
          currentOrder: newOrder
        }));
        console.log('✅ orderStore.createOrder - Commande ajoutée au store');
        return newOrder;
      }
      
      // Si le backend retourne success: false avec un message d'erreur
      const errorMessage = response?.error || response?.message || 'Échec de la création de commande';
      console.error('❌ orderStore.createOrder - Échec:', errorMessage);
      throw new Error(errorMessage);
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ orderStore.createOrder - Exception capturée');
      console.error('   Type:', error?.name);
      console.error('   Message:', error?.message);
      console.error('   Stack:', error?.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
      console.error('Erreur updateOrderStatus:', error);
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
