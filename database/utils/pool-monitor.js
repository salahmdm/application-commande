/**
 * Utilitaire de monitoring du pool MySQL
 * Surveille l'utilisation du pool et alerte en cas de problème
 */

const logger = require('./logger');

class PoolMonitor {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.options = {
      logInterval: options.logInterval || 300000, // 5 minutes par défaut
      warnThreshold: options.warnThreshold || 0.8, // Alerte à 80% d'utilisation
      ...options
    };
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      queuedRequests: 0,
      errors: 0,
      lastError: null
    };
    this.interval = null;
  }

  /**
   * Démarrer le monitoring
   */
  start() {
    // Écouter les événements du pool
    this.pool.on('connection', () => {
      this.stats.totalConnections++;
    });

    this.pool.on('error', (err) => {
      this.stats.errors++;
      this.stats.lastError = {
        message: err.message,
        code: err.code,
        timestamp: new Date().toISOString()
      };
      logger.error('Pool MySQL error', { 
        message: err.message, 
        code: err.code,
        errors: this.stats.errors 
      });
    });

    // Collecter les statistiques périodiquement
    this.interval = setInterval(() => {
      this.collectStats();
    }, this.options.logInterval);

    // Collecter immédiatement
    this.collectStats();
  }

  /**
   * Arrêter le monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Collecter les statistiques du pool
   */
  collectStats() {
    const poolConfig = this.pool.config || {};
    const connectionLimit = poolConfig.connectionLimit || 10;
    
    // Obtenir les statistiques du pool
    this.pool.getConnection((err, connection) => {
      if (err) {
        logger.warn('Pool monitor: Error getting connection', { error: err.message });
        return;
      }

      // Libérer immédiatement la connexion de test
      connection.release();

      // Calculer les statistiques (approximatives car mysql2 ne les expose pas directement)
      const poolState = this.pool._allConnections || [];
      const activeConnections = poolState.filter(c => c._socket && c._socket.readable).length;
      const idleConnections = poolState.length - activeConnections;
      const queuedRequests = this.pool._connectionQueue ? this.pool._connectionQueue.length : 0;

      this.stats.activeConnections = activeConnections;
      this.stats.idleConnections = idleConnections;
      this.stats.queuedRequests = queuedRequests;

      const utilization = connectionLimit > 0 ? activeConnections / connectionLimit : 0;

      // Logger les statistiques
      if (process.env.NODE_ENV === 'development' || utilization >= this.options.warnThreshold) {
        logger.info('Pool MySQL stats', {
          active: activeConnections,
          idle: idleConnections,
          total: poolState.length,
          limit: connectionLimit,
          utilization: `${(utilization * 100).toFixed(1)}%`,
          queued: queuedRequests,
          errors: this.stats.errors
        });
      }

      // Alerter si le pool est surchargé
      if (utilization >= this.options.warnThreshold) {
        logger.warn('Pool MySQL: High utilization', {
          utilization: `${(utilization * 100).toFixed(1)}%`,
          active: activeConnections,
          limit: connectionLimit,
          queued: queuedRequests
        });
      }

      // Alerter si des requêtes sont en file d'attente
      if (queuedRequests > 0) {
        logger.warn('Pool MySQL: Queued requests', {
          queued: queuedRequests,
          active: activeConnections,
          limit: connectionLimit
        });
      }
    });
  }

  /**
   * Obtenir les statistiques actuelles
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Obtenir un résumé des statistiques
   */
  getSummary() {
    const poolConfig = this.pool.config || {};
    const connectionLimit = poolConfig.connectionLimit || 10;
    const utilization = connectionLimit > 0 
      ? (this.stats.activeConnections / connectionLimit * 100).toFixed(1) 
      : 'N/A';

    return {
      active: this.stats.activeConnections,
      idle: this.stats.idleConnections,
      total: this.stats.activeConnections + this.stats.idleConnections,
      limit: connectionLimit,
      utilization: `${utilization}%`,
      queued: this.stats.queuedRequests,
      errors: this.stats.errors,
      lastError: this.stats.lastError
    };
  }
}

module.exports = PoolMonitor;

