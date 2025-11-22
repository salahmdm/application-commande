import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import LanguageSelector from '../components/LanguageSelector';
import './OrderTypeSelection.css';

/**
 * Page de sélection du type de commande
 * Sur place ou À emporter
 */
function OrderTypeSelection() {
  const { setCurrentStep, setOrderType, updateActivity } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  const handleOrderTypeSelect = (type) => {
    logger.log(`📋 Kiosk - Type de commande sélectionné: ${type}`);
    setOrderType(type);
    setCurrentStep('home');
  };

  return (
    <div className="order-type-selection h-screen w-full bg-white flex items-center justify-center">
      <div className="order-type-selection__container">
        <div className="order-type-selection__options">
          <button
            onClick={() => handleOrderTypeSelect('dine-in')}
            className="order-type-selection__option"
          >
            <span className="order-type-selection__option-text">SUR PLACE</span>
          </button>

          <button
            onClick={() => handleOrderTypeSelect('takeaway')}
            className="order-type-selection__option"
          >
            <span className="order-type-selection__option-text">À EMPORTER</span>
          </button>
        </div>
      </div>

      <LanguageSelector />
    </div>
  );
}

export default OrderTypeSelection;

