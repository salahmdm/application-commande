import { useEffect } from 'react';
import useUIStore from '../store/uiStore';
import orderWebSocketService from '../services/orderWebSocketService';
import serverConnectionService from '../services/serverConnectionService';
import useAuth from './useAuth';
import logger from '../utils/logger';

/**
 * Hook pour gérer la redirection automatique vers la page d'accueil
 * lorsque le serveur se déconnecte
 */
const useServerDisconnection = () => {
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // Si l'utilisateur n'est pas authentifié, pas besoin d'écouter les déconnexions
      return;
    }

    let hasRedirected = false;
    let redirectTimeout = null;

    const redirectToHome = () => {
      // Éviter les redirections multiples
      if (hasRedirected) {
        return;
      }

      logger.log('🔄 Redirection vers la page d\'accueil suite à la déconnexion serveur');
      hasRedirected = true;
      setCurrentView('home');
      
      // Réinitialiser le flag après un délai pour permettre une nouvelle redirection si nécessaire
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      redirectTimeout = setTimeout(() => {
        hasRedirected = false;
      }, 5000);
    };

    const handleWebSocketDisconnected = (reason) => {
      logger.log('⚠️ Déconnexion WebSocket détectée:', reason);
      
      // Vérifier si la déconnexion est due à une erreur serveur
      // (pas une déconnexion volontaire)
      const isServerError = reason === 'io server disconnect' || 
                           reason === 'transport close' ||
                           reason === 'transport error' ||
                           reason === 'ping timeout' ||
                           reason === 'io client disconnect';

      if (isServerError) {
        redirectToHome();
      }
    };

    const handleWebSocketConnectionFailed = (error) => {
      logger.log('⚠️ Échec de connexion WebSocket:', error);
      redirectToHome();
    };

    const handleServerDisconnected = (reason) => {
      logger.log('⚠️ Déconnexion serveur détectée (événement global):', reason);
      redirectToHome();
    };

    const handleServerConnectionFailed = (error) => {
      logger.log('⚠️ Échec de connexion serveur (événement global):', error);
      redirectToHome();
    };

    // Écouter les événements WebSocket
    orderWebSocketService.on('disconnected', handleWebSocketDisconnected);
    orderWebSocketService.on('connection_failed', handleWebSocketConnectionFailed);

    // Écouter les événements globaux de connexion serveur
    serverConnectionService.on('server_disconnected', handleServerDisconnected);
    serverConnectionService.on('server_connection_failed', handleServerConnectionFailed);

    // Nettoyage
    return () => {
      orderWebSocketService.off('disconnected', handleWebSocketDisconnected);
      orderWebSocketService.off('connection_failed', handleWebSocketConnectionFailed);
      serverConnectionService.off('server_disconnected', handleServerDisconnected);
      serverConnectionService.off('server_connection_failed', handleServerConnectionFailed);
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [isAuthenticated, setCurrentView]);
};

export default useServerDisconnection;

