import { useCallback, useMemo, useEffect } from 'react';
import useProductStore from '../store/productStore';
import useAuthStore from '../store/authStore';
import logger from '../utils/logger';

/**
 * Hook personnalisé pour les produits
 * Connecté à MySQL via API
 */
const useProducts = () => {
  const { role, isAuthenticated } = useAuthStore();
  const {
    products,
    categories,
    isLoading,
    favorites,
    searchQuery,
    filters,
    fetchAllProductsAdmin,
    fetchProductsForClient,
    fetchProductsPublic,
    fetchCategories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFavorite,
    setSearchQuery,
    setFilters,
    getFilteredProducts,
    getProductById
  } = useProductStore();
  
  // Charger les produits au démarrage et quand le rôle change
  useEffect(() => {
    // Ne pas charger si un chargement est déjà en cours
    if (isLoading) {
      return;
    }
    
    if (products && products.length > 0) {
      if (!categories || categories.length === 0) {
        fetchCategories().catch(err => {
          logger.error('❌ Erreur chargement catégories:', err);
        });
      }
      return;
    }
    
    const loadData = async () => {
      try {
        if (role === 'admin') {
          await fetchAllProductsAdmin();
        } else if (isAuthenticated) {
          await fetchProductsForClient();
        } else {
          await fetchProductsPublic();
        }
        await fetchCategories();
      } catch (error) {
        logger.error('❌ Erreur chargement produits:', error);
        logger.error('   Message:', error.message);
        logger.error('   Stack:', error.stack);
      }
    };
    loadData();
    // ✅ CORRECTION: Ne pas inclure products/categories dans les dépendances pour éviter les boucles infinies
    // products et categories changent après chaque chargement, ce qui créerait une boucle
    // La logique interne gère déjà le cas où ils sont vides
  }, [role, isAuthenticated]); // ✅ Seulement role et isAuthenticated - les seules vraies dépendances
  
  // Récupérer tous les produits
  const allProducts = useMemo(() => {
    return products || [];
  }, [products]);
  
  // Récupérer les produits filtrés
  const filteredProducts = useMemo(() => {
    return getFilteredProducts();
  }, [getFilteredProducts]);
  
  // Récupérer les produits favoris
  const favoriteProducts = useMemo(() => {
    return allProducts.filter(p => favorites.has(p.id));
  }, [allProducts, favorites]);
  
  // Récupérer les produits populaires (featured)
  const popularProducts = useMemo(() => {
    return allProducts.filter(p => p.is_featured);
  }, [allProducts]);
  
  // Récupérer les produits par catégorie
  const getProductsByCategory = useCallback((categoryId) => {
    return allProducts.filter(p => p.category_id === parseInt(categoryId));
  }, [allProducts]);
  
  // Recherche
  const search = useCallback((query) => {
    setSearchQuery(query);
  }, [setSearchQuery]);
  
  // Filtrer
  const filter = useCallback((newFilters) => {
    setFilters(newFilters);
  }, [setFilters]);
  
  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      category: null,
      priceRange: [0, 1000], // Plage de prix élargie
      sortBy: 'popular',
      onlyInStock: false
    });
    setSearchQuery('');
  }, [setFilters, setSearchQuery]);
  
  // Rafraîchir les produits
  const refresh = useCallback(async () => {
    if (role === 'admin') {
      await fetchAllProductsAdmin();
    } else if (isAuthenticated) {
      await fetchProductsForClient();
    } else {
      await fetchProductsPublic();
    }
  }, [role, isAuthenticated, fetchAllProductsAdmin, fetchProductsForClient, fetchProductsPublic]);
  
  return {
    products: allProducts,
    allProducts,
    filteredProducts,
    favoriteProducts,
    popularProducts,
    categories,
    favorites,
    searchQuery,
    filters,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFavorite,
    search,
    filter,
    resetFilters,
    getProductsByCategory,
    getProductById,
    refresh
  };
};

export default useProducts;
