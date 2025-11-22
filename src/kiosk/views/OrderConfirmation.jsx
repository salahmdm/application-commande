import { useEffect, useState } from 'react';
import useKioskStore from '../../store/kioskStore';
import kioskService from '../../services/kioskService';
import logger from '../../utils/logger';

/**
 * Écran de confirmation de commande
 * Affiche le numéro de commande
 * Retour automatique après 20 secondes
 */
function OrderConfirmation() {
  const { resetKiosk, cart } = useKioskStore();
  const [orderNumber, setOrderNumber] = useState('CMD-0000');
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    // Récupérer le numéro de commande depuis le store ou localStorage
    const storedOrderNumber = sessionStorage.getItem('kiosk-last-order-number');
    if (storedOrderNumber) {
      setOrderNumber(storedOrderNumber);
      
      // Imprimer le ticket automatiquement
      const printTicket = async () => {
        try {
          logger.log(`🖨️ OrderConfirmation - Impression ticket pour: ${storedOrderNumber}`);
          const result = await kioskService.printOrderTicket(storedOrderNumber);
          if (result.success) {
            logger.log('✅ OrderConfirmation - Ticket imprimé avec succès');
          } else {
            logger.warn('⚠️ OrderConfirmation - Erreur impression ticket:', result.error);
          }
        } catch (error) {
          logger.error('❌ OrderConfirmation - Erreur impression ticket:', error);
          // Ne pas bloquer l'affichage en cas d'erreur d'impression
        }
      };
      
      // Délai de 500ms avant l'impression pour laisser le temps à la page de se charger
      const printTimeout = setTimeout(printTicket, 500);
      
      return () => {
        clearTimeout(printTimeout);
      };
    }

    // Compte à rebours pour retour automatique
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleReturnToStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleReturnToStart = () => {
    logger.log('🔄 Kiosk - Retour à l\'écran d\'accueil');
    resetKiosk();
    // Optionnel: Nettoyer le numéro de commande
    sessionStorage.removeItem('kiosk-last-order-number');
  };

  return (
    <div className="order-confirmation h-full w-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center max-w-4xl px-12">
        {/* Icône de succès */}
        <div className="text-9xl mb-8">✅</div>

        {/* Message de confirmation */}
        <h2 className="text-7xl font-bold text-gray-800 mb-8">
          Commande confirmée !
        </h2>

        {/* Numéro de commande */}
        <div className="bg-white rounded-3xl p-12 shadow-2xl mb-12">
          <p className="text-4xl text-gray-600 mb-6">Votre numéro de commande</p>
          <div className="text-9xl font-bold text-orange-600">
            {orderNumber}
          </div>
        </div>

        {/* Instructions */}
        <p className="text-3xl text-gray-700 mb-8">
          Veuillez noter ce numéro et vous présenter au comptoir
        </p>

        {/* Compte à rebours */}
        <p className="text-2xl text-gray-500 mb-8">
          Retour automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}
        </p>

        {/* Bouton retour immédiat */}
        <button
          onClick={handleReturnToStart}
          className="bg-orange-500 hover:bg-orange-600 text-white px-16 py-6 rounded-2xl text-4xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all touch-manipulation"
        >
          Nouvelle commande
        </button>
      </div>
    </div>
  );
}

export default OrderConfirmation;

