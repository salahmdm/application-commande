import { create } from 'zustand';
import productService from '../services/productService';
import { fallbackProducts, fallbackCategories } from '../utils/fallbackData';

/**
 * Store des produits
 * Connecté à la base de données MySQL via API
 * Avec données de secours si l'API n'est pas accessible
 */
const useProductStore = create((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  usingFallback: false,
  
  favorites: new Set(),
  searchQuery: '',
  filters: {
    category: null,
    priceRange: [0, 100],
    sortBy: 'popular',
    onlyInStock: false,
  },
  
  // Charger les produits depuis MySQL (avec fallback) - UNIFIÉ avec route admin
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      // Utiliser la route admin pour avoir TOUS les produits (actifs ET inactifs)
      const response = await productService.getAllProductsAdmin();
      if (response.success && response.data) {
        set({ products: response.data, isLoading: false, usingFallback: false });
        console.log('✅ Produits chargés depuis MySQL (route admin unifiée)');
      }
    } catch (error) {
      console.warn('⚠️ API non accessible, utilisation données de secours');
      // Utiliser les données de secours
      set({ products: fallbackProducts, isLoading: false, usingFallback: true });
    }
  },
  
  // Charger TOUS les produits pour l'admin (actifs ET inactifs)
  // IMPORTANT: Ne JAMAIS utiliser les données de secours pour l'admin
  fetchAllProductsAdmin: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await productService.getAllProductsAdmin();
      if (response.success && response.data) {
        set({ products: response.data, isLoading: false, usingFallback: false });
        console.log('✅ TOUS les produits chargés (admin) depuis MySQL:', response.data.length);
        return { success: true, data: response.data };
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (error) {
      console.error('❌ Erreur chargement produits admin:', error);
      // NE PAS utiliser les données de secours - afficher une erreur
      set({ 
        products: [], 
        isLoading: false, 
        usingFallback: false,
        error: error.message || 'Impossible de charger les produits depuis la base de données'
      });
      throw error; // Propager l'erreur pour que l'UI puisse l'afficher
    }
  },
  
  // Charger les catégories depuis MySQL (avec fallback)
  fetchCategories: async () => {
    try {
      const response = await productService.getCategories();
      if (response.success && response.data) {
        set({ categories: response.data });
        console.log('✅ Catégories chargées depuis MySQL');
      }
    } catch (error) {
      console.warn('⚠️ API non accessible, utilisation catégories de secours');
      // Utiliser les données de secours
      set({ categories: fallbackCategories });
    }
  },
  
  // Ajouter un produit (Admin) - Sauvegarde dans MySQL
  addProduct: async (productData) => {
    try {
      console.log('➕ Store - Ajout d\'un nouveau produit');
      const response = await productService.createProduct(productData);
      
      if (response.success) {
        console.log('✅ Store - Produit ajouté dans MySQL');
        
        // Recharger tous les produits depuis MySQL pour synchroniser
        await get().fetchProducts();
        console.log('✅ Store - Produits rechargés depuis MySQL');
        
        return response;
      }
    } catch (error) {
      console.error('❌ Store - Erreur addProduct:', error);
      throw error;
    }
  },
  
  // Mettre à jour un produit (Admin) - Sauvegarde dans MySQL
  updateProduct: async (id, updates) => {
    try {
      console.log('🔄 Store - Mise à jour produit ID:', id);
      const response = await productService.updateProduct(id, updates);
      
      if (response.success) {
        console.log('✅ Store - Produit modifié dans MySQL');
        
        // IMPORTANT: Recharger depuis MySQL pour avoir les données exactes
        await get().fetchProducts();
        console.log('✅ Store - Produits rechargés depuis MySQL');
        
        return response;
      }
    } catch (error) {
      console.error('❌ Store - Erreur updateProduct:', error);
      throw error;
    }
  },
  
  // Supprimer un produit (Admin) - Supprime de MySQL
  deleteProduct: async (id) => {
    try {
      console.log('🗑️ Store - Suppression produit ID:', id);
      const response = await productService.deleteProduct(id);
      
      if (response.success) {
        console.log('✅ Store - Produit supprimé de MySQL');
        
        // Recharger tous les produits depuis MySQL pour synchroniser
        await get().fetchProducts();
        console.log('✅ Store - Produits rechargés depuis MySQL');
        
        return response;
      }
    } catch (error) {
      console.error('❌ Store - Erreur deleteProduct:', error);
      throw error;
    }
  },
  
  toggleFavorite: (productId) => {
    set((state) => {
      const newFavorites = new Set(state.favorites);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return { favorites: newFavorites };
    });
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  
  getFilteredProducts: () => {
    const { products, searchQuery, filters } = get();
    let filteredProducts = [...products];
    
    // Recherche
    if (searchQuery) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filtre par catégorie
    if (filters.category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category_id === parseInt(filters.category) ||
        (p.category_name && p.category_name.toLowerCase() === filters.category.toLowerCase())
      );
    }
    
    // Filtre par prix
    filteredProducts = filteredProducts.filter(p => 
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );
    
    // Filtre stock
    if (filters.onlyInStock) {
      filteredProducts = filteredProducts.filter(p => p.stock > 0);
    }
    
    // Tri
    switch (filters.sortBy) {
      case 'price-asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popular':
      default:
        filteredProducts.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }
    
    return filteredProducts;
  },
  
  getProductById: (id) => {
    const { products } = get();
    return products.find(p => p.id === parseInt(id));
  },
  
  // Organiser les produits par catégorie
  getProductsByCategory: () => {
    const { products } = get();
    const byCategory = {};
    
    products.forEach(product => {
      const catName = product.category_name || 'autres';
      if (!byCategory[catName]) {
        byCategory[catName] = [];
      }
      byCategory[catName].push(product);
    });
    
    return byCategory;
  }
}));

export default useProductStore;
