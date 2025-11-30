import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import { BKCategories } from '../styles/kiosk-theme';
import './KioskSidebar.css';

function KioskSidebar({ categories = [], selectedCategoryId = null, onCategorySelect, onCheckout }) {
  const { updateActivity, cart } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  const menuCategories = categories.length > 0 
    ? categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '🍽️',
        bkId: cat.bkId,
        headerGradient: cat.headerGradient,
      }))
    : BKCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        bkId: cat.id,
        headerGradient: cat.headerGradient,
      }));

  const handleCategoryClick = (categoryId) => {
    logger.log(`📂 KioskSidebar - Catégorie cliquée: ${categoryId}`);
    updateActivity();
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  const total = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' 
      ? parseFloat(item.price) 
      : (item.price || item.product?.price || 0);
    return sum + (price * item.quantity);
  }, 0);

  const handleCheckout = () => {
    updateActivity();
    logger.log('💳 KioskSidebar - Voir la commande');
    if (onCheckout) {
      onCheckout();
    }
  };

  return (
    <aside className="kiosk-sidebar">
      <nav className="kiosk-sidebar__nav">
        {menuCategories.map((category) => {
          const isActive =
            selectedCategoryId === category.id ||
            (!selectedCategoryId && category.id === menuCategories[0]?.id);

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`kiosk-sidebar__button ${isActive ? 'kiosk-sidebar__button--active' : ''}`}
              aria-label={`Catégorie ${category.name}`}
            >
              <div className="kiosk-sidebar__details">
                <span className="kiosk-sidebar__text">{category.name}</span>
              </div>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}

export default KioskSidebar;

