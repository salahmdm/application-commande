import { useCallback } from 'react';
import useOrderStore from '../store/orderStore';
import logger from '../utils/logger';

/**
 * Hook personnalisé pour les commandes
 * Connecté à MySQL via API
 */
const useOrders = () => {
  const {
    orders,
    currentOrder,
    isLoading,
    fetchOrders,
    createOrder: storeCreateOrder,
    updateOrderStatus,
    cancelOrder: storeCancelOrder,
    getOrderById,
    getOrdersByUser,
    getOrdersByStatus,
    getPendingOrders,
    getTodayOrders,
    getTodayRevenue,
    getOrderStats
  } = useOrderStore();
  
  // Ne plus charger automatiquement au démarrage
  // Les composants doivent appeler refresh() quand ils en ont besoin
  
  const createOrder = useCallback(async (orderData) => {
    try {
      logger.log('📍 useOrders.createOrder - Appel store');
      const order = await storeCreateOrder(orderData);
      logger.log('✅ useOrders.createOrder - Succès:', order);
      return { success: true, order };
    } catch (error) {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ useOrders.createOrder - Exception capturée');
      logger.error('   Type:', error?.name);
      logger.error('   Message:', error?.message);
      logger.error('   Stack:', error?.stack);
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: false, error: error?.message || 'Erreur inconnue lors de la création de la commande' };
    }
  }, [storeCreateOrder]);
  
  const updateStatus = useCallback(async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      return { success: true };
    } catch (error) {
      logger.error('Erreur updateStatus hook:', error);
      return { success: false, error: error.message };
    }
  }, [updateOrderStatus]);
  
  const cancelOrder = useCallback(async (orderId) => {
    try {
      await storeCancelOrder(orderId);
      return { success: true };
    } catch (error) {
      logger.error('Erreur cancelOrder hook:', error);
      return { success: false, error: error.message };
    }
  }, [storeCancelOrder]);
  
  // Rafraîchir les commandes
  const refresh = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);
  
  return {
    orders,
    currentOrder,
    isLoading,
    createOrder,
    updateStatus,
    cancelOrder,
    getOrderById,
    getOrdersByUser,
    getOrdersByStatus,
    getPendingOrders,
    getTodayOrders,
    getTodayRevenue,
    getOrderStats,
    refresh
  };
};

export default useOrders;
