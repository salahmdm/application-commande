import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';

/**
 * Vue du panier
 * Liste claire des articles
 * Bouton "Passer au paiement"
 */
function CartView() {
  const {
    cart,
    setCurrentStep,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    orderType,
    setOrderType,
    updateActivity
  } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const total = calculateTotal();

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      logger.warn('⚠️ Kiosk - Panier vide, impossible de passer au paiement');
      return;
    }
    logger.log('💳 Kiosk - Passage au paiement');
    setCurrentStep('payment');
  };

  return (
    <div className="cart-view h-full w-full bg-gradient-to-br from-orange-50 to-red-50 p-12">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* En-tête */}
        <div className="mb-8">
          <h2 className="text-6xl font-bold text-gray-800 mb-4">
            Votre panier
          </h2>
          <button
            onClick={() => setCurrentStep('categories')}
            className="text-3xl text-gray-600 hover:text-gray-800 underline"
          >
            ← Continuer les achats
          </button>
        </div>

        {/* Type de commande */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-4xl font-bold text-gray-800 mb-6">Type de commande</h3>
          <div className="flex gap-6">
            <button
              onClick={() => setOrderType('dine-in')}
              className={`flex-1 py-6 px-8 rounded-xl text-3xl font-bold transition-all ${
                orderType === 'dine-in'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sur place
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex-1 py-6 px-8 rounded-xl text-3xl font-bold transition-all ${
                orderType === 'takeaway'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              À emporter
            </button>
          </div>
        </div>

        {/* Liste des articles */}
        <div className="cart-items flex-1 overflow-y-auto mb-8 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">🛒</div>
              <p className="text-4xl text-gray-600">Votre panier est vide</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={index}
                className="cart-item bg-white rounded-2xl p-8 shadow-lg flex items-center gap-8"
              >
                {/* Image */}
                <div className="w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-4xl">🍽️</div>
                  )}
                </div>

                {/* Informations */}
                <div className="flex-1">
                  <h3 className="text-4xl font-bold text-gray-800 mb-2">
                    {item.product?.name || 'Produit'}
                  </h3>
                  <p className="text-2xl text-gray-600">
                    {(item.price * item.quantity).toFixed(2)} €
                  </p>
                </div>

                {/* Quantité */}
                <div className="quantity-controls flex items-center gap-4">
                  <button
                    onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                    className="w-16 h-16 bg-gray-200 hover:bg-gray-300 rounded-full text-3xl font-bold touch-manipulation"
                  >
                    −
                  </button>
                  <span className="text-4xl font-bold w-16 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                    className="w-16 h-16 bg-gray-200 hover:bg-gray-300 rounded-full text-3xl font-bold touch-manipulation"
                  >
                    +
                  </button>
                </div>

                {/* Supprimer */}
                <button
                  onClick={() => removeFromCart(index)}
                  className="remove-button text-red-500 hover:text-red-700 text-4xl px-6 touch-manipulation"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Total et actions */}
        {cart.length > 0 && (
          <div className="cart-footer bg-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <span className="text-5xl font-bold text-gray-800">Total</span>
              <span className="text-6xl font-bold text-orange-600">
                {total.toFixed(2)} €
              </span>
            </div>
            <div className="flex gap-6">
              <button
                onClick={clearCart}
                className="flex-1 py-6 px-8 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-3xl font-bold transition-all"
              >
                Vider le panier
              </button>
              <button
                onClick={handleProceedToPayment}
                className="flex-1 py-6 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-4xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all touch-manipulation"
              >
                Passer au paiement →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartView;

