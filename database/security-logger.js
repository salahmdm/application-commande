/**
 * Système de logging de sécurité pour Blossom Café
 * Surveillance et alertes de sécurité
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');

/**
 * Classe de logging de sécurité
 */
class SecurityLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.securityLogFile = path.join(this.logDir, 'security.log');
    this.accessLogFile = path.join(this.logDir, 'access.log');
    this.errorLogFile = path.join(this.logDir, 'error.log');
    
    // Créer le dossier de logs s'il n'existe pas
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Formater un message de log
   */
  formatLogMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      metadata: {
        ...metadata,
        nodeEnv: config.server.nodeEnv,
        version: '1.0.0'
      }
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Écrire dans un fichier de log
   */
  writeToFile(filename, message) {
    try {
      fs.appendFileSync(filename, message + '\n');
    } catch (error) {
      logger.error('❌ Error writing to log file:', error);
    }
  }

  /**
   * Log d'authentification
   */
  logAuth(action, userId, ip, userAgent, success = true, details = {}) {
    const level = success ? 'INFO' : 'WARN';
    const message = `Authentication ${action}: ${success ? 'SUCCESS' : 'FAILED'}`;
    
    const metadata = {
      action,
      userId: userId || 'anonymous',
      ip,
      userAgent,
      success,
      ...details
    };

    const logMessage = this.formatLogMessage(level, message, metadata);
    
    logger.log(`🔐 ${level}: ${message} - User: ${userId || 'anonymous'} - IP: ${ip}`);
    this.writeToFile(this.securityLogFile, logMessage);

    // Alerte pour les échecs d'authentification
    if (!success) {
      this.logSecurityAlert('AUTH_FAILURE', metadata);
    }
  }

  /**
   * Log d'accès aux ressources sensibles
   */
  logAccess(resource, userId, ip, userAgent, action = 'ACCESS') {
    const message = `Resource access: ${action}`;
    
    const metadata = {
      resource,
      userId,
      ip,
      userAgent,
      action
    };

    const logMessage = this.formatLogMessage('INFO', message, metadata);
    
    logger.log(`🔍 ACCESS: ${action} - Resource: ${resource} - User: ${userId} - IP: ${ip}`);
    this.writeToFile(this.accessLogFile, logMessage);
  }

  /**
   * Log d'erreurs de sécurité
   */
  logSecurityError(error, context = {}) {
    const message = `Security error: ${error.message}`;
    
    const metadata = {
      error: error.message,
      stack: error.stack,
      ...context
    };

    const logMessage = this.formatLogMessage('ERROR', message, metadata);
    
    logger.error(`🚨 SECURITY ERROR: ${error.message}`);
    this.writeToFile(this.errorLogFile, logMessage);
    this.writeToFile(this.securityLogFile, logMessage);
  }

  /**
   * Log d'alerte de sécurité
   */
  logSecurityAlert(alertType, metadata = {}) {
    const message = `Security alert: ${alertType}`;
    
    const alertMetadata = {
      alertType,
      severity: this.getAlertSeverity(alertType),
      ...metadata
    };

    const logMessage = this.formatLogMessage('ALERT', message, alertMetadata);
    
    logger.warn(`🚨 SECURITY ALERT: ${alertType} - Severity: ${alertMetadata.severity}`);
    this.writeToFile(this.securityLogFile, logMessage);

    // En production, envoyer une alerte externe
    if (config.server.nodeEnv === 'production') {
      this.sendExternalAlert(alertType, alertMetadata);
    }
  }

  /**
   * Déterminer la sévérité d'une alerte
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'AUTH_FAILURE': 'MEDIUM',
      'RATE_LIMIT_EXCEEDED': 'LOW',
      'UNAUTHORIZED_ACCESS': 'HIGH',
      'SQL_INJECTION_ATTEMPT': 'CRITICAL',
      'XSS_ATTEMPT': 'HIGH',
      'CSRF_ATTEMPT': 'HIGH',
      'FILE_UPLOAD_ABUSE': 'MEDIUM',
      'SUSPICIOUS_ACTIVITY': 'MEDIUM'
    };

    return severityMap[alertType] || 'UNKNOWN';
  }

  /**
   * Envoyer une alerte externe (webhook, email, etc.)
   */
  sendExternalAlert(alertType, metadata) {
    // TODO: Implémenter l'envoi d'alertes externes
    // Exemples: webhook Slack, email, SMS, etc.
    logger.log(`📡 External alert would be sent for: ${alertType}`);
  }

  /**
   * Log d'activité suspecte
   */
  logSuspiciousActivity(activity, userId, ip, details = {}) {
    const message = `Suspicious activity detected: ${activity}`;
    
    const metadata = {
      activity,
      userId,
      ip,
      ...details
    };

    const logMessage = this.formatLogMessage('WARN', message, metadata);
    
    logger.warn(`⚠️ SUSPICIOUS: ${activity} - User: ${userId} - IP: ${ip}`);
    this.writeToFile(this.securityLogFile, logMessage);
    
    this.logSecurityAlert('SUSPICIOUS_ACTIVITY', metadata);
  }

  /**
   * Log de modification de données sensibles
   */
  logDataModification(table, recordId, userId, ip, action, changes = {}) {
    const message = `Data modification: ${action}`;
    
    const metadata = {
      table,
      recordId,
      userId,
      ip,
      action,
      changes: this.sanitizeChanges(changes)
    };

    const logMessage = this.formatLogMessage('INFO', message, metadata);
    
    logger.log(`📝 DATA MODIFICATION: ${action} - Table: ${table} - Record: ${recordId} - User: ${userId}`);
    this.writeToFile(this.securityLogFile, logMessage);
  }

  /**
   * Nettoyer les changements pour les logs
   */
  sanitizeChanges(changes) {
    const sanitized = { ...changes };
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***';
      }
    });

    return sanitized;
  }

  /**
   * Analyser les logs pour détecter des patterns suspects
   */
  analyzeLogs() {
    try {
      const securityLogs = fs.readFileSync(this.securityLogFile, 'utf8');
      const lines = securityLogs.split('\n').filter(line => line.trim());

      // Analyser les tentatives d'authentification échouées
      const failedAuths = lines.filter(line => 
        line.includes('"success":false') && line.includes('Authentication')
      );

      if (failedAuths.length > 10) {
        this.logSecurityAlert('AUTH_FAILURE', {
          count: failedAuths.length,
          message: 'Multiple failed authentication attempts detected'
        });
      }

      // Analyser les accès non autorisés
      const unauthorizedAccess = lines.filter(line => 
        line.includes('Unauthorized access attempt')
      );

      if (unauthorizedAccess.length > 5) {
        this.logSecurityAlert('UNAUTHORIZED_ACCESS', {
          count: unauthorizedAccess.length,
          message: 'Multiple unauthorized access attempts detected'
        });
      }

    } catch (error) {
      logger.error('❌ Error analyzing logs:', error);
    }
  }

  /**
   * Nettoyer les anciens logs
   */
  cleanupLogs() {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    const files = [this.securityLogFile, this.accessLogFile, this.errorLogFile];

    files.forEach(file => {
      try {
        const stats = fs.statSync(file);
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(file);
          logger.log(`🗑️ Cleaned up old log file: ${file}`);
        }
      } catch (error) {
        // Fichier n'existe pas ou erreur de lecture
      }
    });
  }
}

// Instance globale du logger
const securityLogger = new SecurityLogger();

// Nettoyer les logs toutes les heures
setInterval(() => {
  securityLogger.cleanupLogs();
}, 60 * 60 * 1000);

// Analyser les logs toutes les 5 minutes
setInterval(() => {
  securityLogger.analyzeLogs();
}, 5 * 60 * 1000);

module.exports = securityLogger;
