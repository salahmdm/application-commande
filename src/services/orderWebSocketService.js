/**
 * Service WebSocket pour les mises à jour en temps réel des commandes
 * Remplace le polling par des mises à jour instantanées
 */

import { io } from 'socket.io-client';
import logger from '../utils/logger';

// URL du backend (sans /api pour WebSocket)
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class OrderWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
  }

  /**
   * Connecter au serveur WebSocket
   */
  connect(token) {
    if (this.socket?.connected) {
      logger.log('[OrderWebSocket] Déjà connecté');
      return;
    }

    try {
      this.socket = io(`${API_URL}`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
        auth: token ? { token } : {},
      });

      this.socket.on('connect', () => {
        logger.log('[OrderWebSocket] Connecté');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.socket.on('disconnect', (reason) => {
        logger.log('[OrderWebSocket] Déconnecté:', reason);
        this.isConnected = false;
        this.emit('disconnected', reason);
        
        // ✅ Émettre aussi un événement global pour cohérence
        // Import dynamique pour éviter les dépendances circulaires
        import('./serverConnectionService').then(({ serverConnectionService }) => {
          serverConnectionService.emitDisconnection(reason);
        }).catch((importError) => {
          logger.warn('[OrderWebSocket] Impossible d\'importer serverConnectionService:', importError);
        });
      });

      this.socket.on('connect_error', (error) => {
        logger.error('[OrderWebSocket] Erreur de connexion:', error.message || error);
        this.reconnectAttempts++;
        
        // ✅ AMÉLIORATION: Ne pas émettre d'erreur immédiatement, laisser Socket.IO réessayer
        // Socket.IO gère automatiquement la reconnexion avec reconnectionAttempts
        // On émet seulement si toutes les tentatives sont épuisées
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error(`[OrderWebSocket] Échec après ${this.maxReconnectAttempts} tentatives de reconnexion`);
          this.emit('connection_failed', error);
          
          // ✅ Émettre aussi un événement global pour cohérence
          import('./serverConnectionService').then(({ serverConnectionService }) => {
            serverConnectionService.emitConnectionFailed(error);
          }).catch((importError) => {
            logger.warn('[OrderWebSocket] Impossible d\'importer serverConnectionService:', importError);
          });
        } else {
          // Log seulement les premières tentatives pour éviter le spam
          if (this.reconnectAttempts <= 3) {
            logger.warn(`[OrderWebSocket] Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
          }
        }
      });

      // Écouter les événements de commandes
      this.socket.on('order:created', (order) => {
        logger.log('[OrderWebSocket] Nouvelle commande:', order);
        this.emit('order:created', order);
      });

      this.socket.on('order:updated', (order) => {
        logger.log('[OrderWebSocket] Commande mise à jour:', order);
        this.emit('order:updated', order);
      });

      this.socket.on('order:status_changed', (data) => {
        logger.log('[OrderWebSocket] Statut changé:', data);
        this.emit('order:status_changed', data);
      });

      this.socket.on('orders:refresh', () => {
        logger.log('[OrderWebSocket] Rafraîchissement demandé');
        this.emit('orders:refresh');
      });

    } catch (error) {
      logger.error('[OrderWebSocket] Erreur lors de la connexion:', error);
      this.emit('connection_error', error);
    }
  }

  /**
   * Déconnecter du serveur
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
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
          logger.error(`[OrderWebSocket] Erreur dans callback pour ${event}:`, error);
        }
      });
    }
  }

  /**
   * Obtenir le statut de connexion
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket?.connected || false,
    };
  }
}

// Instance singleton
export const orderWebSocketService = new OrderWebSocketService();

export default orderWebSocketService;

