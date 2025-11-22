import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import { BKColors } from '../styles/kiosk-theme';
import './KioskCartFixed.css';

/**
 * Panier fixe en bas (1/4 de l'écran - 25vh)
 * Style Burger King
 * Hauteur fixe, pas de redimensionnement
 */
function KioskCartFixed({ onCheckout }) {
  const { updateActivity, cart, updateCartItemQuantity, removeFromCart } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);
  
  // Mettre à jour le padding du contenu principal (fixe à 25vh)
  useEffect(() => {
    const mainContent = document.querySelector('.kiosk-home-screen__main');
    if (mainContent) {
      mainContent.style.paddingBottom = '25vh';
    }
  }, []);

  // Calculer le total
  const total = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' 
      ? parseFloat(item.price) 
      : (item.price || 0);
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (index, newQuantity) => {
    updateActivity();
    if (newQuantity <= 0) {
      removeFromCart(index);
    } else {
      updateCartItemQuantity(index, newQuantity);
    }
  };

  const handleCheckout = () => {
    updateActivity();
    logger.log('💳 KioskCartFixed - Passage à la caisse');
    if (onCheckout) {
      onCheckout();
    }
  };

  return (
    <div className="kiosk-cart-fixed">
      {/* Header du panier */}
      <div 
        className="kiosk-cart-fixed__header"
        style={{ background: BKColors.gradients.buttonPrimary }}
      >
        <div className="kiosk-cart-fixed__header-left">
          <h2 className="kiosk-cart-fixed__title">🛒 MA COMMANDE</h2>
          <div className="kiosk-cart-fixed__count">
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </div>
        </div>
        <div className="kiosk-cart-fixed__header-right">
          <div className="kiosk-cart-fixed__total-preview">
            {total > 0 && (
              <>
                <span className="kiosk-cart-fixed__total-preview-label">TOTAL</span>
                <span className="kiosk-cart-fixed__total-preview-amount">{total.toFixed(2)} €</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Liste des articles (scrollable) */}
      <div className="kiosk-cart-fixed__items">
        {cart.length === 0 ? (
          <div className="kiosk-cart-fixed__empty">
            <div className="kiosk-cart-fixed__empty-icon">🛒</div>
            <p className="kiosk-cart-fixed__empty-text">Votre panier est vide</p>
          </div>
        ) : (
          cart.map((item, index) => {
            // Le panier stocke les items avec productId, product, quantity, price
            // Accéder au nom depuis item.product.name ou item.name directement
            const product = item.product || item;
            const itemName = product.name || item.name || 'Produit sans nom';
            const itemImage = product.image_url || item.image_url || product.imageUrl || item.imageUrl || null;
            
            const itemPrice = typeof item.price === 'string' 
              ? parseFloat(item.price) 
              : (item.price || (product.price ? (typeof product.price === 'string' ? parseFloat(product.price) : product.price) : 0));
            const itemTotal = itemPrice * item.quantity;

            return (
              <div key={index} className="kiosk-cart-fixed__item">
                <div className="kiosk-cart-fixed__item-emoji">
                  {itemImage ? (
                    <img src={itemImage} alt={itemName} />
                  ) : (
                    '🍽️'
                  )}
                </div>
                
                <div className="kiosk-cart-fixed__item-info">
                  <h3 className="kiosk-cart-fixed__item-name">
                    {itemName.toUpperCase()}
                  </h3>
                  <div className="kiosk-cart-fixed__item-details">
                    <span className="kiosk-cart-fixed__item-unit-price">
                      {itemPrice.toFixed(2)} €
                    </span>
                    <span className="kiosk-cart-fixed__item-quantity-badge">
                      × {item.quantity}
                    </span>
                    <span className="kiosk-cart-fixed__item-total-price">
                      = {itemTotal.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="kiosk-cart-fixed__quantity-controls">
                  <button
                    className="kiosk-cart-fixed__quantity-button"
                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                    aria-label="Diminuer la quantité"
                  >
                    −
                  </button>
                  <span className="kiosk-cart-fixed__quantity-value">
                    {item.quantity}
                  </span>
                  <button
                    className="kiosk-cart-fixed__quantity-button"
                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer avec total et bouton commander */}
      {cart.length > 0 && (
        <div 
          className="kiosk-cart-fixed__footer"
          style={{ background: BKColors.gradients.cartFooter }}
        >
          <div className="kiosk-cart-fixed__total-row">
            <span className="kiosk-cart-fixed__total-label">TOTAL</span>
            <span className="kiosk-cart-fixed__total-amount">
              {total.toFixed(2)} €
            </span>
          </div>
          
          <button
            className="kiosk-cart-fixed__checkout-button"
            onClick={handleCheckout}
            style={{ background: BKColors.gradients.buttonPrimary }}
          >
            COMMANDER
          </button>
        </div>
      )}
    </div>
  );
}

export default KioskCartFixed;
