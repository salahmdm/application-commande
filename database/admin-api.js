/**
 * ================================================================
 * API ADMIN COMPLÈTE - Blossom Café
 * ================================================================
 * Routes CRUD complètes pour l'administration
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
// ✅ MIGRATION SUPABASE: Remplacé mysql2 par Supabase
// const mysql = require('mysql2/promise');
const supabaseService = require('./supabase-backend-service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const { upload, validateFileMagicBytes: validateProductMagicBytes } = require('./upload-config');
const { upload: uploadNews, validateFileMagicBytes: validateNewsMagicBytes } = require('./upload-config-news');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./utils/logger'); // ✅ SÉCURITÉ: Logger structuré
const { errorHandler, asyncHandler, notFoundHandler } = require('./middleware/errorHandler'); // ✅ Gestion d'erreurs centralisée
const { parsePaginationParams, getPaginationMetadata, formatPaginatedResponse } = require('./utils/pagination'); // ✅ Pagination
// ✅ MIGRATION SUPABASE: PoolMonitor désactivé (non nécessaire avec Supabase)
// const PoolMonitor = require('./utils/pool-monitor');
const cache = require('./utils/cache'); // ✅ OPTIMISATION: Cache pour données fréquentes

/**
 * ✅ Générer un identifiant unique de 11 caractères (mélange lettres et chiffres)
 * Format: Lettres majuscules (A-Z) et chiffres (0-9)
 * @returns {string} Identifiant unique de 11 caractères
 */
const generateClientIdentifier = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // 26 lettres + 10 chiffres = 36 caractères
  let identifier = '';
  
  // Générer 11 caractères aléatoires
  for (let i = 0; i < 11; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    identifier += chars[randomIndex];
  }
  
  return identifier;
};

/**
 * ✅ Générer un identifiant client unique (vérifier qu'il n'existe pas déjà en base)
 * @param {Object} supabaseService - Service Supabase
 * @returns {Promise<string>} Identifiant unique
 */
const generateUniqueClientIdentifier = async (supabaseService) => {
  let identifier;
  let attempts = 0;
  const maxAttempts = 10; // Limiter les tentatives pour éviter une boucle infinie
  
  do {
    identifier = generateClientIdentifier();
    // ✅ MIGRATION SUPABASE: Utiliser selectOne au lieu de pool.query
    const [existing] = await supabaseService.select('users', {
      where: { client_identifier: identifier },
      select: 'id',
      limit: 1
    });
    
    if (!existing || existing.length === 0) {
      // Identifiant unique trouvé
      return identifier;
    }
    
    attempts++;
    if (attempts >= maxAttempts) {
      // En cas d'échec répété, ajouter un timestamp pour garantir l'unicité
      const timestamp = Date.now().toString().slice(-4); // 4 derniers chiffres du timestamp
      identifier = generateClientIdentifier().slice(0, 7) + timestamp;
      logger.warn('⚠️ Utilisation d\'un identifiant avec timestamp pour garantir l\'unicité');
      return identifier;
    }
  } while (true);
};
const { 
  helmetConfig, 
  authRateLimit, 
  generalRateLimit,
  adminRateLimit, // ✅ Import du rate limiting admin
  csrfProtection, 
  generateCsrfToken,
  authenticateToken, // ✅ Import depuis security-middleware.js (inclut session timeout)
  requireKiosk, // ✅ Middleware pour rôle kiosk
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
  validateId
} = require('./security-middleware');

const app = express();
const httpServer = http.createServer(app);

// ✅ SIMPLIFICATION: Variable pour faciliter les vérifications
const isProd = process.env.NODE_ENV === 'production';

// Normalisation des origines CORS (supprimer la barre finale)
const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '');

// Configuration CORS sécurisée
// ✅ Port 3000: Application principale (App.jsx)
// ✅ Port 3010: Kiosk (KioskApp.jsx)
const allowedOrigins = (isProd
  ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
  : [
      'http://localhost:3000',      // Application principale
      'http://localhost:3010'       // Kiosk
    ]
).map(normalizeOrigin);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Le PORT sera défini après le chargement de config

// ================================================================
// MIDDLEWARES DE SÉCURITÉ
// ================================================================
// Appliquer Helmet pour les headers de sécurité
app.use(helmetConfig);

// ✅ OPTIMISATION: Compression des réponses (réduit la taille de 60-70%)
// Installer avec: npm install compression
// Si le package n'est pas installé, la compression sera désactivée sans erreur
try {
  const compression = require('compression');
  app.use(compression({
    level: 6, // Niveau de compression optimal (0-9)
    threshold: 1024, // Compresser seulement si > 1KB
    filter: (req, res) => {
      // Ne pas compresser si le client ne le supporte pas
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Utiliser le filtre par défaut
      return compression.filter(req, res);
    }
  }));
  logger.log('✅ Compression activée pour les réponses API');
} catch (error) {
  // Package compression non installé - continuer sans compression
  logger.log('ℹ️ Compression non disponible (optionnel) - installez avec: npm install compression');
}

// ✅ SÉCURITÉ: Le bypass dev doit être explicitement activé
// Ne JAMAIS activer automatiquement, même en développement
const DEV_BYPASS_ENABLED = process.env.ALLOW_DEV_BYPASS === 'true';
const DEV_BYPASS_SECRET = process.env.DEV_BYPASS_SECRET || 'CHANGEZ_MOI_EN_DEVELOPPEMENT';

const canUseDevBypass = (req) => {
  if (isProd) return false; // ❌ JAMAIS en production
  if (!DEV_BYPASS_ENABLED) return false; // ❌ Doit être explicitement activé
  const providedSecret = req.headers['x-dev-bypass-secret'];
  if (!providedSecret || providedSecret !== DEV_BYPASS_SECRET) return false; // ❌ Header secret invalide
  return true; // ✅ Toutes les conditions sont remplies
};

// ✅ SÉCURITÉ: Wrapper pour bypass dev avec vérifications strictes
const devBypass = (mw) => {
  if (isProd) {
    // En production, toujours utiliser le middleware normal
    return mw;
  }
  // En développement, vérifier les conditions avant de bypasser
  return (req, res, next) => {
    if (canUseDevBypass(req)) {
      // ⚠️ LOGGER l'utilisation du bypass
      logger.warn('⚠️ [DEV BYPASS] Bypass middleware pour:', req.path, 'IP:', req.ip);
      if (!req.user) {
        req.user = { id: 0, email: 'dev@local', role: 'manager', devBypass: true };
      }
      return next();
    }
    // Si le bypass n'est pas autorisé, utiliser le middleware normal
    return mw(req, res, next);
  };
};
// (Diagnostic externe supprimé à la demande)

// ✅ SÉCURITÉ: Rate limiting activé sur toutes les routes API
// Rate limiting général pour toutes les routes
app.use('/api', generalRateLimit);

// ✅ SÉCURITÉ: Rate limiting plus strict pour les routes admin
// Limite: 50 requêtes par 15 minutes (au lieu de 100)
app.use('/api/admin', adminRateLimit);

// (Routes /api/diagnostic/* supprimées)

// ================================================================
// FONCTION UTILITAIRE : Génération de numéro de commande
// ================================================================
/**
 * Génère un numéro de commande unique au format CMD-XXXX
 * Format: CMD-0001, CMD-0002, etc. (séquentiel)
 * @param {Object} connection - Connexion MySQL
 * @returns {Promise<string>} - Numéro de commande au format CMD-XXXX
 */
async function generateOrderNumber(connection) {
  try {
    logger.log('🔢 [generateOrderNumber] Début de la génération séquentielle...');
    
    // Récupérer le dernier numéro de commande au format CMD-XXXX
    const [lastOrders] = await connection.query(
      `SELECT order_number FROM orders 
       WHERE order_number REGEXP '^CMD-[0-9]{4}$'
       ORDER BY CAST(SUBSTRING(order_number, 5) AS UNSIGNED) DESC
       LIMIT 1`
    );
    
    let nextNumber = 1;
    
    if (lastOrders.length > 0) {
      // Extraire le numéro du dernier order_number (ex: CMD-0001 -> 1)
      const lastNumberStr = lastOrders[0].order_number.replace('CMD-', '');
      const lastNumber = parseInt(lastNumberStr, 10);
      
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    // Formater avec padding de 4 chiffres (CMD-0001, CMD-0002, etc.)
    const orderNumber = `CMD-${String(nextNumber).padStart(4, '0')}`;
    
    // Vérifier l'unicité (sécurité supplémentaire)
    const [existing] = await connection.query(
      'SELECT id FROM orders WHERE order_number = ?',
      [orderNumber]
    );
    
    if (existing.length > 0) {
      // Collision détectée, incrémenter
      logger.warn('⚠️ Collision détectée, incrémentation...');
      return generateOrderNumber(connection);
    }
    
    logger.log('📌 [generateOrderNumber] Génération numéro de commande séquentiel:');
    logger.log('   - Format: CMD-XXXX');
    logger.log('   - Nouveau numéro généré:', orderNumber);
    logger.log('   - Format vérifié:', orderNumber.match(/^CMD-\d{4}$/) ? '✅' : '❌');
    
    // Vérifier que le format est correct
    if (!orderNumber.match(/^CMD-\d{4}$/)) {
      logger.error('❌ [generateOrderNumber] Format invalide généré:', orderNumber);
      throw new Error(`Format de numéro de commande invalide: ${orderNumber}`);
    }
    
    return orderNumber;
  } catch (error) {
    logger.error('❌ [generateOrderNumber] Erreur lors de la génération:', error);
    logger.error('   Stack:', error.stack);
    // En cas d'erreur, utiliser un fallback séquentiel basique
    const [countResult] = await connection.query('SELECT COUNT(*) as count FROM orders');
    const fallbackNumber = `CMD-${String((countResult[0]?.count || 0) + 1).padStart(4, '0')}`;
    logger.error('   ⚠️ Utilisation du fallback séquentiel:', fallbackNumber);
    return fallbackNumber;
  }
}

// ✅ SÉCURITÉ: Middleware CORS - Configuration stricte
app.use(cors({
  origin: (origin, callback) => {
    // En production, refuser les requêtes sans origine
    if (isProd && !origin) {
      logger.security('CORS blocked - No origin', {});
      return callback(new Error('CORS: Origin requise en production'));
    }
    
    // Autoriser les requêtes sans origine uniquement en développement
    if (!origin && !isProd) {
      return callback(null, true);
    }
    
    // Vérifier si l'origine est autorisée
    const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
    if (normalizedOrigin && allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      logger.security('CORS blocked', { origin, allowedOrigins });
      callback(new Error(`CORS: Origine non autorisée: ${origin}`));
    }
  },
  credentials: true, // Nécessaire pour les cookies HTTP-only
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Dev-Bypass-Secret'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-CSRF-Token'],
  maxAge: isProd ? 86400 : 0 // Cache preflight 24h en prod, pas de cache en dev
}));

// Cookie parser - Nécessaire pour lire les cookies HTTP-only
app.use(cookieParser());

// ✅ SÉCURITÉ: Forcer HTTPS seulement en production
if (isProd) {
  app.use((req, res, next) => {
    // Vérifier si la requête est en HTTPS ou si elle passe par un proxy (Heroku, etc.)
    const isSecure = req.secure || 
                     req.headers['x-forwarded-proto'] === 'https' ||
                     req.headers['x-forwarded-ssl'] === 'on';
    
    if (!isSecure) {
      // Rediriger vers HTTPS
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    
    next();
  });
}

// ✅ SÉCURITÉ: Limiter la taille des requêtes pour protection DoS
// Limites réduites pour éviter les attaques par requêtes volumineuses
app.use(express.json({ limit: '1mb' })); // 1MB pour JSON (suffisant pour la plupart des requêtes)
app.use(express.urlencoded({ limit: '1mb', extended: true })); // 1MB pour form data

// Middleware de logging pour diagnostiquer les problèmes de connexion
// ✅ SÉCURITÉ: Ne logger que les informations non sensibles
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    logger.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    logger.log(`  Origin: ${req.headers.origin || 'N/A'}`);
    logger.log(`  Referer: ${req.headers.referer || 'N/A'}`);
  }
  next();
});

// Servir les fichiers statiques (images uploads)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Route de test santé
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Blossom Café API est active',
    timestamp: new Date().toISOString()
  });
});

// ================================================================
// CONFIGURATION BASE DE DONNÉES
// ================================================================
// Utiliser la configuration centralisée depuis config.js
const config = require('./config');

// Définir le PORT depuis la config
const PORT = config.server.port;

// ✅ MIGRATION SUPABASE: Pool MySQL remplacé par Supabase
// Le service Supabase est déjà initialisé dans supabase-backend-service.js
// Créer un alias 'pool' pour compatibilité temporaire pendant la migration
const pool = supabaseService;

// ✅ MIGRATION SUPABASE: PoolMonitor désactivé (non nécessaire avec Supabase)
// const poolMonitor = ... (désactivé)

logger.log('✅ Backend configuré pour utiliser Supabase au lieu de MySQL');
// ✅ MIGRATION SUPABASE: Code de configuration MySQL supprimé (non nécessaire avec Supabase)

// ================================================================
// ENDPOINT PUBLIC DEV: Statut de la base de données (sans auth)
// ================================================================
if (process.env.NODE_ENV !== 'production' || process.env.SECURITY_MODE === 'relaxed') {
  app.get('/api/db/status', async (req, res) => {
    try {
      // Requête de test
      const [ping] = await pool.query('SELECT 1 AS ok');
      const ok = Array.isArray(ping) && ping[0] && (ping[0].ok === 1 || ping[0].OK === 1);
      // Compter les tables
      const [tables] = await pool.query(
        'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
        [config.database.database]
      );
      
      // ✅ OPTIMISATION: Inclure les statistiques du pool
      const poolStats = poolMonitor.getSummary();
      
      res.json({
        success: true,
        database: {
          name: config.database.database,
          ok,
          tables: Array.isArray(tables) ? tables.length : 0
        },
        pool: poolStats
      });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
}

// ✅ MIGRATION SUPABASE: pool.on('error') supprimé (non nécessaire avec Supabase)

// ✅ MIGRATION SUPABASE: Code de keep-alive et gestion d'arrêt MySQL supprimé
// Supabase gère automatiquement les connexions

// Test de connexion Supabase
(async () => {
  try {
    await supabaseService.ping();
    logger.log('✅ Connexion Supabase réussie');
  } catch (err) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ ERREUR: Impossible de se connecter à Supabase');
    logger.error('   Message:', err.message);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('💡 Vérifiez que:');
    logger.error('   1. Les variables SUPABASE_URL et SUPABASE_KEY sont définies dans database/.env');
    logger.error('   2. Votre projet Supabase est actif');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
})();

// ================================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ================================================================
// ✅ authenticateToken est importé depuis security-middleware.js
// Il inclut la vérification de session timeout (8 heures max)

// Middleware d'authentification optionnel (accepte token ou invité)
const authenticateOptional = (req, res, next) => {
  // ✅ PRIORITÉ 1: Cookie HTTP-only
  let token = req.cookies?.token;
  
  // ✅ PRIORITÉ 2: Header Authorization (compatibilité)
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  // ✅ SÉCURITÉ: Logs minimaux en production
  if (process.env.NODE_ENV === 'development') {
    logger.log('🔐 authenticateOptional - Vérification...');
    logger.log('   Token depuis cookie:', req.cookies?.token ? 'OUI' : 'NON');
    logger.log('   Token depuis header:', req.headers['authorization'] ? 'OUI' : 'NON');
  }

  // Si pas de token, vérifier si c'est un invité
  if (!token) {
    const guestName = req.body.guestName || req.headers['x-guest-name'];
    if (guestName) {
      // Utilisateur invité
      if (process.env.NODE_ENV === 'development') {
        logger.log('✅ Utilisateur invité détecté');
      }
      req.user = {
        id: null, // Pas d'ID dans la base de données pour les invités
        role: 'client',
        isGuest: true,
        guestName: guestName
      };
      return next();
    }
    if (process.env.NODE_ENV === 'development') {
      logger.error('❌ Erreur: Ni token ni nom invité');
    }
    return res.status(401).json({ error: 'Token manquant ou nom invité manquant' });
  }

  // Token présent, vérifier
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('❌ Token invalide:', err.message);
      }
      // Si le token est invalide, essayer de traiter comme invité
      const guestName = req.body.guestName || req.headers['x-guest-name'];
      if (guestName) {
        if (process.env.NODE_ENV === 'development') {
          logger.log('⚠️ Token invalide, traitement comme invité');
        }
        req.user = {
          id: null,
          role: 'client',
          isGuest: true,
          guestName: guestName
        };
        return next();
      }
      return res.status(403).json({ error: 'Token invalide' });
    }
    if (process.env.NODE_ENV === 'development') {
      logger.log('✅ Token valide pour utilisateur ID:', user.id, 'role:', user.role);
    }
    req.user = user;
    req.user.isGuest = false;
    next();
  });
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Droits admin requis.' });
  }
  next();
};

// Middleware pour vérifier le rôle manager ou admin
const requireManager = (req, res, next) => {
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé. Droits manager requis.' });
  }
  next();
};

// ================================================================
// ROUTES PUBLIQUES (Pas d'authentification requise)
// ================================================================

// Route de santé pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Blossom Café API Server', timestamp: new Date().toISOString() });
});

// Route de santé API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Server is running', timestamp: new Date().toISOString() });
});

// ✅ OPTIMISATION: Produits disponibles (pour les clients non authentifiés) - Avec cache
app.get('/api/products', asyncHandler(async (req, res) => {
  const cacheKey = 'products:available';
  
  // Vérifier le cache
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return res.json(cached);
  }
  
  // Requête à la base de données
  const [products] = await pool.query(`
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_available = TRUE
    ORDER BY c.display_order, p.name
  `);
  
  const response = {
    success: true,
    data: products
  };
  
  // Mettre en cache
  cache.set(cacheKey, response);
  
  logger.debug('Products fetched from DB', { count: products.length });
  res.json(response);
}));

// ✅ OPTIMISATION: Produits complets (pour tout utilisateur authentifié) - Avec cache
app.get('/api/products/all', authenticateToken, asyncHandler(async (req, res) => {
  const cacheKey = 'products:all';
  
  // Vérifier le cache
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return res.json(cached);
  }
  
  // Requête à la base de données
  const [products] = await pool.query(`
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY c.display_order, p.name
  `);

  const response = {
    success: true,
    data: products
  };
  
  // Mettre en cache
  cache.set(cacheKey, response);
  
  logger.debug('All products fetched from DB', { count: products.length });
  res.json(response);
}));

// ✅ OPTIMISATION: Catégories disponibles (pour les clients non authentifiés) - Avec cache
app.get('/api/categories', asyncHandler(async (req, res) => {
  const cacheKey = 'categories:active';
  
  // Vérifier le cache
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return res.json(cached);
  }
  
  // Requête à la base de données
  const [categories] = await pool.query(`
    SELECT * FROM categories 
    WHERE is_active = TRUE 
    ORDER BY display_order
  `);
  
  const response = {
    success: true,
    data: categories
  };
  
  // Mettre en cache
  cache.set(cacheKey, response);
  
  logger.debug('Categories fetched from DB', { count: categories.length });
  res.json(response);
}));

// ================================================================
// ROUTE DE SANTÉ (HEALTH CHECK)
// ================================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// ✅ SÉCURITÉ: Route pour obtenir le token CSRF
// Cette route génère un nouveau token CSRF et le retourne
app.get('/api/csrf-token', generateCsrfToken, (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken
  });
});

// ================================================================
// ROUTES D'AUTHENTIFICATION
// ================================================================

// Login avec rate limiting pour protection contre brute force
app.post('/api/auth/login', authRateLimit, loginValidation, async (req, res) => {
  try {
    // ✅ SÉCURITÉ: Logger structuré avec masquage des données sensibles
    logger.request(req, 'POST /api/auth/login');
    logger.debug('Login attempt', {
      origin: req.headers.origin,
      hasPassword: !!req.body.password,
      email: logger.sanitizeEmail(req.body.email)
    });
    
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', { ip: req.ip });
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    
    // ✅ Générer un identifiant client s'il n'existe pas (pour les anciens clients)
    // Vérifier d'abord si la colonne existe en gérant l'erreur
    if (users.length > 0 && users[0].role === 'client') {
      const hasIdentifier = users[0].client_identifier !== undefined && users[0].client_identifier !== null;
      
      if (!hasIdentifier) {
        try {
          // Générer l'identifiant client pour les clients existants qui n'en ont pas
          const clientIdentifier = await generateUniqueClientIdentifier(pool);
          await pool.query(
            'UPDATE users SET client_identifier = ? WHERE id = ?',
            [clientIdentifier, users[0].id]
          );
          users[0].client_identifier = clientIdentifier;
          logger.log('✅ Identifiant client généré pour un client existant:', clientIdentifier);
        } catch (error) {
          if (error.code === 'ER_BAD_FIELD_ERROR' || error.sqlMessage?.includes('client_identifier')) {
            // La colonne n'existe pas encore, ne rien faire pour l'instant
            logger.warn('⚠️ Colonne client_identifier non disponible. Exécutez la migration SQL: database/migrations/sql/add-client-identifier.sql');
            users[0].client_identifier = null;
          } else if (error.code === 'ER_DUP_ENTRY') {
            // L'identifiant existe déjà (cas rare), récupérer celui existant
            const [existing] = await pool.query(
              'SELECT client_identifier FROM users WHERE id = ?',
              [users[0].id]
            );
            if (existing.length > 0) {
              users[0].client_identifier = existing[0].client_identifier;
              logger.log('✅ Identifiant client récupéré:', existing[0].client_identifier);
            }
          } else {
            logger.error('⚠️ Erreur lors de la génération de l\'identifiant client:', error);
            users[0].client_identifier = null;
          }
        }
      }
    }

    if (users.length === 0) {
      logger.security('Login failed - User not found', { 
        email: logger.sanitizeEmail(email),
        ip: req.ip 
      });
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];
    logger.debug('User found', { userId: user.id, email: logger.sanitizeEmail(user.email) });

    // Vérification du mot de passe avec bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      logger.security('Login failed - Invalid password', {
        userId: user.id,
        email: logger.sanitizeEmail(user.email),
        ip: req.ip
      });
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    logger.info('Login successful', { userId: user.id, email: logger.sanitizeEmail(user.email) });

    // Mettre à jour last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Créer le token avec expiration sécurisée (15 minutes pour access token)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, type: 'access' },
      config.jwt.secret,
      { expiresIn: '15m' } // 15 minutes pour access token
    );

    // Créer le refresh token (7 jours)
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.jwt.refreshSecret || config.jwt.secret + '_refresh',
      { expiresIn: '7d' }
    );

    logger.debug('Tokens created', { userId: user.id });

    // Stocker le refresh token dans la base de données pour révocation possible
    try {
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY)) ON DUPLICATE KEY UPDATE token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)',
        [user.id, refreshToken, refreshToken]
      );
    } catch (error) {
      // Si la table n'existe pas encore, on continue quand même
      logger.warn('⚠️ Table refresh_tokens non disponible, refresh token non stocké:', error.message);
    }

    const { password_hash, ...userWithoutPassword } = user;

    // ✅ STOCKER LE TOKEN DANS UN COOKIE HTTP-ONLY (sécurisé)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,        // JavaScript ne peut pas accéder (protection XSS)
      secure: isProduction,  // HTTPS uniquement en production
      sameSite: isProduction ? 'strict' : 'lax',    // Lax en développement pour permettre les cookies
      maxAge: 15 * 60 * 1000, // 15 minutes (même durée que le token)
      path: '/',
      ...(isProduction && { domain: process.env.COOKIE_DOMAIN }) // Domaine spécifique en production
    };
    
    res.cookie('token', accessToken, cookieOptions);
    logger.log('✅ Cookie token défini:', cookieOptions);

    // ✅ STOCKER LE REFRESH TOKEN DANS UN COOKIE SÉPARÉ
    const refreshCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',    // Lax en développement pour permettre les cookies
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/api/auth',
      ...(isProduction && { domain: process.env.COOKIE_DOMAIN })
    };
    
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    logger.log('✅ Cookie refreshToken défini:', refreshCookieOptions);

    // Ne plus envoyer le token dans le body JSON (sécurité)
    // Le frontend récupérera le token depuis le cookie automatiquement
    logger.log('✅ Réponse JSON envoyée avec user:', { id: userWithoutPassword.id, email: userWithoutPassword.email, role: userWithoutPassword.role });
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('✅ POST /api/auth/login - Succès');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.json({
      success: true,
      // token: accessToken, // ❌ SUPPRIMÉ - Utiliser cookie uniquement
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ POST /api/auth/login - Erreur:', error);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // ✅ SÉCURITÉ: Masquer les détails d'erreur en production
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      error: 'Erreur serveur',
      ...(isProd ? {} : { message: error.message })
    });
  }
});
// Route de refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token manquant' });
    }

    // Vérifier le refresh token dans la base de données
    try {
      const [tokens] = await pool.query(
        'SELECT user_id, expires_at FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
        [refreshToken]
      );

      if (tokens.length === 0) {
        return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
      }

      const userId = tokens[0].user_id;

      // Récupérer l'utilisateur
      const [users] = await pool.query('SELECT id, email, role FROM users WHERE id = ? AND is_active = TRUE', [userId]);
      
      if (users.length === 0) {
        return res.status(401).json({ error: 'Utilisateur introuvable' });
      }

      const user = users[0];

      // Générer un nouveau access token
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, type: 'access' },
        config.jwt.secret,
        { expiresIn: '15m' }
      );

      // Mettre à jour le cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/',
        ...(isProduction && { domain: process.env.COOKIE_DOMAIN })
      });

      res.json({ success: true });
    } catch (dbError) {
      // Si la table n'existe pas encore, on peut quand même vérifier le token JWT
      try {
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret || config.jwt.secret + '_refresh');
        
        if (decoded.type !== 'refresh') {
          return res.status(401).json({ error: 'Token invalide' });
        }

        const [users] = await pool.query('SELECT id, email, role FROM users WHERE id = ? AND is_active = TRUE', [decoded.id]);
        
        if (users.length === 0) {
          return res.status(401).json({ error: 'Utilisateur introuvable' });
        }

        const user = users[0];
        const accessToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role, type: 'access' },
          config.jwt.secret,
          { expiresIn: '15m' }
        );

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', accessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
          path: '/',
          ...(isProduction && { domain: process.env.COOKIE_DOMAIN })
        });

        res.json({ success: true });
      } catch (jwtError) {
        return res.status(401).json({ error: 'Refresh token invalide' });
      }
    }
  } catch (error) {
    logger.error('Erreur refresh token:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

  // Route de logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    // Révoquer le refresh token dans la base de données
    if (refreshToken) {
      try {
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      } catch (error) {
        logger.warn('⚠️ Erreur suppression refresh token:', error.message);
      }
    }

    // Supprimer les cookies avec les mêmes attributs qu'au set
    const isProduction = process.env.NODE_ENV === 'production';
    const commonTokenOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      ...(isProduction && { domain: process.env.COOKIE_DOMAIN })
    };
    const commonRefreshOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/api/auth',
      ...(isProduction && { domain: process.env.COOKIE_DOMAIN })
    };
    res.clearCookie('token', commonTokenOpts);
    res.clearCookie('refreshToken', commonRefreshOpts);

    res.json({ success: true, message: 'Déconnexion réussie' });
  } catch (error) {
    logger.error('Erreur logout:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Register
// ✅ SÉCURITÉ: Le rôle est forcé à 'client' - toute tentative d'inscription avec un autre rôle est ignorée
app.post('/api/auth/register', registerValidation, async (req, res) => {
  try {
    // ✅ Ignorer intentionnellement req.body.role pour forcer 'client'
    const { email, password, firstName, lastName, phone } = req.body;

    // ✅ Validation supplémentaire côté serveur (sécurité)
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Email requis',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'email', message: 'Email requis' }]
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ 
        success: false,
        error: 'Mot de passe invalide',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'password', message: 'Le mot de passe doit contenir au moins 8 caractères' }]
      });
    }

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Prénom requis',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'firstName', message: 'Prénom requis' }]
      });
    }

    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Nom requis',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'lastName', message: 'Nom requis' }]
      });
    }

    // Vérifier si l'email existe déjà
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Cet email est déjà utilisé',
        code: 'DUPLICATE_EMAIL'
      });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ Normaliser le téléphone : null si vide/undefined, sinon trim()
    const normalizedPhone = phone && phone.trim() ? phone.trim() : null;

    // ✅ Générer un identifiant unique de 11 caractères pour le client
    const clientIdentifier = await generateUniqueClientIdentifier(pool);

    // ✅ Créer l'utilisateur avec rôle FORCÉ à 'client' et identifiant unique
    // Gérer le cas où la colonne client_identifier n'existe pas encore
    let result;
    try {
      [result] = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, client_identifier, phone, role, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, 'client', TRUE)`,
        [
          email.trim().toLowerCase(), 
          passwordHash, 
          firstName.trim(), 
          lastName.trim(),
          clientIdentifier, // ✅ Identifiant unique de 11 caractères
          normalizedPhone
        ]
      );
      logger.log('✅ Utilisateur créé avec identifiant client:', clientIdentifier);
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR' || error.sqlMessage?.includes('client_identifier')) {
        // La colonne n'existe pas encore, créer sans l'identifiant
        logger.warn('⚠️ Colonne client_identifier non disponible. Création sans identifiant. Exécutez la migration SQL.');
        [result] = await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active) 
           VALUES (?, ?, ?, ?, ?, 'client', TRUE)`,
          [
            email.trim().toLowerCase(), 
            passwordHash, 
            firstName.trim(), 
            lastName.trim(),
            normalizedPhone
          ]
        );
      } else {
        throw error; // Relancer les autres erreurs
      }
    }

    logger.log('✅ Utilisateur créé avec succès:', {
      userId: result.insertId,
      email: email.trim().toLowerCase(),
      clientIdentifier: clientIdentifier,
      role: 'client'
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      userId: result.insertId
    });
  } catch (error) {
    logger.error('❌ Erreur register:', error);
    
    // Gestion spécifique des erreurs MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        error: 'Cet email est déjà utilisé',
        code: 'DUPLICATE_EMAIL'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la création du compte',
      code: 'SERVER_ERROR'
    });
  }
});

// ================================================================
// ROUTES KIOSK (Bornes tactiles)
// ================================================================

// Authentification kiosk (token long durée)
// POST /api/kiosk/login
// Body: { kioskId, kioskSecret }
app.post('/api/kiosk/login', authRateLimit, asyncHandler(async (req, res) => {
  try {
    logger.log('🔐 KIOSK LOGIN - Tentative d\'authentification');
    const { kioskId, kioskSecret } = req.body;

    if (!kioskId || !kioskSecret) {
      return res.status(400).json({ error: 'kioskId et kioskSecret requis' });
    }

    // Vérifier les identifiants kiosk (peut être stocké en dur ou en base)
    // Pour l'instant, on vérifie dans la table users avec role='kiosk'
    const [kiosks] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND role = ? AND is_active = TRUE',
      [kioskId, 'kiosk']
    );

    if (kiosks.length === 0) {
      logger.security('Kiosk login failed - Kiosk not found', { kioskId, ip: req.ip });
      return res.status(401).json({ error: 'Identifiants kiosk invalides' });
    }

    const kiosk = kiosks[0];

    // Vérifier le secret (peut être un hash ou une valeur en dur)
    // Pour l'instant, on compare directement (à améliorer avec bcrypt en production)
    const isValid = await bcrypt.compare(kioskSecret, kiosk.password_hash);

    if (!isValid) {
      logger.security('Kiosk login failed - Invalid secret', { kioskId, ip: req.ip });
      return res.status(401).json({ error: 'Identifiants kiosk invalides' });
    }

    logger.info('Kiosk login successful', { kioskId: kiosk.id });

    // Créer un token long durée (30 jours pour les bornes)
    const kioskToken = jwt.sign(
      { id: kiosk.id, email: kiosk.email, role: 'kiosk', type: 'kiosk' },
      config.jwt.secret,
      { expiresIn: '30d' } // Token long durée pour les bornes
    );

    // Stocker dans un cookie HTTP-only
    res.cookie('kiosk_token', kioskToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 jours
    });

    res.json({
      success: true,
      token: kioskToken,
      kiosk: {
        id: kiosk.id,
        email: kiosk.email
      }
    });
  } catch (error) {
    logger.error('❌ Kiosk login error:', error);
    throw error;
  }
}));

// Récupérer les catégories (optimisé pour kiosk)
// GET /api/kiosk/categories
// ✅ IMPORTANT: Récupère toutes les catégories actives depuis la BDD
app.get('/api/kiosk/categories', asyncHandler(async (req, res) => {
  try {
    // ✅ MIGRATION SUPABASE: Récupérer toutes les catégories actives depuis Supabase
    const [categories] = await supabaseService.select('categories', {
      where: { is_active: 1 }, // Supabase utilise 1 pour true (SMALLINT)
      orderBy: ['display_order ASC', 'name ASC']
    });
    
    logger.log(`✅ Kiosk - ${categories.length} catégories récupérées depuis la BDD`);
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('❌ Kiosk getCategories error:', error);
    throw error;
  }
}));

// Récupérer les produits (optimisé pour kiosk)
// GET /api/kiosk/products?categoryId=X
// ✅ IMPORTANT: Récupère TOUS les produits disponibles depuis la BDD (sans filtre stock)
app.get('/api/kiosk/products', asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    // ✅ Récupérer TOUS les produits disponibles (is_available = TRUE)
    // Pas de filtre sur stock car certains produits peuvent avoir stock = 0 ou NULL
    // Inclure les informations de catégorie pour un affichage complet
    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = TRUE
    `;
    const params = [];

    // Filtrer par catégorie si fournie
    if (categoryId) {
      query += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    // Trier par ordre d'affichage de catégorie puis par nom
    query += ' ORDER BY c.display_order ASC, p.name ASC';

    logger.log(`📦 Kiosk - Récupération produits${categoryId ? ` (catégorie: ${categoryId})` : ' (tous)'}`);
    const [products] = await pool.query(query, params);
    
    logger.log(`✅ Kiosk - ${products.length} produits récupérés depuis la BDD`);
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('❌ Kiosk getProducts error:', error);
    throw error;
  }
}));

// Créer une commande depuis la borne
// POST /api/kiosk/orders
// Pas de fidélité, pas de compte client
app.post('/api/kiosk/orders', asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    logger.log('📝 KIOSK - CRÉATION DE COMMANDE');
    logger.log('   Kiosk ID:', req.user.id);

    const { orderType, items, paymentMethod, notes, tableNumber, promoCode: promoCodeInput, subtotal: subtotalFromClient, discountAmount: discountAmountFromClient } = req.body;
    
    // Validation
    if (!items || items.length === 0) {
      throw new Error('Le panier est vide');
    }
    
    if (!orderType) {
      throw new Error('Type de commande manquant');
    }

    if (!paymentMethod) {
      throw new Error('Méthode de paiement manquante');
    }

    // Générer le numéro de commande
    const [lastOrder] = await connection.query(
      'SELECT order_number FROM orders ORDER BY id DESC LIMIT 1'
    );
    
    let orderNumber = 'CMD-0001';
    if (lastOrder.length > 0 && lastOrder[0].order_number) {
      const lastNum = parseInt(lastOrder[0].order_number.replace('CMD-', ''));
      orderNumber = `CMD-${String(lastNum + 1).padStart(4, '0')}`;
    }

    // Calculer le sous-total
    let subtotal = 0;
    for (const item of items) {
      const [product] = await connection.query('SELECT price FROM products WHERE id = ?', [item.productId]);
      if (product.length === 0) {
        throw new Error(`Produit ${item.productId} introuvable`);
      }
      subtotal += product[0].price * item.quantity;
    }

    // Utiliser le sous-total du client si fourni (plus précis avec les prix du panier)
    if (subtotalFromClient && subtotalFromClient > 0) {
      subtotal = parseFloat(subtotalFromClient);
    }

    // Appliquer le code promo si fourni
    let discountAmount = 0;
    let promoCodeId = null;
    let promoCode = promoCodeInput ? promoCodeInput.toUpperCase() : null;

    if (promoCode) {
      // Valider le code promo
      const [promoCodes] = await connection.query(
        `SELECT * FROM promo_codes 
         WHERE code = ? AND is_active = TRUE 
         AND (valid_until IS NULL OR valid_until > NOW())
         AND (max_uses IS NULL OR uses_count < max_uses)
         AND ? >= min_order_amount`,
        [promoCode, subtotal]
      );

      if (promoCodes.length > 0) {
        const promo = promoCodes[0];
        promoCodeId = promo.id;

        if (promo.discount_type === 'percentage') {
          discountAmount = (subtotal * parseFloat(promo.discount_value)) / 100;
        } else {
          discountAmount = parseFloat(promo.discount_value);
        }

        // Utiliser le montant de réduction du client si fourni (plus précis)
        if (discountAmountFromClient && discountAmountFromClient > 0) {
          discountAmount = parseFloat(discountAmountFromClient);
        }
      } else {
        // Code promo invalide, ignorer
        logger.warn(`⚠️ KIOSK - Code promo invalide: ${promoCode}`);
        promoCode = null;
        discountAmount = 0;
      }
    }

    // Calculer les totaux avec réduction
    const baseTaxableHT = subtotal - discountAmount;
    const taxAmount = baseTaxableHT * 0.1; // TVA 10%
    const totalAmount = baseTaxableHT + taxAmount;

    // Créer la commande (user_id NULL pour kiosk)
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id, order_number, order_type, status, 
        subtotal, discount_amount, tax_amount, total_amount,
        promo_code_id, payment_method, payment_status, notes, table_number
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        null, // user_id NULL pour kiosk
        orderNumber,
        orderType,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        promoCodeId,
        paymentMethod,
        notes || `Commande depuis borne kiosk${promoCode ? ` - Code promo: ${promoCode}` : ''}`,
        tableNumber || null
      ]
    );

    const orderId = orderResult.insertId;

    // Ajouter les items
    for (const item of items) {
      const [product] = await connection.query('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (product.length === 0) continue;

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.quantity,
          product[0].price,
          item.notes || null
        ]
      );
    }

    await connection.commit();

    logger.log('✅ KIOSK - Commande créée:', orderNumber);

    res.json({
      success: true,
      data: {
        id: orderId,
        orderNumber,
        totalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    logger.error('❌ Kiosk createOrder error:', error);
    throw error;
  } finally {
    connection.release();
  }
}));

// Valider un code promo pour kiosk
// POST /api/kiosk/promo-codes/validate
app.post('/api/kiosk/promo-codes/validate', asyncHandler(async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || !code.trim()) {
      return res.json({
        success: false,
        error: 'Code promo requis'
      });
    }

    const promoCode = code.toUpperCase().trim();
    const orderSubtotal = parseFloat(subtotal) || 0;

    // Rechercher le code promo
    const [promoCodes] = await pool.query(
      `SELECT * FROM promo_codes 
       WHERE code = ? AND is_active = TRUE 
       AND (valid_until IS NULL OR valid_until > NOW())
       AND (max_uses IS NULL OR uses_count < max_uses)
       AND ? >= min_order_amount`,
      [promoCode, orderSubtotal]
    );

    if (promoCodes.length === 0) {
      return res.json({
        success: false,
        error: 'Code promo invalide ou expiré'
      });
    }

    const promo = promoCodes[0];
    let discountAmount = 0;

    if (promo.discount_type === 'percentage') {
      discountAmount = (orderSubtotal * parseFloat(promo.discount_value)) / 100;
    } else {
      discountAmount = parseFloat(promo.discount_value);
    }

    logger.log(`✅ KIOSK - Code promo validé: ${promoCode} (-${discountAmount.toFixed(2)} €)`);

    res.json({
      success: true,
      data: {
        code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: discountAmount
      }
    });
  } catch (error) {
    logger.error('❌ Kiosk validatePromoCode error:', error);
    throw error;
  }
}));

// Imprimer un ticket de commande
// POST /api/kiosk/orders/:orderNumber/print
app.post('/api/kiosk/orders/:orderNumber/print', asyncHandler(async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Récupérer la commande
    const [orders] = await pool.query(
      `SELECT o.*, 
              GROUP_CONCAT(
                CONCAT(oi.quantity, 'x ', p.name, ' - ', oi.price, '€') 
                SEPARATOR '\\n'
              ) as items_summary
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.order_number = ?
       GROUP BY o.id`,
      [orderNumber]
    );

    if (orders.length === 0) {
      return res.json({
        success: false,
        error: 'Commande introuvable'
      });
    }

    const order = orders[0];

    // TODO: Intégrer avec une imprimante de tickets réelle
    // Pour l'instant, on simule l'impression
    logger.log(`🖨️ KIOSK - Impression ticket pour commande: ${orderNumber}`);
    logger.log(`   Total: ${order.total_amount} €`);
    logger.log(`   Items: ${order.items_summary || 'Aucun'}`);

    // Ici, vous pouvez intégrer avec une imprimante :
    // - Imprimante USB (node-printer)
    // - Imprimante réseau (socket)
    // - API d'impression cloud
    // - Génération PDF et impression

    res.json({
      success: true,
      message: 'Ticket imprimé avec succès',
      data: {
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        printedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Kiosk printOrderTicket error:', error);
    throw error;
  }
}));

// Récupérer le statut d'une commande
// GET /api/kiosk/orders/:orderNumber
app.get('/api/kiosk/orders/:orderNumber', asyncHandler(async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ success: true, data: orders[0] });
  } catch (error) {
    logger.error('❌ Kiosk getOrderStatus error:', error);
    throw error;
  }
}));

// ================================================================
// ROUTES COMMANDES (Client)
// ================================================================

// Créer une commande (Client authentifié ou invité)
app.post('/api/orders', authenticateOptional, asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // ✅ SÉCURITÉ: Logs minimaux en production
    if (process.env.NODE_ENV === 'development') {
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('📝 CRÉATION DE COMMANDE');
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('👤 User ID:', req.user.id);
      logger.log('👤 Role:', req.user.role);
      // ✅ SÉCURITÉ: Ne jamais logger l'email en production
      logger.log('👤 Email:', req.user.email);
      logger.log('👤 Is Guest:', req.user.isGuest || false);
      logger.log('👤 Guest Name:', req.user.guestName || 'N/A');
      logger.log('📦 Body complet:', JSON.stringify(req.body, null, 2));
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      logger.log('📝 CRÉATION DE COMMANDE - User ID:', req.user.id, 'Role:', req.user.role);
    }

    const { orderType, items, promoCode: promoCodeInput, loyaltyReward, paymentMethod, notes, tableNumber } = req.body;
    
    // Validation des données
    logger.log('🔍 Validation...');
    logger.log('   - orderType:', orderType);
    logger.log('   - items:', items);
    logger.log('   - items.length:', items?.length);
    logger.log('   - paymentMethod:', paymentMethod);
    
    if (!items || items.length === 0) {
      logger.error('❌ VALIDATION ÉCHOUÉE: Panier vide');
      throw new Error('Le panier est vide');
    }
    
    if (!orderType) {
      logger.error('❌ VALIDATION ÉCHOUÉE: Type de commande manquant');
      throw new Error('Type de commande manquant');
    }
    
    // Validation du type de commande (doit correspondre à l'ENUM MySQL)
    const validOrderTypes = ['dine-in', 'takeaway', 'delivery'];
    if (!validOrderTypes.includes(orderType)) {
      logger.error('❌ VALIDATION ÉCHOUÉE: Type de commande invalide:', orderType);
      throw new Error(`Type de commande invalide. Valeurs acceptées: ${validOrderTypes.join(', ')}`);
    }
    
    // Validation de la méthode de paiement (doit correspondre à l'ENUM MySQL)
    const validPaymentMethods = ['cash', 'card', 'stripe', 'paypal'];
    const finalPaymentMethod = paymentMethod || 'cash';
    if (!validPaymentMethods.includes(finalPaymentMethod)) {
      logger.error('❌ VALIDATION ÉCHOUÉE: Méthode de paiement invalide:', finalPaymentMethod);
      throw new Error(`Méthode de paiement invalide. Valeurs acceptées: ${validPaymentMethods.join(', ')}`);
    }
    
    logger.log('✅ Validation réussie');

    // Générer un numéro de commande unique au format CMD-XXXX
    // IMPORTANT: Utiliser UNIQUEMENT la fonction generateOrderNumber()
    // NE JAMAIS utiliser l'ancien format ORD-YYYY-XXXXXXXXXX
    logger.log('🔢 Appel de generateOrderNumber()...');
    const orderNumber = await generateOrderNumber(connection);
    
    // Vérification stricte du format (format séquentiel CMD-XXXX)
    if (!orderNumber || !orderNumber.match(/^CMD-\d{4}$/)) {
      logger.error('❌❌❌ ERREUR CRITIQUE: Format de numéro invalide généré!');
      logger.error('   Numéro reçu:', orderNumber);
      logger.error('   Type:', typeof orderNumber);
      throw new Error(`Format de numéro de commande invalide. Attendu: CMD-XXXX (ex: CMD-0001), Reçu: ${orderNumber}`);
    }
    
    logger.log('✅✅✅ Numéro de commande validé:', orderNumber);

    // Calculer le sous-total
    let subtotal = 0;
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT price FROM products WHERE id = ?',
        [item.productId || item.id]
      );
      if (products.length > 0) {
        subtotal += parseFloat(products[0].price) * parseInt(item.quantity);
      }
    }

    // Appliquer le code promo si fourni (une seule promotion à la fois)
    let discountAmount = 0;
    let promoCodeId = null;
    let promoCode = promoCodeInput; // Variable modifiable pour le code promo
    
    // Appliquer la récompense de fidélité si fournie (priorité sur le code promo)
    let loyaltyDiscountAmount = 0;
    let loyaltyRewardData = null;
    let pointsToDeduct = 0;
    
    if (loyaltyReward) {
      // Vérifier que l'utilisateur est authentifié (pas invité)
      if (!req.user.id || req.user.isGuest) {
        await connection.rollback();
        throw new Error('Vous devez être connecté pour utiliser une récompense de fidélité');
      }
      
      // Vérifier les points requis
      pointsToDeduct = parseInt(loyaltyReward.pointsRequired || 0);
      
      if (pointsToDeduct > 0) {
        // Récupérer les points actuels de l'utilisateur
        const [users] = await connection.query(
          'SELECT loyalty_points FROM users WHERE id = ?',
          [req.user.id]
        );
        
        if (users.length === 0) {
          await connection.rollback();
          throw new Error('Utilisateur introuvable');
        }
        
        const currentPoints = Math.max(0, users[0].loyalty_points || 0);
        
        // Vérifier que l'utilisateur a assez de points
        if (currentPoints < pointsToDeduct) {
          await connection.rollback();
          throw new Error(`Points insuffisants. Vous avez ${currentPoints} points, ${pointsToDeduct} points requis pour cette récompense.`);
        }
      }
      
      // Appliquer la récompense de fidélité
      loyaltyRewardData = JSON.stringify(loyaltyReward);
      
      if (loyaltyReward.type === 'percentage') {
        loyaltyDiscountAmount = (subtotal * parseFloat(loyaltyReward.discountValue || 0)) / 100;
      } else if (loyaltyReward.type === 'fixed') {
        loyaltyDiscountAmount = parseFloat(loyaltyReward.discountValue || 0);
      }
      
      discountAmount = loyaltyDiscountAmount;
      promoCode = null; // Pas de code promo si récompense de fidélité
    } else if (promoCode) {
      // Appliquer le code promo seulement si pas de récompense de fidélité
      const [promoCodes] = await connection.query(
        `SELECT * FROM promo_codes 
         WHERE code = ? AND is_active = TRUE 
         AND (valid_until IS NULL OR valid_until > NOW())
         AND (max_uses IS NULL OR uses_count < max_uses)
         AND ? >= min_order_amount`,
        [promoCode.toUpperCase(), subtotal]
      );

      if (promoCodes.length > 0) {
        const promo = promoCodes[0];
        promoCodeId = promo.id;

        if (promo.discount_type === 'percentage') {
          discountAmount = (subtotal * parseFloat(promo.discount_value)) / 100;
        } else {
          discountAmount = parseFloat(promo.discount_value);
        }
      }
    }

    // Total TTC = (Sous-total HT - Réduction HT) × 1.10 (comme avant, inchangé)
    const baseTaxableHT = subtotal - discountAmount;
    const totalAmount = baseTaxableHT * 1.10; // Total TTC (comme avant)
    
    // TVA pour affichage : calculée sur le Total TTC (Sous-total TTC - Réduction TTC)
    const subtotalTTC = subtotal * 1.10;
    const discountTTC = discountAmount * 1.10;
    const baseTaxableTTC = Math.max(0, subtotalTTC - discountTTC);
    const taxAmount = baseTaxableTTC * 0.10; // TVA calculée sur le TTC pour l'affichage

    // Déterminer le statut de paiement selon la méthode
    const paymentStatus = (finalPaymentMethod === 'cash') ? 'pending' : 'completed';
    
    // Protection finale : Vérifier que le numéro n'est PAS au format ORD-
    // et qu'il respecte le format séquentiel CMD-XXXX
    const isNewFormat = typeof orderNumber === 'string' && /^CMD-\d{4}$/.test(orderNumber);
    if (!orderNumber || orderNumber.startsWith('ORD-') || !isNewFormat) {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌❌❌ ERREUR CRITIQUE: Format de numéro invalide!');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('   Numéro reçu:', orderNumber);
      logger.error('   Type:', typeof orderNumber);
      logger.error('   Format attendu: CMD-XXXX (ex: CMD-0001, CMD-0002)');
      logger.error('   Format reçu:', orderNumber?.startsWith('ORD-') ? 'ORD-YYYY-... (OBSOLÈTE)' : orderNumber || 'Format invalide');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await connection.rollback();
      throw new Error(`Format de numéro de commande invalide. Attendu: CMD-XXXX (ex: CMD-0001), Reçu: ${orderNumber}. L'ancien format ORD- est obsolète.`);
    }

    // ⚠️ LOG AVANT INSERTION MYSQL
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('💾 INSERTION DANS MYSQL');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('📌 order_type     :', orderType, `(type: ${typeof orderType})`);
    logger.log('📌 payment_method :', finalPaymentMethod, `(type: ${typeof finalPaymentMethod})`);
    logger.log('📌 payment_status :', paymentStatus);
    logger.log('📌 order_number   :', orderNumber, '(format: CMD-XXXX ✅)');
    logger.log('📌 user_id        :', req.user.id);
    logger.log('📌 table_number   :', tableNumber);
    logger.log('📌 subtotal       :', subtotal);
    logger.log('📌 total_amount   :', totalAmount);
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Protection ULTIME : Vérifier une dernière fois avant insertion SQL
    // Cette vérification est critique car elle empêche l'insertion de formats invalides
    // ✅ FORMAT SÉQUENTIEL: CMD-XXXX (aligné avec generateOrderNumber)
    const isNewFormatUltime = typeof orderNumber === 'string' && /^CMD-\d{4}$/.test(orderNumber);
    if (!orderNumber || !isNewFormatUltime) {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('🚨🚨🚨 PROTECTION ULTIME ACTIVÉE 🚨🚨🚨');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ BLOCAGE avant insertion SQL');
      logger.error('   Numéro reçu:', orderNumber);
      logger.error('   Format attendu: CMD-XXXX (ex: CMD-0001)');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await connection.rollback();
      throw new Error(`BLOCAGE: Format de numéro invalide détecté avant insertion. Attendu: CMD-XXXX (ex: CMD-0001), Reçu: ${orderNumber}`);
    }

    // Créer la commande
    logger.log('💾 Insertion dans MySQL avec order_number:', orderNumber);
    logger.log('✅ Format validé avant insertion: CMD-XXXX');
    
    // Stocker la récompense de fidélité dans la commande (JSON dans notes ou colonne dédiée)
    // On stocke dans notes avec un préfixe spécial pour pouvoir le récupérer
    let orderNotes = notes || '';
    if (loyaltyRewardData) {
      const rewardPrefix = 'LOYALTY_REWARD_DATA:';
      orderNotes = orderNotes ? `${orderNotes}\n${rewardPrefix}${loyaltyRewardData}` : `${rewardPrefix}${loyaltyRewardData}`;
    }
    
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id, order_number, order_type, status, 
        subtotal, discount_amount, tax_amount, total_amount,
        promo_code_id, payment_method, payment_status, notes, table_number
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      // Note: user_id peut être NULL pour les invités
      [
        req.user.isGuest ? null : req.user.id, // NULL pour les invités
        orderNumber, orderType,
        subtotal, discountAmount, taxAmount, totalAmount,
        promoCodeId, finalPaymentMethod, paymentStatus, orderNotes, tableNumber
      ]
    );
    
    // Vérification POST-INSERTION : S'assurer que le numéro inséré est correct
    const [verifyInsert] = await connection.query(
      'SELECT order_number FROM orders WHERE id = ?',
      [orderResult.insertId]
    );
    
    const insertedNumber = verifyInsert.length > 0 ? verifyInsert[0].order_number : null;
    if (insertedNumber && !/^CMD-\d{4}$/.test(insertedNumber)) {
      logger.error('❌❌❌ ERREUR POST-INSERTION: Le numéro inséré ne correspond pas au format!');
      logger.error('   Numéro dans la base:', insertedNumber);
      await connection.rollback();
      throw new Error(`Erreur: Le numéro inséré (${insertedNumber}) ne correspond pas au format CMD-XXXX (ex: CMD-0001)`);
    }
    
    logger.log('✅ Vérification post-insertion réussie:', verifyInsert[0].order_number);

    const orderId = orderResult.insertId;

    // Ajouter les items
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT name, price FROM products WHERE id = ?',
        [item.productId || item.id]
      );

      if (products.length > 0) {
        const product = products[0];
        const itemSubtotal = parseFloat(product.price) * parseInt(item.quantity);

        await connection.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.productId || item.id, product.name, item.quantity, product.price, itemSubtotal]
        );
      }
    }

    // Déduire les points de fidélité immédiatement si une récompense est appliquée
    if (pointsToDeduct > 0 && req.user.id && !req.user.isGuest) {
      // Récupérer les points actuels (peut avoir changé entre temps)
      const [users] = await connection.query(
        'SELECT loyalty_points FROM users WHERE id = ?',
        [req.user.id]
      );
      
      if (users.length > 0) {
        const currentPoints = Math.max(0, users[0].loyalty_points || 0);
        
        // Vérification finale avant déduction
        if (currentPoints >= pointsToDeduct) {
          const newBalance = Math.max(0, currentPoints - pointsToDeduct);
          
          // Déduire les points
          await connection.query(
            'UPDATE users SET loyalty_points = ? WHERE id = ?',
            [newBalance, req.user.id]
          );
          
          // Enregistrer la transaction de déduction
          await connection.query(
            `INSERT INTO loyalty_transactions 
             (user_id, order_id, points, transaction_type, description, balance_after)
             VALUES (?, ?, ?, 'redeemed', ?, ?)`,
            [
              req.user.id,
              orderId,
              -pointsToDeduct,
              `Utilisation récompense: ${loyaltyReward && loyaltyReward.name ? loyaltyReward.name : 'Récompense de fidélité'} (commande ${orderNumber})`,
              newBalance
            ]
          );
          
          logger.log(`✅ Points déduits lors de la création: ${pointsToDeduct} pour l'utilisateur ${req.user.id} (commande ${orderId}). Nouveau solde: ${newBalance}`);
        } else {
          // Si les points ne sont plus suffisants, annuler la transaction
          await connection.rollback();
          throw new Error(`Points insuffisants. Vous avez ${currentPoints} points, ${pointsToDeduct} points requis.`);
        }
      }
    }

    // Si la commande est créée avec payment_status = 'completed' (paiement par carte), ajouter les points
    if (paymentStatus === 'completed' && req.user.id && !req.user.isGuest) {
      // Vérifier si les points ont déjà été ajoutés pour cette commande
      const [existingTransaction] = await connection.query(
        'SELECT id FROM loyalty_transactions WHERE order_id = ? AND transaction_type = ?',
        [orderId, 'earned']
      );

      // Si aucune transaction n'existe, ajouter les points
      if (existingTransaction.length === 0) {
        const pointsToAdd = Math.floor(totalAmount); // Points = total de la commande (arrondi à l'entier inférieur)
        
        if (pointsToAdd > 0) {
          // Récupérer les points actuels
          const [users] = await connection.query(
            'SELECT loyalty_points FROM users WHERE id = ?',
            [req.user.id]
          );

          if (users.length > 0) {
            const currentPoints = Math.max(0, users[0].loyalty_points || 0); // S'assurer que les points actuels ne sont pas négatifs
            const newBalance = Math.max(0, currentPoints + pointsToAdd); // Les points sont toujours ajoutés, jamais soustraits (et toujours positifs)

            // Mettre à jour les points de l'utilisateur
            await connection.query(
              'UPDATE users SET loyalty_points = ? WHERE id = ?',
              [newBalance, req.user.id]
            );

            // Enregistrer la transaction
            await connection.query(
              `INSERT INTO loyalty_transactions 
               (user_id, order_id, points, transaction_type, description, balance_after)
               VALUES (?, ?, ?, 'earned', ?, ?)`,
              [
                req.user.id,
                orderId,
                pointsToAdd,
                `Points gagnés sur commande ${orderNumber} (${totalAmount.toFixed(2)}€)`,
                newBalance
              ]
            );

            logger.log(`✅ Points ajoutés lors de la création: ${pointsToAdd} pour l'utilisateur ${req.user.id} (commande ${orderId}). Nouveau solde: ${newBalance}`);
          }
        }
      }
    }

    await connection.commit();

    // ✅ OPTIMISATION: Invalider le cache des commandes
    cache.invalidateOnModify.orders();

    logger.log('✅✅✅ COMMANDE CRÉÉE AVEC SUCCÈS ! ✅✅✅');
    logger.log('   - Order ID:', orderId);
    logger.log('   - Order Number:', orderNumber);
    logger.log('   - Total Amount:', totalAmount);
    logger.log('   - Payment Status:', paymentStatus);
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Récupérer la commande complète pour l'événement WebSocket
    try {
      const [newOrder] = await connection.query(`
        SELECT 
          o.*,
          COALESCE(u.first_name, '') as first_name, 
          COALESCE(u.last_name, 'Invité') as last_name, 
          COALESCE(u.email, '') as email,
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          ) FROM order_items oi WHERE oi.order_id = o.id) AS items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);
      
      // Émettre l'événement WebSocket pour mise à jour en temps réel
      if (newOrder.length > 0) {
        emitOrderUpdate('order:created', newOrder[0]);
        emitOrderUpdate('orders:refresh', {});
        logger.log('📡 Événement WebSocket émis: order:created');
      }
    } catch (wsError) {
      logger.error('⚠️ Erreur lors de l\'émission WebSocket (non bloquant):', wsError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: {
        id: orderId,
        orderId,
        orderNumber,
        totalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    // ✅ Gestion d'erreurs centralisée : l'erreur sera formatée par errorHandler
    // Les erreurs MySQL seront automatiquement converties en erreurs applicatives
    throw error; // Laisser asyncHandler et errorHandler gérer
  } finally {
    if (connection) {
      connection.release();
    }
  }
})); // ✅ Fermeture: asyncHandler(async (req, res) => { ... })

// ================================================================
// ROUTE: Récupérer le profil utilisateur
// ================================================================
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.log('📊 GET /api/profile - Récupération profil user:', userId);
    
    // Récupérer les données utilisateur
    // ✅ Utiliser SELECT * pour éviter l'erreur si la colonne client_identifier n'existe pas encore
    let [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    // ✅ Générer un identifiant client s'il n'existe pas (pour les anciens clients)
    // Vérifier d'abord si la colonne existe en gérant l'erreur
    if (users.length > 0 && users[0].role === 'client') {
      const hasIdentifier = users[0].client_identifier !== undefined && users[0].client_identifier !== null;
      
      if (!hasIdentifier) {
        try {
          // Générer l'identifiant client pour les clients existants qui n'en ont pas
          const clientIdentifier = await generateUniqueClientIdentifier(pool);
          await pool.query(
            'UPDATE users SET client_identifier = ? WHERE id = ?',
            [clientIdentifier, users[0].id]
          );
          users[0].client_identifier = clientIdentifier;
          logger.log('✅ Identifiant client généré pour un client existant:', clientIdentifier);
        } catch (error) {
          if (error.code === 'ER_BAD_FIELD_ERROR' || error.sqlMessage?.includes('client_identifier')) {
            // La colonne n'existe pas encore, ne rien faire pour l'instant
            logger.warn('⚠️ Colonne client_identifier non disponible. Exécutez la migration SQL: database/migrations/sql/add-client-identifier.sql');
            users[0].client_identifier = null;
          } else if (error.code === 'ER_DUP_ENTRY') {
            // L'identifiant existe déjà (cas rare), récupérer celui existant
            const [existing] = await pool.query(
              'SELECT client_identifier FROM users WHERE id = ?',
              [users[0].id]
            );
            if (existing.length > 0) {
              users[0].client_identifier = existing[0].client_identifier;
              logger.log('✅ Identifiant client récupéré:', existing[0].client_identifier);
            }
          } else {
            logger.error('⚠️ Erreur lors de la génération de l\'identifiant client:', error);
            users[0].client_identifier = null;
          }
        }
      }
    }
    
    if (users.length === 0) {
      logger.warn('⚠️ GET /api/profile - Utilisateur introuvable:', userId);
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      });
    }
    
    const user = users[0];
    
    // S'assurer que loyalty_points est bien un nombre (peut être NULL dans la BDD)
    const loyaltyPoints = Math.max(0, parseInt(user.loyalty_points) || 0);
    
    logger.log('✅ GET /api/profile - Profil récupéré:', {
      id: user.id,
      email: user.email,
      loyalty_points: loyaltyPoints,
      loyalty_points_raw: user.loyalty_points
    });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        client_identifier: user.client_identifier || null, // ✅ Identifiant unique du client
        phone: user.phone,
        role: user.role,
        points: loyaltyPoints,
        loyalty_points: loyaltyPoints,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    logger.error('❌ Erreur récupération profil:', error);
    logger.error('   Message:', error.message);
    logger.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// ================================================================
// ROUTE: Récupérer les statistiques du client
// ================================================================
app.get('/api/profile/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.log('📊 GET /api/profile/stats - Statistiques client:', userId);
    
    // Récupérer les statistiques des commandes du client
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_completed,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
        COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_amount ELSE NULL END), 0) as average_order_value,
        MAX(created_at) as last_order_date
      FROM orders
      WHERE user_id = ?
    `, [userId]);
    
    const statistics = stats[0] || {
      total_orders: 0,
      total_spent: 0,
      total_completed: 0,
      pending_orders: 0,
      completed_orders: 0,
      average_order_value: 0,
      last_order_date: null
    };
    
    // Convertir les valeurs en nombres
    statistics.total_orders = parseInt(statistics.total_orders) || 0;
    statistics.total_spent = parseFloat(statistics.total_spent) || 0;
    statistics.total_completed = parseFloat(statistics.total_completed) || 0;
    statistics.pending_orders = parseInt(statistics.pending_orders) || 0;
    statistics.completed_orders = parseInt(statistics.completed_orders) || 0;
    statistics.average_order_value = parseFloat(statistics.average_order_value) || 0;
    
    logger.log('✅ GET /api/profile/stats - Statistiques récupérées:', statistics);
    
    res.json({
      success: true,
      stats: statistics
    });
  } catch (error) {
    logger.error('❌ Erreur récupération statistiques:', error);
    logger.error('   Message:', error.message);
    logger.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      stats: {
        total_orders: 0,
        total_spent: 0,
        total_completed: 0,
        pending_orders: 0,
        completed_orders: 0,
        average_order_value: 0,
        last_order_date: null
      }
    });
  }
});
// ================================================================
// ROUTE: Mettre à jour le profil utilisateur
// ================================================================
app.put('/api/profile', authenticateToken, csrfProtection, validateProfile, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { first_name, last_name, phone, email } = req.body;
    
    // Logs simplifiés pour éviter la surcharge
    logger.log('📝 PUT /api/profile - User ID:', userId);
    logger.log('   - first_name:', first_name);
    logger.log('   - last_name:', last_name);
    logger.log('   - phone:', phone);
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cet email est déjà utilisé par un autre compte'
        });
      }
    }
    
    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];
    
    // Vérifier et traiter first_name
    if (first_name !== undefined) {
      if (first_name === null || String(first_name).trim().length === 0) {
        logger.log('   ❌ first_name est vide ou null');
        return res.status(400).json({
          success: false,
          error: 'Le prénom est obligatoire et ne peut pas être vide'
        });
      }
      const valueToSet = String(first_name).trim();
      updates.push('first_name = ?');
      values.push(valueToSet);
      logger.log('   ✅ first_name à mettre à jour:', valueToSet);
    }
    
    // Vérifier et traiter last_name
    if (last_name !== undefined) {
      if (last_name === null || String(last_name).trim().length === 0) {
        logger.log('   ❌ last_name est vide ou null');
        return res.status(400).json({
          success: false,
          error: 'Le nom est obligatoire et ne peut pas être vide'
        });
      }
      const valueToSet = String(last_name).trim();
      updates.push('last_name = ?');
      values.push(valueToSet);
      logger.log('   ✅ last_name à mettre à jour:', valueToSet);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null); // Convertir chaîne vide en null pour la BDD
      logger.log('   ✅ phone à mettre à jour:', phone || '(null)');
    } else {
      logger.log('   ⚠️ phone est undefined, ignoré');
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email || null); // Convertir chaîne vide en null pour la BDD
      // ✅ SÉCURITÉ: Ne jamais logger l'email en production
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Updating email', { userId: req.user.id, email: logger.sanitizeEmail(email) });
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        logger.log('   ⚠️ email est undefined, ignoré');
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      logger.log('   📋 Updates à exécuter:', updates);
      logger.log('   📋 Values:', values);
    }
    
    if (updates.length === 0) {
      logger.warn('⚠️ Aucune donnée à mettre à jour');
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à mettre à jour'
      });
    }
    
    // IMPORTANT: userId doit être ajouté en dernier pour correspondre au WHERE id = ?
    values.push(userId);
    
    // ✅ SÉCURITÉ: Ne jamais logger le SQL complet en production
    if (process.env.NODE_ENV === 'development') {
      const sqlQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      logger.log('   🔄 Exécution UPDATE:');
      logger.log('   - SQL:', sqlQuery);
      logger.log('   - Updates:', updates);
      logger.log('   - Values (ordre):', values);
      logger.log('   - Mapping:', updates.map((update, idx) => `${update} = ${JSON.stringify(values[idx])}`).join(', '));
    }
    
    try {
      const [updateResult] = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      logger.log('   ✅ UPDATE exécuté');
      logger.log('   - affectedRows:', updateResult.affectedRows);
      logger.log('   - changedRows:', updateResult.changedRows);
      logger.log('   - warningCount:', updateResult.warningCount);
      
      // Vérifier si la mise à jour a réellement affecté des lignes
      if (updateResult.affectedRows === 0) {
        logger.warn('   ⚠️ Aucune ligne affectée par l\'UPDATE');
        // Ne pas retourner d'erreur, peut-être que les valeurs sont identiques
      }
      
      // Récupérer les données mises à jour IMMÉDIATEMENT après l'UPDATE
      const [users] = await pool.query(
        'SELECT id, email, first_name, last_name, phone, role, loyalty_points, created_at FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        logger.error('   ❌ Utilisateur introuvable après UPDATE');
        return res.status(404).json({
          success: false,
          error: 'Utilisateur introuvable après la mise à jour'
        });
      }
      
      const updatedUser = users[0];
      // ✅ SÉCURITÉ: Ne jamais logger l'email en production
      if (process.env.NODE_ENV === 'development') {
        logger.log('   📊 Données récupérées après UPDATE:');
        logger.log('   - first_name:', updatedUser.first_name);
        logger.log('   - last_name:', updatedUser.last_name);
        logger.log('   - phone:', updatedUser.phone);
        logger.log('   - email:', updatedUser.email);
      }
    } catch (sqlError) {
      // ✅ SÉCURITÉ: Masquer les détails SQL en production
      if (process.env.NODE_ENV === 'development') {
        logger.error('   ❌ Erreur SQL lors de l\'UPDATE:');
        logger.error('   - Code:', sqlError.code);
        logger.error('   - Message:', sqlError.message);
        logger.error('   - SQL State:', sqlError.sqlState);
        logger.error('   - SQL:', sqlError.sql);
      } else {
        logger.error('   ❌ Erreur SQL lors de l\'UPDATE');
        logger.error('   - Code:', sqlError.code);
        // ✅ SÉCURITÉ: Ne jamais logger le SQL complet en production
      }
      throw sqlError; // Re-lancer l'erreur pour qu'elle soit capturée par le catch global
    }
    
    // Récupérer à nouveau les données pour la réponse (au cas où)
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, phone, role, loyalty_points, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      });
    }
    
    const updatedUser = users[0];
    
    logger.log('✅ Profil mis à jour avec succès');
    
    // S'assurer que loyalty_points est bien un nombre
    const loyaltyPoints = Math.max(0, parseInt(updatedUser.loyalty_points) || 0);
    
    const responseUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.email,
      first_name: updatedUser.first_name || '',
      last_name: updatedUser.last_name || '',
      phone: updatedUser.phone || '',
      role: updatedUser.role,
      points: loyaltyPoints,
      loyalty_points: loyaltyPoints,
      createdAt: updatedUser.created_at
    };
    
    logger.log('✅ Profil mis à jour avec succès');
    logger.log('   - User retourné:', responseUser);
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: responseUser
    });
  } catch (error) {
    logger.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// Désactiver le compte du client (suppression logique)
app.post('/api/profile/deactivate', authenticateToken, csrfProtection, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.log('🗑️ POST /api/profile/deactivate - Désactivation compte user:', userId);
    
    // Vérifier que l'utilisateur existe
    const [users] = await pool.query(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      });
    }
    
    const user = users[0];
    
    // Empêcher la désactivation des comptes admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Les comptes administrateur ne peuvent pas être désactivés via cette interface'
      });
    }
    
    // Désactiver le compte (mettre is_active = 0)
    await pool.query(
      'UPDATE users SET is_active = 0 WHERE id = ?',
      [userId]
    );
    
    logger.log('✅ Compte désactivé avec succès:', userId);
    
    res.json({
      success: true,
      message: 'Votre compte a été désactivé avec succès'
    });
  } catch (error) {
    logger.error('❌ Erreur désactivation compte:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la désactivation du compte'
    });
  }
}));

// Déduire des points de fidélité
app.post('/api/loyalty/deduct', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { points, description } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de points invalide'
      });
    }
    
    // Récupérer les points actuels
    const [users] = await pool.query(
      'SELECT loyalty_points FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      });
    }
    
    const currentPoints = Math.max(0, users[0].loyalty_points || 0); // S'assurer que les points actuels ne sont pas négatifs
    
    // Vérification que l'utilisateur a assez de points
    if (currentPoints < points) {
      return res.status(400).json({
        success: false,
        error: `Points insuffisants. Vous avez ${currentPoints} points, ${points} points requis.`
      });
    }
    
    // Calculer le nouveau solde (les points ne peuvent jamais être négatifs)
    const newBalance = Math.max(0, currentPoints - points);
    
    // Vérification supplémentaire : s'assurer que le nouveau solde n'est pas négatif
    if (newBalance < 0) {
      logger.warn(`⚠️ Tentative de déduction qui rendrait le solde négatif. Points actuels: ${currentPoints}, Points à déduire: ${points}`);
      return res.status(400).json({
        success: false,
        error: 'Impossible de déduire les points : le solde serait négatif'
      });
    }
    
    // Mettre à jour les points (le trigger dans la base de données garantit que loyalty_points >= 0)
    await pool.query(
      'UPDATE users SET loyalty_points = ? WHERE id = ?',
      [newBalance, userId]
    );
    
    // Vérification post-update pour s'assurer que les points ne sont pas négatifs
    const [verifyUpdate] = await pool.query(
      'SELECT loyalty_points FROM users WHERE id = ?',
      [userId]
    );
    
    if (verifyUpdate.length > 0 && verifyUpdate[0].loyalty_points < 0) {
      logger.error(`❌ ERREUR CRITIQUE: Les points sont négatifs après la mise à jour! User ID: ${userId}, Points: ${verifyUpdate[0].loyalty_points}`);
      // Corriger immédiatement
      await pool.query(
        'UPDATE users SET loyalty_points = 0 WHERE id = ?',
        [userId]
      );
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la déduction des points. Veuillez réessayer.'
      });
    }
    
    // Utiliser le solde vérifié pour la transaction
    const finalBalance = Math.max(0, verifyUpdate[0].loyalty_points || 0);
    
    // Enregistrer la transaction (utiliser le solde vérifié)
    await pool.query(
      `INSERT INTO loyalty_transactions 
       (user_id, order_id, points, transaction_type, description, balance_after)
       VALUES (?, NULL, ?, 'redeemed', ?, ?)`,
      [userId, -points, description || `Déduction de ${points} points`, finalBalance]
    );
    
    logger.log(`✅ Points déduits: ${points} pour l'utilisateur ${userId}. Nouveau solde: ${finalBalance}`);
    
    res.json({
      success: true,
      message: 'Points déduits avec succès',
      newBalance: finalBalance,
      pointsDeducted: points
    });
  } catch (error) {
    logger.error('❌ Erreur déduction points:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la déduction des points'
    });
  }
});

// Restaurer des points de fidélité (annulation d'une récompense)
app.post('/api/loyalty/restore', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { points, description } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de points invalide'
      });
    }
    
    // Récupérer les points actuels
    const [users] = await pool.query(
      'SELECT loyalty_points FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      });
    }
    
    const currentPoints = Math.max(0, users[0].loyalty_points || 0);
    const newBalance = Math.max(0, currentPoints + points); // Restaurer les points
    
    // Mettre à jour les points
    await pool.query(
      'UPDATE users SET loyalty_points = ? WHERE id = ?',
      [newBalance, userId]
    );
    
    // Enregistrer la transaction
    await pool.query(
      `INSERT INTO loyalty_transactions 
       (user_id, order_id, points, transaction_type, description, balance_after)
       VALUES (?, NULL, ?, 'restored', ?, ?)`,
      [userId, points, description || `Restauration de ${points} points (annulation récompense)`, newBalance]
    );
    
    logger.log(`✅ Points restaurés: ${points} pour l'utilisateur ${userId}. Nouveau solde: ${newBalance}`);
    
    res.json({
      success: true,
      message: 'Points restaurés avec succès',
      newBalance: newBalance,
      pointsRestored: points
    });
  } catch (error) {
    logger.error('❌ Erreur restauration points:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la restauration des points'
    });
  }
});

// Récupérer les commandes de l'utilisateur connecté
app.get('/api/orders', devBypass(authenticateToken), async (req, res) => {
  try {
    // ✅ SÉCURITÉ: Logs minimaux en production
    if (process.env.NODE_ENV === 'development') {
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('📋 GET /api/orders - Récupération commandes');
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('👤 User ID:', req.user.id);
      // ✅ SÉCURITÉ: Ne jamais logger l'email en production
      logger.log('👤 User Email:', req.user.email);
      logger.log('👤 User Role:', req.user.role);
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      logger.log('📋 GET /api/orders - User ID:', req.user.id, 'Role:', req.user.role);
    }
    
    const userId = parseInt(req.user.id);
    if (isNaN(userId)) {
      logger.error('❌ ERREUR: user.id n\'est pas un nombre valide:', req.user.id);
      return res.status(400).json({ error: 'Identifiant utilisateur invalide' });
    }
    
    const [orders] = await pool.query(
      `SELECT o.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    // Nettoyer les items (convertir JSON string en array si nécessaire)
    const cleanedOrders = orders.map(order => {
      let items = order.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          logger.warn(`⚠️ Erreur parsing items pour commande ${order.id}:`, e);
          items = [];
        }
      }
      if (!Array.isArray(items)) {
        items = [];
      }
      return {
        ...order,
        items: items
      };
    });

    logger.log('✅ Commandes trouvées:', cleanedOrders.length);
    if (cleanedOrders.length > 0) {
      logger.log('   - Exemples:');
      cleanedOrders.slice(0, 3).forEach((order, idx) => {
        logger.log(`     ${idx + 1}. ${order.order_number} - ${order.total_amount}€ - ${order.status}`);
      });
    }
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({ success: true, data: cleanedOrders });
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ Erreur GET /api/orders');
    logger.error('   Message:', error.message);
    logger.error('   Stack:', error.stack);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES UTILISATEURS
// ================================================================

// Liste tous les utilisateurs
// ✅ SÉCURITÉ: Pagination implémentée
app.get('/api/admin/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePaginationParams(req);
  
  // Compter le total d'utilisateurs
  const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');
  const total = countResult[0].total;
  
  // Récupérer les utilisateurs avec leurs statistiques (paginés)
  const [users] = await pool.query(`
    SELECT 
      u.id, 
      u.email, 
      u.first_name, 
      u.last_name, 
      u.phone, 
      u.role, 
      u.loyalty_points, 
      u.is_active, 
      u.email_verified, 
      u.created_at, 
      u.last_login,
      COUNT(DISTINCT o.id) as total_orders,
      COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE 0 END), 0) as total_spent,
      MAX(o.created_at) as last_order_date
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  const pagination = getPaginationMetadata(total, page, limit);
  logger.debug('Users fetched', { page, limit, total, fetched: users.length });
  
  res.json(formatPaginatedResponse(users, pagination));
}));

// Créer un utilisateur
app.post('/api/admin/users', authenticateToken, requireAdmin, csrfProtection, validateUserCreate, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, loyaltyPoints } = req.body;

    // Vérifier si l'email existe
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, loyalty_points) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, phone, role || 'client', loyaltyPoints || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé',
      userId: result.insertId
    });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un utilisateur
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, csrfProtection, validateId, validateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName, phone, role, loyaltyPoints, isActive } = req.body;

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET 
          email = ?,
          password_hash = ?,
          first_name = ?,
          last_name = ?,
          phone = ?,
          role = ?,
          loyalty_points = ?,
          is_active = ?
         WHERE id = ?`,
        [email, passwordHash, firstName, lastName, phone, role, loyaltyPoints, isActive, id]
      );
    } else {
      // Pas de changement de mot de passe
      await pool.query(
        `UPDATE users SET 
          email = ?,
          first_name = ?,
          last_name = ?,
          phone = ?,
          role = ?,
          loyalty_points = ?,
          is_active = ?
         WHERE id = ?`,
        [email, firstName, lastName, phone, role, loyaltyPoints, isActive, id]
      );
    }

    res.json({ success: true, message: 'Utilisateur modifié' });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, csrfProtection, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Ne pas permettre de se supprimer soi-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les commandes d'un utilisateur (même méthode que /api/admin/users)
app.get('/api/admin/users/:id/orders', authenticateToken, requireAdmin, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    logger.log('🔵 Requête GET /api/admin/users/:id/orders - ID:', id);
    
    // Requête SQL simple et directe (comme pour /api/admin/users)
    const [orders] = await pool.query(
      `SELECT o.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal,
            'special_instructions', oi.special_instructions
          )
        ) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [id]
    );
    
    // Nettoyer les items (convertir JSON string en array si nécessaire)
    const ordersWithItems = orders.map(order => {
      let items = [];
      if (order.items) {
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) {
          logger.error('Erreur parsing items pour commande', order.id, ':', e);
          items = [];
        }
      }
      return {
        ...order,
        items: items || []
      };
    });

    logger.log(`✅ ${ordersWithItems.length} commandes trouvées pour l'utilisateur ${id}`);
    
    // Même format de réponse que /api/admin/users
    res.json({ success: true, data: ordersWithItems });
  } catch (error) {
    logger.error('❌ Erreur dans /api/admin/users/:id/orders:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Obtenir les détails d'un utilisateur avec son historique complet
app.get('/api/admin/users/:id/details', authenticateToken, requireAdmin, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ SÉCURITÉ: Logs minimaux en production
    if (process.env.NODE_ENV === 'development') {
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('🔵 Requête GET /api/admin/users/:id/details');
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.log('📋 ID utilisateur:', id);
      // ✅ SÉCURITÉ: Ne jamais logger l'email en production
      logger.log('👤 Utilisateur authentifié:', req.user?.email || req.user?.id);
    } else {
      logger.log('🔵 GET /api/admin/users/:id/details - ID:', id, 'Admin ID:', req.user?.id);
    }

    // Vérifier que l'ID est valide
    if (!id || isNaN(parseInt(id))) {
      logger.error('❌ ID utilisateur invalide:', id);
      return res.status(400).json({ 
        success: false, 
        error: 'ID utilisateur invalide' 
      });
    }

    // Informations de base de l'utilisateur (utiliser pool.query directement comme les autres endpoints)
    logger.log('📊 Récupération des informations utilisateur...');
    const [users] = await pool.query(`
      SELECT id, email, first_name, last_name, phone, role, 
             loyalty_points, is_active, email_verified, 
             created_at, last_login
      FROM users 
      WHERE id = ?
    `, [id]);

    if (users.length === 0) {
      logger.log('❌ Utilisateur non trouvé:', id);
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    const user = users[0];
    // ✅ SÉCURITÉ: Ne jamais logger l'email en production
    if (process.env.NODE_ENV === 'development') {
      logger.log('✅ Utilisateur trouvé:', user.email, `(ID: ${user.id})`);
    } else {
      logger.log('✅ Utilisateur trouvé - ID:', user.id);
    }

    // Historique des commandes avec leurs items (une seule requête optimisée)
    logger.log('📦 Récupération des commandes avec leurs items...');
    let ordersWithItems = [];
    try {
      // Requête optimisée : récupère les commandes ET leurs items en une seule fois
      // Utilise JSON_ARRAYAGG pour regrouper les items par commande
      const [ordersResult] = await pool.query(`
        SELECT 
          o.id, 
          o.order_number, 
          o.order_type,
          o.status, 
          o.subtotal,
          o.discount_amount,
          o.tax_amount,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.notes,
          o.table_number,
          o.delivery_address,
          o.estimated_ready_time,
          o.completed_at,
          o.created_at,
          o.updated_at,
          COALESCE(
            (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'product_name', oi.product_name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'subtotal', oi.subtotal,
                  'special_instructions', oi.special_instructions
                )
              )
              FROM order_items oi
              WHERE oi.order_id = o.id
              ORDER BY oi.id ASC
            ),
            JSON_ARRAY()
          ) AS items
        FROM orders o
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        LIMIT 100
      `, [id]);
      
      // Nettoyer les items (convertir JSON string en array si nécessaire)
      ordersWithItems = ordersResult.map(order => {
        let items = [];
        if (order.items) {
          try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          } catch (e) {
            logger.error(`❌ Erreur parsing items pour commande ${order.id}:`, e.message);
            items = [];
          }
        }
        return {
          ...order,
          items: items || []
        };
      });
      
      logger.log(`✅ ${ordersWithItems.length} commande(s) trouvée(s) pour l'utilisateur ${id}`);
      logger.log(`✅ Total items récupérés: ${ordersWithItems.reduce((sum, o) => sum + (o.items?.length || 0), 0)}`);
    } catch (ordersError) {
      // ✅ SÉCURITÉ: Masquer les détails SQL en production
      if (process.env.NODE_ENV === 'development') {
        logger.error('❌ Erreur lors de la récupération des commandes:');
        logger.error('   Message:', ordersError.message);
        logger.error('   Code:', ordersError.code);
        logger.error('   SQL State:', ordersError.sqlState);
        logger.error('   Stack:', ordersError.stack);
      } else {
        logger.error('❌ Erreur lors de la récupération des commandes');
        logger.error('   Code:', ordersError.code);
      }
      ordersWithItems = [];
    }

    // Historique de fidélité
    logger.log('🎁 Récupération de l\'historique de fidélité...');
    let loyaltyHistory = [];
    try {
      const [loyaltyResult] = await pool.query(`
        SELECT 
          transaction_type, 
          points as points_change,
          description, 
          balance_after,
          created_at
        FROM loyalty_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `, [id]);
      loyaltyHistory = loyaltyResult || [];
      logger.log(`✅ ${loyaltyHistory.length} transaction(s) de fidélité trouvée(s)`);
    } catch (loyaltyError) {
      // ✅ SÉCURITÉ: Masquer les détails SQL en production
      if (process.env.NODE_ENV === 'development') {
        logger.error('❌ Erreur historique fidélité:');
        logger.error('   Message:', loyaltyError.message);
        logger.error('   Code:', loyaltyError.code);
        logger.error('   SQL State:', loyaltyError.sqlState);
      } else {
        logger.error('❌ Erreur historique fidélité');
        logger.error('   Code:', loyaltyError.code);
      }
      loyaltyHistory = [];
    }

    // Statistiques
    logger.log('📈 Calcul des statistiques...');
    let statsData = {
      total_orders: 0,
      total_spent: 0,
      average_order: 0,
      last_order_date: null
    };
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE 0 END), 0) as total_spent,
          COALESCE(AVG(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE NULL END), 0) as average_order,
          MAX(o.created_at) as last_order_date
        FROM orders o
        WHERE o.user_id = ?
      `, [id]);
      
      if (stats && stats.length > 0) {
        statsData = {
          total_orders: parseInt(stats[0].total_orders) || 0,
          total_spent: parseFloat(stats[0].total_spent) || 0,
          average_order: parseFloat(stats[0].average_order) || 0,
          last_order_date: stats[0].last_order_date || null
        };
      }
      logger.log('✅ Statistiques calculées:', JSON.stringify(statsData, null, 2));
    } catch (statsError) {
      // ✅ SÉCURITÉ: Masquer les détails SQL en production
      if (process.env.NODE_ENV === 'development') {
        logger.error('❌ Erreur statistiques:');
        logger.error('   Message:', statsError.message);
        logger.error('   Code:', statsError.code);
        logger.error('   SQL State:', statsError.sqlState);
      } else {
        logger.error('❌ Erreur statistiques');
        logger.error('   Code:', statsError.code);
      }
    }

    // Structure de réponse
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        loyalty_points: parseInt(user.loyalty_points) || 0,
        is_active: user.is_active,
        email_verified: user.email_verified,
        created_at: user.created_at,
        last_login: user.last_login
      },
      orders: ordersWithItems,
      loyaltyHistory: loyaltyHistory,
      stats: statsData
    };

    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('✅ Données préparées avec succès:');
    logger.log('   Utilisateur:', responseData.user.email);
    logger.log('   Commandes:', responseData.orders.length);
    logger.log('   Transactions fidélité:', responseData.loyaltyHistory.length);
    logger.log('   Statistiques:', JSON.stringify(responseData.stats, null, 2));
    
    // Vérifier les premières commandes
    if (responseData.orders.length > 0) {
      logger.log('\n📋 Exemple de commande (première):');
      const firstOrder = responseData.orders[0];
      logger.log('   ID:', firstOrder.id);
      logger.log('   Numéro:', firstOrder.order_number);
      logger.log('   Montant:', firstOrder.total_amount);
      logger.log('   Items:', firstOrder.items?.length || 0);
      if (firstOrder.items && firstOrder.items.length > 0) {
        logger.log('   Premier item:', JSON.stringify(firstOrder.items[0], null, 2));
      }
    } else {
      logger.log('\n⚠️ AUCUNE COMMANDE TROUVÉE pour cet utilisateur !');
      logger.log('   Vérifiez que user_id dans orders correspond bien à l\'ID utilisateur');
    }
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Retourner la réponse
    logger.log('📤 Envoi de la réponse au client...');
    const jsonResponse = { 
      success: true, 
      data: responseData 
    };
    logger.log('📦 Taille de la réponse:', JSON.stringify(jsonResponse).length, 'caractères');
    res.json(jsonResponse);
    logger.log('✅ Réponse envoyée avec succès');
  } catch (error) {
    // ✅ SÉCURITÉ: Masquer les détails SQL en production
    if (process.env.NODE_ENV === 'development') {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ ERREUR dans /api/admin/users/:id/details');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('Message:', error.message);
      logger.error('Code:', error.code);
      logger.error('SQL State:', error.sqlState);
      logger.error('Stack:', error.stack);
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      logger.error('❌ ERREUR dans /api/admin/users/:id/details');
      logger.error('Code:', error.code);
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur',
      // Ne pas exposer les détails en production
      ...(process.env.NODE_ENV === 'development' && {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      })
    });
  }
});

// Ajuster manuellement les points de fidélité
app.post('/api/admin/users/:id/adjust-points', authenticateToken, requireAdmin, csrfProtection, validateId, validatePointsAdjustment, async (req, res) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;

    if (!points || points === 0) {
      return res.status(400).json({ error: 'Le montant de points doit être différent de 0' });
    }

    // Récupérer les points actuels
    const [users] = await pool.query('SELECT loyalty_points FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const currentPoints = users[0].loyalty_points;
    const newPoints = Math.max(0, currentPoints + points);

    // Mettre à jour les points
    await pool.query('UPDATE users SET loyalty_points = ? WHERE id = ?', [newPoints, id]);

    // Enregistrer la transaction
    await pool.query(
      `INSERT INTO loyalty_transactions 
       (user_id, order_id, transaction_type, points_change, description) 
       VALUES (?, NULL, ?, ?, ?)`,
      [id, points > 0 ? 'manual_add' : 'manual_deduct', points, reason || 'Ajustement manuel par admin']
    );

    res.json({
      success: true,
      message: 'Points ajustés avec succès',
      newPoints
    });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES CATÉGORIES
// ================================================================

// Liste toutes les catégories
app.get('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY display_order');
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une catégorie
// ✅ OPTIMISATION: Invalidation du cache lors de la création
app.post('/api/admin/categories', authenticateToken, requireAdmin, csrfProtection, validateCategory, asyncHandler(async (req, res) => {
  const { name, slug, description, icon, displayOrder } = req.body;

  const [result] = await pool.query(
    `INSERT INTO categories (name, slug, description, icon, display_order) 
     VALUES (?, ?, ?, ?, ?)`,
    [name, slug, description, icon, displayOrder || 0]
  );

  // Invalider le cache des catégories et produits
  cache.invalidateOnModify.categories();

  res.status(201).json({
    success: true,
    message: 'Catégorie créée',
    categoryId: result.insertId
  });
}));

// ✅ OPTIMISATION: Modifier une catégorie - Invalidation du cache
app.put('/api/admin/categories/:id', authenticateToken, requireAdmin, csrfProtection, validateId, validateCategory, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, icon, displayOrder, isActive } = req.body;

  await pool.query(
    `UPDATE categories SET 
      name = ?,
      slug = ?,
      description = ?,
      icon = ?,
      display_order = ?,
      is_active = ?
     WHERE id = ?`,
    [name, slug, description, icon, displayOrder, isActive, id]
  );

  // Invalider le cache des catégories et produits
  cache.invalidateOnModify.categories();

  res.json({ success: true, message: 'Catégorie modifiée' });
}));

// ✅ OPTIMISATION: Supprimer une catégorie - Invalidation du cache
app.delete('/api/admin/categories/:id', authenticateToken, requireAdmin, csrfProtection, validateId, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Vérifier si des produits utilisent cette catégorie
  const [products] = await pool.query(
    'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
    [id]
  );

  if (products[0].count > 0) {
    return res.status(400).json({
      error: `Impossible de supprimer. ${products[0].count} produit(s) utilisent cette catégorie.`
    });
  }

  await pool.query('DELETE FROM categories WHERE id = ?', [id]);

  // Invalider le cache des catégories et produits
  cache.invalidateOnModify.categories();

  res.json({ success: true, message: 'Catégorie supprimée' });
}));

// ================================================================
// ADMIN - GESTION DES PRODUITS
// ================================================================

// Liste tous les produits
// ✅ SÉCURITÉ: Pagination implémentée
app.get('/api/admin/products', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePaginationParams(req);
  
  // Compter le total de produits
  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM products WHERE deleted_at IS NULL'
  );
  const total = countResult[0].total;
  
  // Récupérer les produits (paginés)
  const [products] = await pool.query(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  const pagination = getPaginationMetadata(total, page, limit);
  logger.debug('Products fetched', { page, limit, total, fetched: products.length });
  
  res.json(formatPaginatedResponse(products, pagination));
}));

// Créer un produit
// ✅ OPTIMISATION: Invalidation du cache lors de la création
app.post('/api/admin/products', authenticateToken, requireAdmin, csrfProtection, validateProductCreate, asyncHandler(async (req, res) => {
  const {
    categoryId, name, slug, description, price, imageUrl,
    stock, isAvailable, isFeatured, calories, preparationTime, allergens
  } = req.body;

  // Convertir allergens en JSON si c'est un array, sinon utiliser une chaîne vide
  const allergensJson = Array.isArray(allergens) ? JSON.stringify(allergens) : (allergens || '');
  
  const [result] = await pool.query(
    `INSERT INTO products (
      category_id, name, slug, description, price, image_url,
      stock, is_available, is_featured, calories, preparation_time, allergens
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [categoryId, name, slug, description, price, imageUrl, stock, isAvailable, isFeatured, calories, preparationTime, allergensJson]
  );

  // Invalider le cache des produits
  cache.invalidateOnModify.products();

  res.status(201).json({
    success: true,
    message: 'Produit créé',
    productId: result.insertId
  });
}));

// Modifier un produit
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, csrfProtection, validateId, validateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoryId, name, slug, description, price, imageUrl,
      stock, isAvailable, isFeatured, calories, preparationTime, allergens
    } = req.body;

    logger.log('📝 Modification produit ID:', id);
    logger.log('   Données reçues:', { categoryId, name, price, stock, isAvailable, isFeatured });

    // Convertir allergens en JSON si c'est un array
    const allergensJson = Array.isArray(allergens) ? JSON.stringify(allergens) : allergens;

    // Convertir les booléens explicitement
    const isAvailableValue = isAvailable ? 1 : 0;
    const isFeaturedValue = isFeatured ? 1 : 0;

    const params = [
      categoryId, 
      name, 
      slug, 
      description, 
      price, 
      imageUrl, 
      stock, 
      isAvailableValue, 
      isFeaturedValue, 
      calories, 
      preparationTime, 
      allergensJson, 
      id
    ];

    logger.log('   Paramètres SQL:', params);

    const [result] = await pool.query(
      `UPDATE products SET 
        category_id = ?,
        name = ?,
        slug = ?,
        description = ?,
        price = ?,
        image_url = ?,
        stock = ?,
        is_available = ?,
        is_featured = ?,
        calories = ?,
        preparation_time = ?,
        allergens = ?
       WHERE id = ?`,
      params
    );

    // Invalider le cache des produits
    cache.invalidateOnModify.products();

    res.json({ success: true, message: 'Produit modifié', affectedRows: result.affectedRows });
  } catch (error) {
    logger.error('❌ Erreur modification produit:', error.message);
    logger.error('   Stack:', error.stack);
    // ✅ SÉCURITÉ: Masquer les détails d'erreur en production
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      error: 'Erreur serveur',
      ...(isProd ? {} : { details: error.message })
    });
  }
});

// Toggle disponibilité produit (Admin ET Manager)
// ✅ OPTIMISATION: Toggle produit - Invalidation du cache
app.put('/api/admin/products/:id/toggle', authenticateToken, requireManager, csrfProtection, validateId, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Récupérer l'état actuel
  const [products] = await pool.query('SELECT is_available FROM products WHERE id = ?', [id]);
  
  if (products.length === 0) {
    return res.status(404).json({ error: 'Produit non trouvé' });
  }
  
  const currentStatus = products[0].is_available;
  const newStatus = currentStatus ? 0 : 1;
  
  // Mettre à jour
  await pool.query('UPDATE products SET is_available = ? WHERE id = ?', [newStatus, id]);
  
  // Invalider le cache des produits
  cache.invalidateOnModify.products();
  
  res.json({ 
    success: true, 
    message: newStatus ? 'Produit activé' : 'Produit désactivé',
    is_available: newStatus
  });
}));

// ✅ OPTIMISATION: Supprimer un produit - Invalidation du cache
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, csrfProtection, validateId, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Soft delete au lieu de suppression physique
  await pool.query('UPDATE products SET deleted_at = NOW() WHERE id = ?', [id]);
  
  // Invalider le cache des produits
  cache.invalidateOnModify.products();
  
  res.json({ success: true, message: 'Produit supprimé' });
}));

// ================================================================
// ADMIN - GESTION DES CODES PROMO
// ================================================================

// Liste tous les codes promo
app.get('/api/admin/promo-codes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [codes] = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json({ success: true, data: codes });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un code promo
app.post('/api/admin/promo-codes', authenticateToken, requireAdmin, csrfProtection, validatePromoCode, async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxUses, validFrom, validUntil
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO promo_codes (
        code, description, discount_type, discount_value,
        min_order_amount, max_uses, valid_from, valid_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, description, discountType, discountValue, minOrderAmount, maxUses, validFrom, validUntil]
    );

    res.status(201).json({
      success: true,
      message: 'Code promo créé',
      promoCodeId: result.insertId
    });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un code promo
app.put('/api/admin/promo-codes/:id', authenticateToken, requireAdmin, csrfProtection, validateId, validatePromoCode, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxUses, validFrom, validUntil, isActive
    } = req.body;

    await pool.query(
      `UPDATE promo_codes SET 
        code = ?,
        description = ?,
        discount_type = ?,
        discount_value = ?,
        min_order_amount = ?,
        max_uses = ?,
        valid_from = ?,
        valid_until = ?,
        is_active = ?
       WHERE id = ?`,
      [code, description, discountType, discountValue, minOrderAmount, maxUses, validFrom, validUntil, isActive, id]
    );

    res.json({ success: true, message: 'Code promo modifié' });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un code promo
app.delete('/api/admin/promo-codes/:id', authenticateToken, requireAdmin, csrfProtection, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM promo_codes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Code promo supprimé' });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES RÉCOMPENSES DE FIDÉLITÉ
// ================================================================

// Liste toutes les récompenses de fidélité
app.get('/api/admin/loyalty-rewards', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rewards] = await pool.query(
      'SELECT * FROM loyalty_rewards ORDER BY sort_order ASC, points_required ASC'
    );
    res.json({ success: true, data: rewards });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route publique pour récupérer les récompenses actives (pour les clients)
app.get('/api/loyalty-rewards', async (req, res) => {
  try {
    const [rewards] = await pool.query(
      'SELECT id, name, description, points_required, reward_type, discount_value, product_id, icon, sort_order FROM loyalty_rewards WHERE is_active = TRUE ORDER BY sort_order ASC, points_required ASC'
    );
    res.json({ success: true, data: rewards });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une récompense de fidélité
app.post('/api/admin/loyalty-rewards', authenticateToken, requireAdmin, csrfProtection, validateLoyaltyReward, async (req, res) => {
  try {
    const {
      name, description, pointsRequired, rewardType,
      discountValue, productId, isActive, sortOrder, icon
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO loyalty_rewards (
        name, description, points_required, reward_type,
        discount_value, product_id, is_active, sort_order, icon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, pointsRequired || 0, rewardType || 'percentage', 
       discountValue || 0, productId || null, isActive !== false, sortOrder || 0, icon || '🎁']
    );

    res.status(201).json({
      success: true,
      message: 'Récompense créée',
      rewardId: result.insertId
    });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une récompense de fidélité
app.put('/api/admin/loyalty-rewards/:id', authenticateToken, requireAdmin, csrfProtection, validateId, validateLoyaltyReward, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, pointsRequired, rewardType,
      discountValue, productId, isActive, sortOrder, icon
    } = req.body;

    await pool.query(
      `UPDATE loyalty_rewards SET 
        name = ?,
        description = ?,
        points_required = ?,
        reward_type = ?,
        discount_value = ?,
        product_id = ?,
        is_active = ?,
        sort_order = ?,
        icon = ?
       WHERE id = ?`,
      [name, description, pointsRequired || 0, rewardType || 'percentage',
       discountValue || 0, productId || null, isActive !== false, sortOrder || 0, icon || '🎁', id]
    );

    res.json({ success: true, message: 'Récompense modifiée' });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une récompense de fidélité
app.delete('/api/admin/loyalty-rewards/:id', authenticateToken, requireAdmin, csrfProtection, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM loyalty_rewards WHERE id = ?', [id]);
    res.json({ success: true, message: 'Récompense supprimée' });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES COMMANDES
// ================================================================

// Vérification connexion DB et comptages basiques
app.get('/api/health/db', async (req, res) => {
  try {
    logger.log('🔌 GET /api/health/db - Vérification connexion Supabase et comptages');
    // ✅ MIGRATION SUPABASE: Test de connexion et comptages
    const [ping] = await supabaseService.ping();
    const [ordersCountRow] = await supabaseService.count('orders');
    const [itemsCountRow] = await supabaseService.count('order_items');
    const [usersCountRow] = await supabaseService.count('users');
    res.json({
      success: true,
      db: true,
      ok: ping?.[0]?.ok === 1,
      counts: {
        orders: Number(ordersCountRow?.count || 0),
        order_items: Number(itemsCountRow?.count || 0),
        users: Number(usersCountRow?.count || 0),
      }
    });
  } catch (error) {
    logger.error('❌ /api/health/db - Erreur:', error.message);
    // ✅ SÉCURITÉ: Masquer les détails d'erreur en production
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      success: false, 
      error: isProd ? 'Erreur de base de données' : error.message 
    });
  }
});
// Endpoint léger: résumé des dernières commandes (sans agrégations lourdes)
app.get('/api/admin/orders/summary', devBypass(authenticateToken), devBypass(requireManager), async (req, res) => {
  try {
    logger.log('📦 GET /api/admin/orders/summary - Début');
    const [rows] = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.created_at,
        o.order_type,
        COALESCE(u.first_name, '') as first_name,
        COALESCE(u.last_name, '') as last_name,
        COALESCE(u.email, '') as email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `);
    logger.log('✅ /summary - Nombre de lignes:', rows.length);
    res.json({ success: true, data: rows || [] });
  } catch (error) {
    logger.error('❌ GET /api/admin/orders/summary - Erreur:', error.message);
    res.status(500).json({ success: false, error: 'Erreur serveur (summary)' });
  }
});

// ✅ SÉCURITÉ: Endpoint de diagnostic supprimé pour éviter l'exposition de données sensibles
// Si un endpoint de diagnostic est nécessaire, utiliser l'endpoint authentifié /api/admin/orders

// ✅ SÉCURITÉ: Pagination implémentée
// Liste toutes les commandes
app.get('/api/admin/orders', devBypass(authenticateToken), devBypass(requireManager), asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePaginationParams(req);
  
  logger.request(req, 'GET /api/admin/orders');
  
  // Compter le total de commandes
  const [countResult] = await pool.query('SELECT COUNT(*) as total FROM orders');
  const total = countResult[0].total;
  
  // ✅ CORRECTION: Requête simplifiée et robuste avec pagination
  // Utilisation de sous-requêtes pour éviter les problèmes avec GROUP BY
  const [orders] = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.order_type,
        o.status,
        o.subtotal,
        o.discount_amount,
        o.tax_amount,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.notes,
        o.table_number,
        o.delivery_address,
        o.estimated_ready_time,
        o.completed_at,
        o.created_at,
        o.updated_at,
        o.user_id,
        COALESCE(u.first_name, '') as first_name, 
        COALESCE(u.last_name, 'Invité') as last_name, 
        COALESCE(u.email, '') as email,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', op.id,
                'method', op.method,
                'amount', op.amount,
                'reference', op.reference,
                'created_at', op.created_at
              )
            )
            FROM order_payments op
            WHERE op.order_id = o.id
          ),
          JSON_ARRAY()
        ) AS payments,
        (SELECT COUNT(*) FROM order_items oi2 WHERE oi2.order_id = o.id) as items_count,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', COALESCE(oi.product_name, ''),
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'subtotal', oi.subtotal,
                'image_url', COALESCE(p.image_url, ''),
                'category_name', COALESCE(c.name, ''),
                'category_type', CASE 
                  WHEN LOWER(COALESCE(c.name, '')) LIKE '%entrée%' OR LOWER(COALESCE(c.name, '')) LIKE '%entree%' OR LOWER(COALESCE(c.name, '')) LIKE '%starter%' THEN 'entree'
                  WHEN LOWER(COALESCE(c.name, '')) LIKE '%dessert%' OR LOWER(COALESCE(c.name, '')) LIKE '%sweet%' THEN 'dessert'
                  ELSE 'plat'
                END
              )
            )
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE oi.order_id = o.id
          ),
          JSON_ARRAY()
        ) AS items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // ✅ CORRECTION: Nettoyer les items pour s'assurer qu'ils sont toujours des tableaux
    const cleanedOrders = orders.map(order => {
      let items = [];
      
      // Nettoyer les items (convertir JSON string en array si nécessaire)
      if (order.items) {
        try {
          if (typeof order.items === 'string') {
            items = JSON.parse(order.items);
          } else if (Array.isArray(order.items)) {
            items = order.items;
          } else if (order.items === null || order.items === undefined) {
            items = [];
          } else {
            // Si c'est un objet JSON déjà parsé
            items = [order.items];
          }
        } catch (e) {
          logger.error(`⚠️ Erreur parsing items pour commande ${order.id}:`, e.message);
          items = [];
        }
      }
      
      // S'assurer que items est toujours un tableau
      if (!Array.isArray(items)) {
        items = [];
      }
      
      // Nettoyer les payments de la même manière
      let payments = [];
      if (order.payments) {
        try {
          if (typeof order.payments === 'string') {
            payments = JSON.parse(order.payments);
          } else if (Array.isArray(order.payments)) {
            payments = order.payments;
          } else if (order.payments === null || order.payments === undefined) {
            payments = [];
          }
        } catch (e) {
          logger.error(`⚠️ Erreur parsing payments pour commande ${order.id}:`, e.message);
          payments = [];
        }
      }
      
      if (!Array.isArray(payments)) {
        payments = [];
      }
      
      return {
        ...order,
        items: items,
        payments: payments
      };
    });
    
    const pagination = getPaginationMetadata(total, page, limit);
    logger.debug('Orders fetched', { page, limit, total, fetched: cleanedOrders.length });
    
    res.json(formatPaginatedResponse(cleanedOrders, pagination));
}));

// Variante simplifiée (DEV): sans agrégations JSON pour écarter un souci SQL/mode
if (!isProd) {
  app.get('/api/admin/orders/raw-lite', devBypass(authenticateToken), devBypass(requireManager), async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          o.id, o.order_number, o.status, o.total_amount, o.created_at,
          COALESCE(u.first_name,'') AS first_name, COALESCE(u.last_name,'') AS last_name
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 200
      `);
      res.json({ success: true, data: rows || [] });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
}
// Détails d'une commande (Admin ET Manager)
app.get('/api/admin/orders/:id', devBypass(authenticateToken), devBypass(requireManager), validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(`
      SELECT o.*, 
        COALESCE(u.first_name, '') as first_name, 
        COALESCE(u.last_name, 'Invité') as last_name, 
        COALESCE(u.email, '') as email, 
        COALESCE(u.phone, '') as phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const [items] = await pool.query(`
      SELECT * FROM order_items WHERE order_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...orders[0],
        items
      }
    });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier le statut d'une commande (Admin ET Manager)
app.put('/api/admin/orders/:id/status', authenticateToken, requireManager, csrfProtection, validateId, validateOrderStatus, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Récupérer l'ancien statut pour gérer les timestamps
    const [currentOrder] = await pool.query(
      'SELECT status, taken_at FROM orders WHERE id = ?',
      [id]
    );

    if (currentOrder.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const oldStatus = currentOrder[0].status;
    const newStatus = status;

    // Préparer la requête de mise à jour avec les timestamps
    let updateQuery = 'UPDATE orders SET status = ?';
    let updateParams = [newStatus];

    // Si on passe de "pending" à "preparing", enregistrer le temps de prise en charge
    if (oldStatus === 'pending' && newStatus === 'preparing') {
      updateQuery += ', taken_at = NOW()';
      logger.log(`📌 Commande ${id}: Prise en charge - taken_at enregistré`);
    }

    // Si on passe de "preparing" à "served" ou "ready" à "served", enregistrer le temps de fin de préparation
    if ((oldStatus === 'preparing' || oldStatus === 'ready') && newStatus === 'served') {
      // Si taken_at n'est pas encore défini, le définir maintenant (cas où on passe directement de pending à served)
      if (!currentOrder[0].taken_at && oldStatus !== 'ready') {
        updateQuery += ', taken_at = NOW()';
        logger.log(`📌 Commande ${id}: Prise en charge tardive - taken_at enregistré`);
      }
      updateQuery += ', prepared_at = NOW()';
      logger.log(`📌 Commande ${id}: Préparation terminée - prepared_at enregistré`);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

    // ✅ OPTIMISATION: Invalider le cache des commandes
    cache.invalidateOnModify.orders();

    // Créer une notification pour le client
    const [order] = await pool.query('SELECT user_id FROM orders WHERE id = ?', [id]);
    
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_order_id)
       VALUES (?, ?, ?, 'order', ?)`,
      [
        order[0].user_id,
        'Statut de commande mis à jour',
        `Votre commande est maintenant: ${status}`,
        id
      ]
    );

    // Émettre l'événement WebSocket pour mise à jour en temps réel
    emitOrderUpdate('order:status_changed', { orderId: id, status: newStatus, oldStatus });
    emitOrderUpdate('orders:refresh', {});

    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/admin/orders/:id/payment-status', authenticateToken, requireManager, csrfProtection, validateId, validatePaymentStatus, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Statut de paiement requis' });
    }

    const rawStatus = String(status).toLowerCase();
    const statusMap = {
      completed: 'completed',
      paid: 'completed',
      pending: 'pending',
      unpaid: 'pending',
      failed: 'failed',
      refused: 'refused',
      cancelled: 'cancelled',
      refunded: 'refunded'
    };

    const normalizedStatus = statusMap[rawStatus];

    if (!normalizedStatus) {
      return res.status(400).json({ success: false, error: `Statut de paiement invalide: ${status}` });
    }

    const normalizedMethod = paymentMethod ? String(paymentMethod).toLowerCase() : null;

    let updateQuery = 'UPDATE orders SET payment_status = ?';
    const queryParams = [normalizedStatus];

    if (normalizedMethod) {
      updateQuery += ', payment_method = ?';
      queryParams.push(normalizedMethod);
    }

    const numericId = Number(id);
    const whereClauses = [];
    const whereParams = [];

    if (!Number.isNaN(numericId)) {
      whereClauses.push('id = ?');
      whereParams.push(numericId);
    }

    whereClauses.push('order_number = ?');
    whereParams.push(id);

    updateQuery += ` WHERE ${whereClauses.join(' OR ')}`;

    // Récupérer la commande AVANT la mise à jour pour vérifier l'ancien statut et le user_id
    const [orderBeforeUpdate] = await pool.query(
      `SELECT id, user_id, payment_status, total_amount FROM orders WHERE ${whereClauses.join(' OR ')}`,
      whereParams
    );

    if (orderBeforeUpdate.length === 0) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée pour mise à jour du paiement' });
    }

    const order = orderBeforeUpdate[0];
    const oldPaymentStatus = order.payment_status;
    const userId = order.user_id;
    const totalAmount = parseFloat(order.total_amount) || 0;

    // Mettre à jour le statut de paiement
    const [result] = await pool.query(updateQuery, [...queryParams, ...whereParams]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée pour mise à jour du paiement' });
    }

    // Si la commande passe à "completed" et qu'elle n'était pas déjà "completed"
    if (normalizedStatus === 'completed' && oldPaymentStatus !== 'completed' && userId) {
      // Récupérer la commande pour obtenir loyaltyReward depuis notes
      const [currentOrder] = await pool.query(
        'SELECT notes FROM orders WHERE id = ?',
        [order.id]
      );
      
      let loyaltyRewardData = null;
      if (currentOrder.length > 0 && currentOrder[0].notes) {
        const notes = currentOrder[0].notes;
        const rewardPrefix = 'LOYALTY_REWARD_DATA:';
        const rewardIndex = notes.indexOf(rewardPrefix);
        if (rewardIndex !== -1) {
          const rewardStart = rewardIndex + rewardPrefix.length;
          const rewardEnd = notes.indexOf('\n', rewardStart);
          const rewardJson = rewardEnd !== -1 ? notes.substring(rewardStart, rewardEnd) : notes.substring(rewardStart);
          try {
            loyaltyRewardData = JSON.parse(rewardJson);
          } catch (e) {
            logger.error('❌ Erreur parsing loyaltyRewardData:', e);
          }
        }
      }
      
      // Si une récompense de fidélité était appliquée, déduire les points et marquer comme utilisée
      // NOTE: Les points sont maintenant déduits lors de la création de la commande,
      // donc cette section ne devrait normalement pas être nécessaire, mais on la garde pour sécurité
      if (loyaltyRewardData && loyaltyRewardData.pointsRequired) {
        const rewardId = `${loyaltyRewardData.pointsRequired}_${loyaltyRewardData.name}`;
        const pointsToDeduct = loyaltyRewardData.pointsRequired || 0;
        
        // Vérifier si les points ont déjà été déduits pour cette commande
        const [existingDeduction] = await pool.query(
          'SELECT id FROM loyalty_transactions WHERE order_id = ? AND transaction_type = ? AND (description LIKE ? OR description LIKE ?)',
          [order.id, 'redeemed', `%${loyaltyRewardData.name}%`, '%Utilisation récompense%']
        );
        
        // Ne déduire que si les points n'ont pas déjà été déduits lors de la création
        if (existingDeduction.length === 0 && pointsToDeduct > 0) {
          // Récupérer les points actuels
          const [users] = await pool.query(
            'SELECT loyalty_points FROM users WHERE id = ?',
            [userId]
          );
          
          if (users.length > 0) {
            const currentPoints = Math.max(0, users[0].loyalty_points || 0);
            
            // Vérifier que l'utilisateur a assez de points (au cas où)
            if (currentPoints >= pointsToDeduct) {
              const newBalance = Math.max(0, currentPoints - pointsToDeduct);
              
              // Déduire les points
              await pool.query(
                'UPDATE users SET loyalty_points = ? WHERE id = ?',
                [newBalance, userId]
              );
              
              // Enregistrer la transaction de déduction
              await pool.query(
                `INSERT INTO loyalty_transactions 
                 (user_id, order_id, points, transaction_type, description, balance_after)
                 VALUES (?, ?, ?, 'redeemed', ?, ?)`,
                [
                  userId,
                  order.id,
                  -pointsToDeduct,
                  `Utilisation récompense: ${loyaltyRewardData.name}`,
                  newBalance
                ]
              );
              
              logger.log(`✅ Points déduits pour récompense: ${pointsToDeduct} pour l'utilisateur ${userId} (commande ${order.id}). Nouveau solde: ${newBalance}`);
              
              // Marquer la récompense comme utilisée dans localStorage via l'API
              // On stocke cette information dans la base pour la synchroniser
              // Note: Le frontend devra aussi mettre à jour localStorage
            }
          }
        }
      }
      
      // Ajouter les points de fidélité (après avoir déduit les points de récompense)
      // Vérifier si les points ont déjà été ajoutés pour cette commande
      const [existingTransaction] = await pool.query(
        'SELECT id FROM loyalty_transactions WHERE order_id = ? AND transaction_type = ?',
        [order.id, 'earned']
      );

      // Si aucune transaction n'existe, ajouter les points
      if (existingTransaction.length === 0) {
        const pointsToAdd = Math.floor(totalAmount); // Points = total de la commande (arrondi à l'entier inférieur)
        
        if (pointsToAdd > 0) {
          // Récupérer les points actuels (peut-être déjà mis à jour par la déduction)
          const [users] = await pool.query(
            'SELECT loyalty_points FROM users WHERE id = ?',
            [userId]
          );

          if (users.length > 0) {
            const currentPoints = Math.max(0, users[0].loyalty_points || 0); // S'assurer que les points actuels ne sont pas négatifs
            const newBalance = Math.max(0, currentPoints + pointsToAdd); // Les points sont toujours ajoutés, jamais soustraits (et toujours positifs)

            // Mettre à jour les points de l'utilisateur
            await pool.query(
              'UPDATE users SET loyalty_points = ? WHERE id = ?',
              [newBalance, userId]
            );

            // Enregistrer la transaction
            await pool.query(
              `INSERT INTO loyalty_transactions 
               (user_id, order_id, points, transaction_type, description, balance_after)
               VALUES (?, ?, ?, 'earned', ?, ?)`,
              [
                userId,
                order.id,
                pointsToAdd,
                `Points gagnés sur commande ${order.order_number || order.id} (${totalAmount.toFixed(2)}€)`,
                newBalance
              ]
            );

            logger.log(`✅ Points ajoutés: ${pointsToAdd} pour l'utilisateur ${userId} (commande ${order.id}). Nouveau solde: ${newBalance}`);
          }
        }
      } else {
        logger.log(`ℹ️ Points déjà ajoutés pour la commande ${order.id}`);
      }
    }

    const [updatedRows] = await pool.query(
      `SELECT id, order_number, payment_status, payment_method FROM orders WHERE ${whereClauses.join(' OR ')}`,
      whereParams
    );
    const updatedOrder = updatedRows[0];

    // ✅ OPTIMISATION: Invalider le cache des commandes
    cache.invalidateOnModify.orders();

    emitOrderUpdate('order:payment_updated', { orderId: updatedOrder.id, payment_status: updatedOrder.payment_status });
    emitOrderUpdate('orders:refresh', {});

    res.json({ success: true, message: 'Statut de paiement mis à jour', data: updatedOrder });
  } catch (error) {
    logger.error('❌ Erreur mise à jour statut paiement:', error);
    // ✅ SÉCURITÉ: Masquer les détails d'erreur en production
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      ...(isProd ? {} : { details: error.message })
    });
  }
});
app.put('/api/admin/orders/:id/payment-workflow', authenticateToken, requireManager, csrfProtection, validateId, async (req, res) => {
  const identifier = req.params.id;
  const {
    items = [],
    removedItemIds = [],
    payments = [],
    totals = {},
    notes = null,
    statusNext = null
  } = req.body || {};

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const numericId = Number(identifier);
    const whereClauses = [];
    const whereParams = [];

    if (!Number.isNaN(numericId)) {
      whereClauses.push('id = ?');
      whereParams.push(numericId);
    }

    whereClauses.push('order_number = ?');
    whereParams.push(identifier);

    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE ${whereClauses.join(' OR ')} LIMIT 1`,
      whereParams
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    const currentOrder = orders[0];
    const orderId = currentOrder.id;

    const removalSet = new Set(
      Array.isArray(removedItemIds)
        ? removedItemIds
            .map(value => Number(value))
            .filter(value => Number.isInteger(value) && value > 0)
        : []
    );

    if (Array.isArray(items)) {
      for (const rawItem of items) {
        const itemId = Number(rawItem?.id);
        if (!itemId || Number.isNaN(itemId)) {
          continue;
        }

        const quantity = Number(rawItem?.quantity ?? 0);
        const unitPrice = Number(rawItem?.unitPrice ?? rawItem?.unit_price ?? 0);
        const subtotal = Number(rawItem?.subtotal ?? quantity * unitPrice);

        if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
          continue;
        }

        if (quantity <= 0) {
          removalSet.add(itemId);
          continue;
        }

        await connection.query(
          'UPDATE order_items SET quantity = ?, unit_price = ?, subtotal = ? WHERE id = ? AND order_id = ?',
          [quantity, unitPrice, subtotal, itemId, orderId]
        );
      }
    }

    if (removalSet.size > 0) {
      const removalArray = Array.from(removalSet);
      const placeholders = removalArray.map(() => '?').join(', ');
      await connection.query(
        `DELETE FROM order_items WHERE order_id = ? AND id IN (${placeholders})`,
        [orderId, ...removalArray]
      );
    }

    const [itemsTotals] = await connection.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS subtotal FROM order_items WHERE order_id = ?',
      [orderId]
    );

    const recalculatedSubtotal = Number(itemsTotals[0]?.subtotal ?? 0);
    const discountAmount = Number(currentOrder.discount_amount ?? 0);
    const taxAmount = Number(currentOrder.tax_amount ?? 0);

    const safeTotals = totals && typeof totals === 'object' ? totals : {};
    // ✅ SÉCURITÉ: RECALCULER TOUJOURS CÔTÉ SERVEUR - Ne JAMAIS faire confiance au client
    // Ignorer safeTotals.total du client et recalculer depuis les données de la base
    const totalAmount = Math.max(0, recalculatedSubtotal - discountAmount + taxAmount);

    await connection.query('DELETE FROM order_payments WHERE order_id = ?', [orderId]);

    const allowedPaymentMethods = new Set(['cash','card','stripe','paypal','mixed','voucher','other','check','transfer']);
    const paymentMethodSet = new Set();
    const paymentDetailsList = [];

    const normalizedPayments = Array.isArray(payments) ? payments : [];
    for (const entry of normalizedPayments) {
      const amount = Number(entry?.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      let method = String(entry?.method || 'cash').toLowerCase();
      if (!allowedPaymentMethods.has(method)) {
        method = 'other';
      }

      paymentMethodSet.add(method);
      paymentDetailsList.push({
        method,
        amount,
        reference: entry?.reference || null
      });

      await connection.query(
        'INSERT INTO order_payments (order_id, method, amount, reference) VALUES (?, ?, ?, ?)',
        [orderId, method, amount, entry?.reference || null]
      );
    }

    const amountPaid = Number(
      safeTotals.amountPaid != null
        ? safeTotals.amountPaid
        : paymentDetailsList.reduce((sum, payment) => sum + payment.amount, 0)
    );

    const changeAmount = Number(
      safeTotals.change != null
        ? safeTotals.change
        : Math.max(0, amountPaid - totalAmount)
    );

    const remainingAmount = Number(
      safeTotals.remaining != null
        ? safeTotals.remaining
        : Math.max(0, totalAmount - amountPaid)
    );

    // Vérifier que les paiements correspondent au total recalculé (après calcul des détails)
    const tolerance = 0.01; // Tolérance de 1 centime pour les arrondis
    if (Math.abs(amountPaid - totalAmount) > tolerance && amountPaid > 0) {
      logger.error('❌ ERREUR SÉCURITÉ: Montant de paiement ne correspond pas au total');
      logger.error('   - Total recalculé:', totalAmount);
      logger.error('   - Total payé:', amountPaid);
      await connection.rollback();
      return res.status(400).json({
        error: 'Montant de paiement invalide',
        details: `Le montant total payé (${amountPaid.toFixed(2)}€) ne correspond pas au total de la commande (${totalAmount.toFixed(2)}€)`
      });
    }

    let normalizedPaymentMethod = currentOrder.payment_method || 'cash';
    if (paymentMethodSet.size === 1) {
      normalizedPaymentMethod = Array.from(paymentMethodSet)[0];
    } else if (paymentMethodSet.size > 1) {
      normalizedPaymentMethod = 'mixed';
    }

    if (!['cash','card','stripe','paypal','mixed'].includes(normalizedPaymentMethod)) {
      normalizedPaymentMethod = 'cash';
    }

    const paymentStatus = remainingAmount <= 0 ? 'completed' : 'pending';
    const oldPaymentStatus = currentOrder.payment_status || 'pending';
    const userId = currentOrder.user_id;

    const paymentDetails = {
      payments: paymentDetailsList,
      totals: {
        subtotal: recalculatedSubtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: totalAmount,
        amountPaid,
        change: changeAmount,
        remaining: remainingAmount
      },
      updatedAt: new Date().toISOString()
    };

    let updateQuery = `
      UPDATE orders
      SET subtotal = ?,
          total_amount = ?,
          amount_paid = ?,
          change_amount = ?,
          payment_status = ?,
          payment_method = ?,
          payment_details = ?,
          notes = COALESCE(?, notes),
          updated_at = NOW()
    `;

    const updateParams = [
      recalculatedSubtotal,
      totalAmount,
      amountPaid,
      changeAmount,
      paymentStatus,
      normalizedPaymentMethod,
      JSON.stringify(paymentDetails),
      notes != null ? String(notes) : null
    ];

    let statusChanged = false;
    let nextStatus = null;

    if (typeof statusNext === 'string') {
      const candidateStatus = statusNext.toLowerCase();
      const allowedStatuses = ['pending','preparing','ready','served','cancelled'];
      if (allowedStatuses.includes(candidateStatus) && candidateStatus !== currentOrder.status) {
        statusChanged = true;
        nextStatus = candidateStatus;
        updateQuery += ', status = ?';
        updateParams.push(candidateStatus);

        if (currentOrder.status === 'pending' && candidateStatus === 'preparing') {
          updateQuery += ', taken_at = NOW()';
        }

        if (candidateStatus === 'ready') {
          updateQuery += ', prepared_at = NOW()';
        }

        if (candidateStatus === 'served') {
          updateQuery += ', completed_at = NOW()';
        }
      }
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(orderId);

    await connection.query(updateQuery, updateParams);

    // Si la commande passe à "completed" et qu'elle n'était pas déjà "completed", ajouter les points
    if (paymentStatus === 'completed' && oldPaymentStatus !== 'completed' && userId) {
      // Vérifier si les points ont déjà été ajoutés pour cette commande
      const [existingTransaction] = await connection.query(
        'SELECT id FROM loyalty_transactions WHERE order_id = ? AND transaction_type = ?',
        [orderId, 'earned']
      );

      // Si aucune transaction n'existe, ajouter les points
      if (existingTransaction.length === 0) {
        const pointsToAdd = Math.floor(totalAmount); // Points = total de la commande (arrondi à l'entier inférieur)
        
        if (pointsToAdd > 0) {
          // Récupérer les points actuels
          const [users] = await connection.query(
            'SELECT loyalty_points FROM users WHERE id = ?',
            [userId]
          );

          if (users.length > 0) {
            const currentPoints = Math.max(0, users[0].loyalty_points || 0); // S'assurer que les points actuels ne sont pas négatifs
            const newBalance = Math.max(0, currentPoints + pointsToAdd); // Les points sont toujours ajoutés, jamais soustraits (et toujours positifs)

            // Mettre à jour les points de l'utilisateur
            await connection.query(
              'UPDATE users SET loyalty_points = ? WHERE id = ?',
              [newBalance, userId]
            );

            // Enregistrer la transaction
            await connection.query(
              `INSERT INTO loyalty_transactions 
               (user_id, order_id, points, transaction_type, description, balance_after)
               VALUES (?, ?, ?, 'earned', ?, ?)`,
              [
                userId,
                orderId,
                pointsToAdd,
                `Points gagnés sur commande ${currentOrder.order_number || orderId} (${totalAmount.toFixed(2)}€)`,
                newBalance
              ]
            );

            logger.log(`✅ Points ajoutés via workflow: ${pointsToAdd} pour l'utilisateur ${userId} (commande ${orderId}). Nouveau solde: ${newBalance}`);
          }
        }
      } else {
        logger.log(`ℹ️ Points déjà ajoutés pour la commande ${orderId}`);
      }
    }

    await connection.commit();

    const [updatedOrders] = await connection.query(`
      SELECT 
        o.*,
        COALESCE(u.first_name, '') AS first_name,
        COALESCE(u.last_name, 'Invité') AS last_name,
        COALESCE(u.email, '') AS email,
        COALESCE((
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', op.id,
              'method', op.method,
              'amount', op.amount,
              'reference', op.reference,
              'created_at', op.created_at
            )
          )
          FROM order_payments op
          WHERE op.order_id = o.id
        ), JSON_ARRAY()) AS payments,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal,
            'image_url', p.image_url,
            'category_name', c.name,
            'category_type', CASE 
              WHEN LOWER(c.name) LIKE '%entrée%' OR LOWER(c.name) LIKE '%entree%' OR LOWER(c.name) LIKE '%starter%' THEN 'entree'
              WHEN LOWER(c.name) LIKE '%dessert%' OR LOWER(c.name) LIKE '%sweet%' THEN 'dessert'
              ELSE 'plat'
            END
          )
        ) AS items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);

    const updatedOrder = updatedOrders[0] || null;

    emitOrderUpdate('order:payment_updated', {
      orderId,
      payment_status: paymentStatus,
      amount_paid: amountPaid
    });

    if (statusChanged && nextStatus) {
      emitOrderUpdate('order:status_changed', { orderId, status: nextStatus, oldStatus: currentOrder.status });
    }

    emitOrderUpdate('orders:refresh', {});

    res.json({
      success: true,
      message: 'Workflow de paiement enregistré',
      data: updatedOrder
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        logger.error('❌ Erreur rollback workflow paiement:', rollbackError);
      }
    }
    logger.error('❌ Erreur workflow paiement:', error);
    // ✅ SÉCURITÉ: Masquer les détails d'erreur en production
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors du workflow paiement',
      ...(isProd ? {} : { details: error.message })
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// ================================================================
// ADMIN - PARAMÈTRES
// ================================================================

// Liste tous les paramètres
app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM app_settings ORDER BY setting_key');
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Erreur récupération settings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un paramètre spécifique (route publique pour le frontend)
app.get('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const [settings] = await pool.query('SELECT * FROM app_settings WHERE setting_key = ?', [key]);
    
    if (settings.length === 0) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }
    
    const setting = settings[0];
    let value = setting.setting_value;
    
    // Convertir selon le type
    if (setting.setting_type === 'boolean') {
      value = value === 'true' || value === '1';
    } else if (setting.setting_type === 'number') {
      value = parseFloat(value);
    } else if (setting.setting_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        logger.error('Erreur parse JSON:', e);
      }
    }
    
    res.json({ success: true, data: { key: setting.setting_key, value, type: setting.setting_type } });
  } catch (error) {
    logger.error('Erreur récupération setting:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un paramètre (Admin only)
app.put('/api/admin/settings/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, setting_type } = req.body;

    logger.log('🔧 PUT /api/admin/settings/:key');
    logger.log('   Key:', key);
    logger.log('   Value reçue:', value, '(type:', typeof value, ')');
    logger.log('   Setting type:', setting_type);

    // Convertir la valeur en string si nécessaire
    let stringValue = value;
    if (typeof value === 'object' && value !== null) {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    // Déterminer le type si non fourni
    let finalType = setting_type || 'string';
    if (setting_type === 'json' || (typeof value === 'object' && value !== null)) {
      finalType = 'json';
    } else if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      finalType = 'boolean';
    } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
      finalType = 'number';
    }

    const [result] = await pool.query(
      'UPDATE app_settings SET setting_value = ?, setting_type = ? WHERE setting_key = ?',
      [stringValue, finalType, key]
    );

    logger.log('   Rows affected:', result.affectedRows);

    // Si la clé n'existe pas encore, l'insérer (UPSERT simplifié)
    if (result.affectedRows === 0) {
      logger.log('   ⚠️ Clé inexistante, insertion...');
      await pool.query(
        'INSERT INTO app_settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)',
        [key, stringValue, finalType]
      );
    }

    // Vérifier la nouvelle valeur
    const [rows] = await pool.query(
      'SELECT setting_value, setting_type FROM app_settings WHERE setting_key = ?',
      [key]
    );
    
    logger.log('   Nouvelle valeur en BDD:', rows[0]?.setting_value);
    logger.log('   Type en BDD:', rows[0]?.setting_type);
    logger.log('   ✅ Paramètre modifié avec succès');

    res.json({ 
      success: true, 
      message: 'Paramètre modifié',
      newValue: rows[0]?.setting_value,
      type: rows[0]?.setting_type
    });
  } catch (error) {
    logger.error('❌ Erreur UPDATE setting:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// RESTAURANT INFO (via app_settings)
// ================================================================

// Helper: get setting by key
async function getSettingValue(pool, key) {
  const [rows] = await pool.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [key]);
  return rows[0]?.setting_value ?? null;
}

// Helper: upsert setting
async function upsertSetting(pool, key, value) {
  const [result] = await pool.query('UPDATE app_settings SET setting_value = ? WHERE setting_key = ?', [String(value), key]);
  if (result.affectedRows === 0) {
    await pool.query('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', [key, String(value)]);
  }
}

// GET restaurant info agrégée
app.get('/api/restaurant-info', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM app_settings');
    const map = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
    let openingHours = {};
    try { openingHours = map.opening_hours ? JSON.parse(map.opening_hours) : {}; } catch { openingHours = {}; }
    const businessDefaults = {
      name: 'BLOSSOM CAFE',
      address: '15 Avenue des Champs-Élysées, 75008 PARIS',
      phone: '01 42 56 78 90',
      siret: '123 456 789 00012',
      vatNumber: 'FR 12 345678901',
      website: 'www.supermarche-dupont.fr',
      email: 'contact@supermarche-dupont.fr',
      legalForm: 'SAS',
      shareCapital: '100 000 €',
      rcs: 'RCS Paris B 123 456 789',
      paymentMention: 'TVA acquittée sur les encaissements',
      legalMentions: '',
      returnPolicy: 'Les produits alimentaires ne sont ni repris ni échangés. Merci de conserver votre ticket.',
      foodInfo: 'Les denrées alimentaires servies ne peuvent être reprises pour des raisons sanitaires.',
      customerService: '0800 123 456'
    };
    const displayDefaults = {
      showName: true,
      showAddress: true,
      showPhone: true,
      showSiret: true,
      showVat: true,
      showWebsite: true,
      showEmail: true,
      showCustomerService: true,
      showLegalForm: true,
      showRcs: true,
      showPaymentMention: true,
      showLegalMentions: true,
      showReturnPolicy: true,
      showFoodInfo: true
    };

    res.json({
      success: true,
      data: {
        opening_hours: openingHours,
        address: {
          street: map.address_street || map.restaurant_address || '',
          city: map.address_city || '',
          postal: map.address_postal || '',
          country: map.address_country || 'France'
        },
        contact: {
          phone_main: map.phone_main || map.contact_phone || '',
          phone_mobile: map.phone_mobile || '',
          email_contact: map.email_contact || map.contact_email || '',
          email_reservation: map.email_reservation || ''
        },
        business: {
          name: map.business_name || businessDefaults.name,
          address: map.business_address || map.restaurant_address || businessDefaults.address,
          phone: map.business_phone || map.phone_main || map.contact_phone || businessDefaults.phone,
          siret: map.business_siret || businessDefaults.siret,
          vatNumber: map.business_vat_number || businessDefaults.vatNumber,
          website: map.business_website || businessDefaults.website,
          email: map.business_email || businessDefaults.email,
          legalForm: map.business_legal_form || businessDefaults.legalForm,
          shareCapital: map.business_share_capital || businessDefaults.shareCapital,
          rcs: map.business_rcs || businessDefaults.rcs,
          paymentMention: map.business_payment_mention || businessDefaults.paymentMention,
          legalMentions: map.business_legal_mentions || businessDefaults.legalMentions,
          returnPolicy: map.business_return_policy || businessDefaults.returnPolicy,
          foodInfo: map.business_food_info || businessDefaults.foodInfo,
          customerService: map.business_customer_service || businessDefaults.customerService
        },
        displayPreferences: {
          ...displayDefaults,
          showName: map.ticket_show_name !== 'false',
          showAddress: map.ticket_show_address !== 'false',
          showPhone: map.ticket_show_phone !== 'false',
          showSiret: map.ticket_show_siret !== 'false',
          showVat: map.ticket_show_vat !== 'false',
          showWebsite: map.ticket_show_website !== 'false',
          showEmail: map.ticket_show_email !== 'false',
          showCustomerService: map.ticket_show_customer_service !== 'false',
          showLegalForm: map.ticket_show_legal_form !== 'false',
          showRcs: map.ticket_show_rcs !== 'false',
          showPaymentMention: map.ticket_show_payment_mention !== 'false',
          showLegalMentions: map.ticket_show_legal_mentions !== 'false',
          showReturnPolicy: map.ticket_show_return_policy !== 'false',
          showFoodInfo: map.ticket_show_food_info !== 'false'
        }
      }
    });
  } catch (error) {
    logger.error('❌ GET /api/restaurant-info:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT horaires
app.put('/api/restaurant-info/hours', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { hours } = req.body;
    if (!hours || typeof hours !== 'object') {
      return res.status(400).json({ success: false, error: 'Paramètre "hours" invalide' });
    }
    await upsertSetting(pool, 'opening_hours', JSON.stringify(hours));
    res.json({ success: true, message: 'Horaires mis à jour' });
  } catch (error) {
    logger.error('❌ PUT /api/restaurant-info/hours:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT adresse
app.put('/api/restaurant-info/address', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { street = '', city = '', postal = '', country = 'France' } = req.body || {};
    await Promise.all([
      upsertSetting(pool, 'address_street', street),
      upsertSetting(pool, 'address_city', city),
      upsertSetting(pool, 'address_postal', postal),
      upsertSetting(pool, 'address_country', country),
      upsertSetting(pool, 'restaurant_address', [street, postal, city].filter(Boolean).join(' '))
    ]);
    res.json({ success: true, message: 'Adresse mise à jour' });
  } catch (error) {
    logger.error('❌ PUT /api/restaurant-info/address:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT contact
app.put('/api/restaurant-info/contact', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { phone_main = '', phone_mobile = '', email_contact = '', email_reservation = '' } = req.body || {};
    await Promise.all([
      upsertSetting(pool, 'phone_main', phone_main),
      upsertSetting(pool, 'phone_mobile', phone_mobile),
      upsertSetting(pool, 'email_contact', email_contact),
      upsertSetting(pool, 'email_reservation', email_reservation),
      upsertSetting(pool, 'contact_phone', phone_main),
      upsertSetting(pool, 'contact_email', email_contact)
    ]);
    res.json({ success: true, message: 'Contacts mis à jour' });
  } catch (error) {
    logger.error('❌ PUT /api/restaurant-info/contact:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - STATISTIQUES
// ================================================================

app.get('/api/admin/dashboard', authenticateToken, requireManager, async (req, res) => {
  try {
    logger.log('📊 GET /api/admin/dashboard - Statistiques complètes');
    
    const [stats] = await pool.query(`
      SELECT 
        -- Clients
        (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
        (SELECT COUNT(DISTINCT user_id) FROM orders) as active_clients,
        
        -- Produits
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE is_available = 1) as active_products,
        (SELECT COUNT(*) FROM products WHERE is_available = 0) as inactive_products,
        
        -- Commandes - Totales
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as orders_today,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as orders_yesterday,
        
        -- Commandes par statut
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'preparing') as preparing_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'ready') as ready_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'served') as served_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
        
        -- Revenus - Tous statuts (sauf annulées)
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') as revenue_today,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status != 'cancelled') as revenue_yesterday,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status != 'cancelled') as revenue_7days,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status != 'cancelled') as revenue_30days,
        
        -- Ticket moyen
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status != 'cancelled') as average_order_value,
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') as average_order_value_today,
        
        -- Articles
        (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status != 'cancelled') as total_items_sold,
        (SELECT COALESCE(AVG(items_count), 0) FROM (SELECT COUNT(oi.id) as items_count FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status != 'cancelled' GROUP BY o.id) as subq) as average_items_per_order
    `);
    
    logger.log('✅ Statistiques dashboard calculées:', stats[0]);
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    logger.error('❌ Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - ANALYTICS AVANCÉS
// ================================================================

// Statistiques de ventes par période
app.get('/api/admin/analytics/sales', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    
    logger.log('📈 GET /api/admin/analytics/sales - Période:', period);
    
    let dateCondition = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    let intervalDays = 7;
    
    if (period === '30days') {
      dateCondition = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      intervalDays = 30;
    } else if (period === '90days') {
      dateCondition = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
      intervalDays = 90;
    } else if (period === 'today') {
      dateCondition = 'DATE(created_at) = CURDATE()';
      intervalDays = 1;
    }
    
    const [sales] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(AVG(total_amount), 0) as average_order,
        COUNT(DISTINCT user_id) as unique_customers
      FROM orders
      WHERE ${dateCondition} AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    logger.log(`✅ ${sales.length} jours de données retournés`);
    res.json({ success: true, data: sales });
  } catch (error) {
    logger.error('❌ Erreur analytics/sales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Top produits vendus
app.get('/api/admin/analytics/top-products', authenticateToken, requireManager, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    logger.log('🏆 GET /api/admin/analytics/top-products - Limit:', limit);
    
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.name as product_name,
        p.price,
        p.image_url,
        p.category_id,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COALESCE(COUNT(DISTINCT oi.order_id), 0) as order_count,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY p.id, p.name, p.price, p.image_url, p.category_id, c.name
      HAVING total_quantity > 0
      ORDER BY total_quantity DESC, total_revenue DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    logger.log(`✅ ${products.length} produits top retournés`);
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('❌ Erreur top-products:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Revenus par catégorie
app.get('/api/admin/analytics/revenue-by-category', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [revenues] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(oi.subtotal), 0) as revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'completed'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `);
    
    res.json({ success: true, data: revenues });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTE: Statistiques CA avec comparaison de périodes (DONNÉES RÉELLES)
// ================================================================
app.get('/api/admin/analytics/revenue-comparison', authenticateToken, requireManager, async (req, res) => {
  try {
    const { startDate, endDate, compareStartDate, compareEndDate } = req.query;
    
    logger.log('📊 GET /api/admin/analytics/revenue-comparison');
    logger.log('   Période actuelle:', startDate, '→', endDate);
    logger.log('   Période comparaison:', compareStartDate, '→', compareEndDate);
    
    // Statistiques période actuelle (TOUTES les commandes sauf annulées)
    const [currentStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM orders o
      WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        AND o.status != 'cancelled'
    `, [startDate, endDate]);
    
    // Statistiques période précédente (TOUTES les commandes sauf annulées)
    const [previousStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM orders o
      WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        AND o.status != 'cancelled'
    `, [compareStartDate, compareEndDate]);
    
    // Vérifier si c'est une seule journée pour affichage heure par heure
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isSingleDay = start.toDateString() === end.toDateString();
    
    logger.log('   Mode:', isSingleDay ? 'HEURE PAR HEURE' : 'JOUR PAR JOUR');
    
    let dailyStats;
    
    if (isSingleDay) {
      // Une seule journée : détails HEURE PAR HEURE
      [dailyStats] = await pool.query(`
        SELECT 
          HOUR(o.created_at) as hour,
          DATE(o.created_at) as date,
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue
        FROM orders o
        WHERE DATE(o.created_at) = ?
          AND o.status != 'cancelled'
        GROUP BY HOUR(o.created_at), DATE(o.created_at)
        ORDER BY hour ASC
      `, [startDate]);
    } else {
      // Plusieurs jours : détails JOUR PAR JOUR
      [dailyStats] = await pool.query(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM orders o
      WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        AND o.status != 'cancelled'
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `, [startDate, endDate]);
    }
    
    const current = currentStats[0];
    const previous = previousStats[0];
    
    // Calcul des variations réelles
    const revenueCurrent = parseFloat(current.total_revenue) || 0;
    const revenuePrevious = parseFloat(previous.total_revenue) || 0;
    const ordersCurrent = parseInt(current.total_orders) || 0;
    const ordersPrevious = parseInt(previous.total_orders) || 0;
    
    const revenueGrowth = revenuePrevious > 0 
      ? ((revenueCurrent - revenuePrevious) / revenuePrevious) * 100 
      : 0;
    
    const ordersGrowth = ordersPrevious > 0 
      ? ((ordersCurrent - ordersPrevious) / ordersPrevious) * 100 
      : 0;
    
    const avgOrderCurrent = ordersCurrent > 0 ? revenueCurrent / ordersCurrent : 0;
    const avgOrderPrevious = ordersPrevious > 0 ? revenuePrevious / ordersPrevious : 0;
    const avgOrderGrowth = avgOrderPrevious > 0 
      ? ((avgOrderCurrent - avgOrderPrevious) / avgOrderPrevious) * 100 
      : 0;
    
    // Calcul TVA (10%)
    const totalHT = revenueCurrent / 1.1;
    const totalTVA = revenueCurrent - totalHT;
    
    logger.log('✅ Statistiques calculées:');
    logger.log('   CA actuel:', revenueCurrent.toFixed(2), '€');
    logger.log('   CA précédent:', revenuePrevious.toFixed(2), '€');
    logger.log('   Croissance CA:', revenueGrowth.toFixed(2), '%');
    logger.log('   Croissance commandes:', ordersGrowth.toFixed(2), '%');
    logger.log('   Croissance panier moyen:', avgOrderGrowth.toFixed(2), '%');
    
    res.json({
      success: true,
      data: {
        current: {
          totalRevenue: revenueCurrent,
          totalOrders: ordersCurrent,
          avgOrder: avgOrderCurrent,
          totalHT: totalHT,
          totalTVA: totalTVA
        },
        previous: {
          totalRevenue: revenuePrevious,
          totalOrders: ordersPrevious,
          avgOrder: avgOrderPrevious
        },
        growth: {
          revenue: revenueGrowth,
          orders: ordersGrowth,
          avgOrder: avgOrderGrowth
        },
        details: dailyStats
      }
    });
  } catch (error) {
    logger.error('❌ Erreur revenue-comparison:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// Commandes du jour (Manager)
app.get('/api/manager/today-orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        u.first_name, u.last_name, u.email, u.phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE DATE(o.created_at) = CURDATE()
      ORDER BY o.created_at DESC
    `);
    
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques du jour (Manager)
app.get('/api/manager/today-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue,
        COALESCE(AVG(CASE WHEN payment_status = 'completed' THEN total_amount ELSE NULL END), 0) as avg_order,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN status = 'served' THEN 1 ELSE 0 END) as served
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);
    
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    logger.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES IMAGES PRODUITS
// ================================================================

// Upload d'une image produit
app.post('/api/admin/products/upload-image', authenticateToken, requireAdmin, csrfProtection, upload.single('image'), validateProductMagicBytes, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    logger.log('📸 Image uploadée:', imageUrl);
    
    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      imageUrl: imageUrl
    });
  } catch (error) {
    logger.error('❌ Erreur upload image:', error);
    // ✅ SÉCURITÉ: Masquer les détails d'erreur en production
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      error: isProd ? 'Erreur lors de l\'upload' : (error.message || 'Erreur lors de l\'upload')
    });
  }
});

// Supprimer une image produit
app.delete('/api/admin/products/:id/image', authenticateToken, requireAdmin, csrfProtection, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'image actuelle
    const [products] = await pool.query('SELECT image_url FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const imageUrl = products[0].image_url;
    
    // Supprimer le fichier si il existe
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '../public', imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        logger.log('🗑️ Image supprimée:', imagePath);
      }
    }
    
    // Mettre à jour la BDD
    await pool.query('UPDATE products SET image_url = NULL WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Image supprimée avec succès'
    });
  } catch (error) {
    logger.error('❌ Erreur suppression image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - STATISTIQUES REVENUS DÉTAILLÉES
// ================================================================

// Statistiques de revenus avec calculs HT/TVA/TTC
app.get('/api/stats/revenue', authenticateToken, requireManager, async (req, res) => {
  try {
    const { start, end, period = 'daily' } = req.query;
    
    logger.log('💰 GET /api/stats/revenue - Période:', start, 'à', end);
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Dates de début et fin requises' });
    }
    
    // Validation des dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Format de date invalide' });
    }
    
    if (startDate > endDate) {
      return res.status(400).json({ error: 'La date de début doit être antérieure à la date de fin' });
    }
    
    // Calculer le CA avec HT/TVA/TTC
    const [revenueStats] = await pool.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS orders_count,
        SUM(total_amount) AS total_ttc,
        SUM(total_amount / 1.20) AS total_ht,
        SUM(total_amount - (total_amount / 1.20)) AS total_tva,
        AVG(total_amount) AS average_basket,
        COUNT(DISTINCT user_id) AS unique_customers
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ? 
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `, [start, end]);
    
    // Calculer les totaux pour la période
    const [totals] = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_ttc,
        SUM(total_amount / 1.20) AS total_ht,
        SUM(total_amount - (total_amount / 1.20)) AS total_tva,
        AVG(total_amount) AS average_basket,
        COUNT(DISTINCT user_id) AS total_customers
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ? 
        AND status != 'cancelled'
    `, [start, end]);
    
    // Statistiques par période (jour/semaine/mois)
    let periodStats = [];
    
    if (period === 'weekly') {
      const [weeklyStats] = await pool.query(`
        SELECT 
          YEARWEEK(created_at) AS period,
          DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)) AS week_start,
          COUNT(*) AS orders_count,
          SUM(total_amount) AS total_ttc,
          SUM(total_amount / 1.20) AS total_ht,
          SUM(total_amount - (total_amount / 1.20)) AS total_tva,
          AVG(total_amount) AS average_basket
        FROM orders
        WHERE DATE(created_at) BETWEEN ? AND ? 
          AND status != 'cancelled'
        GROUP BY YEARWEEK(created_at)
        ORDER BY period ASC
      `, [start, end]);
      periodStats = weeklyStats;
    } else if (period === 'monthly') {
      const [monthlyStats] = await pool.query(`
        SELECT 
          YEAR(created_at) AS year,
          MONTH(created_at) AS month,
          CONCAT(YEAR(created_at), '-', LPAD(MONTH(created_at), 2, '0')) AS period,
          COUNT(*) AS orders_count,
          SUM(total_amount) AS total_ttc,
          SUM(total_amount / 1.20) AS total_ht,
          SUM(total_amount - (total_amount / 1.20)) AS total_tva,
          AVG(total_amount) AS average_basket
        FROM orders
        WHERE DATE(created_at) BETWEEN ? AND ? 
          AND status != 'cancelled'
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year ASC, month ASC
      `, [start, end]);
      periodStats = monthlyStats;
    } else {
      periodStats = revenueStats;
    }
    
    logger.log(`✅ ${revenueStats.length} jours de statistiques retournés`);
    logger.log('💰 Totaux période:', totals[0]);
    
    res.json({ 
      success: true, 
      data: {
        daily: revenueStats,
        period: periodStats,
        totals: totals[0],
        period_type: period,
        date_range: { start, end }
      }
    });
  } catch (error) {
    logger.error('❌ Erreur stats/revenue:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques rapides (aujourd'hui, semaine, mois)
app.get('/api/stats/revenue/quick', authenticateToken, requireManager, async (req, res) => {
  try {
    logger.log('⚡ GET /api/stats/revenue/quick - Statistiques rapides');
    
    const [quickStats] = await pool.query(`
      SELECT 
        -- Aujourd'hui
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') AS today_revenue,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') AS today_orders,
        
        -- Cette semaine
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE()) AND status != 'cancelled') AS week_revenue,
        (SELECT COUNT(*) FROM orders WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE()) AND status != 'cancelled') AS week_orders,
        
        -- Ce mois
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND status != 'cancelled') AS month_revenue,
        (SELECT COUNT(*) FROM orders WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND status != 'cancelled') AS month_orders,
        
        -- Hier (pour comparaison)
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status != 'cancelled') AS yesterday_revenue,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status != 'cancelled') AS yesterday_orders
    `);
    
    const stats = quickStats[0];
    
    // Calculer les variations
    const todayVariation = stats.yesterday_revenue > 0 
      ? ((stats.today_revenue - stats.yesterday_revenue) / stats.yesterday_revenue) * 100 
      : 0;
    
    logger.log('⚡ Statistiques rapides calculées:', stats);
    
    res.json({ 
      success: true, 
      data: {
        today: {
          revenue: parseFloat(stats.today_revenue) || 0,
          orders: parseInt(stats.today_orders) || 0,
          variation: todayVariation
        },
        week: {
          revenue: parseFloat(stats.week_revenue) || 0,
          orders: parseInt(stats.week_orders) || 0
        },
        month: {
          revenue: parseFloat(stats.month_revenue) || 0,
          orders: parseInt(stats.month_orders) || 0
        },
        yesterday: {
          revenue: parseFloat(stats.yesterday_revenue) || 0,
          orders: parseInt(stats.yesterday_orders) || 0
        }
      }
    });
  } catch (error) {
    logger.error('❌ Erreur stats/revenue/quick:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// DASHBOARD CA - ROUTES AMÉLIORÉES
// ================================================================

// 1. Produits les plus vendus
app.get('/api/dashboard/top-products', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 8 } = req.query;
    
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category_id,
        c.name as category_name,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.total_price) AS revenue_ht,
        SUM(oi.total_price * (1 + p.tva_rate / 100)) AS revenue_ttc,
        COUNT(DISTINCT oi.order_id) AS nb_orders
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ?
    `, [startDate, endDate, parseInt(limit)]);
    
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('❌ Erreur top produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 2. Heures de pointe
app.get('/api/dashboard/peak-hours', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const [hours] = await pool.query(`
      SELECT 
        HOUR(created_at) AS hour,
        COUNT(*) AS nb_orders,
        SUM(total_amount) AS revenue,
        AVG(total_amount) AS avg_order
      FROM orders
      WHERE created_at BETWEEN ? AND ?
        AND status != 'cancelled'
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `, [startDate, endDate]);
    
    res.json({ success: true, data: hours });
  } catch (error) {
    logger.error('❌ Erreur heures de pointe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 3. Répartition par catégories
app.get('/api/dashboard/category-distribution', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const [categories] = await pool.query(`
      SELECT 
        c.id,
        c.name AS category,
        c.icon,
        COUNT(DISTINCT oi.order_id) AS nb_orders,
        SUM(oi.quantity) AS total_items,
        SUM(oi.total_price) AS revenue_ht,
        SUM(oi.total_price * (1 + p.tva_rate / 100)) AS revenue_ttc
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY revenue_ttc DESC
    `, [startDate, endDate]);
    
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('❌ Erreur répartition catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 4. Alertes stock
app.get('/api/dashboard/stock-alerts', authenticateToken, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.stock,
        p.category_id,
        c.name as category_name,
        CASE
          WHEN p.stock = 0 THEN 'critical'
          WHEN p.stock <= 5 THEN 'warning'
          WHEN p.stock <= 10 THEN 'low'
          ELSE 'ok'
        END as alert_level
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.stock <= 10
      ORDER BY p.stock ASC, p.name ASC
    `);
    
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('❌ Erreur alertes stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. Stats détaillées par jour ou par heure
app.get('/api/dashboard/daily-stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Vérifier si c'est une seule journée
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isSingleDay = start.toDateString() === end.toDateString();
    
    logger.log(`📊 Stats détaillées: ${startDate} à ${endDate} (${isSingleDay ? 'HEURE PAR HEURE' : 'JOUR PAR JOUR'})`);
    
    let stats;
    
    if (isSingleDay) {
      // Une seule journée : retourner les stats HEURE PAR HEURE
      [stats] = await pool.query(`
        SELECT 
          HOUR(created_at) AS hour,
          DATE(created_at) AS date,
          COUNT(*) AS nb_orders,
          SUM(total_amount) AS total_ttc,
          SUM(total_amount / 1.1) AS total_ht,
          SUM(total_amount - (total_amount / 1.1)) AS tva,
          AVG(total_amount) AS avg_order
        FROM orders
        WHERE DATE(created_at) = ?
          AND status != 'cancelled'
        GROUP BY HOUR(created_at), DATE(created_at)
        ORDER BY hour ASC
      `, [startDate]);
      
      logger.log(`✅ ${stats.length} heures avec activité`);
    } else {
      // Plusieurs jours : retourner les stats JOUR PAR JOUR
      [stats] = await pool.query(`
        SELECT 
          DATE(created_at) AS date,
          COUNT(*) AS nb_orders,
          SUM(total_amount) AS total_ttc,
          SUM(total_amount / 1.1) AS total_ht,
          SUM(total_amount - (total_amount / 1.1)) AS tva,
          AVG(total_amount) AS avg_order
        FROM orders
        WHERE created_at BETWEEN ? AND ?
          AND status != 'cancelled'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [startDate, endDate]);
      
      logger.log(`✅ ${stats.length} jours avec activité`);
    }
    
    res.json({ 
      success: true, 
      data: stats,
      isSingleDay: isSingleDay
    });
  } catch (error) {
    logger.error('❌ Erreur stats quotidiennes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 6. Dashboard complet (toutes les données en une seule requête)
app.get('/api/dashboard/complete', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Stats globales
    const [globalStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_ttc,
        SUM(total_amount / 1.1) AS total_ht,
        SUM(total_amount - (total_amount / 1.1)) AS tva,
        AVG(total_amount) AS avg_order
      FROM orders
      WHERE created_at BETWEEN ? AND ?
        AND status != 'cancelled'
    `, [startDate, endDate]);
    
    res.json({ 
      success: true, 
      data: {
        stats: globalStats[0]
      }
    });
  } catch (error) {
    logger.error('❌ Erreur dashboard complet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// ================================================================
// ROUTE HOME PAGE - DONNÉES DYNAMIQUES
// ================================================================

// Statistiques pour la page d'accueil
app.get('/api/home/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // 1. Total de commandes
      const [ordersCount] = await connection.query(
        'SELECT COUNT(*) as total FROM orders WHERE status != ?',
        ['cancelled']
      );
      
      // 2. Produits les plus populaires (top 10 pour le tableau)
      logger.log('🔍 Récupération des top products...');
      
      // Récupérer TOUS les produits avec leurs stats de vente
      const [allProductsWithStats] = await connection.query(`
        SELECT 
          p.id, 
          p.name, 
          p.description, 
          p.price, 
          p.image_url,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COUNT(DISTINCT oi.order_id) as order_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
        WHERE p.is_available = 1
        GROUP BY p.id, p.name, p.description, p.price, p.image_url
        ORDER BY total_sold DESC, p.created_at DESC
        LIMIT 10
      `);
      
      const topProducts = allProductsWithStats;
      
      logger.log('📊 Top Products récupérés:', topProducts.length);
      topProducts.forEach((p, idx) => {
        logger.log(`  ${idx + 1}. ${p.name}: ${p.total_sold} vendus, ${p.order_count} commandes`);
      });
      
      // 3. Codes promo actifs
      const [activePromos] = await connection.query(`
        SELECT code, discount_value, discount_type, description, valid_until
        FROM promo_codes
        WHERE is_active = 1 AND (valid_until IS NULL OR valid_until > NOW())
        ORDER BY discount_value DESC
        LIMIT 3
      `);
      
      // 4. Statistiques des événements (prochaines commandes programmées ou stats générales)
      const [upcomingOrders] = await connection.query(`
        SELECT COUNT(*) as pending_orders
        FROM orders
        WHERE status = 'pending'
      `);
      
      // 5. Heures de pointe (pour suggestions d'événements)
      const [peakHours] = await connection.query(`
        SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as order_count
        FROM orders
        WHERE status != 'cancelled'
        GROUP BY HOUR(created_at)
        ORDER BY order_count DESC
        LIMIT 3
      `);
      
      logger.log('📤 Envoi de la réponse avec', topProducts.length, 'produits');
      
      res.json({
        success: true,
        data: {
          totalOrders: ordersCount[0]?.total || 0,
          topProducts: topProducts.map(p => {
            const mapped = {
              id: p.id,
              name: p.name,
              description: p.description,
              price: parseFloat(p.price) || 0,
              image_url: p.image_url,
              orderCount: parseInt(p.order_count) || 0,
              totalSold: parseInt(p.total_sold) || 0
            };
            logger.log(`  ✓ ${mapped.name}: ${mapped.totalSold} vendus`);
            return mapped;
          }),
          activePromos: activePromos.map(promo => ({
            code: promo.code,
            discount: parseInt(promo.discount_value),
            discountType: promo.discount_type,
            description: promo.description,
            validUntil: promo.valid_until
          })),
          pendingOrders: upcomingOrders[0]?.pending_orders || 0,
          peakHours: peakHours.map(h => ({
            hour: h.hour,
            orderCount: parseInt(h.order_count)
          }))
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('❌ Erreur stats home:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// ================================================================
// ROUTES ACTUALITÉS (NEWS)
// ================================================================

// Récupérer toutes les actualités (publique)
app.get('/api/home/news', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [news] = await connection.query(`
        SELECT id, title, description, date, image_url, icon, gradient, bg_pattern as bgPattern, \`order\`, is_active, is_new
        FROM news
        WHERE is_active = TRUE
        ORDER BY \`order\` ASC, created_at DESC
      `);
      
      res.json({
        success: true,
        data: news
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('❌ Erreur récupération actualités:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des actualités'
    });
  }
});

// Créer une actualité (Admin/Manager)
app.post('/api/admin/news', authenticateToken, requireManager, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { title, description, date, image_url, icon, gradient, bgPattern, order, is_new } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Le titre est requis' });
    }
    
    const [result] = await connection.query(`
      INSERT INTO news (title, description, date, image_url, icon, gradient, bg_pattern, \`order\`, is_new)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description || null, date || null, image_url || null, icon && icon !== '' ? icon : null, gradient && gradient !== '' ? gradient : 'from-emerald-400 via-teal-500 to-cyan-600', bgPattern || null, order || 0, is_new === true || is_new === 1 || is_new === 'true' ? true : false]);
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Actualité créée avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    await connection.rollback();
    logger.error('❌ Erreur création actualité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'actualité'
    });
  } finally {
    connection.release();
  }
});

// Mettre à jour une actualité (Admin/Manager)
app.put('/api/admin/news/:id', authenticateToken, requireManager, csrfProtection, validateId, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    logger.log('📝 PUT /api/admin/news/:id - Début');
    logger.log('  - ID paramètre:', req.params.id);
    logger.log('  - Body reçu:', JSON.stringify(req.body, null, 2));
    
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { title, description, date, image_url, icon, gradient, bgPattern, order, is_active, is_new } = req.body;
    
    // Vérifier que l'actualité existe
    const [existingNews] = await connection.query('SELECT id FROM news WHERE id = ?', [id]);
    if (existingNews.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        error: `Actualité avec l'ID ${id} non trouvée` 
      });
    }
    
    const updateFields = [];
    const values = [];
    
    if (title !== undefined) { updateFields.push('title = ?'); values.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); values.push(description); }
    if (date !== undefined) { updateFields.push('date = ?'); values.push(date !== null && date !== '' ? date : null); }
    if (image_url !== undefined) { updateFields.push('image_url = ?'); values.push(image_url !== null && image_url !== '' ? image_url : null); }
    if (icon !== undefined) { updateFields.push('icon = ?'); values.push(icon !== null && icon !== '' ? icon : null); }
    if (gradient !== undefined) { updateFields.push('gradient = ?'); values.push(gradient !== null && gradient !== '' ? gradient : null); }
    if (bgPattern !== undefined) { updateFields.push('bg_pattern = ?'); values.push(bgPattern !== null && bgPattern !== '' ? bgPattern : null); }
    if (order !== undefined) { updateFields.push('`order` = ?'); values.push(order); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); values.push(is_active); }
    if (req.body.is_new !== undefined) { 
      const isNewValue = req.body.is_new === true || req.body.is_new === 1 || req.body.is_new === 'true';
      updateFields.push('is_new = ?'); 
      values.push(isNewValue); 
    }
    
    if (updateFields.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: 'Aucune donnée à mettre à jour' });
    }
    
    values.push(id);
    
    logger.log('📝 Requête SQL:', `UPDATE news SET ${updateFields.join(', ')} WHERE id = ?`);
    logger.log('📝 Valeurs:', values);
    
    await connection.query(`
      UPDATE news
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, values);
    
    await connection.commit();
    
    logger.log('✅ Actualité modifiée avec succès');
    
    res.json({
      success: true,
      message: 'Actualité modifiée avec succès'
    });
  } catch (error) {
    await connection.rollback();
    logger.error('❌ Erreur modification actualité:', error);
    logger.error('  - Message:', error.message);
    logger.error('  - Code:', error.code);
    logger.error('  - Stack:', error.stack);
    logger.error('  - Données reçues:', req.body);
    logger.error('  - ID:', req.params.id);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la modification de l\'actualité',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    connection.release();
  }
});

// Supprimer une actualité (Admin/Manager)
app.delete('/api/admin/news/:id', authenticateToken, requireManager, csrfProtection, validateId, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    
    await connection.query('DELETE FROM news WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Actualité supprimée avec succès'
    });
  } catch (error) {
    logger.error('❌ Erreur suppression actualité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'actualité'
    });
  } finally {
    connection.release();
  }
});

// Test route pour vérifier que les routes news fonctionnent
app.get('/api/admin/news/test', authenticateToken, requireManager, (req, res) => {
  res.json({ success: true, message: 'Route news accessible' });
});

// Route upload-image déplacée juste avant app.listen() pour éviter les problèmes d'ordre

// ================================================================
// ROUTES INVENTAIRE
// ================================================================

// GET - Récupérer tous les articles d'inventaire (matières premières)
app.get('/api/inventory', authenticateToken, async (req, res) => {
  logger.log('📦 GET /api/inventory - Récupération inventaire (matières premières)');
  try {
    const [inventory] = await pool.query(`
      SELECT 
        i.id,
        i.name,
        COALESCE(i.category_inventory, 'Autres') as category,
        i.quantity,
        i.price_per_unit as price,
        COALESCE(i.min_quantity, 0) as minQuantity,
        i.unit,
        i.supplier,
        i.description,
        i.created_at as dateAdded,
        CASE 
          WHEN i.quantity = 0 THEN 'out'
          WHEN i.quantity <= COALESCE(i.min_quantity, 0) THEN 'low'
          ELSE 'available'
        END as status
      FROM ingredients i
      WHERE i.deleted_at IS NULL
      ORDER BY i.name ASC
    `);
    
    logger.log(`✅ ${inventory.length} matières premières récupérées`);
    res.json({ 
      success: true, 
      data: inventory 
    });
  } catch (error) {
    logger.error('❌ Erreur récupération inventaire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'inventaire' 
    });
  }
});

// POST - Ajouter un ingrédient (matière première)
app.post('/api/inventory', authenticateToken, requireAdmin, async (req, res) => {
  logger.log('📦 POST /api/inventory - Ajout ingrédient (matière première)');
  const { name, category, quantity, price, minQuantity, unit, supplier, description } = req.body;
  
  try {
    // Validation des données
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le nom et la catégorie sont obligatoires' 
      });
    }

    // Valider la catégorie d'inventaire
    const validInventoryCategories = ['Surgelé', 'Frais', 'Autres'];
    if (!validInventoryCategories.includes(category)) {
      logger.error('❌ Catégorie d\'inventaire non valide:', category);
      return res.status(400).json({ 
        success: false, 
        error: `Catégorie "${category}" non valide. Catégories valides: ${validInventoryCategories.join(', ')}` 
      });
    }

    // Générer un slug unique à partir du nom
    let baseSlug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Vérifier si le slug existe déjà dans ingredients
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await pool.query('SELECT id FROM ingredients WHERE slug = ?', [slug]);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    logger.log('   Nom:', name);
    logger.log('   Slug généré:', slug);
    logger.log('   Catégorie inventaire:', category);
    logger.log('   Unité:', unit || 'kg');
    
    // Calculer automatiquement le statut en fonction de la quantité
    const qty = quantity || 0;
    const isAvailable = qty > 0 ? 1 : 0;
    logger.log('   Quantité:', qty, '→ Statut:', isAvailable ? 'disponible' : 'rupture');
    
    const [result] = await pool.query(
      `INSERT INTO ingredients (
        name, 
        slug, 
        category_inventory,
        quantity, 
        unit,
        price_per_unit, 
        min_quantity, 
        supplier,
        description,
        is_available,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        slug,
        category,
        qty,
        unit || 'kg',
        price || 0,
        minQuantity || 0,
        supplier || '',
        description || 'Ingrédient ajouté depuis l\'inventaire',
        isAvailable
      ]
    );
    
    logger.log('✅ Ingrédient ajouté, ID:', result.insertId);
    res.json({ 
      success: true, 
      message: 'Ingrédient ajouté avec succès' 
    });
  } catch (error) {
    logger.error('❌ Erreur ajout ingrédient:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de l\'ajout de l\'ingrédient' 
    });
  }
});

// PUT - Modifier un ingrédient (matière première)
app.put('/api/inventory/:id', authenticateToken, requireAdmin, csrfProtection, validateId, async (req, res) => {
  logger.log('📦 PUT /api/inventory/:id - Modification ingrédient');
  const { id } = req.params;
  const { name, category, quantity, price, minQuantity, unit, supplier, description } = req.body;
  
  try {
    const [existing] = await pool.query(
      `SELECT * FROM ingredients WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ingrédient non trouvé' 
      });
    }

    const currentIngredient = existing[0];

    // Si c'est juste une mise à jour de quantité (depuis les boutons +/-)
    if (quantity !== undefined && !name && !category) {
      logger.log(`📦 MAJ quantité uniquement: ${currentIngredient.name} → ${quantity}`);
      
      // Calculer le statut automatiquement en fonction de la quantité
      const isAvailable = quantity > 0 ? 1 : 0;
      
      await pool.query(
        `UPDATE ingredients 
         SET quantity = ?, is_available = ?, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [quantity, isAvailable, id]
      );
      
      logger.log(`✅ Quantité mise à jour, ID: ${id}, Statut: ${isAvailable ? 'disponible' : 'rupture'}`);
      return res.json({ 
        success: true, 
        message: 'Quantité mise à jour avec succès' 
      });
    }

    // Mise à jour complète - valider les champs requis
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le nom et la catégorie sont obligatoires pour une modification complète' 
      });
    }

    // Valider la catégorie d'inventaire
    const validInventoryCategories = ['Surgelé', 'Frais', 'Autres'];
    if (!validInventoryCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: `Catégorie "${category}" non valide. Catégories valides: ${validInventoryCategories.join(', ')}` 
      });
    }

    // Générer un nouveau slug si le nom change
    let baseSlug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Vérifier unicité (sauf pour l'ingrédient actuel)
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await pool.query('SELECT id FROM ingredients WHERE slug = ? AND id != ?', [slug, id]);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Calculer automatiquement le statut en fonction de la quantité
    const qty = quantity || 0;
    const isAvailable = qty > 0 ? 1 : 0;
    logger.log(`   Quantité: ${qty} → Statut: ${isAvailable ? 'disponible' : 'rupture'}`);
    
    await pool.query(
      `UPDATE ingredients 
       SET name = ?, slug = ?, category_inventory = ?, quantity = ?, unit = ?, price_per_unit = ?, min_quantity = ?, 
           supplier = ?, description = ?, is_available = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [name, slug, category, qty, unit || 'kg', price || 0, minQuantity || 0, supplier || '', description || '', isAvailable, id]
    );
    
    logger.log('✅ Ingrédient modifié, ID:', id);
    res.json({ 
      success: true, 
      message: 'Ingrédient modifié avec succès' 
    });
  } catch (error) {
    logger.error('❌ Erreur modification ingrédient:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la modification de l\'ingrédient' 
    });
  }
});

// DELETE - Supprimer un ingrédient (soft delete)
app.delete('/api/inventory/:id', authenticateToken, requireAdmin, csrfProtection, validateId, async (req, res) => {
  logger.log('📦 DELETE /api/inventory/:id - Suppression ingrédient');
  const { id } = req.params;
  
  try {
    const [existing] = await pool.query('SELECT name FROM ingredients WHERE id = ? AND deleted_at IS NULL', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ingrédient non trouvé' 
      });
    }
    
    // Soft delete
    await pool.query('UPDATE ingredients SET deleted_at = NOW() WHERE id = ?', [id]);
    
    logger.log('✅ Ingrédient supprimé (soft delete), ID:', id);
    res.json({ 
      success: true, 
      message: 'Ingrédient supprimé avec succès' 
    });
  } catch (error) {
    logger.error('❌ Erreur suppression ingrédient:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la suppression de l\'ingrédient' 
    });
  }
});

// ✅ OPTIMISATION: GET - Récupérer les catégories de produits - Avec cache
app.get('/api/products/categories', asyncHandler(async (req, res) => {
  const cacheKey = 'products:categories:names';
  
  // Vérifier le cache
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return res.json(cached);
  }
  
  const [categories] = await pool.query(`
    SELECT name 
    FROM categories 
    ORDER BY name ASC
  `);
  
  const categoryList = categories.map(c => c.name);
  const response = { 
    success: true, 
    data: categoryList 
  };
  
  // Mettre en cache
  cache.set(cacheKey, response);
  
  logger.debug('Product categories fetched from DB', { count: categoryList.length });
  res.json(response);
}));

// ================================================================
// ROUTES LISTE DE COURSES (SHOPPING LIST)
// ================================================================

// GET - Récupérer la liste de courses
app.get('/api/shopping-list', authenticateToken, async (req, res) => {
  logger.log('🛒 GET /api/shopping-list - Récupération liste de courses');
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        sl.id,
        sl.ingredient_id,
        sl.quantity_needed,
        sl.unit,
        sl.added_at,
        sl.status,
        sl.notes,
        sl.priority,
        i.name as ingredient_name,
        i.category_inventory as category,
        i.min_quantity
      FROM shopping_list sl
      JOIN ingredients i ON i.id = sl.ingredient_id
      WHERE i.deleted_at IS NULL
    `;
    const params = [];
    
    if (status) {
      query += ' AND sl.status = ?';
      params.push(status);
    } else {
      query += ' AND sl.status = "pending"';
    }
    
    query += ` ORDER BY 
      CASE sl.priority
        WHEN "urgent" THEN 1
        WHEN "high" THEN 2
        WHEN "medium" THEN 3
        WHEN "low" THEN 4
      END,
      sl.added_at ASC`;
    
    const [items] = await pool.query(query, params);
    
    logger.log(`✅ ${items.length} articles dans la liste de courses`);
    res.json({ 
      success: true, 
      data: items 
    });
  } catch (error) {
    logger.error('❌ Erreur récupération liste de courses:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la liste de courses' 
    });
  }
});

// POST - Ajouter un produit à la liste de courses
app.post('/api/shopping-list/add', authenticateToken, async (req, res) => {
  logger.log('🛒 POST /api/shopping-list/add - Ajout à la liste');
  const { ingredient_id, quantity_needed, notes, priority = 'medium' } = req.body;
  
  try {
    // Validation
    if (!ingredient_id || !quantity_needed || quantity_needed <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ingredient_id et quantity_needed sont obligatoires (quantity_needed > 0)' 
      });
    }
    
    // Vérifier que l'ingrédient existe
    const [ingredient] = await pool.query(
      'SELECT id, name, unit, min_quantity FROM ingredients WHERE id = ? AND deleted_at IS NULL',
      [ingredient_id]
    );
    
    if (ingredient.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ingrédient non trouvé' 
      });
    }
    
    // Vérifier si déjà dans la liste avec statut pending
    const [existing] = await pool.query(
      'SELECT id FROM shopping_list WHERE ingredient_id = ? AND status = "pending"',
      [ingredient_id]
    );
    
    if (existing.length > 0) {
      // Mettre à jour la quantité si déjà présent
      await pool.query(
        'UPDATE shopping_list SET quantity_needed = quantity_needed + ?, updated_at = NOW() WHERE id = ?',
        [quantity_needed, existing[0].id]
      );
      logger.log('✅ Quantité mise à jour pour ingrédient existant, ID:', existing[0].id);
      return res.json({ 
        success: true, 
        message: 'Quantité mise à jour dans la liste',
        data: { id: existing[0].id, updated: true }
      });
    }
    
    // Ajouter à la liste
    const [result] = await pool.query(
      `INSERT INTO shopping_list 
       (ingredient_id, quantity_needed, unit, notes, priority) 
       VALUES (?, ?, ?, ?, ?)`,
      [ingredient_id, quantity_needed, ingredient[0].unit || null, notes || null, priority]
    );
    
    logger.log('✅ Produit ajouté à la liste de courses, ID:', result.insertId);
    res.json({ 
      success: true, 
      message: 'Produit ajouté à la liste de courses',
      data: { id: result.insertId }
    });
  } catch (error) {
    logger.error('❌ Erreur ajout à la liste:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de l\'ajout à la liste de courses' 
    });
  }
});
// POST - Ajouter automatiquement les produits sous stock_min
app.post('/api/shopping-list/auto-add-low-stock', authenticateToken, async (req, res) => {
  logger.log('🛒 POST /api/shopping-list/auto-add-low-stock - Ajout automatique');
  try {
    // Trouver tous les ingrédients en rupture ou en stock bas
    // - Produits en rupture (quantity = 0)
    // - Produits en stock bas (quantity <= min_quantity ET min_quantity > 0)
    const [lowStockItems] = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.quantity,
        i.min_quantity,
        i.unit,
        CASE 
          WHEN i.quantity = 0 THEN COALESCE(i.min_quantity, 1)
          WHEN i.quantity < i.min_quantity AND i.min_quantity > 0 THEN (i.min_quantity - i.quantity)
          ELSE 0
        END as quantity_needed
      FROM ingredients i
      WHERE i.deleted_at IS NULL
        AND (
          i.quantity = 0 
          OR (i.quantity <= i.min_quantity AND i.min_quantity > 0)
        )
    `);
    
    if (lowStockItems.length === 0) {
      return res.json({ 
        success: true, 
        message: 'Aucun produit en rupture ou en stock bas',
        added: 0,
        data: []
      });
    }
    
    let addedCount = 0;
    const addedItems = [];
    
    for (const item of lowStockItems) {
      // Vérifier si déjà dans la liste
      const [existing] = await pool.query(
        'SELECT id FROM shopping_list WHERE ingredient_id = ? AND status = "pending"',
        [item.id]
      );
      
      // Vérifier que quantity_needed est valide (peut être décimal)
      const quantityNeeded = parseFloat(item.quantity_needed) || 0;
      if (existing.length === 0 && quantityNeeded > 0) {
        // Déterminer la priorité
        let priority = 'medium';
        if (item.quantity === 0) {
          // Produit en rupture = urgent
          priority = 'urgent';
        } else if (item.min_quantity > 0) {
          const ratio = item.quantity / item.min_quantity;
          if (ratio < 0.3) priority = 'high';
          else if (ratio < 0.5) priority = 'medium';
          else priority = 'low';
        } else {
          // Produit sans min_quantity mais en rupture
          priority = 'urgent';
        }
        
        await pool.query(
          `INSERT INTO shopping_list 
           (ingredient_id, quantity_needed, unit, priority) 
           VALUES (?, ?, ?, ?)`,
          [item.id, quantityNeeded, item.unit || null, priority]
        );
        addedCount++;
        addedItems.push({
          ingredient_id: item.id,
          name: item.name,
          quantity_needed: item.quantity_needed,
          status: item.quantity === 0 ? 'rupture' : 'stock_bas'
        });
      }
    }
    
    const ruptureCount = addedItems.filter(item => item.status === 'rupture').length;
    const stockBasCount = addedItems.filter(item => item.status === 'stock_bas').length;
    
    let message = `${addedCount} produit(s) ajouté(s) automatiquement`;
    if (ruptureCount > 0 && stockBasCount > 0) {
      message += ` (${ruptureCount} en rupture, ${stockBasCount} en stock bas)`;
    } else if (ruptureCount > 0) {
      message += ` (${ruptureCount} en rupture)`;
    } else if (stockBasCount > 0) {
      message += ` (${stockBasCount} en stock bas)`;
    }
    
    logger.log(`✅ ${addedCount} produits ajoutés automatiquement (${ruptureCount} rupture, ${stockBasCount} stock bas)`);
    res.json({ 
      success: true, 
      message: message,
      added: addedCount,
      data: addedItems
    });
  } catch (error) {
    logger.error('❌ Erreur ajout automatique:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de l\'ajout automatique' 
    });
  }
});

// PUT - Mettre à jour un item de la liste
app.put('/api/shopping-list/:id', authenticateToken, csrfProtection, validateId, async (req, res) => {
  logger.log('🛒 PUT /api/shopping-list/:id - Mise à jour item');
  const { id } = req.params;
  const { quantity_needed, notes, priority, status } = req.body;
  
  try {
    const [existing] = await pool.query(
      'SELECT * FROM shopping_list WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Item non trouvé dans la liste' 
      });
    }
    
    const updates = [];
    const params = [];
    
    if (quantity_needed !== undefined) {
      updates.push('quantity_needed = ?');
      params.push(quantity_needed);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aucune donnée à mettre à jour' 
      });
    }
    
    updates.push('updated_at = NOW()');
    params.push(id);
    
    await pool.query(
      `UPDATE shopping_list SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    logger.log('✅ Item mis à jour, ID:', id);
    res.json({ 
      success: true, 
      message: 'Item mis à jour avec succès' 
    });
  } catch (error) {
    logger.error('❌ Erreur mise à jour item:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la mise à jour' 
    });
  }
});

// DELETE - Supprimer un item de la liste
app.delete('/api/shopping-list/:id', authenticateToken, csrfProtection, validateId, async (req, res) => {
  logger.log('🛒 DELETE /api/shopping-list/:id - Suppression item');
  const { id } = req.params;
  
  try {
    const [existing] = await pool.query(
      'SELECT * FROM shopping_list WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Item non trouvé' 
      });
    }
    
    await pool.query('DELETE FROM shopping_list WHERE id = ?', [id]);
    
    logger.log('✅ Item supprimé, ID:', id);
    res.json({ 
      success: true, 
      message: 'Item supprimé de la liste' 
    });
  } catch (error) {
    logger.error('❌ Erreur suppression item:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la suppression' 
    });
  }
});

// POST - Marquer comme commandé
app.post('/api/shopping-list/:id/mark-ordered', authenticateToken, async (req, res) => {
  logger.log('🛒 POST /api/shopping-list/:id/mark-ordered');
  const { id } = req.params;
  
  try {
    await pool.query(
      'UPDATE shopping_list SET status = "ordered", updated_at = NOW() WHERE id = ?',
      [id]
    );
    
    logger.log('✅ Item marqué comme commandé, ID:', id);
    res.json({ 
      success: true, 
      message: 'Item marqué comme commandé' 
    });
  } catch (error) {
    logger.error('❌ Erreur:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la mise à jour' 
    });
  }
});

// POST - Marquer comme reçu
app.post('/api/shopping-list/:id/mark-received', authenticateToken, async (req, res) => {
  logger.log('🛒 POST /api/shopping-list/:id/mark-received');
  const { id } = req.params;
  
  try {
    const [item] = await pool.query(
      'SELECT ingredient_id, quantity_needed FROM shopping_list WHERE id = ?',
      [id]
    );
    
    if (item.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Item non trouvé' 
      });
    }
    
    // Mettre à jour le statut et augmenter la quantité de l'ingrédient
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(
        'UPDATE shopping_list SET status = "received", updated_at = NOW() WHERE id = ?',
        [id]
      );
      
      await connection.query(
        'UPDATE ingredients SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?',
        [item[0].quantity_needed, item[0].ingredient_id]
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    logger.log('✅ Item marqué comme reçu et stock mis à jour, ID:', id);
    res.json({ 
      success: true, 
      message: 'Item marqué comme reçu et stock mis à jour' 
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('❌ Erreur:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la mise à jour' 
    });
  }
});

// GET - Export de la liste (CSV, TXT, JSON)
app.get('/api/shopping-list/export', authenticateToken, async (req, res) => {
  logger.log('🛒 GET /api/shopping-list/export - Export liste');
  const { format = 'csv' } = req.query;
  
  try {
    const [items] = await pool.query(`
      SELECT 
        sl.id,
        i.name as ingredient_name,
        sl.quantity_needed,
        sl.unit,
        i.category_inventory as category,
        sl.priority,
        sl.notes,
        sl.added_at
      FROM shopping_list sl
      JOIN ingredients i ON i.id = sl.ingredient_id
      WHERE sl.status = 'pending' AND i.deleted_at IS NULL
      ORDER BY 
        CASE sl.priority
          WHEN "urgent" THEN 1
          WHEN "high" THEN 2
          WHEN "medium" THEN 3
          WHEN "low" THEN 4
        END,
        sl.added_at ASC
    `);
    
    if (format === 'csv') {
      const csv = [
        'Produit,Quantité,Unité,Catégorie,Priorité,Notes,Date d\'ajout',
        ...items.map(item => 
          `"${item.ingredient_name}","${item.quantity_needed}","${item.unit || ''}","${item.category || ''}","${item.priority}","${(item.notes || '').replace(/"/g, '""')}","${new Date(item.added_at).toLocaleDateString('fr-FR')}"`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="liste-courses-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\ufeff' + csv); // BOM UTF-8 pour Excel
    } else if (format === 'txt') {
      // Format simple pour mobile : liste avec tirets
      let txt = '';
      items.forEach(item => {
        txt += `- ${item.ingredient_name}`;
        if (item.quantity_needed) {
          txt += ` (${item.quantity_needed}`;
          if (item.unit) txt += ` ${item.unit}`;
          txt += ')';
        }
        txt += '\n';
      });
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="liste-courses-${new Date().toISOString().split('T')[0]}.txt"`);
      res.send(txt);
    } else {
      // JSON par défaut
      res.json({ 
        success: true, 
        data: items,
        export_date: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('❌ Erreur export:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de l\'export' 
    });
  }
});

// ============================================
// 📊 ANALYTICS DASHBOARD CA - ROUTES AVANCÉES
// ============================================

// 🧁 TOP PRODUITS VENDUS SUR UNE PÉRIODE
app.get('/api/admin/analytics/top-products-period', authenticateToken, async (req, res) => {
  const { startDate, endDate, limit = 8 } = req.query;
  
  logger.log('📊 GET /api/admin/analytics/top-products-period');
  logger.log('   Période:', startDate, '→', endDate);
  logger.log('   Limite:', limit);
  
  try {
    const [topProducts] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.image_url,
        c.name AS category,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.subtotal) AS revenue_ttc,
        SUM(oi.subtotal / 1.10) AS revenue_ht,
        COUNT(DISTINCT o.id) AS total_orders
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ?
    `, [startDate, endDate, parseInt(limit)]);
    
    logger.log(`✅ ${topProducts.length} produits récupérés`);
    
    res.json({
      success: true,
      data: topProducts.map((p, index) => ({
        ...p,
        rank: index + 1,
        total_sold: parseInt(p.total_sold),
        revenue_ttc: parseFloat(p.revenue_ttc),
        revenue_ht: parseFloat(p.revenue_ht),
        total_orders: parseInt(p.total_orders)
      }))
    });
  } catch (error) {
    logger.error('❌ Erreur récupération top products:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des top produits' 
    });
  }
});

// ⏰ HEURES DE POINTE
app.get('/api/admin/analytics/peak-hours', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  logger.log('📊 GET /api/admin/analytics/peak-hours');
  logger.log('   Période:', startDate, '→', endDate);
  
  try {
    const [peakHours] = await pool.query(`
      SELECT 
        HOUR(created_at) AS hour,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_order_value
      FROM orders
      WHERE created_at BETWEEN ? AND ?
        AND status != 'cancelled'
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `, [startDate, endDate]);
    
    // Remplir les heures manquantes avec 0
    const allHours = Array.from({ length: 24 }, (_, i) => {
      const hourData = peakHours.find(h => h.hour === i);
      return {
        hour: i,
        label: `${i}h`,
        total_orders: hourData ? parseInt(hourData.total_orders) : 0,
        total_revenue: hourData ? parseFloat(hourData.total_revenue) : 0,
        avg_order_value: hourData ? parseFloat(hourData.avg_order_value) : 0
      };
    });
    
    logger.log(`✅ Données heures de pointe récupérées (24h)`);
    
    res.json({
      success: true,
      data: allHours
    });
  } catch (error) {
    logger.error('❌ Erreur récupération heures de pointe:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des heures de pointe' 
    });
  }
});

// 📊 RÉPARTITION PAR CATÉGORIE
app.get('/api/admin/analytics/category-distribution', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  logger.log('📊 GET /api/admin/analytics/category-distribution');
  logger.log('   Période:', startDate, '→', endDate);
  
  try {
    const [categoryData] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.icon,
        SUM(oi.subtotal) AS revenue_ttc,
        SUM(oi.subtotal / 1.10) AS revenue_ht,
        SUM(oi.quantity) AS total_quantity,
        COUNT(DISTINCT o.id) AS total_orders
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY revenue_ttc DESC
    `, [startDate, endDate]);
    
    // Calculer le total pour les pourcentages
    const totalRevenue = categoryData.reduce((sum, cat) => sum + parseFloat(cat.revenue_ttc), 0);
    
    const result = categoryData.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      revenue_ttc: parseFloat(cat.revenue_ttc),
      revenue_ht: parseFloat(cat.revenue_ht),
      total_quantity: parseInt(cat.total_quantity),
      total_orders: parseInt(cat.total_orders),
      percentage: totalRevenue > 0 ? (parseFloat(cat.revenue_ttc) / totalRevenue * 100) : 0
    }));
    
    logger.log(`✅ ${result.length} catégories récupérées`);
    logger.log(`   Total CA: ${totalRevenue.toFixed(2)}€`);
    
    res.json({
      success: true,
      data: result,
      total_revenue: totalRevenue
    });
  } catch (error) {
    logger.error('❌ Erreur récupération répartition catégories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la répartition par catégorie' 
    });
  }
});

// ADMIN - LISTE DES COMMANDES PAR PERIODE (détail transactions)
app.get('/api/admin/analytics/orders-period', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    logger.log('📊 GET /api/admin/analytics/orders-period');
    logger.log('   Période:', startDate, '→', endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate et endDate requis (YYYY-MM-DD)' });
    }

    const [orders] = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.created_at,
        o.updated_at,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.status,
        COALESCE((SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id), 0) AS items_count,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      ORDER BY o.created_at DESC
    `, [startDate, endDate + ' 23:59:59']);

    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    logger.error('❌ Erreur orders-period:', error);
    // ✅ SÉCURITÉ: Masquer les détails d'erreur en production
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      ...(isProd ? {} : { details: error.message })
    });
  }
});

// ⚠️ PRODUITS EN STOCK CRITIQUE
app.get('/api/admin/analytics/critical-stock', authenticateToken, async (req, res) => {
  logger.log('📊 GET /api/admin/analytics/critical-stock');
  
  try {
    const [criticalProducts] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.image_url,
        c.name AS category,
        p.stock AS current_stock,
        COALESCE(p.min_stock, 0) AS min_stock,
        CASE 
          WHEN p.stock = 0 THEN 'out'
          WHEN p.stock <= COALESCE(p.min_stock, 0) THEN 'critical'
          WHEN p.stock <= COALESCE(p.min_stock, 0) * 1.5 THEN 'low'
          ELSE 'ok'
        END AS status,
        CASE 
          WHEN p.stock = 0 THEN 100
          WHEN COALESCE(p.min_stock, 0) > 0 THEN 
            GREATEST(0, LEAST(100, (1 - (p.stock / COALESCE(p.min_stock, 1))) * 100))
          ELSE 0
        END AS urgency_level
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.deleted_at IS NULL
        AND (p.stock = 0 OR p.stock <= COALESCE(p.min_stock, 0) * 1.5)
      ORDER BY 
        CASE 
          WHEN p.stock = 0 THEN 0
          WHEN p.stock <= COALESCE(p.min_stock, 0) THEN 1
          ELSE 2
        END,
        p.stock ASC
    `);
    
    logger.log(`✅ ${criticalProducts.length} produits en stock critique`);
    
    res.json({
      success: true,
      data: criticalProducts.map(p => ({
        ...p,
        current_stock: parseInt(p.current_stock),
        min_stock: parseInt(p.min_stock),
        urgency_level: parseFloat(p.urgency_level)
      })),
      total_critical: criticalProducts.filter(p => p.status === 'critical' || p.status === 'out').length,
      total_low: criticalProducts.filter(p => p.status === 'low').length
    });
  } catch (error) {
    logger.error('❌ Erreur récupération stock critique:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des produits en stock critique' 
    });
  }
});

// ================================================================
// ROUTE UPLOAD NEWS (définie juste avant le démarrage du serveur)
// ================================================================
logger.log('📝 Enregistrement de la route /api/admin/news/upload-image...');
try {
  app.post('/api/admin/news/upload-image', authenticateToken, requireManager, csrfProtection, uploadNews.single('image'), validateNewsMagicBytes, async (req, res) => {
    try {
      logger.log('📸 Upload image actualité - Requête reçue');
      
      if (!req.file) {
        logger.error('❌ Aucun fichier reçu');
        return res.status(400).json({ success: false, error: 'Aucune image fournie' });
      }

      logger.log('  - File:', req.file.originalname);
      logger.log('  - User:', req.user ? `${req.user.role} (ID: ${req.user.id})` : 'Non authentifié');

      // S'assurer que le dossier existe
      const newsUploadsDir = path.join(__dirname, '../public/uploads/news');
      if (!fs.existsSync(newsUploadsDir)) {
        fs.mkdirSync(newsUploadsDir, { recursive: true });
        logger.log('📁 Dossier news créé:', newsUploadsDir);
      }

      const imageUrl = `/uploads/news/${req.file.filename}`;
      const fullPath = path.join(newsUploadsDir, req.file.filename);
      
      // Vérifier que le fichier existe bien
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Fichier non trouvé après upload: ${fullPath}`);
      }
      
      logger.log('✅ Image actualité uploadée:', imageUrl);
      logger.log('  - Chemin complet:', fullPath);
      logger.log('  - Taille:', req.file.size, 'bytes');
      
      res.json({
        success: true,
        message: 'Image uploadée avec succès',
        imageUrl: imageUrl
      });
    } catch (error) {
      logger.error('❌ Erreur upload image actualité:', error);
      logger.error('  - Stack:', error.stack);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Erreur lors de l\'upload',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  logger.log('✅ Route /api/admin/news/upload-image enregistrée');
} catch (error) {
  logger.error('❌ ERREUR lors de l\'enregistrement de la route:', error);
}

// ================================================================
// DÉMARRAGE DU SERVEUR
// ================================================================

// Vérifier que la route upload-image est bien enregistrée
logger.log('🔍 Vérification des routes news...');
const routes = [];
app._router?.stack?.forEach((middleware) => {
  if (middleware.route) {
    const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
    const path = middleware.route.path;
    routes.push({ method: methods, path });
    if (path.includes('/news/upload-image')) {
      logger.log(`  ✅ Route trouvée: ${methods} ${path}`);
    }
  }
});

if (!routes.some(r => r.path === '/api/admin/news/upload-image')) {
  logger.error('  ❌ ERREUR: Route /api/admin/news/upload-image non trouvée !');
  logger.error('  Routes news trouvées:');
  routes.filter(r => r.path.includes('/news')).forEach(r => {
    logger.error(`    ${r.method} ${r.path}`);
  });
}

// ================================================================
// WEBSOCKET - Gestion des connexions et événements
// ================================================================
io.on('connection', (socket) => {
  logger.log(`[WebSocket] Client connecté: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.log(`[WebSocket] Client déconnecté: ${socket.id}`);
  });
});

// Fonction helper pour émettre des événements WebSocket
const emitOrderUpdate = (event, data) => {
  io.emit(event, data);
  logger.log(`[WebSocket] Événement émis: ${event}`);
};

// Exporter pour utilisation dans les routes
app.emitOrderUpdate = emitOrderUpdate;

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.log('');
  logger.log('========================================');
  logger.log(`🌸 Blossom Café - API Admin`);
  logger.log('========================================');
  logger.log(`✅ Serveur démarré sur http://0.0.0.0:${PORT}`);
  logger.log(`✅ Accessible via http://localhost:${PORT}`);
  logger.log(`✅ Accessible via http://127.0.0.1:${PORT}`);
  logger.log(`📊 Base de données: ${config.database.database}`);
  logger.log(`🔌 MySQL: ${config.database.host}:${config.database.port}`);
  logger.log(`🔐 CORS: Activé pour toutes les origines localhost`);
  logger.log(`⚡ WebSocket: Activé pour mises à jour temps réel`);
  logger.log('');
  logger.log('🔐 Routes Admin (requiert authentification):');
  logger.log('  GET/POST/PUT/DELETE /api/admin/users');
  logger.log('  GET/POST/PUT/DELETE /api/admin/categories');
  logger.log('  GET/POST/PUT/DELETE /api/admin/products');
  logger.log('  GET/POST/PUT/DELETE /api/admin/promo-codes');
  logger.log('  GET                 /api/admin/orders');
  logger.log('  GET                 /api/admin/orders/:id');
  logger.log('  PUT                 /api/admin/orders/:id/status');
  logger.log('  GET/PUT             /api/admin/settings');
  logger.log('  GET                 /api/admin/dashboard');
  logger.log('  GET                 /api/admin/analytics/sales');
  logger.log('  GET                 /api/admin/analytics/top-products');
  logger.log('  GET                 /api/admin/analytics/revenue-by-category');
  logger.log('  GET                 /api/stats/revenue');
  logger.log('  GET                 /api/stats/revenue/quick');
  logger.log('');
  logger.log('👔 Routes Manager:');
  logger.log('  GET                 /api/manager/today-orders');
  logger.log('  GET                 /api/manager/today-stats');
  logger.log('');
  logger.log('🖥️  Routes Kiosk (bornes tactiles):');
  logger.log('  POST                /api/kiosk/login');
  logger.log('  GET                 /api/kiosk/categories');
  logger.log('  GET                 /api/kiosk/products');
  logger.log('  POST                /api/kiosk/orders');
  logger.log('  GET                 /api/kiosk/orders/:orderNumber');
  logger.log('');
  logger.log('🔓 Routes publiques:');
  logger.log('  POST                /api/auth/login');
  logger.log('  POST                /api/auth/register');
  logger.log('');
  logger.log('🎁 Routes Fidélité:');
  logger.log('  POST                /api/loyalty/deduct');
  logger.log('');
  logger.log('Appuyez sur Ctrl+C pour arrêter');
  logger.log('========================================');
  logger.log('');
});

// ✅ SÉCURITÉ: Middleware pour les routes non trouvées (404)
// Doit être placé APRÈS toutes les routes mais AVANT errorHandler
app.use(notFoundHandler);

// ✅ SÉCURITÉ: Middleware de gestion d'erreurs centralisé
// Doit être le DERNIER middleware dans la chaîne
app.use(errorHandler);

process.on('unhandledRejection', (err) => {
  logger.error(err, { type: 'unhandledRejection' });
  // En production, on peut vouloir redémarrer le serveur
  if (isProd) {
    logger.error('❌ Unhandled Rejection détecté, arrêt du serveur...');
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.error(err, { type: 'uncaughtException' });
  // Les exceptions non capturées sont critiques, arrêter le serveur
  logger.error('❌ Uncaught Exception détectée, arrêt du serveur...');
  process.exit(1);
});