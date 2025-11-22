/**
 * Fonction utilitaire pour déconnecter de TOUS les comptes
 * Nettoie tous les stores, localStorage, sessionStorage et cookies
 */

import logger from './logger';

/**
 * Déconnecte de tous les comptes et nettoie tout le stockage
 */
export const logoutAll = async () => {
  try {
    logger.log('🚪 Déconnexion de tous les comptes...');

    // 1. Déconnexion de l'application principale
    try {
      const authStore = await import('../store/authStore');
      if (authStore.default && authStore.default.getState().logout) {
        await authStore.default.getState().logout();
        logger.log('✅ Déconnexion application principale');
      }
    } catch (error) {
      logger.warn('⚠️ Erreur déconnexion application principale:', error);
    }

    // 2. Déconnexion du kiosk
    try {
      const kioskStore = await import('../store/kioskStore');
      if (kioskStore.default && kioskStore.default.getState().logoutKiosk) {
        kioskStore.default.getState().logoutKiosk();
        logger.log('✅ Déconnexion kiosk');
      }
    } catch (error) {
      logger.warn('⚠️ Erreur déconnexion kiosk:', error);
    }

    // 3. Nettoyer localStorage
    try {
      const keysToRemove = [
        'token',
        'user',
        'blossom-auth-storage',
        'cart-storage',
        'kiosk-storage',
        'ui-storage'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignorer les erreurs
        }
      });
      
      // Nettoyer aussi toutes les clés qui commencent par certaines préfixes
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('auth-') ||
            key.startsWith('cart-') ||
            key.startsWith('kiosk-') ||
            key.startsWith('user-')
          )) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Ignorer les erreurs
      }
      
      logger.log('✅ localStorage nettoyé');
    } catch (error) {
      logger.warn('⚠️ Erreur nettoyage localStorage:', error);
    }

    // 4. Nettoyer sessionStorage
    try {
      const keysToRemove = [
        'guest-cart-key',
        'kiosk-storage',
        'csrf-token',
        'session'
      ];
      
      keysToRemove.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          // Ignorer les erreurs
        }
      });
      
      // Nettoyer toutes les clés de sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        // Ignorer les erreurs
      }
      
      logger.log('✅ sessionStorage nettoyé');
    } catch (error) {
      logger.warn('⚠️ Erreur nettoyage sessionStorage:', error);
    }

    // 5. Appeler l'API pour supprimer les cookies côté serveur
    try {
      const apiCall = (await import('../services/api')).apiCall;
      await apiCall('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      logger.log('✅ Cookies serveur supprimés');
    } catch (error) {
      logger.warn('⚠️ Erreur suppression cookies serveur:', error);
    }

    // 6. Supprimer les cookies côté client (si possible)
    try {
      // Supprimer tous les cookies du domaine actuel
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        // Supprimer le cookie
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      });
      logger.log('✅ Cookies client supprimés');
    } catch (error) {
      logger.warn('⚠️ Erreur suppression cookies client:', error);
    }

    // 7. Réinitialiser tous les stores Zustand
    try {
      // Réinitialiser authStore
      const authStore = await import('../store/authStore');
      if (authStore.default) {
        authStore.default.setState({
          user: null,
          isAuthenticated: false,
          role: null,
          token: null
        });
      }

      // Réinitialiser kioskStore
      const kioskStore = await import('../store/kioskStore');
      if (kioskStore.default) {
        kioskStore.default.setState({
          isAuthenticated: false,
          kioskToken: null,
          kioskId: null,
          currentStep: 'login',
          cart: [],
          orderType: 'dine-in'
        });
      }

      logger.log('✅ Stores Zustand réinitialisés');
    } catch (error) {
      logger.warn('⚠️ Erreur réinitialisation stores:', error);
    }

    logger.log('✅ Déconnexion complète de tous les comptes terminée');
    
    // 8. Rediriger vers la page d'accueil
    try {
      window.location.href = '/';
    } catch (error) {
      logger.warn('⚠️ Erreur redirection:', error);
    }

    return { success: true };
  } catch (error) {
    logger.error('❌ Erreur lors de la déconnexion complète:', error);
    return { success: false, error: error.message };
  }
};

export default logoutAll;

