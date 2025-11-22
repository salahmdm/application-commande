import { useEffect, useState } from 'react';
import useKioskStore from '../../store/kioskStore';
import kioskService from '../../services/kioskService';
import logger from '../../utils/logger';

/**
 * Vue des produits d'une catégorie
 * Affichage en grille avec grandes images
 * Bouton + pour ajouter rapidement
 */
function ProductView() {
  const { setCurrentStep, addToCart, updateActivity, cart } = useKioskStore();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    updateActivity();
    // Charger tous les produits au montage (categoryId = null = tous les produits)
    loadProducts(null);
  }, [updateActivity]);

  const loadProducts = async (categoryId = null) => {
    try {
      setIsLoading(true);
      logger.log(`🔄 Kiosk - Chargement produits${categoryId ? ` (catégorie: ${categoryId})` : ' (tous)'}`);
      
      // ✅ UTILISER kioskService (route /api/kiosk/products) - ISOLÉ de l'app principale
      // Récupère TOUS les produits disponibles depuis la BDD MySQL
      const response = await kioskService.getProductsByCategory(categoryId);
      
      logger.log('📦 Kiosk - Réponse API produits:', {
        success: response?.success,
        hasData: !!response?.data,
        dataLength: response?.data?.length || 0,
        error: response?.error
      });
      
      if (response.success && response.data) {
        // Les produits sont déjà filtrés côté backend (is_available = TRUE)
        // Pas besoin de filtrer côté frontend
        setProducts(response.data);
        logger.log(`✅ Kiosk - ${response.data.length} produits chargés depuis la BDD${categoryId ? ` (catégorie: ${categoryId})` : ' (tous)'}`);
        
        // Afficher les premiers produits pour debug
        if (response.data.length > 0) {
          logger.log('📋 Kiosk - Exemple produits:', response.data.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category_name || p.category_id
          })));
        } else {
          logger.warn('⚠️ Kiosk - Aucun produit trouvé dans la BDD');
        }
      } else {
        const errorMsg = response.error || 'Réponse API invalide';
        logger.error(`❌ Kiosk - ${errorMsg}:`, response);
        setProducts([]);
      }
    } catch (error) {
      logger.error('❌ Kiosk - Erreur chargement produits:', error);
      logger.error('   Détails:', {
        message: error.message,
        stack: error.stack
      });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    logger.log(`➕ Kiosk - Ajout au panier: ${product.name}`);
    addToCart(product, 1);
    // Optionnel: Afficher une notification visuelle
  };

  const getCartQuantity = (productId) => {
    return cart.filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-6xl font-bold text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="product-view h-full w-full bg-gradient-to-br from-orange-50 to-red-50 p-12">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* En-tête */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-6xl font-bold text-gray-800 mb-4">
              Nos produits
            </h2>
            <button
              onClick={() => setCurrentStep('categories')}
              className="text-3xl text-gray-600 hover:text-gray-800 underline"
            >
              ← Retour aux catégories
            </button>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCurrentStep('cart')}
              className="cart-indicator bg-orange-500 text-white px-8 py-4 rounded-2xl text-3xl font-bold shadow-xl"
            >
              🛒 {cart.length} article{cart.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Grille de produits */}
        {products.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-9xl mb-8">🍽️</div>
              <p className="text-4xl font-bold text-gray-600 mb-4">
                Aucun produit disponible
              </p>
              <p className="text-2xl text-gray-500">
                Vérifiez la connexion à la base de données
              </p>
            </div>
          </div>
        ) : (
          <div className="products-grid grid grid-cols-4 gap-8 flex-1 overflow-y-auto pb-8">
            {products.map((product) => {
            const quantityInCart = getCartQuantity(product.id);
            
            // ✅ Convertir le prix en nombre (peut être string depuis MySQL)
            const productPrice = typeof product.price === 'string' 
              ? parseFloat(product.price) 
              : (product.price || 0);
            
            return (
              <div
                key={product.id}
                className="product-card bg-white rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden flex flex-col min-h-[500px]"
              >
                {/* Image produit */}
                <div className="product-image h-64 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">🍽️</div>
                  )}
                </div>

                {/* Informations produit */}
                <div className="product-info p-8 flex-1 flex flex-col">
                  <h3 className="text-4xl font-bold text-gray-800 mb-4">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-2xl text-gray-600 mb-4 flex-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="product-footer flex items-center justify-between mt-auto">
                    <div className="text-5xl font-bold text-orange-600">
                      {isNaN(productPrice) ? '0.00' : productPrice.toFixed(2)} €
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="add-button bg-orange-500 hover:bg-orange-600 text-white w-20 h-20 rounded-full text-4xl font-bold shadow-lg hover:scale-110 active:scale-95 transition-all touch-manipulation flex items-center justify-center"
                    >
                      {quantityInCart > 0 ? quantityInCart : '+'}
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductView;

