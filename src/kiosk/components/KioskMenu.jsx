import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import './KioskMenu.css';

/**
 * Menu latéral vertical fixe (style KFC)
 * Largeur : 260-300px
 * Fond blanc
 * Catégories alignées verticalement
 */
function KioskMenu({ categories = [], activeCategoryId = null, onCategorySelect }) {
  const { updateActivity } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  // Catégories par défaut si aucune n'est fournie
  const defaultCategories = [
    { id: 'promotions', name: 'Promotions', icon: '🔥' },
    { id: 'menus', name: 'Menus', icon: '🍔' },
    { id: 'chicken', name: 'Chicken', icon: '🍗' },
    { id: 'burgers', name: 'Burgers', icon: '🥪' },
    { id: 'tendres', name: 'Tendres', icon: '🍖' },
    { id: 'boissons', name: 'Boissons', icon: '🥤' },
    { id: 'desserts', name: 'Desserts', icon: '🍰' },
    { id: 'accompagnements', name: 'Accompagnements', icon: '🍟' }
  ];

  const menuCategories = categories.length > 0 ? categories : defaultCategories;

  const handleCategoryClick = (categoryId) => {
    logger.log(`📂 KioskMenu - Catégorie cliquée: ${categoryId}`);
    updateActivity();
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  return (
    <aside className="kiosk-menu">
      {/* Logo en haut */}
      <div className="kiosk-menu__logo">
        <h1 className="kiosk-menu__logo-text">Blossom Café</h1>
      </div>

      {/* Liste des catégories */}
      <nav className="kiosk-menu__nav">
        <ul className="kiosk-menu__list">
          {menuCategories.map((category) => {
            const isActive = activeCategoryId === category.id || activeCategoryId === category.id || 
                            (activeCategoryId === null && category.id === 'promotions');
            return (
              <li key={category.id} className="kiosk-menu__item">
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`kiosk-menu__button ${isActive ? 'kiosk-menu__button--active' : ''}`}
                  aria-label={`Catégorie ${category.name}`}
                >
                  {category.icon && (
                    <span className="kiosk-menu__icon">{category.icon}</span>
                  )}
                  <span className="kiosk-menu__text">{category.name}</span>
                  {isActive && <div className="kiosk-menu__indicator" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default KioskMenu;

