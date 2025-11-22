import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import { BKCategories, BKColors } from '../styles/kiosk-theme';
import './KioskHeader.css';

/**
 * Header catégorie style Burger King
 * Dégradé dynamique selon la catégorie active
 */
function KioskHeader({ categoryId = 'nouveautes', categoryName = null }) {
  const { updateActivity } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  // Trouver la configuration de la catégorie
  const categoryConfig = BKCategories.find(c => c.id === categoryId) || BKCategories[0];
  const displayName = categoryName ? categoryName.toUpperCase() : categoryConfig.name;
  const headerGradient = categoryConfig.headerGradient || BKColors.gradients.headerNouveautes;
  const isNouveautes = categoryId === 'nouveautes';

  return (
    <header 
      className="kiosk-header"
      style={{ background: headerGradient }}
    >
      <div className="kiosk-header__content">
        {isNouveautes && (
          <div className="kiosk-header__badge">
            <span className="kiosk-header__badge-icon">🔥</span>
            <span className="kiosk-header__badge-text">NOUVEAUTÉS</span>
          </div>
        )}
        <h1 className="kiosk-header__title">{displayName}</h1>
        {isNouveautes && (
          <p className="kiosk-header__subtitle">Découvrez nos dernières créations</p>
        )}
      </div>
    </header>
  );
}

export default KioskHeader;

