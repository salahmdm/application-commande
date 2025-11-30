import { useEffect, useState } from 'react';
import useKioskStore from '../../store/kioskStore';
import kioskService from '../../services/kioskService';
import logger from '../../utils/logger';
import { KioskSidebar, KioskProductCard } from '../components';
import CartNotification from '../components/CartNotification';
import { enrichCategoriesWithBKStyles, filterProductsByCategory, isProductNew, isProductPromo } from '../utils/categoryMapper';
import '../styles/kiosk-layout.css';

/**
 * Écran principal de la borne (style Burger King)
 * Structure :
 * - Sidebar latérale avec catégories (dégradé marron/rouge)
 * - Header catégorie avec dégradé dynamique
 * - Grille produits avec cards style BK
 * - Bouton panier flottant
 * - Sidebar panier
 */
function HomeScreen() {
  const { setCurrentStep, updateActivity, addToCart, cart } = useKioskStore();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [notificationProduct, setNotificationProduct] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    updateActivity();
    loadData();
  }, [updateActivity, retryCount]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setBackendError(null);
      
      // Charger les catégories depuis la BDD
      const categoriesResponse = await kioskService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        // Enrichir les catégories avec les styles BK
        const enrichedCategories = enrichCategoriesWithBKStyles(categoriesResponse.data);
        setCategories(enrichedCategories);
        logger.log(`✅ HomeScreen - ${enrichedCategories.length} catégories chargées et enrichies depuis la BDD`);
        
        // Sélectionner la première catégorie active par défaut
        if (enrichedCategories.length > 0 && !selectedCategoryId) {
          const firstActiveCategory = enrichedCategories.find(c => c.is_active) || enrichedCategories[0];
          setSelectedCategoryId(firstActiveCategory.id);
          logger.log(`📂 HomeScreen - Catégorie par défaut: ${firstActiveCategory.name} (ID: ${firstActiveCategory.id})`);
        }
      }

      // Charger tous les produits depuis la BDD
      const productsResponse = await kioskService.getProductsByCategory(null);
      if (productsResponse.success && productsResponse.data) {
        // Enrichir les produits avec les flags promo/nouveau
        const enrichedProducts = productsResponse.data.map(product => ({
          ...product,
          is_new: isProductNew(product),
          is_promo: isProductPromo(product),
        }));
        setProducts(enrichedProducts);
        logger.log(`✅ HomeScreen - ${enrichedProducts.length} produits chargés depuis la BDD`);
      }
    } catch (error) {
      logger.error('❌ HomeScreen - Erreur chargement données:', error);
      setCategories([]);
      setProducts([]);
      setBackendError({
        message: 'Impossible de se connecter au serveur. Vérifiez que la borne est reliée au backend.',
        details: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    logger.log(`📂 HomeScreen - Catégorie sélectionnée: ${categoryId}`);
    setSelectedCategoryId(categoryId);
    updateActivity();
  };

  const handleProductAdd = (product) => {
    logger.log(`➕ HomeScreen - Ajout au panier: ${product.name}`);
    addToCart(product, 1);
    updateActivity();
    // Afficher la notification
    setNotificationProduct(product);
  };

  const handleNotificationClose = () => {
    setNotificationProduct(null);
  };

  const handleCheckout = () => {
    setCurrentStep('payment');
    updateActivity();
  };

  // Filtrer les produits par catégorie sélectionnée (utiliser l'ID de la BDD)
  const filteredProducts = filterProductsByCategory(products, selectedCategoryId);
  
  // Log pour debug
  if (selectedCategoryId) {
    logger.log(`🔍 HomeScreen - Filtrage produits:`, {
      totalProducts: products.length,
      selectedCategoryId,
      filteredCount: filteredProducts.length,
      categoryName: categories.find(c => c.id === selectedCategoryId)?.name
    });
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const heroProduct = filteredProducts[0] || products[0] || null;
  const heroPrice = heroProduct
    ? (() => {
        const value = typeof heroProduct.price === 'string'
          ? parseFloat(heroProduct.price)
          : Number(heroProduct.price ?? 0);
        return Number.isFinite(value) ? value : 0;
      })()
    : 0;
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string'
      ? parseFloat(item.price)
      : (item.price ?? item.product?.price ?? 0);
    return sum + (Number.isFinite(price) ? price * item.quantity : 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="kiosk-home-screen kiosk-home-screen--loading">
        <div className="kiosk-home-screen__loading">
          <div className="kiosk-home-screen__loading-spinner">⏳</div>
          <p className="kiosk-home-screen__loading-text">CHARGEMENT...</p>
        </div>
      </div>
    );
  }

  if (backendError) {
    return (
      <div className="kiosk-home-screen kiosk-home-screen--offline">
        <div className="kiosk-home-screen__offline-card">
          <div className="kiosk-home-screen__offline-icon">📡</div>
          <h2 className="kiosk-home-screen__offline-title">SERVEUR INDISPONIBLE</h2>
          <p className="kiosk-home-screen__offline-text">
            {backendError.message}
          </p>
          <button
            type="button"
            className="kiosk-home-screen__offline-button"
            onClick={loadData}
          >
            RÉESSAYER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-shell kiosk-shell--zones">
      <header className="kiosk-zone kiosk-zone__header">
        <div className="kiosk-header__aura" />
        <div className="kiosk-header__content">
          <div className="kiosk-header__brand">
            <h1 className="kiosk-header__logo">Blossom Café</h1>
          </div>
        </div>
      </header>

      <section className="kiosk-zone kiosk-zone__sidebar">
        <KioskSidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={handleCategorySelect}
          onCheckout={handleCheckout}
        />
      </section>

      <main className="kiosk-shell__main kiosk-zone kiosk-zone__products">
        <div className="kiosk-zone__spacer" />
        <div className="kiosk-grid">
          {filteredProducts.length === 0 ? (
            <div className="kiosk-home-screen__empty">
              <div className="kiosk-home-screen__empty-icon">🍽️</div>
              <p className="kiosk-home-screen__empty-text">Aucun produit dans cette catégorie</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <KioskProductCard
                key={product.id}
                product={product}
                onAddToCart={handleProductAdd}
              />
            ))
          )}
        </div>

        <div className="kiosk-cart-bar">
          <div className="kiosk-cart-bar__metrics">
            <div>
              <p>Articles</p>
              <strong>{totalCartItems}</strong>
            </div>
            <div>
              <p>Total à payer</p>
              <strong>{cartTotal.toFixed(2)} €</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            OUVRIR LE PANIER ({totalCartItems})
          </button>
        </div>
      </main>

      {/* Notification d'ajout au panier */}
      {notificationProduct && (
        <CartNotification
          product={notificationProduct}
          onClose={handleNotificationClose}
        />
      )}
    </div>
  );
}

export default HomeScreen;
