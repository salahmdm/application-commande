import { useEffect, useRef, useCallback } from 'react';
import logger from '../../utils/logger';

/**
 * Hook pour gérer le reset automatique après inactivité
 * Utilisé pour les bornes kiosk qui doivent se réinitialiser après X secondes
 * 
 * @param {number} timeoutMs - Délai d'inactivité en millisecondes (défaut: 60000 = 60s)
 * @param {Function} onReset - Callback appelé lors du reset
 */
export const useInactivityReset = (timeoutMs = 60000, onReset) => {
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const onResetRef = useRef(onReset);

  // Mettre à jour la référence du callback
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  const resetTimer = useCallback(() => {
    // Nettoyer le timer existant
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Démarrer un nouveau timer
    timeoutRef.current = setTimeout(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      logger.log(`⏱️ Inactivité détectée: ${Math.round(inactiveTime / 1000)}s`);
      
      if (onResetRef.current && typeof onResetRef.current === 'function') {
        try {
          onResetRef.current();
        } catch (error) {
          logger.error('❌ Erreur dans onReset callback:', error);
        }
      }
    }, timeoutMs);
  }, [timeoutMs]);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    resetTimer();
  }, [resetTimer]);

  // Écouter les événements utilisateur
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Démarrer le timer initial
    resetTimer();

    // Nettoyage
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeoutMs, resetTimer, updateActivity]);

  return { updateActivity };
};

