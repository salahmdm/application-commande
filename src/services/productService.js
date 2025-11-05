import { apiCall } from './api';

/**
 * Service de gestion des produits
 * Connecté au backend MySQL via API
 */

const productService = {
  /**
   * Récupérer tous les produits (Route publique - pas besoin d'auth)
   */
  async getAllProducts(filters = {}) {
    try {
      console.log('🔄 productService.getAllProducts - Appel API');
      let endpoint = '/products';  // ✅ Route publique
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.featured) params.append('featured', 'true');
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      console.log('   → Endpoint:', endpoint);
      const response = await apiCall(endpoint);
      console.log('   ✅ Réponse reçue:', response.data?.length || 0, 'produits');
      return response;
    } catch (error) {
      console.error('❌ Erreur getAllProducts:', error);
      throw error;
    }
  },

  /**
   * Récupérer TOUS les produits pour l'admin (actifs ET inactifs)
   */
  async getAllProductsAdmin() {
    try {
      console.log('🔄 productService.getAllProductsAdmin - Appel API route admin');
      const response = await apiCall('/admin/products');  // ✅ Route admin
      console.log('   ✅ Réponse reçue:', response.data?.length || 0, 'produits (tous)');
      return response;
    } catch (error) {
      console.error('❌ Erreur getAllProductsAdmin:', error);
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
      console.error('Erreur getProductById:', error);
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
      console.error('Erreur createProduct:', error);
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
      console.error('Erreur updateProduct:', error);
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
      console.error('Erreur deleteProduct:', error);
      throw error;
    }
  },

  /**
   * Récupérer toutes les catégories (Route publique - pas besoin d'auth)
   */
  async getCategories() {
    try {
      console.log('🔄 productService.getCategories - Appel API');
      const response = await apiCall('/categories');  // ✅ Route publique
      console.log('   ✅ Réponse reçue:', response.data?.length || 0, 'catégories');
      return response;
    } catch (error) {
      console.error('❌ Erreur getCategories:', error);
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
      console.error('Erreur createCategory:', error);
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
      console.error('Erreur updateCategory:', error);
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
      console.error('Erreur deleteCategory:', error);
      throw error;
    }
  }
};

export default productService;


