import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import './KioskHeroBanner.css';

/**
 * Hero Banner (bannière produit en haut)
 * Style KFC
 * Hauteur : 280-350px
 * Grande image produit avec texte overlay
 */
function KioskHeroBanner({ 
  imageUrl = null, 
  title = 'Découvrez nos spécialités',
  subtitle = 'Commandez facilement depuis votre borne',
  product = null 
}) {
  const { updateActivity } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  // Image par défaut ou depuis le produit
  const bannerImage = imageUrl || product?.image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=600&fit=crop';

  return (
    <div className="kiosk-hero-banner">
      <div 
        className="kiosk-hero-banner__image"
        style={{ backgroundImage: `url(${bannerImage})` }}
      >
        <div className="kiosk-hero-banner__overlay">
          <div className="kiosk-hero-banner__content">
            <h2 className="kiosk-hero-banner__title">{title}</h2>
            {subtitle && (
              <p className="kiosk-hero-banner__subtitle">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KioskHeroBanner;

