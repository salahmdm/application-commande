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
          isActive: filters.featured ? undefined : true, // Par défaut, seulement actifs
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
      const response = await apiCall(endpoint);
      logger.log('   ✅ Réponse reçue:', response.data?.length || 0, 'produits');
      return response;
    } catch (error) {
      logger.error('❌ Erreur getAllProducts:', error);
      throw error;
    }
  },

  /**
   * Récupérer TOUS les produits pour l'admin (actifs ET inactifs)
   */
  async getAllProductsAdmin() {
    try {
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 productService.getAllProductsAdmin - Utilisation Supabase direct (tous les produits)');
        // Pour l'admin, récupérer tous les produits (actifs ET inactifs)
        const result = await supabaseService.getProducts({ isActive: undefined });
        if (result.success) {
          logger.log(`✅ productService.getAllProductsAdmin - ${result.data.length} produits récupérés depuis Supabase (tous)`);
          return result;
        } else {
          throw new Error(result.error || 'Erreur Supabase');
        }
      }

      logger.log('🔄 productService.getAllProductsAdmin - Appel API route admin');
      const response = await apiCall('/admin/products');  // ✅ Route admin
      logger.log('   ✅ Réponse reçue:', response.data?.length || 0, 'produits (tous)');
      return response;
    } catch (error) {
      logger.error('❌ Erreur getAllProductsAdmin:', error);
      throw error;
    }
  },

  /**
   * Récupérer tous les produits (route authentifiée mais non restreinte)
   */
  async getAllProductsAuthenticated() {
    try {
      logger.log('🔄 productService.getAllProductsAuthenticated - Route /products/all');
      const response = await apiCall('/products/all');
      logger.log('   ✅ Réponse reçue:', response.data?.length || 0, 'produits (auth)');
      return response;
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
        const result = await supabaseService.getCategories({ isActive: true });
        if (result.success) {
          logger.log(`✅ productService.getCategories - ${result.data.length} catégories récupérées depuis Supabase`);
          return result;
        } else {
          throw new Error(result.error || 'Erreur Supabase');
        }
      }

      logger.log('🔄 productService.getCategories - Appel API');
      const response = await apiCall('/categories');  // ✅ Route publique
      logger.log('   ✅ Réponse reçue:', response.data?.length || 0, 'catégories');
      return response;
    } catch (error) {
      logger.error('❌ Erreur getCategories:', error);
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


