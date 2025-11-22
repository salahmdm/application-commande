import logger from '../utils/logger';
/**
 * Service global pour gérer les événements de connexion/déconnexion serveur
 * Permet de centraliser la détection des déconnexions serveur
 */

class ServerConnectionService {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Émettre un événement de déconnexion serveur
   */
  emitDisconnection(reason) {
    logger.log('[ServerConnection] Émission événement déconnexion:', reason);
    this.emit('server_disconnected', reason);
  }

  /**
   * Émettre un événement d'échec de connexion
   */
  emitConnectionFailed(error) {
    logger.log('[ServerConnection] Émission événement échec connexion:', error);
    this.emit('server_connection_failed', error);
  }

  /**
   * Souscrire à un événement
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Se désabonner d'un événement
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Émettre un événement interne
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`[ServerConnection] Erreur dans callback pour ${event}:`, error);
        }
      });
    }
  }
}

// Instance singleton
export const serverConnectionService = new ServerConnectionService();

export default serverConnectionService;

