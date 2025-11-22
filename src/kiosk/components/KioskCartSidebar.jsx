import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import { BKColors } from '../styles/kiosk-theme';
import './KioskCartSidebar.css';

/**
 * Sidebar panier style Burger King
 * Panneau latéral avec liste des articles et total
 */
function KioskCartSidebar({ onClose, onCheckout }) {
  const { updateActivity, cart, updateCartItemQuantity, removeFromCart } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  // Calculer le total
  const total = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' 
      ? parseFloat(item.price) 
      : (item.price || 0);
    return sum + (price * item.quantity);
  }, 0);

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
    logger.log('💳 KioskCartSidebar - Passage à la caisse');
    if (onCheckout) {
      onCheckout();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="kiosk-cart-sidebar__overlay" onClick={onClose} />
      
      {/* Sidebar */}
      <aside className="kiosk-cart-sidebar">
        {/* Header */}
        <div 
          className="kiosk-cart-sidebar__header"
          style={{ background: BKColors.gradients.buttonPrimary }}
        >
          <h2 className="kiosk-cart-sidebar__title">MA COMMANDE</h2>
          <button
            className="kiosk-cart-sidebar__close"
            onClick={onClose}
            aria-label="Fermer le panier"
          >
            ✕
          </button>
        </div>

        {/* Liste des articles */}
        <div className="kiosk-cart-sidebar__items">
          {cart.length === 0 ? (
            <div className="kiosk-cart-sidebar__empty">
              <div className="kiosk-cart-sidebar__empty-icon">🛒</div>
              <p className="kiosk-cart-sidebar__empty-text">Votre panier est vide</p>
            </div>
          ) : (
            cart.map((item, index) => {
              const itemPrice = typeof item.price === 'string' 
                ? parseFloat(item.price) 
                : (item.price || 0);
              const itemTotal = itemPrice * item.quantity;

              return (
                <div key={index} className="kiosk-cart-sidebar__item">
                  <div className="kiosk-cart-sidebar__item-emoji">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      '🍽️'
                    )}
                  </div>
                  
                  <div className="kiosk-cart-sidebar__item-info">
                    <h3 className="kiosk-cart-sidebar__item-name">
                      {item.name.toUpperCase()}
                    </h3>
                    <div className="kiosk-cart-sidebar__item-price">
                      {itemPrice.toFixed(2)} €
                    </div>
                  </div>

                  <div className="kiosk-cart-sidebar__quantity-controls">
                    <button
                      className="kiosk-cart-sidebar__quantity-button"
                      onClick={() => handleQuantityChange(index, item.quantity - 1)}
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <span className="kiosk-cart-sidebar__quantity-value">
                      {item.quantity}
                    </span>
                    <button
                      className="kiosk-cart-sidebar__quantity-button"
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

        {/* Footer avec total */}
        {cart.length > 0 && (
          <div 
            className="kiosk-cart-sidebar__footer"
            style={{ background: BKColors.gradients.cartFooter }}
          >
            <div className="kiosk-cart-sidebar__total-row">
              <span className="kiosk-cart-sidebar__total-label">TOTAL</span>
              <span className="kiosk-cart-sidebar__total-amount">
                {total.toFixed(2)} €
              </span>
            </div>
            
            <button
              className="kiosk-cart-sidebar__checkout-button"
              onClick={handleCheckout}
              style={{ background: BKColors.gradients.buttonPrimary }}
            >
              COMMANDER
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default KioskCartSidebar;

