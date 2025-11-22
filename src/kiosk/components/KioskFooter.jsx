import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import './KioskFooter.css';

/**
 * Footer fixe (bas d'écran)
 * Style KFC - Rouge
 * Hauteur : 120-150px
 * Affiche total panier, nombre d'articles, bouton "Voir mon panier"
 */
function KioskFooter({ onViewCart }) {
  const { updateActivity, cart } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  // Calculer le total du panier
  const total = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' 
      ? parseFloat(item.price) 
      : (item.price || 0);
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleViewCart = () => {
    updateActivity();
    logger.log('🛒 KioskFooter - Voir le panier');
    if (onViewCart) {
      onViewCart();
    }
  };

  return (
    <footer className="kiosk-footer">
      <div className="kiosk-footer__container">
        <div className="kiosk-footer__info">
          <div className="kiosk-footer__total">
            <span className="kiosk-footer__label">Total :</span>
            <span className="kiosk-footer__amount">
              {isNaN(total) ? '0.00' : total.toFixed(2)} €
            </span>
          </div>
          <div className="kiosk-footer__count">
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </div>
        </div>

        <button
          className="kiosk-footer__button"
          onClick={handleViewCart}
          disabled={itemCount === 0}
        >
          {itemCount > 0 ? 'Voir mon panier' : 'Panier vide'}
        </button>
      </div>
    </footer>
  );
}

export default KioskFooter;

