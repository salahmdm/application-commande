import logger from './logger';
/**
 * Utilitaires pour les notifications sonores
 */

class SoundNotificationManager {
  constructor() {
    this.enabled = true;
    this.audioContext = null;
    this.audioContextInitialized = false;
    this.sounds = {
      newOrder: null,
      statusChange: null,
      urgent: null,
    };
    // Ne pas initialiser AudioContext immédiatement - seulement quand nécessaire
  }

  initAudioContext() {
    // Initialiser AudioContext seulement quand nécessaire et de manière lazy
    if (this.audioContextInitialized) {
      return this.audioContext;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    // Vérifier si les notifications sonores sont autorisées
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContextInitialized = true;
        return this.audioContext;
      } catch (error) {
        logger.warn('[SoundNotification] AudioContext non disponible:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Générer un son de notification
   */
  playTone(frequency = 800, duration = 200, type = 'sine') {
    if (!this.enabled) return;

    // Initialiser AudioContext de manière lazy si nécessaire
    const audioContext = this.initAudioContext();
    if (!audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      logger.warn('[SoundNotification] Erreur lors de la lecture du son:', error);
    }
  }

  /**
   * Son pour nouvelle commande
   */
  playNewOrder() {
    // Double bip aigu
    this.playTone(1000, 150, 'sine');
    setTimeout(() => {
      this.playTone(1200, 150, 'sine');
    }, 200);
  }

  /**
   * Son pour changement de statut
   */
  playStatusChange() {
    // Bip unique moyen
    this.playTone(800, 200, 'sine');
  }

  /**
   * Son pour commande urgente
   */
  playUrgent() {
    // Triple bip rapide
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(1500, 100, 'square');
      }, i * 150);
    }
  }

  /**
   * Activer/désactiver les sons
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Vérifier si les sons sont activés
   */
  isEnabled() {
    return this.enabled;
  }
}

export const soundNotificationManager = new SoundNotificationManager();

export default soundNotificationManager;

