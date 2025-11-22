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
      logger.log('⏸️ useProducts - Chargement déjà en cours, attente...');
      return;
    }
    
    // Si on a déjà des produits, ne pas recharger automatiquement
    // Cela évite les appels API inutiles et améliore la fluidité
    if (products && products.length > 0) {
      logger.log('✅ useProducts - Produits déjà chargés, pas de rechargement automatique');
      // Charger quand même les catégories si elles ne sont pas chargées
      if (!categories || categories.length === 0) {
        fetchCategories().catch(err => {
          logger.error('❌ Erreur chargement catégories:', err);
        });
      }
      return;
    }
    
    const loadData = async () => {
      try {
        // ✅ SÉCURITÉ: Ne pas logger le rôle (données sensibles)
        logger.debug('🔄 useProducts - Chargement des produits...');
        // Utiliser la route appropriée selon le rôle
        if (role === 'admin' || role === 'manager') {
          // Admin/Manager - route admin qui charge TOUS les produits depuis la BDD
          logger.log('👤 Utilisation route admin');
          await fetchAllProductsAdmin();
        } else if (isAuthenticated) {
          // Utilisateur authentifié (client ou autre) - route authentifiée qui charge depuis la BDD
          logger.log('👤 Utilisation route authentifiée pour client');
          await fetchProductsForClient();
        } else {
          // Invité non authentifié - route publique
          logger.log('👤 Utilisation route publique');
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
    if (role === 'admin' || role === 'manager') {
      await fetchAllProductsAdmin();
    } else if (isAuthenticated && role === 'client') {
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
