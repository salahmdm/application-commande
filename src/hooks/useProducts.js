import { useCallback, useMemo, useEffect } from 'react';
import useProductStore from '../store/productStore';

/**
 * Hook personnalisé pour les produits
 * Connecté à MySQL via API
 */
const useProducts = () => {
  const {
    products,
    categories,
    isLoading,
    favorites,
    searchQuery,
    filters,
    fetchAllProductsAdmin,
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
  
  // Charger les produits au démarrage (avec gestion d'erreur)
  useEffect(() => {
    const loadData = async () => {
      if (products.length === 0 && !isLoading) {
        try {
          // Utiliser fetchAllProductsAdmin pour avoir TOUS les produits (actifs ET inactifs)
          await fetchAllProductsAdmin();
          await fetchCategories();
        } catch (error) {
          console.warn('Produits non chargés depuis MySQL, utilisation données de secours');
        }
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionnellement vide - chargement unique au montage
  
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
      priceRange: [0, 100],
      sortBy: 'popular',
      onlyInStock: false
    });
    setSearchQuery('');
  }, [setFilters, setSearchQuery]);
  
  // Rafraîchir les produits
  const refresh = useCallback(async () => {
    await fetchAllProductsAdmin();
  }, [fetchAllProductsAdmin]);
  
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
