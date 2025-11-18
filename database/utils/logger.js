/**
 * Système de logging structuré et sécurisé
 * Masque automatiquement les données sensibles
 */

const isProd = process.env.NODE_ENV === 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

// Niveaux de log (du plus bas au plus haut)
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLogLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

/**
 * Masque les données sensibles dans un objet
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'password_hash',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'cookie',
    'cookies',
    'creditCard',
    'credit_card',
    'cvv',
    'cvc',
    'ssn',
    'socialSecurityNumber'
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // Vérifier si le champ est sensible
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '***MASKED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Récursion pour les objets imbriqués
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Masque l'email en production (affiche seulement le domaine)
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return email;
  }

  if (isProd) {
    // En production, masquer l'email (garder seulement le domaine)
    const [localPart, domain] = email.split('@');
    if (domain) {
      return `***@${domain}`;
    }
    return '***@***';
  }

  // En développement, afficher l'email complet
  return email;
};

/**
 * Formate un message de log avec timestamp
 */
const formatLogMessage = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    const sanitized = sanitizeData(data);
    return `${prefix} ${message} ${JSON.stringify(sanitized, null, 2)}`;
  }
  
  return `${prefix} ${message}`;
};

/**
 * Logger de base avec niveau
 */
const log = (level, message, data = null) => {
  const levelValue = LOG_LEVELS[level] || LOG_LEVELS.info;
  
  // Ne pas logger si le niveau est trop bas
  if (levelValue < currentLogLevel) {
    return;
  }

  const formattedMessage = formatLogMessage(level, message, data);

  switch (level) {
    case 'error':
      console.error(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'info':
      console.log(formattedMessage);
      break;
    case 'debug':
      if (!isProd) {
        console.log(formattedMessage);
      }
      break;
    default:
      console.log(formattedMessage);
  }
};

/**
 * Logger pour les requêtes HTTP
 */
const logRequest = (req, message = '') => {
  if (LOG_LEVELS.debug < currentLogLevel && isProd) {
    return; // Ne pas logger les requêtes en debug en production
  }

  const logData = {
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    // Ne jamais logger les headers d'authentification
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers['origin']
    }
  };

  // Ajouter les infos utilisateur si authentifié (sans email en prod)
  if (req.user) {
    logData.user = {
      id: req.user.id,
      role: req.user.role,
      email: sanitizeEmail(req.user.email)
    };
  }

  log('debug', message || `${req.method} ${req.path}`, logData);
};

/**
 * Logger pour les erreurs
 */
const logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: isProd ? undefined : error.stack, // Pas de stack en production
    code: error.code,
    ...sanitizeData(context)
  };

  log('error', 'Erreur', errorData);
};

/**
 * Logger pour les événements de sécurité
 */
const logSecurity = (event, details = {}) => {
  const securityData = {
    event,
    timestamp: new Date().toISOString(),
    ...sanitizeData(details)
  };

  log('warn', `[SECURITY] ${event}`, securityData);
};

// Export du logger
const logger = {
  debug: (message, data) => log('debug', message, data),
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: logError, // Utilise logError pour les erreurs
  request: logRequest,
  security: logSecurity,
  sanitizeEmail,
  sanitizeData
};

module.exports = logger;

