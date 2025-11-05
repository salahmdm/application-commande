import React, { useState } from 'react';
import { Plus, Info, Grid, List, Search, Image as ImageIcon } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import CategoryFilter from '../../components/common/CategoryFilter';
import useProducts from '../../hooks/useProducts';
import useCart from '../../hooks/useCart';
import useUIStore from '../../store/uiStore';
import { calculateTTC, formatPrice } from '../../constants/pricing';

/**
 * Vue Produits avec recherche et filtres
 */
const ProductsView = () => {
  const { 
    filteredProducts, 
    categories, 
    search, 
    searchQuery,
    filters
  } = useProducts();
  const { add } = useCart();
  const { viewMode, setViewMode } = useUIStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const handleAddToCart = (product) => {
    add(product);
  };

  // Filtrer les produits par catégorie sélectionnée
  const displayedProducts = selectedCategory
    ? filteredProducts.filter(p => p.category_slug === selectedCategory || p.category_id === selectedCategory)
    : filteredProducts;
  
  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8 animate-fade-in">
      {/* En-tête avec recherche */}
      <div className="space-y-4">
        <h1 className="text-4xl font-heading font-bold text-black mb-4 animate-slide-in">
          Nos Produits
        </h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => search(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          
          {/* Vue grille/liste */}
          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-2xl border-2 border-neutral-200 shadow-soft">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-black text-white shadow-medium scale-105' 
                    : 'text-neutral-700 hover:bg-neutral-200 hover:scale-105'
                } active:scale-95`}
                aria-label="Vue grille"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-black text-white shadow-medium scale-105' 
                    : 'text-neutral-700 hover:bg-neutral-200 hover:scale-105'
                } active:scale-95`}
                aria-label="Vue liste"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
        </div>
        
        {/* Filtres actifs */}
        {(filters.category || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-neutral-700 font-heading font-semibold">Filtres actifs:</span>
            {filters.category && (
              <span className="px-4 py-2 bg-neutral-100 text-black rounded-full text-sm font-heading font-semibold border-2 border-neutral-300 shadow-soft">
                {categories[filters.category]?.name}
              </span>
            )}
            {searchQuery && (
              <span className="px-4 py-2 bg-neutral-100 text-black rounded-full text-sm font-heading font-semibold border-2 border-neutral-300 shadow-soft">
                &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filtre par catégories */}
      <CategoryFilter 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      
      {/* Résultats */}
      <div className="text-sm text-neutral-600 font-sans">
        {displayedProducts.length} produit{displayedProducts.length > 1 ? 's' : ''} trouvé{displayedProducts.length > 1 ? 's' : ''}
      </div>
      
      {/* Liste des produits */}
      {displayedProducts.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-xl font-heading font-bold mb-2 text-black">Aucun produit trouvé</h3>
          <p className="text-neutral-600 font-sans">Essayez de modifier vos filtres ou votre recherche</p>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }>
          {displayedProducts.map((product) => (
            <Card 
              key={product.id} 
              padding="md" 
              hover
              className="relative group"
            >
                      {/* Badge populaire */}
              {product.popular && (
                <div className="absolute top-4 left-4 bg-accent-500 text-white px-4 py-2 rounded-full text-xs font-heading font-bold z-10 shadow-medium">
                  Populaire
                </div>
              )}
              
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-medium hover:bg-white hover:scale-110 transition-all duration-200 active:scale-95"
                  aria-label="Voir les détails"
                >
                  <Info className="w-5 h-5 text-primary-600" />
                </button>
              </div>
              
              {/* Contenu */}
              <div className={viewMode === 'grid' ? 'flex flex-col h-full' : 'flex items-center gap-6'}>
                {/* Image produit */}
                <div className={viewMode === 'grid' ? 'w-full aspect-square mb-4 rounded-xl overflow-hidden' : 'w-32 h-32 rounded-xl overflow-hidden flex-shrink-0'}>
                  {product.image_url ? (
                    <img 
                      src={`http://localhost:5000${product.image_url}`}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                      {product.image ? (
                        <span className="text-6xl">{product.image}</span>
                      ) : (
                        <ImageIcon className="w-16 h-16 text-neutral-400" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className={viewMode === 'grid' ? 'flex-1 flex flex-col' : 'flex-1'}>
                  <h3 className="text-xl font-heading font-bold mb-1 text-black">{product.name}</h3>
                  <p className="text-sm text-neutral-600 mb-3 font-sans">{product.description}</p>
                  
                  <div className={`flex items-center ${viewMode === 'grid' ? 'justify-between mt-auto' : 'gap-4'}`}>
                    <div>
                      <div className="text-2xl font-heading font-bold text-black">
                        {formatPrice(calculateTTC(product.price))}
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal détails produit */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
        size="md"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="text-center">
              {/* Grande image dans modal */}
              <div className="w-full max-w-md mx-auto aspect-square rounded-2xl overflow-hidden mb-6 border-2 border-neutral-200 shadow-soft">
                {selectedProduct.image_url ? (
                  <img 
                    src={`http://localhost:5000${selectedProduct.image_url}`}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                    {selectedProduct.image ? (
                      <span className="text-9xl">{selectedProduct.image}</span>
                    ) : (
                      <ImageIcon className="w-24 h-24 text-neutral-400" />
                    )}
                  </div>
                )}
              </div>
              <h3 className="text-3xl font-heading font-bold mb-3 text-black">{selectedProduct.name}</h3>
              <p className="text-neutral-600 mb-6 font-sans text-lg">{selectedProduct.description}</p>
              <div className="mb-6 bg-neutral-100 p-4 rounded-2xl border-2 border-neutral-200 shadow-soft">
                <div className="text-4xl font-heading font-bold text-black">
                  {formatPrice(calculateTTC(selectedProduct.price))}
                </div>
              </div>
            </div>
            
            {selectedProduct.ingredients && (
              <div className="bg-neutral-100 p-4 rounded-2xl border-2 border-neutral-200 shadow-soft">
                <h4 className="font-heading font-bold text-black mb-3">Ingrédients:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.ingredients.map((ing, idx) => (
                    <span key={idx} className="px-4 py-2 bg-white text-black rounded-full text-sm font-heading font-semibold border-2 border-neutral-300 shadow-soft">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                handleAddToCart(selectedProduct);
                setSelectedProduct(null);
              }}
              icon={<Plus className="w-5 h-5" />}
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

