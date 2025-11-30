import { apiCall } from './api';
import logger from '../utils/logger';
import supabaseService from './supabaseService';

/**
 * Vérifier si on doit utiliser Supabase directement (sur Vercel sans backend)
 */
const shouldUseSupabase = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocalhost) {
    return false;
  }

  return !apiUrl || apiUrl === '';
};

let forceSupabaseAdmin = false;
const preferSupabaseAdmin = () => {
  const envForce = import.meta?.env?.VITE_FORCE_SUPABASE_ADMIN === 'true';
  return forceSupabaseAdmin || envForce || shouldUseSupabase();
};

const fetchAllProductsFromSupabase = async () => {
  const result = await supabaseService.getProducts({ isActive: undefined });
  if (!result.success) {
    throw new Error(result.error || 'Erreur Supabase');
  }
  return result;
};

const normalizeListResponse = (response, fallbackKey = 'data') => {
  if (!response) {
    return { success: false, data: [], error: 'Réponse vide' };
  }

  if (response.success && Array.isArray(response.data)) {
    return { success: true, data: response.data };
  }

  if (response.success && response.data && Array.isArray(response.data[fallbackKey])) {
    return { success: true, data: response.data[fallbackKey] };
  }

  if (Array.isArray(response)) {
    return { success: true, data: response };
  }

  if (Array.isArray(response[fallbackKey])) {
    return { success: true, data: response[fallbackKey] };
  }

  if (response.success && Array.isArray(response.products)) {
    return { success: true, data: response.products };
  }

  if (response.success && Array.isArray(response.categories)) {
    return { success: true, data: response.categories };
  }

  if (Array.isArray(response.results)) {
    return { success: true, data: response.results };
  }

  if (Array.isArray(response.items)) {
    return { success: true, data: response.items };
  }

  if (response.success && response.data && typeof response.data === 'object') {
    const candidate = Object.values(response.data).find((value) => Array.isArray(value));
    if (candidate) {
      return { success: true, data: candidate };
    }
  }

  return {
    success: false,
    data: [],
    error: response.error || response.message || 'Réponse API invalide'
  };
};

/**
 * Service de gestion des produits
 * Connecté au backend MySQL via API ou directement à Supabase (sur Vercel)
 */

const productService = {
  /**
   * Récupérer tous les produits (Route publique - pas besoin d'auth)
   */
  async getAllProducts(filters = {}) {
    try {
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 productService.getAllProducts - Utilisation Supabase direct');
        const supabaseFilters = {
          isActive: filters.featured ? undefined : 1, // Par défaut, seulement actifs (1 = true en smallint)
        };
        if (filters.category) {
          supabaseFilters.categoryId = filters.category;
        }
        if (filters.search) {
          supabaseFilters.search = filters.search;
        }
        const result = await supabaseService.getProducts(supabaseFilters);
        if (result.success) {
          logger.log(`✅ productService.getAllProducts - ${result.data.length} produits récupérés depuis Supabase`);
          return result;
        } else {
          throw new Error(result.error || 'Erreur Supabase');
        }
      }

      logger.log('🔄 productService.getAllProducts - Appel API');
      let endpoint = '/products';  // ✅ Route publique
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.featured) params.append('featured', 'true');
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      logger.log('   → Endpoint:', endpoint);
      try {
        const response = await apiCall(endpoint);
        const normalized = normalizeListResponse(response, 'products');
        if (normalized.success && normalized.data.length > 0) {
          logger.log('   ✅ Réponse reçue:', normalized.data.length, 'produits');
          return normalized;
        }
        logger.warn('⚠️ productService.getAllProducts - Réponse vide, tentative fallback /kiosk/products');
      } catch (primaryError) {
        logger.warn('⚠️ productService.getAllProducts - Erreur route /products, tentative fallback /kiosk/products', primaryError);
      }

      const kioskParams = new URLSearchParams();
      if (filters.category) kioskParams.append('categoryId', filters.category);
      if (filters.search) kioskParams.append('search', filters.search);
      if (filters.featured) kioskParams.append('featured', 'true');
      let kioskEndpoint = '/kiosk/products';
      if (kioskParams.toString()) {
        kioskEndpoint += `?${kioskParams.toString()}`;
      }
      try {
        const fallbackResponse = await apiCall(kioskEndpoint);
        const fallbackNormalized = normalizeListResponse(fallbackResponse, 'products');
        if (fallbackNormalized.success && fallbackNormalized.data.length > 0) {
          logger.log('   ✅ Fallback /kiosk/products:', fallbackNormalized.data.length, 'produits');
          return fallbackNormalized;
        }
      } catch (kioskError) {
        logger.warn('⚠️ productService.getAllProducts - Erreur fallback /kiosk/products:', kioskError);
      }
      
      // ✅ Fallback final: Utiliser Supabase directement si toutes les routes API ont échoué
      logger.warn('⚠️ productService.getAllProducts - Toutes les routes API ont échoué, utilisation Supabase direct');
      const supabaseFilters = {
        isActive: filters.featured ? undefined : 1,
      };
      if (filters.category) {
        supabaseFilters.categoryId = filters.category;
      }
      if (filters.search) {
        supabaseFilters.search = filters.search;
      }
      const supabaseResult = await supabaseService.getProducts(supabaseFilters);
      if (supabaseResult.success) {
        logger.log(`✅ productService.getAllProducts - ${supabaseResult.data.length} produits récupérés depuis Supabase (fallback final)`);
        return supabaseResult;
      } else {
        throw new Error(supabaseResult.error || 'Erreur Supabase');
      }
    } catch (error) {
      logger.error('❌ Erreur getAllProducts:', error);
      // ✅ Dernière tentative: Utiliser Supabase directement si toutes les routes API ont échoué
      if (error?.message?.includes('fetch') || error?.message?.includes('Network') || error?.message?.includes('Failed to fetch')) {
        logger.warn('⚠️ productService.getAllProducts - Erreur réseau détectée, tentative Supabase direct');
        try {
          const supabaseFilters = {
            isActive: filters.featured ? undefined : 1,
          };
          if (filters.category) {
            supabaseFilters.categoryId = filters.category;
          }
          if (filters.search) {
            supabaseFilters.search = filters.search;
          }
          const supabaseResult = await supabaseService.getProducts(supabaseFilters);
          if (supabaseResult.success) {
            logger.log(`✅ productService.getAllProducts - ${supabaseResult.data.length} produits récupérés depuis Supabase (fallback réseau)`);
            return supabaseResult;
          }
        } catch (supabaseError) {
          logger.error('❌ productService.getAllProducts - Erreur Supabase fallback:', supabaseError);
        }
      }
      throw error;
    }
  },

  /**
   * Récupérer TOUS les produits pour l'admin (actifs ET inactifs)
   */
  async getAllProductsAdmin() {
    try {
      // ✅ VERCEL / Auth Supabase: Utiliser Supabase directement si pas de backend ou forcé
      if (preferSupabaseAdmin()) {
        logger.log('🔄 productService.getAllProductsAdmin - Utilisation Supabase direct (tous les produits)');
        const result = await fetchAllProductsFromSupabase();
        logger.log(`✅ productService.getAllProductsAdmin - ${result.data.length} produits récupérés depuis Supabase (tous)`);
        return result;
      }

      logger.log('🔄 productService.getAllProductsAdmin - Appel API route admin');
      const response = await apiCall('/admin/products');  // ✅ Route admin
      const normalized = normalizeListResponse(response);
      logger.log('   ✅ Réponse reçue:', normalized.data.length, 'produits (tous)');
      return normalized;
    } catch (error) {
      // ✅ Gestion des erreurs d'authentification avec fallback automatique vers Supabase
      // ✅ AMÉLIORATION: Extraire toutes les propriétés possibles de l'erreur
      const errorStatus = error?.status || error?.statusCode || error?.responseStatus || null;
      const errorMessage = String(error?.message || error?.error || '').toLowerCase();
      const errorDataMessage = String(error?.errorData?.error || error?.errorData?.message || '').toLowerCase();
      const fullErrorMessage = `${errorMessage} ${errorDataMessage}`.toLowerCase();
      
      // ✅ AMÉLIORATION: Détection plus robuste des erreurs d'authentification
      // Vérifier le statut HTTP, le flag isAuthError, et les messages d'erreur
      const isAuthError = errorStatus === 401 || 
                         errorStatus === 403 || 
                         error?.isAuthError === true ||
                         fullErrorMessage.includes('401') || 
                         fullErrorMessage.includes('403') ||
                         fullErrorMessage.includes('accès refusé') ||
                         fullErrorMessage.includes('forbidden') ||
                         fullErrorMessage.includes('droits admin requis') ||
                         fullErrorMessage.includes('droits admin') ||
                         fullErrorMessage.includes('unauthorized') ||
                         fullErrorMessage.includes('access denied');
      
      logger.debug('🔍 getAllProductsAdmin - Analyse erreur:', {
        errorStatus,
        errorMessage: error?.message,
        isAuthError,
        hasErrorData: !!error?.errorData,
        errorDataMessage: error?.errorData?.error || error?.errorData?.message
      });
      
      if (isAuthError) {
        logger.warn('🔐 productService.getAllProductsAdmin - Accès refusé (401/403), fallback automatique vers Supabase');
        logger.debug('   Détails erreur:', { 
          status: errorStatus, 
          statusCode: error?.statusCode,
          message: error?.message,
          errorData: error?.errorData,
          errorObject: {
            name: error?.name,
            message: error?.message,
            status: error?.status,
            statusCode: error?.statusCode
          }
        });
        
        // ✅ Activer le flag pour éviter les prochains appels backend inutiles
        forceSupabaseAdmin = true;
        
        try {
          logger.log('🔄 Tentative de fallback Supabase...');
          const fallback = await fetchAllProductsFromSupabase();
          logger.log(`✅ productService.getAllProductsAdmin - ${fallback.data?.length || 0} produits récupérés depuis Supabase (fallback)`);
          return fallback;
        } catch (supabaseError) {
          logger.error('❌ productService.getAllProductsAdmin - Fallback Supabase échoué:', supabaseError);
          // Relancer l'erreur Supabase si le fallback échoue
          throw supabaseError;
        }
      } else {
        logger.error('❌ Erreur getAllProductsAdmin (non-auth):', {
          message: error?.message,
          status: errorStatus,
          name: error?.name,
          stack: error?.stack
        });
        throw error;
      }
    }
  },

  /**
   * Récupérer tous les produits (route authentifiée mais non restreinte)
   */
  async getAllProductsAuthenticated() {
    try {
      logger.log('🔄 productService.getAllProductsAuthenticated - Route /products/all');
      const response = await apiCall('/products/all');
      const normalized = normalizeListResponse(response);
      logger.log('   ✅ Réponse reçue:', normalized.data.length, 'produits (auth)');
      return normalized;
    } catch (error) {
      logger.error('❌ Erreur getAllProductsAuthenticated:', error);
      throw error;
    }
  },

  /**
   * Récupérer un produit par ID (Route publique)
   */
  async getProductById(id) {
    try {
      // Pour l'instant, on continue d'utiliser /admin/products/:id
      // On pourrait ajouter /api/products/:id côté backend si nécessaire
      const response = await apiCall(`/admin/products/${id}`);
      return response;
    } catch (error) {
      logger.error('Erreur getProductById:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau produit (Admin)
   */
  async createProduct(productData) {
    try {
      const response = await apiCall('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur createProduct:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un produit (Admin)
   */
  async updateProduct(id, productData) {
    try {
      const response = await apiCall(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur updateProduct:', error);
      throw error;
    }
  },

  /**
   * Supprimer un produit (Admin)
   */
  async deleteProduct(id) {
    try {
      const response = await apiCall(`/admin/products/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      logger.error('Erreur deleteProduct:', error);
      throw error;
    }
  },

  /**
   * Récupérer toutes les catégories (Route publique - pas besoin d'auth)
   */
  async getCategories() {
    try {
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 productService.getCategories - Utilisation Supabase direct');
        const result = await supabaseService.getCategories({ isActive: 1 }); // 1 = true en smallint
        if (result.success) {
          logger.log(`✅ productService.getCategories - ${result.data.length} catégories récupérées depuis Supabase`);
          return result;
        } else {
          throw new Error(result.error || 'Erreur Supabase');
        }
      }

      logger.log('🔄 productService.getCategories - Appel API');
      try {
        const response = await apiCall('/categories');  // ✅ Route publique
        const normalized = normalizeListResponse(response, 'categories');
        if (normalized.success && normalized.data.length > 0) {
          logger.log('   ✅ Réponse reçue:', normalized.data.length, 'catégories');
          return normalized;
        }
        logger.warn('⚠️ productService.getCategories - Réponse vide, fallback /kiosk/categories');
      } catch (primaryError) {
        logger.warn('⚠️ productService.getCategories - Erreur route /categories, fallback /kiosk/categories', primaryError);
      }

      try {
        const fallbackResponse = await apiCall('/kiosk/categories');
        const fallbackNormalized = normalizeListResponse(fallbackResponse, 'categories');
        if (fallbackNormalized.success && fallbackNormalized.data.length > 0) {
          logger.log('   ✅ Fallback /kiosk/categories:', fallbackNormalized.data.length, 'catégories');
          return fallbackNormalized;
        }
      } catch (kioskError) {
        logger.warn('⚠️ productService.getCategories - Erreur fallback /kiosk/categories:', kioskError);
      }
      
      // ✅ Fallback final: Utiliser Supabase directement si toutes les routes API ont échoué
      logger.warn('⚠️ productService.getCategories - Toutes les routes API ont échoué, utilisation Supabase direct');
      const supabaseResult = await supabaseService.getCategories({ isActive: 1 });
      if (supabaseResult.success) {
        logger.log(`✅ productService.getCategories - ${supabaseResult.data.length} catégories récupérées depuis Supabase (fallback final)`);
        return supabaseResult;
      } else {
        throw new Error(supabaseResult.error || 'Erreur Supabase');
      }
    } catch (error) {
      logger.error('❌ Erreur getCategories:', error);
      // ✅ Dernière tentative: Utiliser Supabase directement si toutes les routes API ont échoué
      if (error?.message?.includes('fetch') || error?.message?.includes('Network') || error?.message?.includes('Failed to fetch')) {
        logger.warn('⚠️ productService.getCategories - Erreur réseau détectée, tentative Supabase direct');
        try {
          const supabaseResult = await supabaseService.getCategories({ isActive: 1 });
          if (supabaseResult.success) {
            logger.log(`✅ productService.getCategories - ${supabaseResult.data.length} catégories récupérées depuis Supabase (fallback réseau)`);
            return supabaseResult;
          }
        } catch (supabaseError) {
          logger.error('❌ productService.getCategories - Erreur Supabase fallback:', supabaseError);
        }
      }
      throw error;
    }
  },

  /**
   * Créer une catégorie (Admin)
   */
  async createCategory(categoryData) {
    try {
      const response = await apiCall('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur createCategory:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une catégorie (Admin)
   */
  async updateCategory(id, categoryData) {
    try {
      const response = await apiCall(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur updateCategory:', error);
      throw error;
    }
  },

  /**
   * Supprimer une catégorie (Admin)
   */
  async deleteCategory(id) {
    try {
      const response = await apiCall(`/admin/categories/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      logger.error('Erreur deleteCategory:', error);
      throw error;
    }
  }
};

export default productService;


