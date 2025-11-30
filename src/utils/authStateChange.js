/**
 * Utilitaire pour écouter les changements d'état d'authentification
 * Utilise localStorage events pour détecter les changements d'utilisateur
 */

import authService from '../services/authService';
import logger from './logger';

/**
 * Écouter les changements d'état d'authentification
 * Utilise localStorage events pour détecter les changements d'utilisateur
 */
export function onAuthStateChange(callback) {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  if (typeof callback !== 'function') {
    return () => {};
  }

  const handler = () => {
    try {
      const user = authService.getCurrentUser();
      callback(user || null);
    } catch (error) {
      logger.warn('⚠️ onAuthStateChange - Callback échoué:', error);
    }
  };

  window.addEventListener('storage', handler);
  handler(); // synchronisation immédiate

  return () => {
    window.removeEventListener('storage', handler);
  };
}

