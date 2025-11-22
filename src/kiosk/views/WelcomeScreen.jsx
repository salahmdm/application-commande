import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';

/**
 * Écran d'accueil de la borne
 * Inspiré des bornes McDonald's / KFC
 * Grand bouton "Commencer votre commande"
 */
function WelcomeScreen() {
  const { setCurrentStep, updateActivity } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  const handleStart = () => {
    logger.log('🎬 Kiosk - Démarrage de la commande');
    // Aller à la sélection du type de commande
    setCurrentStep('order-type');
  };

  return (
    <div className="welcome-screen h-screen w-full bg-white flex items-center justify-center">
      <div className="max-w-4xl w-full px-8 py-16 flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-sm tracking-[0.4em] uppercase text-neutral-500">
            Blossom Café
          </span>
          <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight text-neutral-900">
            Commandez facilement
          </h1>
          <p className="text-xl text-neutral-500">
            Touchez l’écran pour démarrer votre commande.
          </p>
        </div>

        <button
          onClick={handleStart}
          className="px-20 py-8 bg-black text-white text-3xl font-semibold rounded-full tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 touch-manipulation"
        >
          Commencer votre commande
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;

