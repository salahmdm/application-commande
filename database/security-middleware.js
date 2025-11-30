/**
 * Minimal security middleware (restored) for backend compatibility.
 * - Auth: JWT cookie/header required (401 if missing), verify with config.jwt.secret
 * - Role checks: requireAdmin / requireManager
 * - Helmet/RateLimit/CSRF: no-op by default (do not block flows)
 * - Validators: basic stubs with handleValidationErrors
 */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('./config');
const logger = require('./utils/clientLogger');

const isProd = process.env.NODE_ENV === 'production';

// ✅ SÉCURITÉ: Le bypass dev doit être explicitement activé
// Ne JAMAIS activer automatiquement, même en développement
const DEV_BYPASS_ENABLED = process.env.ALLOW_DEV_BYPASS === 'true';
const DEV_BYPASS_SECRET = process.env.DEV_BYPASS_SECRET || 'CHANGEZ_MOI_EN_DEVELOPPEMENT';

/**
 * Vérifie si le bypass dev peut être utilisé
 * Conditions strictes :
 * 1. Ne JAMAIS en production
 * 2. Doit être explicitement activé via ALLOW_DEV_BYPASS=true
 * 3. Doit fournir le header secret X-Dev-Bypass-Secret
 */
const canUseDevBypass = (req) => {
  // ❌ JAMAIS en production
  if (isProd) {
    return false;
  }
  
  // ❌ Doit être explicitement activé
  if (!DEV_BYPASS_ENABLED) {
    return false;
  }
  
  // ❌ Doit fournir le header secret
  const providedSecret = req.headers['x-dev-bypass-secret'];
  if (!providedSecret || providedSecret !== DEV_BYPASS_SECRET) {
    return false;
  }
  
  // ✅ Toutes les conditions sont remplies
  return true;
};

// Helmet (no-op in dev, basic in prod)
const helmetConfig = isProd ? helmet() : (req, res, next) => next();

// ✅ SÉCURITÉ: Rate limiting implémenté pour protection DoS et force brute
/**
 * Rate limiting général pour toutes les routes API
 * Limite: 100 requêtes par 15 minutes par IP (500 en développement)
 */
const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs || 15 * 60 * 1000, // 15 minutes
  max: isProd ? (config.rateLimit.maxRequests || 100) : 500, // 500 en dev, 100 en prod
  message: config.rateLimit.message || 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true, // Retourne les headers RateLimit-* dans la réponse
  legacyHeaders: false, // Désactive les headers X-RateLimit-*
  // Clé basée sur l'IP (par défaut)
  keyGenerator: (req) => {
    // Utiliser l'IP réelle même derrière un proxy
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Exclure certaines routes du rate limiting
  skip: (req) => {
    // Routes publiques qui ne nécessitent pas de rate limiting strict
    const publicRoutes = [
      '/api/health',
      '/api/categories',
      '/api/products',
      '/api/products/all',
      '/api/csrf-token'
    ];
    
    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return true; // Skip rate limiting pour ces routes
    }
    
    return false;
  },
  // Handler personnalisé pour les erreurs
  handler: (req, res) => {
    logger.warn('⚠️ [RATE LIMIT] Limite atteinte - IP:', req.ip, 'Path:', req.path);
    res.status(429).json({
      error: 'Trop de requêtes',
      message: config.rateLimit.message || 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
      retryAfter: Math.ceil((config.rateLimit.windowMs || 15 * 60 * 1000) / 1000) // Secondes
    });
  }
});

/**
 * Rate limiting strict pour les routes d'authentification
 * Limite: 5 tentatives par 15 minutes par IP
 * Protection contre les attaques de force brute
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion par fenêtre
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  // Ne pas compter les tentatives réussies (permet de se connecter normalement)
  skipSuccessfulRequests: true,
  // Clé basée sur l'IP
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Handler personnalisé
  handler: (req, res) => {
    logger.warn('⚠️ [RATE LIMIT AUTH] Limite atteinte - IP:', req.ip, 'Path:', req.path);
    res.status(429).json({
      error: 'Trop de tentatives de connexion',
      message: 'Trop de tentatives de connexion depuis cette IP. Veuillez réessayer dans 15 minutes.',
      retryAfter: 900 // 15 minutes en secondes
    });
  }
});

/**
 * Rate limiting pour les routes admin (plus strict)
 * Limite: 50 requêtes par 15 minutes par IP (200 en développement)
 */
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 50 : 200, // 200 en dev, 50 en prod
  message: 'Trop de requêtes admin depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Exclure certaines routes admin du rate limiting strict
  skip: (req) => {
    // Routes admin qui sont appelées fréquemment
    const frequentRoutes = [
      '/api/admin/orders', // Chargement des commandes
      '/api/admin/products', // Chargement des produits
      '/api/admin/settings' // Chargement des paramètres
    ];
    
    // En développement, skip le rate limiting pour ces routes
    if (!isProd && frequentRoutes.some(route => req.path.startsWith(route))) {
      return true;
    }
    
    return false;
  },
  handler: (req, res) => {
    logger.warn('⚠️ [RATE LIMIT ADMIN] Limite atteinte - IP:', req.ip, 'Path:', req.path);
    res.status(429).json({
      error: 'Trop de requêtes',
      message: 'Trop de requêtes admin depuis cette IP, veuillez réessayer plus tard.',
      retryAfter: 900
    });
  }
});

// ✅ SÉCURITÉ: Validation handler amélioré avec intégration errorHandler
// Import dynamique pour éviter les dépendances circulaires
let ValidationError = null;
try {
  ValidationError = require('./middleware/errorHandler').ValidationError;
} catch (e) {
  // Si errorHandler n'est pas disponible, utiliser une classe simple
  class SimpleValidationError extends Error {
    constructor(message, details) {
      super(message);
      this.statusCode = 400;
      this.code = 'VALIDATION_ERROR';
      this.details = details;
      this.isOperational = true;
    }
  }
  ValidationError = SimpleValidationError;
}

// Validation handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // ✅ Corriger: Utiliser path ou param pour le nom du champ (express-validator peut utiliser les deux)
    const validationError = new ValidationError(
      'Données invalides',
      errors.array().map(e => ({ 
        field: e.path || e.param || e.location, // path est la propriété standard, param est l'ancienne
        message: e.msg 
      }))
    );
    return next(validationError); // Passer à errorHandler pour formatage cohérent
  }
  next();
};

// ✅ SÉCURITÉ: Protection CSRF implémentée
const crypto = require('crypto');

/**
 * Génère un token CSRF sécurisé
 * @returns {string} Token CSRF (32 bytes en hex = 64 caractères)
 */
const generateCsrfTokenValue = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware pour générer et envoyer le token CSRF
 * Le token est stocké dans un cookie HTTP-only et aussi envoyé dans le header X-CSRF-Token
 */
const generateCsrfToken = (req, res, next) => {
  // Générer un nouveau token CSRF
  const token = generateCsrfTokenValue();
  
  // Stocker dans un cookie HTTP-only (sécurisé)
  res.cookie('_csrf', token, {
    httpOnly: true, // Inaccessible via JavaScript
    secure: isProd, // HTTPS uniquement en production
    sameSite: 'strict', // Protection CSRF renforcée
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  });
  
  // Aussi envoyer dans un header pour les frameworks frontend
  res.setHeader('X-CSRF-Token', token);
  
  // Stocker dans req pour utilisation dans csrfProtection
  req.csrfToken = token;
  
  next();
};

/**
 * Middleware pour valider le token CSRF
 * Vérifie que le token dans le header correspond au token dans le cookie
 */
const csrfProtection = (req, res, next) => {
  // Ignorer les méthodes GET, HEAD, OPTIONS (lecture seule)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Ignorer les routes publiques (login, register, etc.)
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/health',
    '/api/products/all',
    '/api/categories'
  ];
  
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }
  
  // Récupérer le token depuis le cookie
  const cookieToken = req.cookies && req.cookies._csrf;
  
  // Récupérer le token depuis le header
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  
  // Vérifier que les deux tokens existent
  if (!cookieToken || !headerToken) {
    logger.warn('⚠️ [CSRF] Token manquant - Cookie:', !!cookieToken, 'Header:', !!headerToken, 'Path:', req.path, 'IP:', req.ip);
    return res.status(403).json({
      error: 'Token CSRF manquant',
      message: 'Une erreur de sécurité est survenue. Veuillez rafraîchir la page.'
    });
  }
  
  // Comparaison timing-safe pour éviter les attaques de timing
  const cookieBuffer = Buffer.from(cookieToken, 'hex');
  const headerBuffer = Buffer.from(headerToken, 'hex');
  
  // Vérifier que les tokens ont la même longueur
  if (cookieBuffer.length !== headerBuffer.length) {
    logger.warn('⚠️ [CSRF] Tokens de longueur différente - Path:', req.path, 'IP:', req.ip);
    return res.status(403).json({
      error: 'Token CSRF invalide',
      message: 'Une erreur de sécurité est survenue. Veuillez rafraîchir la page.'
    });
  }
  
  // Comparaison timing-safe
  if (!crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    logger.warn('⚠️ [CSRF] Token invalide - Path:', req.path, 'IP:', req.ip);
    return res.status(403).json({
      error: 'Token CSRF invalide',
      message: 'Une erreur de sécurité est survenue. Veuillez rafraîchir la page.'
    });
  }
  
  // ✅ Token CSRF valide
  next();
};

// Auth: require JWT in cookie or Authorization Bearer
const authenticateToken = (req, res, next) => {
  // ✅ INTELLIGENT: Choisir le bon token selon la route
  // - Pour /api/kiosk/* : utiliser kiosk_token en priorité
  // - Pour toutes les autres routes : utiliser token (NE PAS utiliser kiosk_token)
  const isKioskRoute = req.path && req.path.startsWith('/api/kiosk/');
  const isAdminOrManagerRoute = req.path && (req.path.startsWith('/api/admin/') || req.path.startsWith('/api/manager/'));
  
  let tokenFromCookie = null;
  if (isKioskRoute) {
    // Pour les routes kiosk, accepter kiosk_token OU token
    tokenFromCookie = req.cookies && (req.cookies.kiosk_token || req.cookies.token);
  } else if (isAdminOrManagerRoute) {
    // Pour les routes admin/manager, NE JAMAIS utiliser kiosk_token (sécurité)
    tokenFromCookie = req.cookies && req.cookies.token;
  } else {
    // Pour les autres routes, utiliser token en priorité, kiosk_token en fallback
    tokenFromCookie = req.cookies && (req.cookies.token || req.cookies.kiosk_token);
  }
  
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;
  const token = tokenFromCookie || tokenFromHeader;

  // ✅ DEBUG: Logger la présence du token pour diagnostiquer les problèmes d'authentification
  if (process.env.NODE_ENV === 'development') {
    logger.debug('🔐 authenticateToken - Vérification:', {
      path: req.path,
      hasTokenFromCookie: !!tokenFromCookie,
      hasTokenFromHeader: !!tokenFromHeader,
      hasToken: !!token,
      cookiesKeys: req.cookies ? Object.keys(req.cookies) : []
    });
  }

  if (!token) {
    // ✅ SÉCURITÉ: Vérifier si le bypass dev est autorisé avec toutes les conditions
    if (canUseDevBypass(req)) {
      // ⚠️ LOGGER l'utilisation du bypass pour traçabilité (toujours loggé même en prod pour sécurité)
      logger.warn('⚠️ [DEV BYPASS] Utilisation du bypass dev pour:', req.path, 'IP:', req.ip);
      req.user = { id: 0, email: 'dev@local', role: 'manager', devBypass: true };
      return next();
    }
    logger.warn('❌ authenticateToken - Token manquant:', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Authentification requise' });
  }
  if (!config || !config.jwt || !config.jwt.secret) {
    logger.error('❌ authenticateToken - JWT non configuré');
    return res.status(500).json({ error: 'JWT non configuré' });
  }
  jwt.verify(token, config.jwt.secret, (err, payload) => {
    if (err) {
      // ✅ SÉCURITÉ: Vérifier si le bypass dev est autorisé avec toutes les conditions
      if (canUseDevBypass(req)) {
        // ⚠️ LOGGER l'utilisation du bypass pour traçabilité (toujours loggé même en prod pour sécurité)
        logger.warn('⚠️ [DEV BYPASS] Token invalide, utilisation du bypass dev pour:', req.path, 'IP:', req.ip);
        req.user = { id: 0, email: 'dev@local', role: 'manager', devBypass: true };
        return next();
      }
      logger.warn('❌ authenticateToken - Token invalide ou expiré:', { path: req.path, error: err.message });
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    
    // ✅ CRITIQUE: Normaliser le rôle depuis le JWT token
    const normalizedRoleFromToken = payload.role ? String(payload.role).trim().toLowerCase() : null;
    
    // ✅ DEBUG: Logger les informations utilisateur extraites du token (toujours actif)
    logger.debug('✅ authenticateToken - Token valide:', {
      userId: payload.id,
      email: payload.email,
      roleRaw: payload.role,
      roleNormalized: normalizedRoleFromToken,
      roleType: typeof payload.role,
      roleValue: JSON.stringify(payload.role),
      path: req.path
    });
    
    // ✅ CRITIQUE: S'assurer que le rôle est toujours présent et normalisé
    if (!normalizedRoleFromToken) {
      logger.error('❌ authenticateToken - Rôle manquant dans le JWT token:', {
        userId: payload.id,
        email: payload.email,
        payload: JSON.stringify(payload)
      });
      return res.status(500).json({ error: 'Erreur serveur: rôle manquant dans le token' });
    }
    
    // ✅ SÉCURITÉ: Empêcher les comptes kiosk d'accéder aux routes admin/manager
    if (isAdminOrManagerRoute && normalizedRoleFromToken === 'kiosk') {
      logger.warn('❌ authenticateToken - Tentative d\'accès admin/manager avec compte kiosk:', {
        userId: payload.id,
        email: payload.email,
        role: normalizedRoleFromToken,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({ 
        error: 'Accès refusé. Les comptes kiosk ne peuvent pas accéder aux routes admin/manager.',
        message: 'Veuillez vous connecter avec un compte admin ou manager.'
      });
    }
    
    req.user = {
      id: payload.id,
      email: payload.email || '',
      role: normalizedRoleFromToken, // ✅ Utiliser le rôle normalisé
      isGuest: false
    };
    
    logger.debug('✅ authenticateToken - Utilisateur configuré:', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      isKioskRoute,
      isAdminOrManagerRoute
    });
    
    return next();
  });
};

// Role checks
const requireRole = (roles) => (req, res, next) => {
  // ✅ SÉCURITÉ: Vérifier si le bypass dev est autorisé avec toutes les conditions
  if (canUseDevBypass(req)) {
    // ⚠️ LOGGER l'utilisation du bypass pour traçabilité (toujours loggé même en prod pour sécurité)
    if (!req.user) {
      logger.warn('⚠️ [DEV BYPASS] Pas d\'utilisateur, injection bypass dev pour:', req.path, 'IP:', req.ip);
      req.user = { id: 0, email: 'dev@local', role: 'manager', devBypass: true };
    } else if (req.user.devBypass) {
      // Si l'utilisateur a déjà le bypass, laisser passer (mais logger)
      logger.warn('⚠️ [DEV BYPASS] Bypass rôle pour:', req.path, 'Rôle requis:', roles, 'IP:', req.ip);
    }
    return next();
  }
  
  // ✅ Vérifier que req.user existe (doit être défini par authenticateToken)
  if (!req.user) {
    logger.warn('❌ requireRole - req.user non défini:', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Authentification requise' });
  }
  
  const allowed = Array.isArray(roles) ? roles : [roles];
  // ✅ NORMALISATION: Normaliser le rôle utilisateur (trim, lowercase) pour éviter les problèmes de casse/espaces
  const userRole = req.user.role ? String(req.user.role).trim().toLowerCase() : null;
  // ✅ NORMALISATION: Normaliser les rôles autorisés également
  const normalizedAllowed = allowed.map(r => String(r).trim().toLowerCase());
  
  // ✅ DEBUG: Logger les informations de rôle pour diagnostiquer les problèmes (toujours actif)
  logger.debug('🔐 requireRole - Vérification:', {
    path: req.path,
    userId: req.user.id,
    userEmail: req.user.email,
    userRoleRaw: req.user.role,
    userRoleNormalized: userRole,
    userRoleType: typeof req.user.role,
    userRoleValue: JSON.stringify(req.user.role),
    allowedRolesRaw: allowed,
    allowedRolesNormalized: normalizedAllowed,
    hasAccess: normalizedAllowed.includes(userRole),
    comparison: {
      'userRole === "admin"': userRole === 'admin',
      'userRole === "manager"': userRole === 'manager',
      'normalizedAllowed.includes("admin")': normalizedAllowed.includes('admin'),
      'normalizedAllowed.includes("manager")': normalizedAllowed.includes('manager'),
      'normalizedAllowed.includes(userRole)': normalizedAllowed.includes(userRole)
    }
  });
  
  if (!userRole || !normalizedAllowed.includes(userRole)) {
    logger.warn('❌ requireRole - Accès refusé:', {
      path: req.path,
      userId: req.user.id,
      userEmail: req.user.email,
      userRoleRaw: req.user.role,
      userRoleNormalized: userRole,
      userRoleType: typeof req.user.role,
      userRoleValue: JSON.stringify(req.user.role),
      allowedRolesRaw: allowed,
      allowedRolesNormalized: normalizedAllowed,
      ip: req.ip
    });
    
    // ✅ Message d'erreur plus précis selon le contexte
    const isManagerRoute = Array.isArray(roles) && roles.includes('manager');
    const errorMessage = isManagerRoute 
      ? 'Accès refusé. Droits manager ou admin requis.'
      : 'Accès refusé. Droits admin requis.';
    
    return res.status(403).json({ error: errorMessage });
  }
  
  next();
};
const requireAdmin = requireRole('admin');
const requireManager = requireRole(['manager', 'admin']);
const requireKiosk = requireRole('kiosk');

// ✅ SÉCURITÉ: Validateurs stricts avec express-validator

// Validation login
const loginValidation = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long'),
  body('password')
    .isLength({ min: 1 }).withMessage('Mot de passe requis')
    .isLength({ max: 255 }).withMessage('Mot de passe trop long'),
  handleValidationErrors
];

// Validation register
// ✅ SÉCURITÉ: Tous les inscrits sont automatiquement en rôle 'client' (forcé côté backend)
const registerValidation = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long'),
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
    .isLength({ max: 255 }).withMessage('Mot de passe trop long'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 1, max: 100 }).withMessage('Le prénom doit contenir entre 1 et 100 caractères'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 1, max: 100 }).withMessage('Le nom doit contenir entre 1 et 100 caractères'),
  body('phone')
    .optional({ checkFalsy: true }) // ✅ Ne valider que si la valeur est fournie et non vide
    .trim()
    .custom((value) => {
      // Si le téléphone est vide/null/undefined, c'est valide (optionnel)
      if (!value || value.trim() === '') {
        return true;
      }
      // Sinon, valider le format
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      return phoneRegex.test(value);
    }).withMessage('Numéro de téléphone invalide')
    .isLength({ max: 20 }).withMessage('Numéro de téléphone trop long'),
  // ✅ Le champ 'role' est intentionnellement ignoré - tous les inscrits sont forcés en 'client' côté backend
  handleValidationErrors
];

// Validation utilisateur (création)
const validateUserCreate = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long'),
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
    .isLength({ max: 255 }).withMessage('Mot de passe trop long'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Le prénom doit contenir entre 1 et 100 caractères')
    .escape(),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Le nom doit contenir entre 1 et 100 caractères')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).withMessage('Numéro de téléphone invalide')
    .isLength({ max: 20 }).withMessage('Numéro de téléphone trop long'),
  body('role')
    .isIn(['client', 'manager', 'admin']).withMessage('Rôle invalide. Valeurs acceptées: client, manager, admin'),
  body('loyaltyPoints')
    .optional()
    .isInt({ min: 0 }).withMessage('Les points de fidélité doivent être un nombre entier positif'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  handleValidationErrors
];

// Validation utilisateur (modification)
const validateUser = [
  body('email')
    .optional()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long'),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
    .isLength({ max: 255 }).withMessage('Mot de passe trop long'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Le prénom doit contenir entre 1 et 100 caractères')
    .escape(),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Le nom doit contenir entre 1 et 100 caractères')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).withMessage('Numéro de téléphone invalide')
    .isLength({ max: 20 }).withMessage('Numéro de téléphone trop long'),
  body('role')
    .optional()
    .isIn(['client', 'manager', 'admin']).withMessage('Rôle invalide. Valeurs acceptées: client, manager, admin'),
  body('loyaltyPoints')
    .optional()
    .isInt({ min: 0 }).withMessage('Les points de fidélité doivent être un nombre entier positif'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  handleValidationErrors
];

// Validation profil utilisateur
const validateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Le prénom doit contenir entre 1 et 100 caractères')
    .escape(),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Le nom doit contenir entre 1 et 100 caractères')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).withMessage('Numéro de téléphone invalide')
    .isLength({ max: 20 }).withMessage('Numéro de téléphone trop long'),
  body('email')
    .optional()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long'),
  handleValidationErrors
];

// Validation produit (création)
const validateProductCreate = [
  body('categoryId')
    .isInt({ min: 1 }).withMessage('ID de catégorie invalide'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Le nom doit contenir entre 1 et 255 caractères')
    .escape(),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets')
    .isLength({ max: 255 }).withMessage('Slug trop long'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères')
    .escape(),
  body('price')
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('imageUrl')
    .optional()
    .trim()
    .isURL().withMessage('URL d\'image invalide')
    .isLength({ max: 500 }).withMessage('URL trop longue'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif'),
  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable doit être un booléen'),
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured doit être un booléen'),
  body('calories')
    .optional()
    .isInt({ min: 0 }).withMessage('Les calories doivent être un nombre entier positif'),
  body('preparationTime')
    .optional()
    .isInt({ min: 0 }).withMessage('Le temps de préparation doit être un nombre entier positif'),
  body('allergens')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(item => typeof item === 'string' && item.length <= 50);
      }
      return typeof value === 'string';
    }).withMessage('Les allergènes doivent être un tableau de chaînes ou une chaîne'),
  handleValidationErrors
];

// Validation produit (modification)
const validateProduct = [
  body('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de catégorie invalide'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Le nom doit contenir entre 1 et 255 caractères')
    .escape(),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets')
    .isLength({ max: 255 }).withMessage('Slug trop long'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères')
    .escape(),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('imageUrl')
    .optional()
    .trim()
    .isURL().withMessage('URL d\'image invalide')
    .isLength({ max: 500 }).withMessage('URL trop longue'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif'),
  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable doit être un booléen'),
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured doit être un booléen'),
  body('calories')
    .optional()
    .isInt({ min: 0 }).withMessage('Les calories doivent être un nombre entier positif'),
  body('preparationTime')
    .optional()
    .isInt({ min: 0 }).withMessage('Le temps de préparation doit être un nombre entier positif'),
  body('allergens')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(item => typeof item === 'string' && item.length <= 50);
      }
      return typeof value === 'string';
    }).withMessage('Les allergènes doivent être un tableau de chaînes ou une chaîne'),
  handleValidationErrors
];

// Validation catégorie
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Le nom doit contenir entre 1 et 100 caractères')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères')
    .escape(),
  body('imageUrl')
    .optional()
    .trim()
    .isURL().withMessage('URL d\'image invalide')
    .isLength({ max: 500 }).withMessage('URL trop longue'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('L\'ordre d\'affichage doit être un nombre entier positif'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  handleValidationErrors
];

// Validation code promo
const validatePromoCode = [
  body('code')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Le code doit contenir entre 1 et 50 caractères')
    .matches(/^[A-Z0-9-_]+$/).withMessage('Le code ne peut contenir que des lettres majuscules, chiffres, tirets et underscores')
    .escape(),
  body('discountType')
    .isIn(['percentage', 'fixed']).withMessage('Type de réduction invalide. Valeurs acceptées: percentage, fixed'),
  body('discountValue')
    .isFloat({ min: 0 }).withMessage('La valeur de réduction doit être un nombre positif'),
  body('minPurchase')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le montant minimum d\'achat doit être un nombre positif'),
  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le montant maximum de réduction doit être un nombre positif'),
  body('validFrom')
    .optional()
    .isISO8601().withMessage('Date de début invalide (format ISO 8601 requis)'),
  body('validUntil')
    .optional()
    .isISO8601().withMessage('Date de fin invalide (format ISO 8601 requis)'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('La limite d\'utilisation doit être un nombre entier positif'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  handleValidationErrors
];

// Validation récompense fidélité
const validateLoyaltyReward = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Le nom doit contenir entre 1 et 255 caractères')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères')
    .escape(),
  body('pointsRequired')
    .isInt({ min: 1 }).withMessage('Le nombre de points requis doit être un nombre entier positif'),
  body('discountType')
    .isIn(['percentage', 'fixed']).withMessage('Type de réduction invalide. Valeurs acceptées: percentage, fixed'),
  body('discountValue')
    .isFloat({ min: 0 }).withMessage('La valeur de réduction doit être un nombre positif'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  handleValidationErrors
];

// Validation ajustement de points
const validatePointsAdjustment = [
  body('points')
    .isInt().withMessage('Les points doivent être un nombre entier')
    .custom((value) => {
      // Permettre les valeurs négatives pour déduire des points
      return Math.abs(value) <= 10000; // Limite raisonnable
    }).withMessage('Le nombre de points doit être entre -10000 et 10000'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('La raison ne peut pas dépasser 255 caractères')
    .escape(),
  handleValidationErrors
];

// Validation statut de commande
const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'preparing', 'ready', 'served', 'cancelled']).withMessage('Statut invalide. Valeurs acceptées: pending, preparing, ready, served, cancelled'),
  handleValidationErrors
];

// Validation statut de paiement
const validatePaymentStatus = [
  body('paymentStatus')
    .isIn(['pending', 'paid', 'refunded', 'failed']).withMessage('Statut de paiement invalide. Valeurs acceptées: pending, paid, refunded, failed'),
  handleValidationErrors
];

// Validation ID (paramètre d'URL)
const validateId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID invalide (doit être un nombre entier positif)'),
  handleValidationErrors
];

module.exports = {
  helmetConfig,
  generalRateLimit,
  authRateLimit,
  adminRateLimit, // ✅ Export du rate limiting admin
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManager,
  requireKiosk, // ✅ Export du middleware kiosk
  csrfProtection,
  generateCsrfToken,
  loginValidation,
  registerValidation,
  validateUser,
  validateUserCreate,
  validateProfile,
  validateProduct,
  validateProductCreate,
  validateCategory,
  validatePromoCode,
  validateLoyaltyReward,
  validatePointsAdjustment,
  validateOrderStatus,
  validatePaymentStatus,
  validateId,
  handleValidationErrors
};
