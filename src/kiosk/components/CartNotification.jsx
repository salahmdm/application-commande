import { useEffect, useState } from 'react';
import './CartNotification.css';

/**
 * Notification d'ajout au panier avec animation
 */
function CartNotification({ product, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Attendre la fin de l'animation de sortie
    }, 2000); // Afficher pendant 2 secondes

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!product) return null;

  return (
    <div className={`cart-notification ${isVisible ? 'cart-notification--visible' : 'cart-notification--hidden'}`}>
      <div className="cart-notification__content">
        <div className="cart-notification__icon">✓</div>
        <div className="cart-notification__text">
          <span className="cart-notification__product">{product.name}</span>
          <span className="cart-notification__message">ajouté au panier</span>
        </div>
      </div>
    </div>
  );
}

export default CartNotification;

