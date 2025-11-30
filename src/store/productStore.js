import { create } from 'zustand';
import productService from '../services/productService';
import kioskService from '../services/kioskService';
import logger from '../utils/logger';

/**
 * Store des produits
 * Connecté UNIQUEMENT à la base de données MySQL via API
 * ❌ Aucune donnée de secours hardcodée - Utilise uniquement la base de données
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
    priceRange: [0, 1000], // Plage de prix élargie pour inclure tous les produits
    sortBy: 'popular',
    onlyInStock: false,
  },
  
  // Charger les produits depuis MySQL - UNIQUEMENT depuis la base de données
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      // Utiliser la route admin pour avoir TOUS les produits (actifs ET inactifs)
      const response = await productService.getAllProductsAdmin();
      if (response.success && response.data) {
        set({ products: response.data, isLoading: false, usingFallback: false });
        logger.log('✅ Produits chargés depuis MySQL (route admin unifiée)');
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (error) {
      logger.error('❌ Erreur chargement produits depuis la base de données:', error);
      set({ 
        products: [], 
        isLoading: false, 
        usingFallback: false,
        error: error.message || 'Impossible de charger les produits depuis la base de données'
      });
      throw error; // Propager l'erreur pour que l'UI puisse l'afficher
    }
  },
  
  // Charger les produits pour les clients authentifiés - Utilise toujours la route publique pour simplifier
  fetchProductsForClient: async (filters = {}) => {
    const state = get();
    // Éviter les appels multiples simultanés
    if (state.isLoading) {
      logger.log('⏸️ fetchProductsForClient - Chargement déjà en cours, attente...');
      // Attendre que le chargement en cours se termine
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.isLoading) {
            clearInterval(checkInterval);
            resolve({ success: true, data: currentState.products });
          }
        }, 100);
        // Timeout de sécurité après 5 secondes
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve({ success: true, data: state.products || [] });
        }, 5000);
      });
    }
    
    set({ isLoading: true, error: null });
    try {
      logger.log('🔄 fetchProductsForClient - Début du chargement...');
      // Utiliser la route publique /products qui filtre déjà les produits disponibles
      // C'est plus simple et évite les problèmes d'authentification
      const response = await productService.getAllProducts(filters);
      const productsList = response?.data ?? [];
      logger.log('📦 fetchProductsForClient - Produits reçus:', productsList.length);

      if (response?.success && productsList.length > 0) {
        set({ products: productsList, isLoading: false, usingFallback: false });
        return { success: true, data: productsList };
      }

      logger.warn('⚠️ fetchProductsForClient - Réponse vide, tentative fallback kiosk');
      const kioskResponse = await kioskService.getProductsByCategory(filters.category || null);
      if (kioskResponse?.success && kioskResponse.data) {
        logger.log('✅ fetchProductsForClient - Produits chargés via kiosk fallback:', kioskResponse.data.length);
        set({ products: kioskResponse.data, isLoading: false, usingFallback: true });
        return { success: true, data: kioskResponse.data };
      }

      throw new Error(kioskResponse?.error || 'Réponse API invalide');
    } catch (error) {
      logger.error('❌ Erreur chargement produits clients depuis la base de données:', error);
      logger.error('   Message:', error.message);
      logger.error('   Stack:', error.stack);
      
      // ✅ Fallback final: Utiliser Supabase directement si toutes les routes API ont échoué
      logger.warn('⚠️ fetchProductsForClient - Tentative fallback Supabase direct');
      try {
        const { default: supabaseService } = await import('../services/supabaseService');
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
        if (supabaseResult.success && supabaseResult.data && supabaseResult.data.length > 0) {
          logger.log(`✅ fetchProductsForClient - ${supabaseResult.data.length} produits récupérés depuis Supabase (fallback final)`);
          set({ 
            products: supabaseResult.data, 
            isLoading: false, 
            usingFallback: true,
            error: null
          });
          return { success: true, data: supabaseResult.data };
        }
      } catch (supabaseError) {
        logger.error('❌ fetchProductsForClient - Erreur Supabase fallback:', supabaseError);
      }
      
      // ❌ NE PLUS utiliser les données de secours - Utiliser uniquement la base de données
      set({ 
        products: [], 
        isLoading: false, 
        usingFallback: false,
        error: error.message || 'Impossible de charger les produits depuis la base de données'
      });
      throw error; // Propager l'erreur pour que l'UI puisse l'afficher
    }
  },
  
  // Charger les produits publics (pour les invités non authentifiés) - Route publique
  fetchProductsPublic: async (filters = {}) => {
    const state = get();
    // Éviter les appels multiples simultanés
    if (state.isLoading) {
      logger.log('⏸️ fetchProductsPublic - Chargement déjà en cours, attente...');
      // Attendre que le chargement en cours se termine
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.isLoading) {
            clearInterval(checkInterval);
            resolve({ success: true, data: currentState.products });
          }
        }, 100);
        // Timeout de sécurité après 5 secondes
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve({ success: true, data: state.products || [] });
        }, 5000);
      });
    }
    
    set({ isLoading: true, error: null });
    try {
      const response = await productService.getAllProducts(filters);
      const productsList = response?.data ?? [];

      if (response?.success && productsList.length > 0) {
        set({ products: productsList, isLoading: false, usingFallback: false });
        logger.log('✅ Produits publics chargés:', productsList.length);
        return { success: true, data: productsList };
      }

      logger.warn('⚠️ fetchProductsPublic - Réponse vide, tentative fallback kiosk');
      const kioskResponse = await kioskService.getProductsByCategory(filters.category || null);
      if (kioskResponse?.success && kioskResponse.data) {
        logger.log('✅ fetchProductsPublic - Produits chargés via kiosk fallback:', kioskResponse.data.length);
        set({ products: kioskResponse.data, isLoading: false, usingFallback: true });
        return { success: true, data: kioskResponse.data };
      }

      throw new Error(kioskResponse?.error || 'Réponse API invalide');
    } catch (error) {
      logger.error('❌ Erreur chargement produits publics depuis la base de données:', error);
      logger.error('   Message:', error.message);
      logger.error('   Stack:', error.stack);
      
      // ✅ Fallback final: Utiliser Supabase directement si toutes les routes API ont échoué
      logger.warn('⚠️ fetchProductsPublic - Tentative fallback Supabase direct');
      try {
        const { default: supabaseService } = await import('../services/supabaseService');
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
        if (supabaseResult.success && supabaseResult.data && supabaseResult.data.length > 0) {
          logger.log(`✅ fetchProductsPublic - ${supabaseResult.data.length} produits récupérés depuis Supabase (fallback final)`);
          set({ 
            products: supabaseResult.data, 
            isLoading: false, 
            usingFallback: true,
            error: null
          });
          return { success: true, data: supabaseResult.data };
        }
      } catch (supabaseError) {
        logger.error('❌ fetchProductsPublic - Erreur Supabase fallback:', supabaseError);
      }
      
      // ❌ NE PLUS utiliser les données de secours - Utiliser uniquement la base de données
      set({ 
        products: [], 
        isLoading: false, 
        usingFallback: false,
        error: error.message || 'Impossible de charger les produits depuis la base de données'
      });
      throw error; // Propager l'erreur pour que l'UI puisse l'afficher
    }
  },
  
  // Charger TOUS les produits pour l'admin (actifs ET inactifs)
  // IMPORTANT: Ne JAMAIS utiliser les données de secours pour l'admin
  fetchAllProductsAdmin: async () => {
    const state = get();
    // ✅ CORRECTION: Éviter les appels multiples simultanés (prévent les boucles infinies)
    if (state.isLoading) {
      logger.log('⏸️ fetchAllProductsAdmin - Chargement déjà en cours, retour des produits existants');
      // Retourner les produits existants au lieu de relancer un appel (évite les boucles)
      return { success: true, data: state.products || [] };
    }
    
    set({ isLoading: true, error: null });
    try {
      const response = await productService.getAllProductsAdmin();
      if (response.success && response.data) {
        set({ products: response.data, isLoading: false, usingFallback: false });
        logger.log('✅ TOUS les produits chargés (admin) depuis MySQL:', response.data.length);
        return { success: true, data: response.data };
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (error) {
      logger.error('❌ Erreur chargement produits admin:', error);
      const currentState = get();
      const isAuthError = error?.status === 401 || error?.status === 403;
      
      set({ 
        products: currentState.products || [],
        isLoading: false, 
        usingFallback: false,
        error: isAuthError ? null : (error.message || 'Impossible de charger les produits depuis la base de données')
      });

      if (isAuthError) {
        logger.warn('🔁 fetchAllProductsAdmin - Droits insuffisants, fallback route publique');
        try {
          const fallbackResult = await get().fetchProductsForClient();
          logger.log('✅ fetchAllProductsAdmin - Fallback client réussi');
          return fallbackResult;
        } catch (fallbackError) {
          logger.error('❌ fetchAllProductsAdmin - Fallback client échoué:', fallbackError);
        }
        return { success: false, data: currentState.products || [] };
      }

      throw error; // Propager l'erreur réelle pour traitement amont
    }
  },
  
  // Charger les catégories depuis MySQL - UNIQUEMENT depuis la base de données
  fetchCategories: async () => {
    set({ error: null });
    try {
      const response = await productService.getCategories();
      const categoriesList = response?.data ?? [];

      if (response?.success && categoriesList.length > 0) {
        set({ categories: categoriesList });
        logger.log('✅ Catégories chargées depuis MySQL');
        return;
      }

      logger.warn('⚠️ fetchCategories - Réponse vide, tentative fallback kiosk');
      const kioskResponse = await kioskService.getCategories();
      if (kioskResponse?.success && kioskResponse.data) {
        logger.log('✅ fetchCategories - Catégories chargées via kiosk fallback:', kioskResponse.data.length);
        set({ categories: kioskResponse.data });
        return;
      }

      throw new Error(kioskResponse?.error || 'Réponse API invalide');
    } catch (error) {
      logger.error('❌ Erreur chargement catégories depuis la base de données:', error);
      logger.error('   Message:', error.message);
      logger.error('   Stack:', error.stack);
      
      // ✅ Fallback final: Utiliser Supabase directement si toutes les routes API ont échoué
      logger.warn('⚠️ fetchCategories - Tentative fallback Supabase direct');
      try {
        const { default: supabaseService } = await import('../services/supabaseService');
        const supabaseResult = await supabaseService.getCategories({ isActive: 1 });
        if (supabaseResult.success && supabaseResult.data && supabaseResult.data.length > 0) {
          logger.log(`✅ fetchCategories - ${supabaseResult.data.length} catégories récupérées depuis Supabase (fallback final)`);
          set({ categories: supabaseResult.data });
          return;
        }
      } catch (supabaseError) {
        logger.error('❌ fetchCategories - Erreur Supabase fallback:', supabaseError);
      }
      
      // ❌ NE PLUS utiliser les données de secours - Utiliser uniquement la base de données
      set({ 
        categories: [], 
        error: error.message || 'Impossible de charger les catégories depuis la base de données'
      });
      throw error; // Propager l'erreur pour que l'UI puisse l'afficher
    }
  },
  
  // Ajouter un produit (Admin) - Sauvegarde dans MySQL
  addProduct: async (productData) => {
    try {
      logger.log('➕ Store - Ajout d\'un nouveau produit');
      const response = await productService.createProduct(productData);
      
      if (response.success) {
        logger.log('✅ Store - Produit ajouté dans MySQL');
        
        // Recharger tous les produits depuis MySQL pour synchroniser
        await get().fetchProducts();
        logger.log('✅ Store - Produits rechargés depuis MySQL');
        
        return response;
      }
    } catch (error) {
      logger.error('❌ Store - Erreur addProduct:', error);
      throw error;
    }
  },
  
  // Mettre à jour un produit (Admin) - Sauvegarde dans MySQL
  updateProduct: async (id, updates) => {
    try {
      logger.log('🔄 Store - Mise à jour produit ID:', id);
      const response = await productService.updateProduct(id, updates);
      
      if (response.success) {
        logger.log('✅ Store - Produit modifié dans MySQL');
        
        // IMPORTANT: Recharger depuis MySQL pour avoir les données exactes
        await get().fetchProducts();
        logger.log('✅ Store - Produits rechargés depuis MySQL');
        
        return response;
      }
    } catch (error) {
      logger.error('❌ Store - Erreur updateProduct:', error);
      throw error;
    }
  },
  
  // Supprimer un produit (Admin) - Supprime de Supabase
  deleteProduct: async (id) => {
    try {
      logger.log('🗑️ Store - Suppression produit ID:', id);
      const response = await productService.deleteProduct(id);
      
      if (response.success) {
        logger.log('✅ Store - Produit supprimé de Supabase');
        
        // Recharger tous les produits depuis Supabase pour synchroniser
        await get().fetchAllProductsAdmin();
        logger.log('✅ Store - Produits rechargés depuis Supabase');
        
        return response;
      }
    } catch (error) {
      logger.error('❌ Store - Erreur deleteProduct:', error);
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
    
    // Si aucun produit, retourner un tableau vide
    if (!products || products.length === 0) {
      logger.log('⚠️ getFilteredProducts - Aucun produit dans le store');
      logger.log('   - products:', products);
      logger.log('   - products.length:', products?.length);
      return [];
    }
    
    let filteredProducts = [...products];
    
    logger.log('🔍 getFilteredProducts - Début filtrage:', {
      totalProducts: products.length,
      searchQuery: searchQuery || '(vide)',
      filters,
      priceRange: filters.priceRange,
      sampleProducts: products.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price }))
    });
    
    // Recherche
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filteredProducts = filteredProducts.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
      logger.log('🔍 Après recherche:', filteredProducts.length, 'produits');
    }
    
    // Filtre par catégorie (seulement si un filtre de catégorie est activé dans le store)
    // Note: Le filtre de catégorie dans ProductsView est géré séparément via selectedCategory
    if (filters.category) {
      filteredProducts = filteredProducts.filter(p => {
        // ✅ CORRECTION: Vérifier category_id (gérer les différents formats)
        const productCategoryId = p.category_id || (p.categories?.id) || null;
        const filterCategoryId = typeof filters.category === 'string' 
          ? parseInt(filters.category, 10) 
          : filters.category;
        
        const matchesId = productCategoryId !== null && (
          Number(productCategoryId) === Number(filterCategoryId) ||
          productCategoryId === filterCategoryId
        );
        const matchesName = p.category_name && 
          p.category_name.toLowerCase() === String(filters.category).toLowerCase();
        const matchesSlug = p.category_slug === filters.category ||
          (p.categories?.slug === filters.category);
        
        return matchesId || matchesName || matchesSlug;
      });
      logger.log('🔍 Après filtre catégorie:', filteredProducts.length, 'produits');
    }
    
    // Filtre par prix (convertir en nombre si c'est une chaîne)
    // Vérifier que la plage de prix est valide
    const minPrice = parseFloat(filters.priceRange[0]) || 0;
    const maxPrice = parseFloat(filters.priceRange[1]) || 1000;
    
    filteredProducts = filteredProducts.filter(p => {
      const price = parseFloat(p.price) || 0;
      const inRange = price >= minPrice && price <= maxPrice;
      if (!inRange) {
        logger.log('⚠️ Produit exclu par prix:', p.name, 'prix:', price, 'plage:', [minPrice, maxPrice]);
      }
      return inRange;
    });
    logger.log('🔍 Après filtre prix:', filteredProducts.length, 'produits', '(plage:', [minPrice, maxPrice], ')');
    
    // Filtre stock (seulement si activé)
    if (filters.onlyInStock) {
      filteredProducts = filteredProducts.filter(p => {
        const stock = parseInt(p.stock) || 0;
        return stock > 0;
      });
      logger.log('🔍 Après filtre stock:', filteredProducts.length, 'produits');
    }
    
    // Tri
    switch (filters.sortBy) {
      case 'price-asc':
        filteredProducts.sort((a, b) => {
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => {
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceB - priceA;
        });
        break;
      case 'name':
        filteredProducts.sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case 'popular':
      default:
        filteredProducts.sort((a, b) => {
          const featuredA = a.is_featured === true || a.is_featured === 1 || a.is_featured === '1' ? 1 : 0;
          const featuredB = b.is_featured === true || b.is_featured === 1 || b.is_featured === '1' ? 1 : 0;
          return featuredB - featuredA;
        });
    }
    
    logger.log('✅ getFilteredProducts - Résultat final:', filteredProducts.length, 'produits');
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
