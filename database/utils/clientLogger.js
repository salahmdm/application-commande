// ✅ IMPORT CIRCULAIRE SUPPRIMÉ - Le logger ne peut pas s'importer lui-même
/**
 * 🎯 Système de logging conditionnel pour le backend
 * Logs uniquement en développement pour éviter la pollution en production
 */

const isDev = process.env.NODE_ENV !== 'production';
const isProd = process.env.NODE_ENV === 'production';

/**
 * Logger conditionnel backend
 * - Les erreurs sont toujours loggées (même en production)
 * - Les logs de debug sont uniquement en développement
 */
const logger = {
  /**
   * Log standard (développement uniquement)
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log d'erreur (toujours actif - important pour la production)
   */
  error: (...args) => {
    console.error(...args);
    // TODO: En production, envoyer à un service de monitoring (Sentry, etc.)
    // if (isProd) {
    //   Sentry.captureException(...args);
    // }
  },

  /**
   * Log d'avertissement (développement uniquement)
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log de debug (développement uniquement)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log d'information (développement uniquement)
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log groupé (développement uniquement)
   */
  group: (label) => {
    if (isDev) {
      console.group(label);
    }
  },

  /**
   * Fin de groupe (développement uniquement)
   */
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },

  /**
   * Log avec condition personnalisée
   */
  conditional: (condition, ...args) => {
    if (condition && isDev) {
      console.log(...args);
    }
  }
};

module.exports = logger;

