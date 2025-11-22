import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import './KioskCartButton.css';

/**
 * Bouton panier flottant style Burger King
 * Position fixe en bas à droite avec badge compteur
 */
function KioskCartButton({ onClick }) {
  const { updateActivity, cart } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleClick = () => {
    updateActivity();
    logger.log('🛒 KioskCartButton - Clic sur panier');
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      className="kiosk-cart-button"
      onClick={handleClick}
      aria-label={`Voir le panier (${itemCount} articles)`}
    >
      <span className="kiosk-cart-button__icon">🛒</span>
      {itemCount > 0 && (
        <span className="kiosk-cart-button__badge">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

export default KioskCartButton;

