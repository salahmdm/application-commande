import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Image as ImageIcon, Info } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import CategoryFilter from '../../components/common/CategoryFilter';
import useProducts from '../../hooks/useProducts';
import useCart from '../../hooks/useCart';
import useUIStore from '../../store/uiStore';
import { calculateTTC, formatPrice } from '../../constants/pricing';
import logger from '../../utils/logger';

const extractIngredients = (value) => {
  if (!value) return [];

  let list = [];

  if (Array.isArray(value)) {
    list = value.filter(Boolean);
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        list = parsed.filter(Boolean);
      } else if (parsed) {
        list = String(parsed).split(',').map((ing) => ing.trim()).filter(Boolean);
      }
    } catch {
      list = value.split(',').map((ing) => ing.trim()).filter(Boolean);
    }
  }

  return list;
};

/**
 * Vue Produits avec recherche et filtres
 */
const ProductsView = () => {
  const { 
    filteredProducts, 
    products,
    categories, 
    searchQuery,
    filters,
    isLoading,
    refresh
  } = useProducts();
  const { add } = useCart();
  const { currentView } = useUIStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const selectedProductIngredients = selectedProduct
    ? extractIngredients(selectedProduct.allergens ?? selectedProduct.ingredients)
    : [];
  
  // ✅ OPTIMISATION: Mémoriser la fonction pour éviter les re-renders inutiles
  const handleAddToCart = useCallback((product) => {
    add(product);
  }, [add]);

  // Charger les produits immédiatement au montage et à chaque navigation vers cette vue
  useEffect(() => {
    // Ne charger que si on est sur la vue produits
    if (currentView !== 'products') {
      return;
    }
    
    logger.log('🔄 ProductsView - Navigation vers la vue produits');
    logger.log('   - currentView:', currentView);
    logger.log('   - isLoading:', isLoading);
    logger.log('   - products.length:', products?.length || 0);
    
    // Si les produits sont déjà chargés et qu'on a des produits, ne pas recharger
    // Cela évite les appels API inutiles et améliore la fluidité
    if (products && products.length > 0 && !isLoading) {
      logger.log('✅ ProductsView - Produits déjà chargés, pas de rechargement nécessaire');
      return;
    }
    
    // Charger les produits immédiatement si on n'en a pas ou si on est en chargement
    const loadProducts = async () => {
      try {
        logger.log('🔄 ProductsView - Chargement des produits...');
        await refresh();
        logger.log('✅ ProductsView - Produits chargés avec succès');
      } catch (err) {
        logger.error('❌ ProductsView - Erreur lors du chargement:', err);
      }
    };
    
    // Charger immédiatement sans délai
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]); // Recharger uniquement quand on navigue vers cette vue

  // Filtrer les produits par catégorie sélectionnée
  // Si aucune catégorie n'est sélectionnée, afficher tous les produits filtrés
  // Si une catégorie est sélectionnée, filtrer par catégorie
  let displayedProducts = filteredProducts || [];
  
  if (selectedCategory) {
    displayedProducts = filteredProducts.filter(p => {
      // ✅ CORRECTION: Vérifier category_id (convertir en nombre pour comparaison)
      const productCategoryId = p.category_id || (p.categories?.id) || null;
      const selectedCategoryId = typeof selectedCategory === 'string' 
        ? parseInt(selectedCategory, 10) 
        : selectedCategory;
      
      // Vérifier si le produit correspond à la catégorie sélectionnée
      const matchesId = productCategoryId !== null && (
        Number(productCategoryId) === Number(selectedCategoryId) ||
        productCategoryId === selectedCategoryId
      );
      const matchesSlug = p.category_slug === selectedCategory || 
                         (p.categories?.slug === selectedCategory);
      
      if (matchesId || matchesSlug) {
        logger.log(`✅ Produit "${p.name}" correspond à la catégorie ${selectedCategory} (category_id: ${productCategoryId})`);
      }
      
      return matchesId || matchesSlug;
    });
    
    logger.log(`🔍 Filtrage par catégorie ${selectedCategory}: ${displayedProducts.length} produits trouvés`);
  }
  
  // Debug: afficher les informations de chargement
  logger.log('📦 ProductsView - État complet:', {
    isLoading,
    totalProducts: products?.length || 0,
    filteredProducts: filteredProducts?.length || 0,
    displayedProducts: displayedProducts?.length || 0,
    selectedCategory,
    filters,
    searchQuery,
    products: products?.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price, available: p.is_available }))
  });
  
  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-4 animate-fade-in">
      {/* Filtre par catégories */}
      <CategoryFilter 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      
      {/* Espace pour compenser le bandeau fixe */}
      <div className="h-20 md:h-24"></div>
      
      {/* Liste des produits */}
      {isLoading && (!products || products.length === 0) ? (
        <Card padding="lg" className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center animate-spin">
            <ImageIcon className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-xl font-heading font-bold mb-2 text-black">Chargement des produits...</h3>
          <p className="text-neutral-600 font-sans">Veuillez patienter</p>
        </Card>
      ) : displayedProducts.length === 0 && !isLoading ? (
        <Card padding="lg" className="text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
          <h3 className="text-xl font-heading font-bold mb-2 text-black">Aucun produit trouvé</h3>
          <p className="text-neutral-600 font-sans">
            {searchQuery || selectedCategory 
              ? 'Essayez de modifier vos filtres de recherche' 
              : 'Aucun produit disponible pour le moment'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <Card 
              key={product.id} 
              padding="none" 
              hover
              className="relative group overflow-hidden flex flex-col h-full shadow-lg hover:shadow-xl transition-all duration-300 min-h-[320px]"
              style={{
                backgroundImage: product.image_url 
                  ? `url(${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}${product.image_url})`
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Overlay sombre pour lisibilité du texte */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 z-0"></div>
              
              {/* Badge populaire */}
              {product.popular && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-heading font-bold z-20 shadow-lg">
                  ⭐ Populaire
                </div>
              )}
              
              {/* Bouton Info */}
              <div className="absolute top-3 right-3 z-20">
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="w-9 h-9 bg-white/40 backdrop-blur-sm hover:bg-white/60 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Voir les ingrédients"
                >
                  <Info className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Contenu - Premier plan */}
              <div className="relative z-10 flex flex-col h-full justify-end p-5">
                {/* Nom du produit */}
                <h3 className="text-2xl font-heading font-bold mb-2 text-white leading-tight drop-shadow-lg">
                  {product.name}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-white/90 mb-4 font-sans leading-relaxed line-clamp-2 drop-shadow-md">
                  {product.description}
                </p>
                
                {/* Prix et Bouton - Disposition améliorée */}
                <div className="mt-auto pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between gap-3">
                    {/* Prix */}
                    <div className="flex-shrink-0">
                      <div className="text-3xl font-heading font-bold text-white leading-none drop-shadow-lg">
                        {formatPrice(calculateTTC(product.price))}
                      </div>
                      <div className="text-xs text-white/80 font-sans mt-0.5 drop-shadow-md">TTC</div>
                    </div>
                    
                    {/* Bouton Ajouter - Blanc avec transparence */}
                    <div className="flex-1">
                      <Button
                        variant="secondary"
                        size="md"
                        fullWidth
                        onClick={() => handleAddToCart(product)}
                        icon={<Plus className="w-5 h-5" />}
                        className="!bg-white/90 hover:!bg-white !text-black !border-none font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm"
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fallback si pas d'image */}
              {!product.image_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 z-0">
                  {product.image ? (
                    <span className="text-8xl opacity-30">{product.image}</span>
                  ) : (
                    <ImageIcon className="w-20 h-20 text-neutral-400 opacity-30" />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal détails produit */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title=""
        size="sm"
      >
        {selectedProduct && (
          <div className="space-y-4">
            {/* Nom du produit */}
            <div className="text-center">
              <h3 className="text-2xl font-heading font-bold mb-4 text-black">{selectedProduct.name}</h3>
            </div>
            
            {/* Prix */}
            <div className="bg-neutral-100 p-4 rounded-2xl border-2 border-neutral-200 shadow-soft">
              <div className="text-3xl font-heading font-bold text-black text-center">
                {formatPrice(calculateTTC(selectedProduct.price))}
              </div>
            </div>
            
            {/* Ingrédients */}
            <div className="bg-neutral-100 p-4 rounded-2xl border-2 border-neutral-200 shadow-soft">
              <h4 className="font-heading font-bold text-black mb-2">Ingrédients :</h4>
              {selectedProductIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProductIngredients.map((ing, idx) => (
                    <span key={idx} className="px-4 py-2 bg-white text-black rounded-full text-sm font-heading font-semibold border-2 border-neutral-300 shadow-soft">
                      {ing}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 font-sans">Aucun ingrédient renseigné pour ce produit.</p>
              )}
            </div>
            
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                handleAddToCart(selectedProduct);
                setSelectedProduct(null);
              }}
              icon={<Plus className="w-5 h-5" />}
              className="!bg-black !hover:bg-neutral-800 !from-black !to-black !text-white !border-none font-semibold shadow-lg hover:shadow-xl"
            >
              Ajouter au panier
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsView;

