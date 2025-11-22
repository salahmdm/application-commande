import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import './KioskProductCard.css';

/**
 * Card produit style Burger King
 * Bordures dorées, badges PROMO/NOUVEAU, dégradés
 */
function KioskProductCard({ product, onSelect, onAddToCart }) {
  const { updateActivity, cart } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  // Convertir le prix en nombre (peut être string depuis MySQL)
  const productPrice = typeof product.price === 'string' 
    ? parseFloat(product.price) 
    : (product.price || 0);
  
  // S'assurer que c'est un nombre valide
  const safePrice = isNaN(productPrice) ? 0 : productPrice;

  // Vérifier si le produit est dans le panier
  const quantityInCart = cart.filter(item => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  // Déterminer les badges depuis les propriétés du produit (enrichies depuis la BDD)
  const hasPromo = product.is_promo === true || product.isPromo === true || product.promo === true || false;

  const handleClick = () => {
    updateActivity();
    if (onSelect) {
      onSelect(product);
    } else if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    logger.log(`➕ KioskProductCard - Ajout au panier: ${product.name}`);
    if (onAddToCart) {
      onAddToCart(product);
    }
    updateActivity();
  };

  return (
    <div className="kiosk-product-card" onClick={handleClick}>
      <div className="kiosk-product-card__image-container">
        {hasPromo && (
          <div className="kiosk-product-card__badge">PROMO</div>
        )}

        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="kiosk-product-card__image"
            loading="lazy"
          />
        ) : (
          <div className="kiosk-product-card__emoji">🍽️</div>
        )}
      </div>

      <div className="kiosk-product-card__info">
        <div>
          <h3 className="kiosk-product-card__name">{product.name}</h3>
          {product.description && (
            <p className="kiosk-product-card__description">
              {product.description}
            </p>
          )}
        </div>

        <div className="kiosk-product-card__footer">
          <span className="kiosk-product-card__price">
            {safePrice.toFixed(2)} €
          </span>
          <button
            className="kiosk-product-card__add-button"
            onClick={handleAddClick}
            aria-label={`Ajouter ${product.name} au panier`}
          >
            {quantityInCart > 0 ? `Ajouter (${quantityInCart})` : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default KioskProductCard;
