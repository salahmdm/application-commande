import { apiCall } from './api';
import logger from '../utils/logger';

/**
 * Service API pour le mode Kiosk
 * Endpoints spécifiques aux bornes tactiles
 */
const kioskService = {
  /**
   * Authentification de la borne
   * POST /api/kiosk/login
   * Retourne un token long durée (stocké en dur sur la borne)
   */
  async login(kioskId, kioskSecret) {
    try {
      logger.log('🔐 kioskService.login - Authentification borne');
      const response = await apiCall('/kiosk/login', {
        method: 'POST',
        body: JSON.stringify({ kioskId, kioskSecret })
      });

      if (response.success && response.token) {
        logger.log('✅ kioskService.login - Authentification réussie');
        return response;
      }

      throw new Error(response.error || 'Échec de l\'authentification kiosk');
    } catch (error) {
      logger.error('❌ kioskService.login - Erreur:', error);
      throw error;
    }
  },

  /**
   * Récupérer les catégories (optimisé pour kiosk)
   * GET /api/kiosk/categories
   * Récupère TOUTES les catégories actives depuis la BDD MySQL
   */
  async getCategories() {
    try {
      logger.log('🔄 kioskService.getCategories - Appel API /kiosk/categories');
      const response = await apiCall('/kiosk/categories');
      
      logger.log('📦 kioskService.getCategories - Réponse:', {
        success: response?.success,
        hasData: !!response?.data,
        count: response?.data?.length || 0
      });
      
      if (response.success && response.data) {
        logger.log(`✅ kioskService.getCategories - ${response.data.length} catégories récupérées depuis la BDD`);
      }
      
      return response;
    } catch (error) {
      logger.error('❌ kioskService.getCategories - Erreur:', error);
      logger.error('   Détails:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  /**
   * Récupérer les produits d'une catégorie (optimisé pour kiosk)
   * GET /api/kiosk/products?categoryId=X
   * Récupère TOUS les produits disponibles depuis la BDD MySQL
   */
  async getProductsByCategory(categoryId = null) {
    try {
      const endpoint = `/kiosk/products${categoryId ? `?categoryId=${categoryId}` : ''}`;
      logger.log(`🔄 kioskService.getProductsByCategory - Appel API ${endpoint}`);
      
      const response = await apiCall(endpoint);
      
      logger.log('📦 kioskService.getProductsByCategory - Réponse:', {
        success: response?.success,
        hasData: !!response?.data,
        count: response?.data?.length || 0,
        categoryId
      });
      
      if (response.success && response.data) {
        logger.log(`✅ kioskService.getProductsByCategory - ${response.data.length} produits récupérés depuis la BDD${categoryId ? ` (catégorie: ${categoryId})` : ' (tous)'}`);
      }
      
      return response;
    } catch (error) {
      logger.error('❌ kioskService.getProductsByCategory - Erreur:', error);
      logger.error('   Détails:', {
        message: error.message,
        stack: error.stack,
        categoryId
      });
      throw error;
    }
  },

  /**
   * Créer une commande depuis la borne
   * POST /api/kiosk/orders
   * Pas de fidélité, pas de compte client
   */
  async createOrder(orderData) {
    try {
      logger.log('📝 kioskService.createOrder - Création commande depuis borne');
      const response = await apiCall('/kiosk/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      if (response.success) {
        logger.log('✅ kioskService.createOrder - Commande créée:', response.data?.orderNumber);
        return response;
      }

      throw new Error(response.error || 'Échec de la création de commande');
    } catch (error) {
      logger.error('❌ kioskService.createOrder - Erreur:', error);
      throw error;
    }
  },

  /**
   * Vérifier le statut d'une commande
   * GET /api/kiosk/orders/:orderNumber
   */
  async getOrderStatus(orderNumber) {
    try {
      const response = await apiCall(`/kiosk/orders/${orderNumber}`);
      return response;
    } catch (error) {
      logger.error('❌ kioskService.getOrderStatus - Erreur:', error);
      throw error;
    }
  },

  /**
   * Valider un code promo
   * POST /api/kiosk/promo-codes/validate
   */
  async validatePromoCode(code, subtotal) {
    try {
      logger.log('🎫 kioskService.validatePromoCode - Validation code:', code);
      const response = await apiCall('/kiosk/promo-codes/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal })
      });

      if (response.success && response.data) {
        logger.log('✅ kioskService.validatePromoCode - Code valide:', response.data);
        return response;
      }

      return { success: false, error: response.error || 'Code promo invalide' };
    } catch (error) {
      logger.error('❌ kioskService.validatePromoCode - Erreur:', error);
      return { success: false, error: error.message || 'Erreur validation code promo' };
    }
  },

  /**
   * Imprimer un ticket de commande
   * POST /api/kiosk/orders/:orderNumber/print
   */
  async printOrderTicket(orderNumber) {
    try {
      logger.log('🖨️ kioskService.printOrderTicket - Impression ticket:', orderNumber);
      const response = await apiCall(`/kiosk/orders/${orderNumber}/print`, {
        method: 'POST'
      });

      if (response.success) {
        logger.log('✅ kioskService.printOrderTicket - Ticket imprimé');
        return response;
      }

      return { success: false, error: response.error || 'Erreur impression ticket' };
    } catch (error) {
      logger.error('❌ kioskService.printOrderTicket - Erreur:', error);
      return { success: false, error: error.message || 'Erreur impression ticket' };
    }
  }
};

export default kioskService;

