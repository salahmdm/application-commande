import { useState, useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import kioskService from '../../services/kioskService';
import logger from '../../utils/logger';
import './PaymentView.css';

/**
 * Vue de paiement professionnelle et moderne
 * Avec possibilité de supprimer et modifier les produits
 */
function PaymentView() {
  const {
    cart,
    orderType,
    setCurrentStep,
    clearCart,
    updateActivity,
    removeFromCart,
    updateCartItemQuantity,
    promoCode,
    discount,
    discountPercentage,
    promoData,
    applyPromoCode,
    removePromoCode
  } = useKioskStore();

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'cash'
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price) 
        : (item.price || item.product?.price || 0);
      return sum + (price * item.quantity);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - (discount || 0));
  };

  const handleRemoveItem = (index) => {
    updateActivity();
    removeFromCart(index);
    logger.log(`🗑️ PaymentView - Produit retiré du panier`);
  };

  const handleQuantityChange = (index, change) => {
    updateActivity();
    const item = cart[index];
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      handleRemoveItem(index);
    } else {
      updateCartItemQuantity(index, newQuantity);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      setError('Veuillez saisir un code promo');
      return;
    }

    setIsValidatingPromo(true);
    setError(null);

    try {
      const subtotal = calculateSubtotal();
      const result = await applyPromoCode(promoInput.trim(), subtotal);
      
      if (result.success) {
        setPromoInput('');
        logger.log(`✅ PaymentView - Code promo appliqué: ${result.discountPercentage.toFixed(1)}%`);
      } else {
        setError(result.error || 'Code promo invalide');
      }
    } catch (error) {
      logger.error('❌ PaymentView - Erreur validation code promo:', error);
      setError('Erreur lors de la validation du code promo');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setPromoInput('');
    setError(null);
  };

  const handlePayment = async () => {
    if (cart.length === 0) {
      setError('Le panier est vide');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Préparer les données de commande
      const subtotal = calculateSubtotal();
      const finalDiscount = discount || 0;
      const totalAmount = calculateTotal();
      
      const orderData = {
        orderType,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: typeof item.price === 'string' 
            ? parseFloat(item.price) 
            : (item.price || item.product?.price || 0),
          notes: item.notes || ''
        })),
        paymentMethod,
        promoCode: promoCode || null,
        subtotal,
        discountAmount: finalDiscount,
        totalAmount,
        notes: `Commande depuis borne kiosk - Paiement ${paymentMethod === 'card' ? 'carte' : 'espèces'}${promoCode ? ` - Code promo: ${promoCode}` : ''}`
      };

      logger.log('💳 Kiosk - Envoi commande:', orderData);

      // Créer la commande
      const response = await kioskService.createOrder(orderData);

      if (response.success && response.data) {
        logger.log('✅ Kiosk - Commande créée:', response.data.orderNumber);
        // Stocker le numéro de commande pour l'écran de confirmation
        sessionStorage.setItem('kiosk-last-order-number', response.data.orderNumber);
        setCurrentStep('confirmation');
        // Ne pas vider le panier ici, on le fera après confirmation
      } else {
        throw new Error(response.error || 'Erreur lors de la création de la commande');
      }
    } catch (error) {
      logger.error('❌ Kiosk - Erreur paiement:', error);
      setError(error.message || 'Erreur lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="payment-view">
      <div className="payment-view__container">
        {/* En-tête */}
        <header className="payment-view__header">
          <button
            onClick={() => setCurrentStep('home')}
            className="payment-view__back-button"
            aria-label="Retour"
          >
            ← RETOUR
          </button>
          <h1 className="payment-view__title">PAIEMENT</h1>
        </header>

        <div className="payment-view__content">
          {/* Récapitulatif des articles */}
          <section className="payment-view__section payment-view__section--cart">
            <div className="payment-view__section-header">
              <h2 className="payment-view__section-title">RÉCAPITULATIF DE LA COMMANDE</h2>
              <span className="payment-view__item-count">{itemCount} {itemCount > 1 ? 'articles' : 'article'}</span>
            </div>
            
            <div className="payment-view__items">
              {cart.length === 0 ? (
                <div className="payment-view__empty">
                  <p className="payment-view__empty-text">Votre panier est vide</p>
                </div>
              ) : (
                cart.map((item, index) => {
                const product = item.product || item;
                const itemName = product.name || item.name || 'Produit sans nom';
                const itemPrice = typeof item.price === 'string' 
                  ? parseFloat(item.price) 
                  : (item.price || product.price || 0);
                const itemTotal = itemPrice * item.quantity;
                const itemImage = product.image_url || product.image || null;

                return (
                  <div key={`${item.productId}-${index}`} className="payment-view__item">
                    {itemImage && (
                      <div className="payment-view__item-image">
                        <img src={itemImage} alt={itemName} />
                      </div>
                    )}
                    <div className="payment-view__item-details">
                      <h3 className="payment-view__item-name">{itemName}</h3>
                      <div className="payment-view__item-meta">
                        <span className="payment-view__item-unit-price">
                          {itemPrice.toFixed(2)} € / unité
                        </span>
                      </div>
                    </div>
                    <div className="payment-view__item-controls">
                      <div className="payment-view__quantity-controls">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, -1)}
                          className="payment-view__quantity-button"
                          aria-label="Diminuer la quantité"
                        >
                          −
                        </button>
                        <span className="payment-view__quantity-value">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, 1)}
                          className="payment-view__quantity-button"
                          aria-label="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>
                      <div className="payment-view__item-total">
                        <span className="payment-view__item-total-amount">
                          {itemTotal.toFixed(2)} €
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="payment-view__remove-button"
                        aria-label="Supprimer l'article"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>

            {cart.length > 0 && (
              <div className="payment-view__total-section">
                <div className="payment-view__total-row">
                  <span className="payment-view__total-label">SOUS-TOTAL</span>
                  <span className="payment-view__total-amount">
                    {subtotal.toFixed(2)} €
                  </span>
                </div>
                {promoCode && discount > 0 && (
                  <div className="payment-view__total-row payment-view__total-row--discount">
                    <span className="payment-view__total-label">
                      RÉDUCTION {promoCode} {discountPercentage > 0 ? `(-${discountPercentage.toFixed(1)}%)` : ''}
                    </span>
                    <span className="payment-view__total-amount payment-view__total-amount--discount">
                      -{discount.toFixed(2)} €
                    </span>
                  </div>
                )}
                <div className="payment-view__total-row payment-view__total-row--final">
                  <span className="payment-view__total-label">TOTAL À PAYER</span>
                  <span className="payment-view__total-amount payment-view__total-amount--final">
                    {total.toFixed(2)} €
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Code promo */}
          {cart.length > 0 && (
            <section className="payment-view__section payment-view__section--promo">
              <h2 className="payment-view__section-title">CODE PROMO</h2>
              {promoCode ? (
                <div className="payment-view__promo-applied">
                  <div className="payment-view__promo-info">
                    <span className="payment-view__promo-code">{promoCode}</span>
                    {promoData?.description && (
                      <span className="payment-view__promo-description">{promoData.description}</span>
                    )}
                    <span className="payment-view__promo-discount">
                      -{discount.toFixed(2)} € {discountPercentage > 0 ? `(${discountPercentage.toFixed(1)}%)` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="payment-view__promo-remove"
                    aria-label="Retirer le code promo"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="payment-view__promo-input">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Entrez votre code promo"
                    className="payment-view__promo-field"
                    disabled={isValidatingPromo}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyPromo();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isValidatingPromo || !promoInput.trim()}
                    className="payment-view__promo-button"
                  >
                    {isValidatingPromo ? '⏳' : 'APPLIQUER'}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Méthodes de paiement */}
          {cart.length > 0 && (
            <section className="payment-view__section">
              <h2 className="payment-view__section-title">MOYEN DE PAIEMENT</h2>
              <div className="payment-view__methods">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`payment-view__method ${paymentMethod === 'card' ? 'payment-view__method--active' : ''}`}
                >
                  <div className="payment-view__method-icon">💳</div>
                  <div className="payment-view__method-label">CARTE BANCAIRE</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`payment-view__method ${paymentMethod === 'cash' ? 'payment-view__method--active' : ''}`}
                >
                  <div className="payment-view__method-icon">💵</div>
                  <div className="payment-view__method-label">ESPÈCES</div>
                </button>
              </div>
            </section>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="payment-view__error">
              <p className="payment-view__error-text">{error}</p>
            </div>
          )}

          {/* Bouton de paiement */}
          {cart.length > 0 && (
            <footer className="payment-view__footer">
              <button
                type="button"
                onClick={handlePayment}
                disabled={isProcessing || cart.length === 0}
                className={`payment-view__pay-button ${isProcessing || cart.length === 0 ? 'payment-view__pay-button--disabled' : ''}`}
              >
                {isProcessing ? (
                  <>
                    <span className="payment-view__pay-button-spinner">⏳</span>
                    TRAITEMENT EN COURS...
                  </>
                ) : (
                  `PAYER ${total.toFixed(2)} €`
                )}
              </button>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentView;
