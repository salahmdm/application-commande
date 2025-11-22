/**
 * Middleware centralisé de gestion d'erreurs
 * Capture et formate toutes les erreurs de manière cohérente
 */

const logger = require('../utils/logger');
const isProd = process.env.NODE_ENV === 'production';

/**
 * Classes d'erreur personnalisées
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', true);
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentification requise') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Accès refusé') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Ressource') {
    super(`${resource} introuvable`, 404, 'NOT_FOUND', true);
  }
}

class DatabaseError extends AppError {
  constructor(message, sqlCode = null) {
    super(message, 500, 'DATABASE_ERROR', true);
    this.sqlCode = sqlCode;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflit de données') {
    super(message, 409, 'CONFLICT_ERROR', true);
  }
}

/**
 * Convertit une erreur MySQL en erreur applicative
 */
const handleMySQLError = (error) => {
  // Codes d'erreur MySQL courants
  const errorMap = {
    'ER_NO_REFERENCED_ROW_2': {
      message: 'Référence invalide dans la base de données',
      statusCode: 400,
      code: 'INVALID_REFERENCE'
    },
    'ER_BAD_NULL_ERROR': {
      message: 'Données manquantes (champs requis)',
      statusCode: 400,
      code: 'MISSING_REQUIRED_FIELD'
    },
    'ER_DUP_ENTRY': {
      message: 'Données en double',
      statusCode: 409,
      code: 'DUPLICATE_ENTRY'
    },
    'ER_TRUNCATED_WRONG_VALUE': {
      message: 'Valeur invalide pour un champ',
      statusCode: 400,
      code: 'INVALID_VALUE'
    },
    'ER_DATA_TOO_LONG': {
      message: 'Données trop longues',
      statusCode: 400,
      code: 'DATA_TOO_LONG'
    },
    'ER_LOCK_WAIT_TIMEOUT': {
      message: 'Timeout de verrouillage de base de données',
      statusCode: 503,
      code: 'DATABASE_TIMEOUT'
    },
    'ECONNREFUSED': {
      message: 'Impossible de se connecter à la base de données',
      statusCode: 503,
      code: 'DATABASE_CONNECTION_ERROR'
    }
  };

  const errorInfo = errorMap[error.code];
  
  if (errorInfo) {
    return new AppError(
      errorInfo.message,
      errorInfo.statusCode,
      errorInfo.code,
      true
    );
  }

  // Erreur MySQL générique
  return new DatabaseError(
    'Erreur de base de données',
    error.code
  );
};

/**
 * Middleware de gestion d'erreurs Express
 * Doit être utilisé en dernier dans la chaîne de middlewares
 */
const errorHandler = (err, req, res, next) => {
  // Si l'erreur est déjà une AppError, l'utiliser directement
  let error = err;
  
  // Si c'est une erreur MySQL, la convertir
  if (err.code && err.sqlState) {
    error = handleMySQLError(err);
  }
  
  // Si ce n'est pas une AppError, créer une erreur générique
  if (!(error instanceof AppError)) {
    error = new AppError(
      error.message || 'Une erreur est survenue',
      error.statusCode || 500,
      'INTERNAL_ERROR',
      false
    );
  }

  // Logger l'erreur de manière sécurisée
  const logData = {
    statusCode: error.statusCode,
    code: error.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    // Ne jamais logger le stack en production
    ...(isProd ? {} : { stack: error.stack })
  };

  // Logger selon le niveau de criticité
  if (error.statusCode >= 500) {
    logger.error(error, logData);
  } else if (error.statusCode >= 400) {
    logger.warn(`[${error.code}] ${error.message}`, logData);
  } else {
    logger.info(`[${error.code}] ${error.message}`, logData);
  }

  // Préparer la réponse
  const response = {
    success: false,
    error: error.message,
    code: error.code
  };

  // ✅ Toujours ajouter les détails pour les erreurs de validation (utiles pour l'utilisateur)
  // Pour les autres erreurs, ajouter les détails seulement en développement
  if (error.code === 'VALIDATION_ERROR' && error.details) {
    response.details = error.details;
  } else if (!isProd && error.details) {
    response.details = error.details;
  }

  // Ajouter les détails SQL seulement en développement
  if (!isProd && error.sqlCode) {
    response.sqlCode = error.sqlCode;
  }

  // Ajouter le stack seulement en développement pour les erreurs non opérationnelles
  if (!isProd && !error.isOperational) {
    response.stack = error.stack;
  }

  // Envoyer la réponse
  res.status(error.statusCode).json(response);
};

/**
 * Wrapper pour les routes async
 * Capture automatiquement les erreurs et les passe au errorHandler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware pour les routes non trouvées (404)
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ConflictError
};

