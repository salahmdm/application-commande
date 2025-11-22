import React, { useEffect } from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import useKioskStore from '../store/kioskStore';
import logger from '../utils/logger';

// Vues Kiosk
import WelcomeScreen from './views/WelcomeScreen';
import LanguageSelection from './views/LanguageSelection';
import OrderTypeSelection from './views/OrderTypeSelection';
import CategoryView from './views/CategoryView';
import ProductView from './views/ProductView';
import CartView from './views/CartView';
import PaymentView from './views/PaymentView';
import OrderConfirmation from './views/OrderConfirmation';

// Écran principal style KFC
import HomeScreen from './screens/HomeScreen';

// Hook d'inactivité
// ⚠️ TEMPORAIREMENT DÉSACTIVÉ pour debug
// import { useInactivityReset } from './hooks/useInactivityReset';

/**
 * Application Kiosk Mode
 * Interface dédiée pour les bornes tactiles en restaurant
 * Inspirée des bornes McDonald's, KFC, Burger King
 */
function KioskApp() {
  const { 
    currentStep, 
    setCurrentStep, 
    resetKiosk,
    language 
  } = useKioskStore();

  // Gestion de l'inactivité (reset après 60 secondes)
  // ⚠️ TEMPORAIREMENT DÉSACTIVÉ pour debug
  // useInactivityReset(60000, () => {
  //   try {
  //     logger.log('⏱️ Kiosk - Reset automatique après inactivité');
  //     resetKiosk();
  //     setCurrentStep('welcome');
  //   } catch (error) {
  //     logger.error('❌ Erreur lors du reset automatique:', error);
  //   }
  // });

  // Authentification automatique kiosk au montage
  useEffect(() => {
    const authenticateKiosk = async () => {
      const { isAuthenticated, setKioskAuth } = useKioskStore.getState();
      
      // Si déjà authentifié, ne rien faire
      if (isAuthenticated) {
        logger.log('✅ KioskApp - Déjà authentifié');
        return;
      }

      try {
        logger.log('🔐 KioskApp - Authentification automatique...');
        
        // Identifiants kiosk (peuvent être stockés en dur sur la borne)
        const kioskId = 'kiosk-001@blossom-cafe.local';
        const kioskSecret = 'kiosk-secret-2025';
        
        // Importer le service kiosk
        const kioskService = (await import('../services/kioskService')).default;
        
        // Authentification
        const response = await kioskService.login(kioskId, kioskSecret);
        
        if (response.success && response.token) {
          setKioskAuth(response.token, response.kiosk?.id || kioskId);
          logger.log('✅ KioskApp - Authentification réussie');
          logger.log('   Token reçu:', response.token ? 'Oui' : 'Non');
          logger.log('   Kiosk ID:', response.kiosk?.id || kioskId);
          logger.log('   Cookie kiosk_token devrait être défini par le serveur');
        } else {
          throw new Error(response.error || 'Échec de l\'authentification');
        }
      } catch (error) {
        logger.error('❌ KioskApp - Erreur authentification:', error);
        // En cas d'erreur, continuer quand même (peut-être que les routes sont publiques)
        logger.warn('⚠️ KioskApp - Continuation sans authentification');
      }
    };

    authenticateKiosk();
  }, []);

  // Rendu de la vue selon l'étape actuelle
  const renderCurrentView = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'language':
        return <LanguageSelection />;
      case 'order-type':
        return <OrderTypeSelection />;
      case 'home':
      case 'categories':
        // Nouvel écran principal style KFC
        return <HomeScreen />;
      case 'products':
        return <ProductView />;
      case 'cart':
        return <CartView />;
      case 'payment':
        return <PaymentView />;
      case 'confirmation':
        return <OrderConfirmation />;
      default:
        // Par défaut, afficher l'écran principal style KFC
        return <HomeScreen />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="kiosk-app">
        {renderCurrentView()}
      </div>
    </ErrorBoundary>
  );
}

export default KioskApp;

