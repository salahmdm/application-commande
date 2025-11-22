import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import KioskProductCard from './KioskProductCard';
import './KioskProductSection.css';

/**
 * Section de produits avec titre
 * Style KFC
 * Titre section : 36-42px, bold
 * Marge entre sections : 40-60px
 * Grille 3 colonnes
 */
function KioskProductSection({ 
  title, 
  products = [], 
  onProductSelect,
  onProductAdd 
}) {
  const { updateActivity } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="kiosk-product-section">
      <h2 className="kiosk-product-section__title">{title}</h2>
      <div className="kiosk-product-section__grid">
        {products.map((product) => (
          <KioskProductCard
            key={product.id}
            product={product}
            onSelect={onProductSelect}
            onAddToCart={onProductAdd}
          />
        ))}
      </div>
    </section>
  );
}

export default KioskProductSection;

