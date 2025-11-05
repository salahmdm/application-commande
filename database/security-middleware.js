/**
 * Middlewares de sécurité pour Blossom Café
 * Protection contre les attaques courantes
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');

/**
 * Configuration Helmet pour les en-têtes de sécurité
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * Rate Limiting général
 */
const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: config.rateLimit.message,
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: config.rateLimit.message,
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    });
  }
});

/**
 * Rate Limiting strict pour l'authentification
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * Middleware de validation des erreurs
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('🚨 Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Données invalides',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Middleware d'authentification sécurisé
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('🚨 Missing token for request:', req.path);
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      console.log('🚨 Invalid token:', err.message);
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    
    // Ajouter des informations de sécurité à l'utilisateur
    req.user = {
      ...user,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    next();
  });
};

/**
 * Middleware de vérification des rôles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      console.log(`🚨 Unauthorized access attempt: ${userRole} trying to access ${req.path}`);
      return res.status(403).json({ 
        error: 'Accès refusé',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Middleware de logging de sécurité
 */
const securityLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous'
    };

    // Log des actions sensibles
    if (req.path.includes('/admin') || req.path.includes('/auth')) {
      console.log('🔐 Security Log:', JSON.stringify(logData));
    }

    // Alertes pour les erreurs de sécurité
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.log('🚨 Security Alert:', JSON.stringify(logData));
    }
  });

  next();
};

/**
 * Middleware de nettoyage des données sensibles
 */
const sanitizeResponse = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Supprimer les données sensibles des réponses
    if (data && typeof data === 'object') {
      const sanitized = JSON.parse(JSON.stringify(data));
      
      // Supprimer les mots de passe et tokens des réponses
      const removeSensitiveData = (obj) => {
        if (typeof obj !== 'object' || obj === null) return;
        
        Object.keys(obj).forEach(key => {
          if (key.toLowerCase().includes('password') || 
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('secret')) {
            delete obj[key];
          } else if (typeof obj[key] === 'object') {
            removeSensitiveData(obj[key]);
          }
        });
      };
      
      removeSensitiveData(sanitized);
      return originalJson.call(this, sanitized);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Validateurs pour les routes d'authentification
 */
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Mot de passe requis'),
  handleValidationErrors
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: config.validation.password.minLength })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: config.validation.name.maxLength })
    .withMessage('Prénom requis (max 100 caractères)'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: config.validation.name.maxLength })
    .withMessage('Nom requis (max 100 caractères)'),
  handleValidationErrors
];

/**
 * Validateur pour les IDs de paramètres
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID invalide'),
  handleValidationErrors
];

module.exports = {
  helmetConfig,
  generalRateLimit,
  authRateLimit,
  authenticateToken,
  requireRole,
  requireAdmin: requireRole('admin'),
  requireManager: requireRole(['manager', 'admin']),
  securityLogger,
  sanitizeResponse,
  loginValidation,
  registerValidation,
  validateId,
  handleValidationErrors
};
