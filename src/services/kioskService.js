import { apiCall } from './api';
import productService from './productService';
import supabaseService from './supabaseService';
import logger from '../utils/logger';

/**
 * Service API pour le mode Kiosk
 * Utilise Supabase directement si disponible, sinon passe par le backend API
 */
const kioskService = {
  /**
   * Vérifier si on doit utiliser Supabase directement (production Vercel)
   * ou le backend API (développement local)
   */
  shouldUseSupabase() {
    const hasBackend = !!import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '';
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      return false;
    }

    // Si pas de backend configuré, utiliser Supabase directement
    if (!hasBackend) {
      return true;
    }

    return false;
  },

  /**
   * Authentification de la borne
   * POST /api/kiosk/login
   * Retourne un token long durée (stocké en dur sur la borne)
   */
  async login(kioskId, kioskSecret) {
    // L'authentification kiosk nécessite le backend
    if (this.shouldUseSupabase()) {
      logger.warn('⚠️ kioskService.login - Authentification kiosk nécessite le backend');
      // En mode Supabase direct, on peut simuler une authentification réussie
      return { success: true, token: 'kiosk-direct-mode', kiosk: { id: kioskId } };
    }

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
   * Utilise Supabase directement si disponible, sinon passe par le backend
   */
  async getCategories() {
    // Utiliser Supabase directement si on est en production sans backend
    if (this.shouldUseSupabase()) {
      try {
        logger.log('🔄 kioskService.getCategories - Utilisation Supabase direct');
        const result = await supabaseService.getCategories({ isActive: 1 });
        
        if (result.success && result.data) {
          logger.log(`✅ kioskService.getCategories - ${result.data.length} catégories récupérées depuis Supabase`);
          return result;
        }
        
        throw new Error(result.error || 'Erreur récupération catégories');
      } catch (error) {
        logger.error('❌ kioskService.getCategories - Erreur Supabase:', error);
        throw error;
      }
    }

    // Sinon, utiliser le backend API
    try {
      logger.log('🔄 kioskService.getCategories - Appel API /kiosk/categories');
      const response = await apiCall('/kiosk/categories');
      
      logger.log('📦 kioskService.getCategories - Réponse:', {
        success: response?.success,
        hasData: !!response?.data,
        count: response?.data?.length || 0
      });
      
      if (response.success && response.data?.length) {
        logger.log(`✅ kioskService.getCategories - ${response.data.length} catégories récupérées depuis la BDD`);
        return response;
      }

      logger.warn('⚠️ kioskService.getCategories - Réponse vide, fallback /categories');
      const fallbackResponse = await productService.getCategories();
      return fallbackResponse;
    } catch (error) {
      logger.error('❌ kioskService.getCategories - Erreur:', error);
      logger.error('   Détails:', {
        message: error.message,
        stack: error.stack
      });

      if (error?.status === 404 || error?.status === 500 || error?.name === 'ConnectionError') {
        logger.warn('⚠️ kioskService.getCategories - Fallback route publique /categories');
        const fallbackResponse = await productService.getCategories();
        return fallbackResponse;
      }

      throw error;
    }
  },

  /**
   * Récupérer les produits d'une catégorie (optimisé pour kiosk)
   * Utilise Supabase directement si disponible, sinon passe par le backend
   */
  async getProductsByCategory(categoryId = null) {
    // Utiliser Supabase directement si on est en production sans backend
    if (this.shouldUseSupabase()) {
      try {
        logger.log(`🔄 kioskService.getProductsByCategory - Utilisation Supabase direct (catégorie: ${categoryId || 'toutes'})`);
        
        const filters = { isActive: 1 };
        if (categoryId) {
          filters.categoryId = categoryId;
        }
        
        const result = await supabaseService.getProducts(filters);
        
        if (result.success && result.data) {
          logger.log(`✅ kioskService.getProductsByCategory - ${result.data.length} produits récupérés depuis Supabase${categoryId ? ` (catégorie: ${categoryId})` : ' (tous)'}`);
          return result;
        }
        
        throw new Error(result.error || 'Erreur récupération produits');
      } catch (error) {
        logger.error('❌ kioskService.getProductsByCategory - Erreur Supabase:', error);
        throw error;
      }
    }

    // Sinon, utiliser le backend API
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
      
      if (response.success && response.data?.length) {
        logger.log(`✅ kioskService.getProductsByCategory - ${response.data.length} produits récupérés depuis la BDD${categoryId ? ` (catégorie: ${categoryId})` : ' (tous)'}`);
        return response;
      }

      logger.warn('⚠️ kioskService.getProductsByCategory - Réponse vide, fallback productService');
      const fallbackProducts = await productService.getAllProducts(categoryId ? { category: categoryId } : {});
      return fallbackProducts;
    } catch (error) {
      logger.error('❌ kioskService.getProductsByCategory - Erreur:', error);
      logger.error('   Détails:', {
        message: error.message,
        stack: error.stack,
        categoryId
      });

      if (error?.status === 404 || error?.status === 500 || error?.name === 'ConnectionError') {
        logger.warn('⚠️ kioskService.getProductsByCategory - Fallback route /products');
        const fallbackProducts = await productService.getAllProducts(categoryId ? { category: categoryId } : {});
        return fallbackProducts;
      }

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

