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
  requireRole,
  requireAdmin, // ✅ Import du middleware requireAdmin (inclut gestion bypass dev et vérifications)
  requireManager, // ✅ Import du middleware requireManager (inclut gestion bypass dev et vérifications)
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
// ✅ Port 3050: Écran de Cuisine (KitchenApp.jsx)
const allowedOrigins = (isProd
  ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
  : [
      'http://localhost:3000',      // Application principale
      'http://localhost:3010',      // Kiosk
      'http://localhost:3050'       // Écran de Cuisine
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
// ⚠️ CRITIQUE: CORS DOIT ÊTRE AVANT HELMET pour éviter les conflits de headers
// Configuration CORS complète avec tous les headers personnalisés
app.use(cors({
  origin: (origin, callback) => {
    if (isProd && !origin) {
      logger.security('CORS blocked - No origin', {});
      return callback(new Error('CORS: Origin requise en production'));
    }
    if (!origin && !isProd) {
      return callback(null, true);
    }
    const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
    if (normalizedOrigin && allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      logger.security('CORS blocked', { origin, allowedOrigins });
      callback(new Error(`CORS: Origine non autorisée: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-CSRF-Token', 
    'X-Dev-Bypass-Secret',
    'X-User-Role',
    'x-user-role',
    'X-User-Id',
    'x-user-id',
    'X-User-Email',
    'x-user-email',
    'X-User-Is-Admin',
    'x-user-is-admin',
    'X-User-Is-Guest',
    'x-user-is-guest'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-CSRF-Token'],
  maxAge: isProd ? 86400 : 0,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handler OPTIONS explicite pour toutes les routes (preflight)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (!origin && !isProd) {
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
    if (normalizedOrigin && allowedOrigins.includes(normalizedOrigin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Dev-Bypass-Secret, X-User-Role, x-user-role, X-User-Id, x-user-id, X-User-Email, x-user-email, X-User-Is-Admin, x-user-is-admin, X-User-Is-Guest, x-user-is-guest');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', isProd ? '86400' : '0');
  res.sendStatus(204);
});

// Appliquer Helmet pour les headers de sécurité (APRÈS CORS)
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
 * ✅ MIGRATION SUPABASE: N'utilise plus de connexion MySQL
 * @returns {Promise<string>} - Numéro de commande au format CMD-XXXX
 */
async function generateOrderNumber() {
  try {
    logger.log('🔢 [generateOrderNumber] Début de la génération séquentielle...');
    
    // ✅ SUPABASE: Récupérer le dernier numéro de commande au format CMD-XXXX
    const [allOrdersData] = await supabaseService.select('orders', {
      select: 'order_number',
      orderBy: 'id DESC'
    });
    
    // Filtrer les commandes au format CMD-XXXX et extraire le numéro
    const cmdOrders = (allOrdersData || []).filter(order => 
      order.order_number && /^CMD-\d{4}$/.test(order.order_number)
    );
    
    let nextNumber = 1;
    
    if (cmdOrders.length > 0) {
      // Extraire le numéro du dernier order_number (ex: CMD-0001 -> 1)
      const lastNumberStr = cmdOrders[0].order_number.replace('CMD-', '');
      const lastNumber = parseInt(lastNumberStr, 10);
      
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    // Formater avec padding de 4 chiffres (CMD-0001, CMD-0002, etc.)
    const orderNumber = `CMD-${String(nextNumber).padStart(4, '0')}`;
    
    // ✅ SUPABASE: Vérifier l'unicité (sécurité supplémentaire)
    const [existingData] = await supabaseService.select('orders', {
      where: { order_number: orderNumber },
      select: 'id'
    });
    
    if (existingData && existingData.length > 0) {
      // Collision détectée, incrémenter
      logger.warn('⚠️ Collision détectée, incrémentation...');
      return generateOrderNumber();
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
    // ✅ SUPABASE: En cas d'erreur, utiliser un fallback séquentiel basique
    const [countResult] = await supabaseService.count('orders', {});
    const fallbackNumber = `CMD-${String((countResult?.count || 0) + 1).padStart(4, '0')}`;
    logger.error('   ⚠️ Utilisation du fallback séquentiel:', fallbackNumber);
    return fallbackNumber;
  }
}

// ❌ CONFIGURATION CORS SUPPRIMÉE - Déplacée avant Helmet pour éviter les conflits

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
      // ✅ SUPABASE: Test de connexion
      await supabaseService.ping();
      
      // ✅ SUPABASE: Pas de information_schema (spécifique MySQL)
      // Supabase utilise une structure différente pour les métadonnées
      res.json({
        success: true,
        database: {
          name: 'Supabase',
          ok: true,
          type: 'Supabase',
          url: process.env.SUPABASE_URL ? 'Configuré' : 'Non configuré'
        }
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

// ✅ SUPPRIMÉ: Les middlewares requireAdmin et requireManager sont maintenant importés depuis security-middleware.js
// Ils incluent les vérifications de sécurité, le bypass dev, et la gestion des erreurs appropriées

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
  
  try {
    // ✅ MIGRATION SUPABASE: Utiliser Supabase directement avec relations
    const supabase = pool.getClient();
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          icon,
          display_order
        )
      `)
      .eq('is_available', 1) // Supabase utilise 1 pour true (SMALLINT)
      .order('display_order', { foreignTable: 'categories', ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      logger.error('❌ Erreur récupération produits:', error);
      throw error;
    }
    
    // Transformer les produits pour inclure les données de catégorie au format attendu
    const transformedProducts = (products || []).map(product => {
      const category = Array.isArray(product.categories)
        ? product.categories[0]
        : product.categories;
      
      return {
        ...product,
        category_name: category?.name || null,
        category_slug: category?.slug || null,
        category_icon: category?.icon || null,
        category_display_order: category?.display_order ?? null
      };
    });
    
    const response = {
      success: true,
      data: transformedProducts
    };
    
    // Mettre en cache
    cache.set(cacheKey, response);
    
    logger.debug('Products fetched from Supabase', { count: transformedProducts.length });
    res.json(response);
  } catch (error) {
    logger.error('❌ Erreur /api/products:', error);
    throw error;
  }
}));

// ✅ OPTIMISATION: Produits complets (pour tout utilisateur authentifié) - Avec cache
// ✅ MIGRATION SUPABASE: Utiliser Supabase pour récupérer tous les produits
app.get('/api/products/all', authenticateToken, asyncHandler(async (req, res) => {
  const cacheKey = 'products:all';
  
  // Vérifier le cache
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return res.json(cached);
  }
  
  // ✅ SUPABASE: Récupérer tous les produits avec catégories
  const supabase = pool.getClient();
  
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name,
        slug,
        display_order
      )
    `)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    logger.error('❌ Erreur récupération produits:', error);
    throw error;
  }

  // Transformer les produits pour inclure category_name et category_slug
  const transformedProducts = (products || []).map(product => {
    const category = Array.isArray(product.categories)
      ? product.categories[0]
      : product.categories;
    
    return {
      ...product,
      category_name: category?.name || null,
      category_slug: category?.slug || null
    };
  });

  const response = {
    success: true,
    data: transformedProducts
  };
  
  // Mettre en cache
  cache.set(cacheKey, response);
  
  logger.debug('All products fetched from Supabase', { count: transformedProducts.length });
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
  
  try {
    // ✅ MIGRATION SUPABASE: Utiliser Supabase directement
    const supabase = pool.getClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', 1) // Supabase utilise 1 pour true (SMALLINT)
      .order('display_order', { ascending: true });
    
    if (error) {
      logger.error('❌ Erreur récupération catégories:', error);
      throw error;
    }
    
    const response = {
      success: true,
      data: categories || []
    };
    
    // Mettre en cache
    cache.set(cacheKey, response);
    
    logger.debug('Categories fetched from Supabase', { count: categories?.length || 0 });
    res.json(response);
  } catch (error) {
    logger.error('❌ Erreur /api/categories:', error);
    throw error;
  }
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
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      logger.warn('Login attempt with missing credentials', { ip: req.ip });
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    logger.debug('Login attempt', { 
      normalizedEmail: logger.sanitizeEmail(normalizedEmail),
      hasPassword: !!password,
      poolType: typeof pool,
      hasGetClient: typeof pool.getClient === 'function'
    });

    // ✅ SUPABASE: Utiliser directement Supabase au lieu de parser SQL MySQL
    let user = null;
    let users = [];
    
    if (typeof pool.getClient === 'function') {
      // Utiliser Supabase directement (plus fiable que parser SQL)
      const supabase = pool.getClient();
      logger.debug('Using Supabase client for login query');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('is_active', 1) // ✅ CORRECTION: Supabase utilise smallint (0 ou 1), pas boolean
        .maybeSingle();
      
      logger.debug('Supabase query result', { 
        hasData: !!data, 
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message 
      });
      
      if (error && error.code !== 'PGRST116') {
        logger.warn('Supabase query error, trying case-insensitive fallback', { error: error.message });
        // Si erreur, essayer recherche insensible à la casse
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('*')
          .ilike('email', normalizedEmail)
          .eq('is_active', 1)
          .maybeSingle();
        
        if (fallbackError && fallbackError.code !== 'PGRST116') {
          logger.error('Fallback query also failed', { error: fallbackError.message });
          throw fallbackError;
        }
        
        if (fallbackData) {
          user = fallbackData;
          users = [fallbackData];
          logger.debug('User found via fallback query');
        }
      } else if (data) {
        user = data;
        users = [data];
        logger.debug('User found via primary query', { userId: user.id });
      } else {
        logger.debug('No user found with email', { email: logger.sanitizeEmail(normalizedEmail) });
      }
    } else {
      // ✅ SUPABASE: pool.getClient() devrait toujours exister (pool = supabaseService)
      logger.error('❌ Erreur: pool.getClient() n\'existe pas - configuration Supabase incorrecte');
      throw new Error('Configuration Supabase incorrecte');
    }
    
    // ✅ Générer un identifiant client s'il n'existe pas (pour les anciens clients)
    // Vérifier d'abord si la colonne existe en gérant l'erreur
    if (user && user.role === 'client') {
      const hasIdentifier = user.client_identifier !== undefined && user.client_identifier !== null;
      
      if (!hasIdentifier) {
        try {
          // Générer l'identifiant client pour les clients existants qui n'en ont pas
          const clientIdentifier = await generateUniqueClientIdentifier(pool);
          await pool.query(
            'UPDATE users SET client_identifier = ? WHERE id = ?',
            [clientIdentifier, user.id]
          );
          user.client_identifier = clientIdentifier;
          logger.log('✅ Identifiant client généré pour un client existant:', clientIdentifier);
        } catch (error) {
          if (error.code === 'ER_BAD_FIELD_ERROR' || error.sqlMessage?.includes('client_identifier')) {
            // La colonne n'existe pas encore, ne rien faire pour l'instant
            logger.warn('⚠️ Colonne client_identifier non disponible. Exécutez la migration SQL: database/migrations/sql/add-client-identifier.sql');
            user.client_identifier = null;
          } else if (error.code === 'ER_DUP_ENTRY') {
            // L'identifiant existe déjà (cas rare), récupérer celui existant
            const [existing] = await pool.query(
              'SELECT client_identifier FROM users WHERE id = ?',
              [user.id]
            );
            if (existing.length > 0) {
              user.client_identifier = existing[0].client_identifier;
              logger.log('✅ Identifiant client récupéré:', existing[0].client_identifier);
            }
          } else {
            logger.error('⚠️ Erreur lors de la génération de l\'identifiant client:', error);
            user.client_identifier = null;
          }
        }
      }
    }

    if (!user) {
      logger.security('Login failed - User not found', { 
        email: logger.sanitizeEmail(email),
        ip: req.ip 
      });
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    logger.debug('User found', { userId: user.id, email: logger.sanitizeEmail(user.email) });
    
    // Harmoniser l'email en base si besoin (toujours en minuscule)
    if (typeof pool.getClient === 'function' && user.email !== normalizedEmail) {
      try {
        await pool.getClient()
          .from('users')
          .update({ email: normalizedEmail })
          .eq('id', user.id);
        user.email = normalizedEmail;
      } catch (updateError) {
        logger.warn('⚠️ Impossible d\'harmoniser l\'email en base (non bloquant):', updateError.message);
      }
    }

    // Vérification du mot de passe avec bcrypt
    logger.debug('Verifying password', { 
      userId: user.id,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length,
      passwordHashStart: user.password_hash?.substring(0, 10)
    });
    
    if (!user.password_hash) {
      logger.error('User has no password_hash', { userId: user.id });
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    logger.debug('Password verification result', { isValid });

    if (!isValid) {
      logger.security('Login failed - Invalid password', {
        userId: user.id,
        email: logger.sanitizeEmail(user.email),
        ip: req.ip
      });
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // ✅ NORMALISATION: Normaliser le rôle (trim, lowercase) pour garantir la cohérence
    const normalizedRole = user.role ? String(user.role).trim().toLowerCase() : null;
    
    logger.info('Login successful', { 
      userId: user.id, 
      email: logger.sanitizeEmail(user.email), 
      roleRaw: user.role,
      roleNormalized: normalizedRole,
      roleType: typeof user.role
    });

    // ✅ Vérifier que le rôle existe dans les données utilisateur
    if (!normalizedRole) {
      logger.error('❌ Login - Utilisateur sans rôle:', { userId: user.id, email: logger.sanitizeEmail(user.email) });
      return res.status(500).json({ error: 'Erreur serveur: rôle utilisateur manquant' });
    }

    // Mettre à jour last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Créer le token avec expiration sécurisée (15 minutes pour access token)
    // ✅ Utiliser le rôle normalisé dans le token
    const tokenPayload = { id: user.id, email: user.email, role: normalizedRole, type: 'access' };
    logger.debug('🔐 Création du token JWT:', { userId: user.id, roleRaw: user.role, roleNormalized: normalizedRole });
    const accessToken = jwt.sign(
      tokenPayload,
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

    // ✅ CRITIQUE: S'assurer que le rôle normalisé est dans l'objet user retourné
    userWithoutPassword.role = normalizedRole;
    
    logger.debug('🔐 Login - Données utilisateur à retourner:', {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      role: userWithoutPassword.role,
      roleNormalized: normalizedRole,
      hasRole: !!userWithoutPassword.role
    });

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
    logger.log('✅ Réponse JSON envoyée avec user:', { 
      id: userWithoutPassword.id, 
      email: userWithoutPassword.email, 
      role: userWithoutPassword.role,
      roleNormalized: normalizedRole
    });
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

      // ✅ NORMALISATION: Normaliser le rôle (trim, lowercase) pour garantir la cohérence
      const normalizedRole = user.role ? String(user.role).trim().toLowerCase() : null;

      // ✅ Vérifier que le rôle existe dans les données utilisateur
      if (!normalizedRole) {
        logger.error('❌ Refresh token - Utilisateur sans rôle:', { userId: user.id, email: user.email });
        return res.status(500).json({ error: 'Erreur serveur: rôle utilisateur manquant' });
      }

      // Générer un nouveau access token avec le rôle normalisé de l'utilisateur
      logger.debug('🔐 Refresh token - Création du nouveau access token:', { userId: user.id, roleRaw: user.role, roleNormalized: normalizedRole });
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: normalizedRole, type: 'access' },
        config.jwt.secret,
        { expiresIn: '15m' }
      );

      // Mettre à jour le cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax', // ✅ CORRECTION: Lax en développement pour permettre les cookies
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
        
        // ✅ NORMALISATION: Normaliser le rôle (trim, lowercase) pour garantir la cohérence
        const normalizedRole = user.role ? String(user.role).trim().toLowerCase() : null;
        
        // ✅ Vérifier que le rôle existe dans les données utilisateur
        if (!normalizedRole) {
          logger.error('❌ Refresh token (fallback) - Utilisateur sans rôle:', { userId: user.id, email: user.email });
          return res.status(500).json({ error: 'Erreur serveur: rôle utilisateur manquant' });
        }
        
        // Générer un nouveau access token avec le rôle normalisé de l'utilisateur
        logger.debug('🔐 Refresh token (fallback) - Création du nouveau access token:', { userId: user.id, roleRaw: user.role, roleNormalized: normalizedRole });
        const accessToken = jwt.sign(
          { id: user.id, email: user.email, role: normalizedRole, type: 'access' },
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
    const supabase = pool.getClient();

    let query = supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          icon,
          display_order
        )
      `)
      .eq('is_available', 1);

    if (categoryId) {
      const categoryIdNum = parseInt(categoryId, 10);
      if (!Number.isNaN(categoryIdNum)) {
        query = query.eq('category_id', categoryIdNum);
      }
    }

    const { data, error } = await query
      .order('display_order', { foreignTable: 'categories', ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    const products = (data || []).map(product => {
      const category = Array.isArray(product.categories)
        ? product.categories[0]
        : product.categories;

      return {
        ...product,
        category_name: category?.name || product.category_name || null,
        category_slug: category?.slug || product.category_slug || null,
        category_icon: category?.icon || product.category_icon || null,
        category_display_order: category?.display_order ?? null
      };
    });

    logger.log(`✅ Kiosk - ${products.length} produits récupérés depuis Supabase`);
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('❌ Kiosk getProducts error:', error);
    throw error;
  }
}));

// Créer une commande depuis la borne
// POST /api/kiosk/orders
// Pas de fidélité, pas de compte client
// ✅ MIGRATION SUPABASE: Transactions MySQL supprimées
app.post('/api/kiosk/orders', asyncHandler(async (req, res) => {
  try {
    logger.log('📝 KIOSK - CRÉATION DE COMMANDE');
    logger.log('   Kiosk ID:', req.user?.id || 'N/A');

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

    // ✅ SUPABASE: Générer le numéro de commande
    const orderNumber = await generateOrderNumber();

    // ✅ SUPABASE: Calculer le sous-total
    let subtotal = 0;
    for (const item of items) {
      const products = await supabaseService.select('products', {
        where: { id: item.productId },
        select: 'price'
      });
      if (!products || products.length === 0) {
        throw new Error(`Produit ${item.productId} introuvable`);
      }
      subtotal += parseFloat(products[0].price) * parseInt(item.quantity);
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
      // ✅ SUPABASE: Valider le code promo
      const [promoCodesData] = await supabaseService.select('promo_codes', {
        where: { code: promoCode, is_active: 1 },
        select: '*'
      });

      // Filtrer les codes promo valides
      const now = new Date();
      const validPromos = (promoCodesData || []).filter(promo => {
        // Vérifier la date de validité
        if (promo.valid_until) {
          const validUntil = new Date(promo.valid_until);
          if (validUntil < now) return false;
        }
        if (promo.valid_from) {
          const validFrom = new Date(promo.valid_from);
          if (validFrom > now) return false;
        }
        
        // Vérifier le nombre max d'utilisations
        if (promo.max_uses !== null && promo.max_uses !== undefined) {
          const usesCount = promo.uses_count || 0;
          if (usesCount >= promo.max_uses) return false;
        }
        
        // Vérifier le montant minimum de commande
        const minOrderAmount = parseFloat(promo.min_order_amount) || 0;
        if (subtotal < minOrderAmount) return false;
        
        return true;
      });

      if (validPromos.length > 0) {
        const promo = validPromos[0];
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

    // ✅ SUPABASE: Créer la commande (user_id NULL pour kiosk)
    const orderResult = await supabaseService.insert('orders', {
      user_id: null, // user_id NULL pour kiosk
      order_number: orderNumber,
      order_type: orderType,
      status: 'pending',
      subtotal: subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      promo_code_id: promoCodeId,
      payment_method: paymentMethod,
      payment_status: 'pending',
      notes: notes || `Commande depuis borne kiosk${promoCode ? ` - Code promo: ${promoCode}` : ''}`,
      table_number: tableNumber || null
    });

    // ✅ SUPABASE: Récupérer l'ID (Supabase retourne un tableau avec l'objet créé)
    const orderId = orderResult && orderResult.length > 0 ? orderResult[0].id : null;
    if (!orderId) {
      throw new Error('Erreur lors de la création de la commande: ID non retourné');
    }

    // ✅ SUPABASE: Ajouter les items
    for (const item of items) {
      const [productsData] = await supabaseService.select('products', {
        where: { id: item.productId },
        select: '*'
      });
      if (!productsData || productsData.length === 0) continue;

      await supabaseService.insert('order_items', {
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price: productsData[0].price,
        notes: item.notes || null
      });
    }

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
    logger.error('❌ Kiosk createOrder error:', error);
    throw error;
  }
}));

// Valider un code promo pour les clients
// POST /api/promo-codes/validate
app.post('/api/promo-codes/validate', asyncHandler(async (req, res) => {
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

    logger.log(`🔍 CLIENT - Validation code promo: "${promoCode}", sous-total: ${orderSubtotal} €`);

    // ✅ SUPABASE: Rechercher le code promo
    // Note: is_active est un SMALLINT (0 ou 1) dans Supabase, pas un boolean
    const [promoCodes] = await supabaseService.select('promo_codes', {
      where: { code: promoCode, is_active: 1 },
      select: '*'
    });

    logger.log(`📊 Codes promo trouvés dans BDD: ${promoCodes?.length || 0}`);

    if (!promoCodes || promoCodes.length === 0) {
      logger.warn(`⚠️ CLIENT - Code promo "${promoCode}" non trouvé ou inactif`);
      return res.json({
        success: false,
        error: 'Code promo invalide ou expiré'
      });
    }

    // Filtrer les codes promo valides
    const now = new Date();
    const validPromos = (promoCodes || []).filter(promo => {
      logger.log(`🔍 Validation promo "${promo.code}":`, {
        is_active: promo.is_active,
        valid_from: promo.valid_from,
        valid_until: promo.valid_until,
        max_uses: promo.max_uses,
        uses_count: promo.uses_count,
        min_order_amount: promo.min_order_amount,
        orderSubtotal
      });

      // Vérifier la date de validité
      if (promo.valid_until) {
        const validUntil = new Date(promo.valid_until);
        if (validUntil < now) {
          logger.warn(`⚠️ CLIENT - Code "${promo.code}" expiré (fin: ${validUntil.toISOString()})`);
          return false;
        }
      }
      if (promo.valid_from) {
        const validFrom = new Date(promo.valid_from);
        if (validFrom > now) {
          logger.warn(`⚠️ CLIENT - Code "${promo.code}" pas encore actif (début: ${validFrom.toISOString()})`);
          return false;
        }
      }
      
      // Vérifier le nombre max d'utilisations
      if (promo.max_uses !== null && promo.max_uses !== undefined) {
        const usesCount = promo.uses_count || 0;
        if (usesCount >= promo.max_uses) {
          logger.warn(`⚠️ CLIENT - Code "${promo.code}" a atteint son maximum (${usesCount}/${promo.max_uses})`);
          return false;
        }
      }
      
      // Vérifier le montant minimum de commande
      const minOrderAmount = parseFloat(promo.min_order_amount) || 0;
      if (orderSubtotal < minOrderAmount) {
        logger.warn(`⚠️ CLIENT - Code "${promo.code}" nécessite un montant minimum de ${minOrderAmount} € (commande: ${orderSubtotal} €)`);
        return false;
      }
      
      return true;
    });

    if (validPromos.length === 0) {
      logger.warn(`⚠️ CLIENT - Aucun code promo valide trouvé pour "${promoCode}"`);
      return res.json({
        success: false,
        error: 'Code promo invalide ou expiré'
      });
    }

    const promo = validPromos[0];
    let discountAmount = 0;

    if (promo.discount_type === 'percentage') {
      discountAmount = (orderSubtotal * parseFloat(promo.discount_value)) / 100;
    } else {
      discountAmount = parseFloat(promo.discount_value);
    }

    logger.log(`✅ CLIENT - Code promo validé: ${promoCode} (-${discountAmount.toFixed(2)} €)`);

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
    logger.error('❌ Client validatePromoCode error:', error);
    throw error;
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

    // ✅ SUPABASE: Rechercher le code promo
    // Note: is_active est un SMALLINT (0 ou 1) dans Supabase, pas un boolean
    const [promoCodes] = await supabaseService.select('promo_codes', {
      where: { code: promoCode, is_active: 1 },
      select: '*'
    });

    // Filtrer les codes promo valides
    const now = new Date();
    const validPromos = (promoCodes || []).filter(promo => {
      // Vérifier la date de validité
      if (promo.valid_until) {
        const validUntil = new Date(promo.valid_until);
        if (validUntil < now) return false;
      }
      if (promo.valid_from) {
        const validFrom = new Date(promo.valid_from);
        if (validFrom > now) return false;
      }
      
      // Vérifier le nombre max d'utilisations
      if (promo.max_uses !== null && promo.max_uses !== undefined) {
        const usesCount = promo.uses_count || 0;
        if (usesCount >= promo.max_uses) return false;
      }
      
      // Vérifier le montant minimum de commande
      const minOrderAmount = parseFloat(promo.min_order_amount) || 0;
      if (orderSubtotal < minOrderAmount) return false;
      
      return true;
    });

    if (validPromos.length === 0) {
      return res.json({
        success: false,
        error: 'Code promo invalide ou expiré'
      });
    }

    const promo = validPromos[0];
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
// ✅ MIGRATION SUPABASE: Transactions MySQL supprimées
app.post('/api/orders', authenticateOptional, asyncHandler(async (req, res) => {
  try {

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
    // ✅ MIGRATION SUPABASE: generateOrderNumber() n'utilise plus de connexion
    logger.log('🔢 Appel de generateOrderNumber()...');
    const orderNumber = await generateOrderNumber();
    
    // Vérification stricte du format (format séquentiel CMD-XXXX)
    if (!orderNumber || !orderNumber.match(/^CMD-\d{4}$/)) {
      logger.error('❌❌❌ ERREUR CRITIQUE: Format de numéro invalide généré!');
      logger.error('   Numéro reçu:', orderNumber);
      logger.error('   Type:', typeof orderNumber);
      throw new Error(`Format de numéro de commande invalide. Attendu: CMD-XXXX (ex: CMD-0001), Reçu: ${orderNumber}`);
    }
    
    logger.log('✅✅✅ Numéro de commande validé:', orderNumber);

    // ✅ SUPABASE: Calculer le sous-total
    let subtotal = 0;
    for (const item of items) {
      const [productsData] = await supabaseService.select('products', {
        where: { id: item.productId || item.id },
        select: 'price'
      });
      if (productsData && productsData.length > 0) {
        subtotal += parseFloat(productsData[0].price) * parseInt(item.quantity);
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
        throw new Error('Vous devez être connecté pour utiliser une récompense de fidélité');
      }
      
      // Vérifier les points requis
      pointsToDeduct = parseInt(loyaltyReward.pointsRequired || 0);
      
      if (pointsToDeduct > 0) {
        // ✅ SUPABASE: Récupérer les points actuels de l'utilisateur
        const [usersData] = await supabaseService.select('users', {
          where: { id: req.user.id },
          select: 'loyalty_points'
        });
        
        if (!usersData || usersData.length === 0) {
          throw new Error('Utilisateur introuvable');
        }
        
        const currentPoints = Math.max(0, usersData[0].loyalty_points || 0);
        
        // Vérifier que l'utilisateur a assez de points
        if (currentPoints < pointsToDeduct) {
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
      // ✅ SUPABASE: Appliquer le code promo seulement si pas de récompense de fidélité
      const [promoCodesData] = await supabaseService.select('promo_codes', {
        where: { code: promoCode.toUpperCase(), is_active: 1 },
        select: '*'
      });

      // Filtrer les codes promo valides
      const now = new Date();
      const validPromos = (promoCodesData || []).filter(promo => {
        // Vérifier la date de validité
        if (promo.valid_until) {
          const validUntil = new Date(promo.valid_until);
          if (validUntil < now) return false;
        }
        if (promo.valid_from) {
          const validFrom = new Date(promo.valid_from);
          if (validFrom > now) return false;
        }
        
        // Vérifier le nombre max d'utilisations
        if (promo.max_uses !== null && promo.max_uses !== undefined) {
          const usesCount = promo.uses_count || 0;
          if (usesCount >= promo.max_uses) return false;
        }
        
        // Vérifier le montant minimum de commande
        const minOrderAmount = parseFloat(promo.min_order_amount) || 0;
        if (subtotal < minOrderAmount) return false;
        
        return true;
      });

      if (validPromos.length > 0) {
        const promo = validPromos[0];
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
      throw new Error(`Format de numéro de commande invalide. Attendu: CMD-XXXX (ex: CMD-0001), Reçu: ${orderNumber}. L'ancien format ORD- est obsolète.`);
    }

    // ✅ LOG AVANT INSERTION SUPABASE
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('💾 INSERTION DANS SUPABASE');
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
      throw new Error(`BLOCAGE: Format de numéro invalide détecté avant insertion. Attendu: CMD-XXXX (ex: CMD-0001), Reçu: ${orderNumber}`);
    }

    // ✅ SUPABASE: Créer la commande
    logger.log('💾 Insertion dans Supabase avec order_number:', orderNumber);
    logger.log('✅ Format validé avant insertion: CMD-XXXX');
    
    // Stocker la récompense de fidélité dans la commande (JSON dans notes ou colonne dédiée)
    // On stocke dans notes avec un préfixe spécial pour pouvoir le récupérer
    let orderNotes = notes || '';
    if (loyaltyRewardData) {
      const rewardPrefix = 'LOYALTY_REWARD_DATA:';
      orderNotes = orderNotes ? `${orderNotes}\n${rewardPrefix}${loyaltyRewardData}` : `${rewardPrefix}${loyaltyRewardData}`;
    }
    
    const orderResult = await supabaseService.insert('orders', {
      user_id: req.user.isGuest ? null : req.user.id, // NULL pour les invités
      order_number: orderNumber,
      order_type: orderType,
      status: 'pending',
      subtotal: subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      promo_code_id: promoCodeId,
      payment_method: finalPaymentMethod,
      payment_status: paymentStatus,
      notes: orderNotes,
      table_number: tableNumber
    });
    
    // ✅ SUPABASE: Récupérer l'ID (Supabase retourne un tableau avec l'objet créé)
    const orderId = orderResult && orderResult.length > 0 ? orderResult[0].id : null;
    if (!orderId) {
      throw new Error('Erreur lors de la création de la commande: ID non retourné');
    }
    
    // ✅ SUPABASE: Vérification POST-INSERTION : S'assurer que le numéro inséré est correct
    const [verifyInsertData] = await supabaseService.select('orders', {
      where: { id: orderId },
      select: 'order_number'
    });
    
    const insertedNumber = verifyInsertData && verifyInsertData.length > 0 ? verifyInsertData[0].order_number : null;
    if (insertedNumber && !/^CMD-\d{4}$/.test(insertedNumber)) {
      logger.error('❌❌❌ ERREUR POST-INSERTION: Le numéro inséré ne correspond pas au format!');
      logger.error('   Numéro dans la base:', insertedNumber);
      throw new Error(`Erreur: Le numéro inséré (${insertedNumber}) ne correspond pas au format CMD-XXXX (ex: CMD-0001)`);
    }
    
      logger.log('✅ Vérification post-insertion réussie:', verifyInsertData[0].order_number);

    // ✅ SUPABASE: Ajouter les items
    for (const item of items) {
      const [productsData] = await supabaseService.select('products', {
        where: { id: item.productId || item.id },
        select: 'name, price'
      });

      if (productsData && productsData.length > 0) {
        const product = productsData[0];
        const itemSubtotal = parseFloat(product.price) * parseInt(item.quantity);

        await supabaseService.insert('order_items', {
          order_id: orderId,
          product_id: item.productId || item.id,
          product_name: product.name,
          quantity: item.quantity,
          unit_price: product.price,
          subtotal: itemSubtotal
        });
      }
    }

    // ✅ SUPABASE: Déduire les points de fidélité immédiatement si une récompense est appliquée
    if (pointsToDeduct > 0 && req.user.id && !req.user.isGuest) {
      // Récupérer les points actuels (peut avoir changé entre temps)
      const [usersData] = await supabaseService.select('users', {
        where: { id: req.user.id },
        select: 'loyalty_points'
      });
      
      if (usersData && usersData.length > 0) {
        const currentPoints = Math.max(0, usersData[0].loyalty_points || 0);
        
        // Vérification finale avant déduction
        if (currentPoints >= pointsToDeduct) {
          const newBalance = Math.max(0, currentPoints - pointsToDeduct);
          
          // ✅ SUPABASE: Déduire les points
          await supabaseService.update('users', { id: req.user.id }, {
            loyalty_points: newBalance
          });
          
          // ✅ SUPABASE: Enregistrer la transaction de déduction
          await supabaseService.insert('loyalty_transactions', {
            user_id: req.user.id,
            order_id: orderId,
            points: -pointsToDeduct,
            transaction_type: 'redeemed',
            description: `Utilisation récompense: ${loyaltyReward && loyaltyReward.name ? loyaltyReward.name : 'Récompense de fidélité'} (commande ${orderNumber})`,
            balance_after: newBalance
          });
          
          logger.log(`✅ Points déduits lors de la création: ${pointsToDeduct} pour l'utilisateur ${req.user.id} (commande ${orderId}). Nouveau solde: ${newBalance}`);
        } else {
          // Si les points ne sont plus suffisants, annuler la transaction
          throw new Error(`Points insuffisants. Vous avez ${currentPoints} points, ${pointsToDeduct} points requis.`);
        }
      }
    }

    // ✅ SUPABASE: Si la commande est créée avec payment_status = 'completed' (paiement par carte), ajouter les points
    if (paymentStatus === 'completed' && req.user.id && !req.user.isGuest) {
      // Vérifier si les points ont déjà été ajoutés pour cette commande
      const [existingTransactionData] = await supabaseService.select('loyalty_transactions', {
        where: { order_id: orderId, transaction_type: 'earned' },
        select: 'id'
      });
      
      const existingTransaction = existingTransactionData || [];

      // Si aucune transaction n'existe, ajouter les points
      if (!existingTransaction || existingTransaction.length === 0) {
        const pointsToAdd = Math.floor(totalAmount); // Points = total de la commande (arrondi à l'entier inférieur)
        
        if (pointsToAdd > 0) {
          // ✅ SUPABASE: Récupérer les points actuels
          const [usersData] = await supabaseService.select('users', {
            where: { id: req.user.id },
            select: 'loyalty_points'
          });

          if (usersData && usersData.length > 0) {
            const currentPoints = Math.max(0, usersData[0].loyalty_points || 0); // S'assurer que les points actuels ne sont pas négatifs
            const newBalance = Math.max(0, currentPoints + pointsToAdd); // Les points sont toujours ajoutés, jamais soustraits (et toujours positifs)

            // ✅ SUPABASE: Mettre à jour les points de l'utilisateur
            await supabaseService.update('users', { id: req.user.id }, {
              loyalty_points: newBalance
            });

            // ✅ SUPABASE: Enregistrer la transaction
            await supabaseService.insert('loyalty_transactions', {
              user_id: req.user.id,
              order_id: orderId,
              points: pointsToAdd,
              transaction_type: 'earned',
              description: `Points gagnés sur commande ${orderNumber} (${totalAmount.toFixed(2)}€)`,
              balance_after: newBalance
            });

            logger.log(`✅ Points ajoutés lors de la création: ${pointsToAdd} pour l'utilisateur ${req.user.id} (commande ${orderId}). Nouveau solde: ${newBalance}`);
          }
        }
      }
    }

    // ✅ OPTIMISATION: Invalider le cache des commandes
    cache.invalidateOnModify.orders();

    logger.log('✅✅✅ COMMANDE CRÉÉE AVEC SUCCÈS ! ✅✅✅');
    logger.log('   - Order ID:', orderId);
    logger.log('   - Order Number:', orderNumber);
    logger.log('   - Total Amount:', totalAmount);
    logger.log('   - Payment Status:', paymentStatus);
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ✅ SUPABASE: Récupérer la commande complète pour l'événement WebSocket
    try {
      // Récupérer la commande avec les données utilisateur
      const [ordersData] = await supabaseService.select('orders', {
        where: { id: orderId },
        select: '*'
      });
      
      if (ordersData && ordersData.length > 0) {
        const order = ordersData[0];
        
        // Récupérer les données utilisateur si user_id existe
        if (order.user_id) {
          const [usersData] = await supabaseService.select('users', {
            where: { id: order.user_id },
            select: 'first_name, last_name, email'
          });
          if (usersData && usersData.length > 0) {
            order.first_name = usersData[0].first_name || '';
            order.last_name = usersData[0].last_name || 'Invité';
            order.email = usersData[0].email || '';
          } else {
            order.first_name = '';
            order.last_name = 'Invité';
            order.email = '';
          }
        } else {
          order.first_name = '';
          order.last_name = 'Invité';
          order.email = '';
        }
        
        // Récupérer les items
        const [orderItemsData] = await supabaseService.select('order_items', {
          where: { order_id: orderId },
          select: 'id, product_id, product_name, quantity, unit_price, subtotal'
        });
        order.items = orderItemsData || [];
        
        // Émettre l'événement WebSocket pour mise à jour en temps réel
        emitOrderUpdate('order:created', order);
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
    // ✅ Gestion d'erreurs centralisée : l'erreur sera formatée par errorHandler
    // Les erreurs Supabase seront automatiquement converties en erreurs applicatives
    throw error; // Laisser asyncHandler et errorHandler gérer
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
  logger.log('📋 GET /api/admin/categories - Récupération catégories');
  try {
    // ✅ SUPABASE: Récupérer toutes les catégories
    const [categories] = await supabaseService.select('categories', {
      select: '*',
      orderBy: ['display_order ASC']
    });
    
    logger.log(`✅ ${categories ? categories.length : 0} catégorie(s) récupérée(s)`);
    res.json({ success: true, data: categories || [] });
  } catch (error) {
    logger.error('❌ Erreur récupération catégories:', error);
    logger.error('   Stack:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Créer une catégorie
// ✅ OPTIMISATION: Invalidation du cache lors de la création
app.post('/api/admin/categories', authenticateToken, requireAdmin, csrfProtection, validateCategory, asyncHandler(async (req, res) => {
  logger.log('📋 POST /api/admin/categories - Création catégorie');
  const { name, slug, description, icon, displayOrder } = req.body;

  // ✅ SUPABASE: Insérer la catégorie
  const [result] = await supabaseService.insert('categories', {
    name: name,
    slug: slug,
    description: description || '',
    icon: icon || '📦',
    display_order: displayOrder || 0,
    is_active: 1
  });

  // Invalider le cache des catégories et produits
  cache.invalidateOnModify.categories();

  logger.log(`✅ Catégorie créée avec ID: ${result.id}`);
  res.status(201).json({
    success: true,
    message: 'Catégorie créée',
    categoryId: result.id
  });
}));

// ✅ OPTIMISATION: Modifier une catégorie - Invalidation du cache
app.put('/api/admin/categories/:id', authenticateToken, requireAdmin, csrfProtection, validateId, validateCategory, asyncHandler(async (req, res) => {
  logger.log(`📋 PUT /api/admin/categories/:id - Modification catégorie ${req.params.id}`);
  const { id } = req.params;
  const { name, slug, description, icon, displayOrder, isActive } = req.body;

  // ✅ SUPABASE: Mettre à jour la catégorie
  await supabaseService.update('categories', { id: parseInt(id) }, {
    name: name,
    slug: slug,
    description: description || '',
    icon: icon || '📦',
    display_order: displayOrder || 0,
    is_active: isActive !== undefined ? (isActive ? 1 : 0) : 1
  });

  // Invalider le cache des catégories et produits
  cache.invalidateOnModify.categories();

  logger.log(`✅ Catégorie ${id} modifiée`);
  res.json({ success: true, message: 'Catégorie modifiée' });
}));

// ✅ OPTIMISATION: Supprimer une catégorie - Invalidation du cache
app.delete('/api/admin/categories/:id', authenticateToken, requireAdmin, csrfProtection, validateId, asyncHandler(async (req, res) => {
  logger.log(`📋 DELETE /api/admin/categories/:id - Suppression catégorie ${req.params.id}`);
  const { id } = req.params;

  // ✅ SUPABASE: Vérifier si des produits utilisent cette catégorie
  const [products] = await supabaseService.select('products', {
    where: { category_id: parseInt(id) },
    select: 'id'
  });

  if (products && products.length > 0) {
    logger.warn(`⚠️ Impossible de supprimer: ${products.length} produit(s) utilisent cette catégorie`);
    return res.status(400).json({
      success: false,
      error: `Impossible de supprimer. ${products.length} produit(s) utilisent cette catégorie.`
    });
  }

  // ✅ SUPABASE: Supprimer la catégorie
  await supabaseService.delete('categories', { id: parseInt(id) });

  // Invalider le cache des catégories et produits
  cache.invalidateOnModify.categories();

  logger.log(`✅ Catégorie ${id} supprimée`);
  res.json({ success: true, message: 'Catégorie supprimée' });
}));

// ================================================================
// ADMIN - GESTION DES PRODUITS
// ================================================================

// Liste tous les produits
// ✅ SÉCURITÉ: Pagination implémentée
// ✅ MIGRATION SUPABASE: Utiliser Supabase directement
app.get('/api/admin/products', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePaginationParams(req);
  
  try {
    // ✅ MIGRATION SUPABASE: Utiliser Supabase directement
    const supabase = pool.getClient();
    
    // Compter le total de produits
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    
    if (countError) {
      logger.error('❌ Erreur comptage produits:', countError);
      throw countError;
    }
    
    const total = count || 0;
    
    // Récupérer les produits avec catégories (paginés)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (productsError) {
      logger.error('❌ Erreur récupération produits:', productsError);
      throw productsError;
    }
    
    // Transformer les produits pour inclure category_name
    const transformedProducts = (products || []).map(product => {
      const category = Array.isArray(product.categories)
        ? product.categories[0]
        : product.categories;
      
      return {
        ...product,
        category_name: category?.name || null
      };
    });

    const pagination = getPaginationMetadata(total, page, limit);
    logger.debug('Products fetched from Supabase', { page, limit, total, fetched: transformedProducts.length });
    
    res.json(formatPaginatedResponse(transformedProducts, pagination));
  } catch (error) {
    logger.error('❌ Erreur /api/admin/products:', error);
    throw error;
  }
}));

// Créer un produit
// ✅ OPTIMISATION: Invalidation du cache lors de la création
// ✅ MIGRATION SUPABASE: Utiliser Supabase pour la création
app.post('/api/admin/products', authenticateToken, requireAdmin, csrfProtection, validateProductCreate, asyncHandler(async (req, res) => {
  const {
    categoryId, name, slug, description, price, imageUrl,
    stock, isAvailable, isFeatured, calories, preparationTime, allergens
  } = req.body;

  logger.log('📦 POST /api/admin/products - Création produit:', { name, categoryId, price });

  // Convertir allergens en JSON si c'est un array, sinon utiliser une chaîne vide
  const allergensJson = Array.isArray(allergens) ? JSON.stringify(allergens) : (allergens || '');
  
  // Convertir les booléens explicitement pour Supabase (SMALLINT)
  const isAvailableValue = isAvailable ? 1 : 0;
  const isFeaturedValue = isFeatured ? 1 : 0;
  
  // ✅ SUPABASE: Créer le produit
  const [result] = await supabaseService.insert('products', {
    category_id: categoryId,
    name: name,
    slug: slug,
    description: description || '',
    price: parseFloat(price) || 0,
    image_url: imageUrl || null,
    stock: parseInt(stock) || 0,
    is_available: isAvailableValue,
    is_featured: isFeaturedValue,
    calories: parseInt(calories) || null,
    preparation_time: parseInt(preparationTime) || null,
    allergens: allergensJson || null
  });

  if (!result || result.length === 0) {
    throw new Error('Erreur lors de la création du produit');
  }

  const productId = result[0].id;

  logger.log(`✅ Produit créé avec ID: ${productId}`);

  // Invalider le cache des produits
  cache.invalidateOnModify.products();

  res.status(201).json({
    success: true,
    message: 'Produit créé',
    productId: productId
  });
}));

// Modifier un produit
// ✅ MIGRATION SUPABASE: Utiliser Supabase pour la modification
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, csrfProtection, validateId, validateProduct, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    categoryId, name, slug, description, price, imageUrl,
    stock, isAvailable, isFeatured, calories, preparationTime, allergens
  } = req.body;

  logger.log('📝 PUT /api/admin/products/:id - Modification produit ID:', id);
  logger.log('   Données reçues:', { categoryId, name, price, stock, isAvailable, isFeatured });

  // Vérifier que le produit existe et n'est pas supprimé
  const [existingProduct] = await supabaseService.select('products', {
    where: { id: parseInt(id) },
    select: 'id, deleted_at',
    limit: 1
  });

  if (!existingProduct || existingProduct.length === 0) {
    return res.status(404).json({ 
      success: false, 
      error: 'Produit non trouvé' 
    });
  }

  if (existingProduct[0].deleted_at) {
    return res.status(400).json({ 
      success: false, 
      error: 'Impossible de modifier un produit supprimé' 
    });
  }

  // Convertir allergens en JSON si c'est un array
  const allergensJson = Array.isArray(allergens) ? JSON.stringify(allergens) : (allergens || null);

  // Convertir les booléens explicitement pour Supabase (SMALLINT)
  const isAvailableValue = isAvailable ? 1 : 0;
  const isFeaturedValue = isFeatured ? 1 : 0;

  // ✅ SUPABASE: Mettre à jour le produit
  await supabaseService.update('products', 
    { id: parseInt(id) },
    {
      category_id: categoryId,
      name: name,
      slug: slug,
      description: description || '',
      price: parseFloat(price) || 0,
      image_url: imageUrl || null,
      stock: parseInt(stock) || 0,
      is_available: isAvailableValue,
      is_featured: isFeaturedValue,
      calories: calories ? parseInt(calories) : null,
      preparation_time: preparationTime ? parseInt(preparationTime) : null,
      allergens: allergensJson,
      updated_at: new Date().toISOString()
    }
  );

  logger.log(`✅ Produit ${id} modifié`);

  // Invalider le cache des produits
  cache.invalidateOnModify.products();

  res.json({ success: true, message: 'Produit modifié' });
}));

// Toggle disponibilité produit (Admin ET Manager)
// ✅ OPTIMISATION: Toggle produit - Invalidation du cache
// ✅ MIGRATION SUPABASE: Utiliser Supabase pour le toggle
app.put('/api/admin/products/:id/toggle', authenticateToken, requireManager, csrfProtection, validateId, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.log(`🔄 PUT /api/admin/products/${id}/toggle - Toggle disponibilité`);
  
  // ✅ SUPABASE: Récupérer l'état actuel
  const [products] = await supabaseService.select('products', {
    where: { id: parseInt(id) },
    select: 'id, is_available, deleted_at',
    limit: 1
  });
  
  if (!products || products.length === 0) {
    return res.status(404).json({ 
      success: false,
      error: 'Produit non trouvé' 
    });
  }

  if (products[0].deleted_at) {
    return res.status(400).json({ 
      success: false,
      error: 'Impossible de modifier un produit supprimé' 
    });
  }
  
  const currentStatus = products[0].is_available;
  const newStatus = currentStatus === 1 ? 0 : 1;
  
  // ✅ SUPABASE: Mettre à jour
  await supabaseService.update('products', 
    { id: parseInt(id) },
    { 
      is_available: newStatus,
      updated_at: new Date().toISOString()
    }
  );
  
  logger.log(`✅ Produit ${id} ${newStatus === 1 ? 'activé' : 'désactivé'}`);
  
  // Invalider le cache des produits
  cache.invalidateOnModify.products();
  
  res.json({ 
    success: true, 
    message: newStatus === 1 ? 'Produit activé' : 'Produit désactivé',
    is_available: newStatus
  });
}));

// ✅ OPTIMISATION: Supprimer un produit - Invalidation du cache
// ✅ MIGRATION SUPABASE: Utiliser Supabase pour le soft delete
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, csrfProtection, validateId, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.log(`🗑️ DELETE /api/admin/products/${id} - Suppression produit`);
  
  // ✅ Vérifier que le produit existe et n'est pas déjà supprimé
  const [existingProduct] = await supabaseService.select('products', {
    where: { id: parseInt(id) },
    select: 'id, deleted_at',
    limit: 1
  });
  
  if (!existingProduct || existingProduct.length === 0) {
    logger.warn(`⚠️ Produit ${id} non trouvé`);
    return res.status(404).json({ 
      success: false, 
      error: 'Produit non trouvé' 
    });
  }
  
  if (existingProduct[0].deleted_at) {
    logger.warn(`⚠️ Produit ${id} déjà supprimé`);
    return res.status(400).json({ 
      success: false, 
      error: 'Produit déjà supprimé' 
    });
  }
  
  // ✅ SUPABASE: Soft delete au lieu de suppression physique
  await supabaseService.update('products', 
    { id: parseInt(id) }, 
    { deleted_at: new Date().toISOString() }
  );
  
  logger.log(`✅ Produit ${id} supprimé (soft delete)`);
  
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
    // ✅ SUPABASE: Récupérer tous les codes promo
    const [codes] = await supabaseService.select('promo_codes', {
      select: '*',
      orderBy: ['created_at DESC']
    });
    res.json({ success: true, data: codes || [] });
  } catch (error) {
    logger.error('❌ GET /api/admin/promo-codes:', error);
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

    // ✅ SUPABASE: Créer le code promo
    const [insertedData] = await supabaseService.insert('promo_codes', {
      code: code.toUpperCase().trim(),
      description: description || null,
      discount_type: discountType || 'percentage',
      discount_value: parseFloat(discountValue) || 0,
      min_order_amount: parseFloat(minOrderAmount) || 0,
      max_uses: maxUses ? parseInt(maxUses) : null,
      uses_count: 0,
      valid_from: validFrom || new Date().toISOString(),
      valid_until: validUntil || null,
      is_active: 1 // SMALLINT: 1 = actif, 0 = inactif
    });

    const newPromo = insertedData && insertedData.length > 0 ? insertedData[0] : null;

    logger.log(`✅ Code promo créé: ${code.toUpperCase()}`);

    res.status(201).json({
      success: true,
      message: 'Code promo créé',
      data: newPromo,
      promoCodeId: newPromo?.id
    });
  } catch (error) {
    logger.error('❌ POST /api/admin/promo-codes:', error);
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

    // ✅ SUPABASE: Mettre à jour le code promo
    await supabaseService.update('promo_codes', { id: parseInt(id) }, {
      code: code ? code.toUpperCase().trim() : undefined,
      description: description !== undefined ? description : undefined,
      discount_type: discountType || undefined,
      discount_value: discountValue !== undefined ? parseFloat(discountValue) : undefined,
      min_order_amount: minOrderAmount !== undefined ? parseFloat(minOrderAmount) : undefined,
      max_uses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : undefined,
      valid_from: validFrom !== undefined ? validFrom : undefined,
      valid_until: validUntil !== undefined ? validUntil : undefined,
      is_active: isActive !== undefined ? (isActive ? 1 : 0) : undefined // SMALLINT: 1 = actif, 0 = inactif
    });

    logger.log(`✅ Code promo modifié: ID ${id}`);

    res.json({ success: true, message: 'Code promo modifié' });
  } catch (error) {
    logger.error('❌ PUT /api/admin/promo-codes/:id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un code promo
app.delete('/api/admin/promo-codes/:id', authenticateToken, requireAdmin, csrfProtection, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ SUPABASE: Supprimer le code promo
    await supabaseService.delete('promo_codes', { id: parseInt(id) });
    logger.log(`✅ Code promo supprimé: ID ${id}`);
    res.json({ success: true, message: 'Code promo supprimé' });
  } catch (error) {
    logger.error('❌ DELETE /api/admin/promo-codes/:id:', error);
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
        pc.code as promo_code,
        pc.description as promo_code_description,
        pc.discount_type as promo_discount_type,
        pc.discount_value as promo_discount_value,
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
      LEFT JOIN promo_codes pc ON o.promo_code_id = pc.id
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
        COALESCE(u.phone, '') as phone,
        pc.code as promo_code,
        pc.description as promo_code_description,
        pc.discount_type as promo_discount_type,
        pc.discount_value as promo_discount_value
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN promo_codes pc ON o.promo_code_id = pc.id
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

    // ✅ SUPABASE: Récupérer l'ancien statut pour gérer les timestamps
    const [currentOrders] = await supabaseService.select('orders', {
      where: { id: parseInt(id) },
      select: 'id,status,taken_at,user_id'
    });

    if (!currentOrders || currentOrders.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const currentOrder = currentOrders[0];
    const oldStatus = currentOrder.status;
    const newStatus = status;

    // Préparer les données de mise à jour avec les timestamps
    const updateData = { status: newStatus };
    const now = new Date().toISOString();

    // Si on passe de "pending" à "preparing", enregistrer le temps de prise en charge
    if (oldStatus === 'pending' && newStatus === 'preparing') {
      updateData.taken_at = now;
      logger.log(`📌 Commande ${id}: Prise en charge - taken_at enregistré`);
    }

    // Si on passe de "preparing" à "served" ou "ready" à "served", enregistrer le temps de fin de préparation
    if ((oldStatus === 'preparing' || oldStatus === 'ready') && newStatus === 'served') {
      // Si taken_at n'est pas encore défini, le définir maintenant (cas où on passe directement de pending à served)
      if (!currentOrder.taken_at && oldStatus !== 'ready') {
        updateData.taken_at = now;
        logger.log(`📌 Commande ${id}: Prise en charge tardive - taken_at enregistré`);
      }
      updateData.prepared_at = now;
      logger.log(`📌 Commande ${id}: Préparation terminée - prepared_at enregistré`);
    }

    // ✅ SUPABASE: Mettre à jour la commande
    await supabaseService.update('orders', { id: parseInt(id) }, updateData);

    // ✅ OPTIMISATION: Invalider le cache des commandes
    cache.invalidateOnModify.orders();

    // ✅ SUPABASE: Créer une notification pour le client
    if (currentOrder.user_id) {
      try {
        await supabaseService.insert('notifications', {
          user_id: currentOrder.user_id,
          title: 'Statut de commande mis à jour',
          message: `Votre commande est maintenant: ${status}`,
          type: 'order',
          related_order_id: parseInt(id)
        });
      } catch (notifError) {
        logger.warn('⚠️ Erreur création notification (non bloquant):', notifError);
      }
    }

    // Émettre l'événement WebSocket pour mise à jour en temps réel
    emitOrderUpdate('order:status_changed', { orderId: parseInt(id), status: newStatus, oldStatus });
    emitOrderUpdate('orders:refresh', {});

    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    logger.error('❌ Erreur mise à jour statut commande:', error);
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
  // ✅ DEBUG: Logger les informations utilisateur pour diagnostiquer les problèmes d'accès
  logger.debug('🔐 Payment workflow - Vérification accès:', {
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    orderId: req.params.id,
    path: req.path
  });
  
    const identifier = req.params.id;
  const {
    items = [],
    removedItemIds = [],
    payments = [],
    totals = {},
    appliedPromo = null,
    notes = null,
    statusNext = null
  } = req.body || {};

  // ✅ PROTECTION: Vérifier que la requête n'est pas vide
  logger.debug('📥 Payment workflow - Requête reçue:', {
    orderId: req.params.id,
    itemsCount: Array.isArray(items) ? items.length : 0,
    paymentsCount: Array.isArray(payments) ? payments.length : 0,
    hasTotals: !!totals,
    hasAppliedPromo: !!appliedPromo,
    statusNext
  });

  try {
    // ✅ SUPABASE: Utiliser pool.query() directement au lieu de getConnection()
    const numericId = Number(identifier);
    
    // Rechercher la commande par ID ou order_number
    let currentOrder = null;
    
    if (!Number.isNaN(numericId)) {
      // Recherche par ID
      const [ordersById] = await pool.query(
        'SELECT * FROM orders WHERE id = ? LIMIT 1',
        [numericId]
      );
      if (ordersById.length > 0) {
        currentOrder = ordersById[0];
        logger.debug('✅ Payment workflow - Commande trouvée par ID:', numericId);
      }
    }
    
    // Si pas trouvé par ID, rechercher par order_number
    if (!currentOrder) {
      const [ordersByNumber] = await pool.query(
        'SELECT * FROM orders WHERE order_number = ? LIMIT 1',
        [identifier]
      );
      if (ordersByNumber.length > 0) {
        currentOrder = ordersByNumber[0];
        logger.debug('✅ Payment workflow - Commande trouvée par order_number:', identifier);
      }
    }

    if (!currentOrder) {
      logger.error('❌ Payment workflow - Commande introuvable:', { identifier, numericId });
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    const orderId = currentOrder.id;
    
    // ✅ LOGS DÉTAILLÉS pour diagnostic
    logger.debug('✅ Payment workflow - Commande trouvée:', {
      orderId,
      orderNumber: currentOrder.order_number,
      currentStatus: currentOrder.status,
      currentPaymentStatus: currentOrder.payment_status
    });

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

        await pool.query(
          'UPDATE order_items SET quantity = ?, unit_price = ?, subtotal = ? WHERE id = ? AND order_id = ?',
          [quantity, unitPrice, subtotal, itemId, orderId]
        );
      }
    }

    if (removalSet.size > 0) {
      const removalArray = Array.from(removalSet);
      const placeholders = removalArray.map(() => '?').join(', ');
      await pool.query(
        `DELETE FROM order_items WHERE order_id = ? AND id IN (${placeholders})`,
        [orderId, ...removalArray]
      );
    }

    const [itemsTotals] = await pool.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS subtotal FROM order_items WHERE order_id = ?',
      [orderId]
    );

    const recalculatedSubtotal = Number(itemsTotals[0]?.subtotal ?? 0);
    const discountAmount = Number(currentOrder.discount_amount ?? 0);
    const taxAmount = Number(currentOrder.tax_amount ?? 0);

    const safeTotals = totals && typeof totals === 'object' ? totals : {};
    
    // ✅ CALCULER LA PROMO SI APPLIQUÉE
    let promoDiscount = 0;
    if (appliedPromo && typeof appliedPromo === 'object') {
      const promoDiscountType = appliedPromo.discountType || appliedPromo.discount_type;
      const promoDiscountValue = Number(appliedPromo.discountValue || appliedPromo.discount_value || 0);
      
      if (promoDiscountType === 'percentage' && promoDiscountValue > 0 && promoDiscountValue <= 100) {
        // Réduction en pourcentage
        promoDiscount = Math.round((recalculatedSubtotal * promoDiscountValue / 100) * 100) / 100;
      } else if (promoDiscountType === 'fixed' && promoDiscountValue > 0) {
        // Réduction fixe
        promoDiscount = Math.min(promoDiscountValue, recalculatedSubtotal); // Ne pas dépasser le subtotal
      }
      
      // Utiliser le promoDiscount du frontend si fourni et cohérent
      const frontendPromoDiscount = Number(safeTotals.promoDiscount ?? 0);
      if (frontendPromoDiscount > 0 && Math.abs(frontendPromoDiscount - promoDiscount) < 0.1) {
        promoDiscount = frontendPromoDiscount; // Utiliser la valeur du frontend si cohérente
      }
    } else if (safeTotals.promoDiscount != null) {
      // Fallback: utiliser le promoDiscount envoyé par le frontend
      promoDiscount = Number(safeTotals.promoDiscount ?? 0);
    }
    
    promoDiscount = Math.max(0, Math.round(promoDiscount * 100) / 100);
    
    // ✅ SÉCURITÉ: RECALCULER TOUJOURS CÔTÉ SERVEUR - Ne JAMAIS faire confiance au client
    // Recalculer depuis les données de la base + promo si appliquée
    // Total = Subtotal - Discount existant - Promo + Tax
    const totalBeforeTax = Math.max(0, recalculatedSubtotal - discountAmount - promoDiscount);
    const totalAmount = Math.max(0, totalBeforeTax + taxAmount);
    
    // ✅ LOGS DÉTAILLÉS POUR DIAGNOSTIC
    logger.debug('💰 Payment workflow - Calcul des totaux:', {
      recalculatedSubtotal: recalculatedSubtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      promoDiscount: promoDiscount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalBeforeTax: totalBeforeTax.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      hasAppliedPromo: !!appliedPromo,
      promoType: appliedPromo?.discountType || appliedPromo?.discount_type || 'none'
    });

    await pool.query('DELETE FROM order_payments WHERE order_id = ?', [orderId]);

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

      await pool.query(
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

    // ✅ VALIDATION AMÉLIORÉE: Vérifier que les paiements correspondent au total recalculé
    // ✅ CORRECTION: Permettre que le montant payé soit >= au total (pour la monnaie à rendre)
    // ✅ Tolérance pour les erreurs d'arrondi et les paiements partiels
    const tolerance = 0.05; // Tolérance de 5 centimes pour les arrondis (augmentée pour plus de flexibilité)
    
    // ✅ LOGS DÉTAILLÉS POUR DIAGNOSTIC COMPLET
    logger.debug('💰 Payment workflow - Validation des paiements:', {
      totalAmount: totalAmount.toFixed(2),
      amountPaid: amountPaid.toFixed(2),
      remainingAmount: remainingAmount.toFixed(2),
      changeAmount: changeAmount.toFixed(2),
      difference: (amountPaid - totalAmount).toFixed(2),
      tolerance: tolerance.toFixed(2),
      promoDiscount: promoDiscount.toFixed(2),
      paymentCount: paymentDetailsList.length,
      payments: paymentDetailsList.map(p => `${p.method}: ${p.amount.toFixed(2)}€`)
    });
    
    // ✅ Autoriser les paiements partiels si remainingAmount > tolerance
    // ✅ Autoriser les paiements avec monnaie à rendre (amountPaid > totalAmount)
    // ✅ Ne rejeter que si le montant payé est insuffisant ET qu'on essaie de finaliser (statusNext !== null)
    const isUnderpaid = amountPaid > 0 && amountPaid < totalAmount - tolerance;
    const isTryingToFinalize = statusNext !== null && statusNext !== undefined;
    
    if (isUnderpaid && isTryingToFinalize && remainingAmount > tolerance) {
      logger.error('❌ ERREUR: Tentative de finalisation avec paiement incomplet');
      logger.error('   - Total recalculé (avec promo):', totalAmount.toFixed(2));
      logger.error('   - Total payé:', amountPaid.toFixed(2));
      logger.error('   - Reste à payer:', remainingAmount.toFixed(2));
      logger.error('   - Différence:', (totalAmount - amountPaid).toFixed(2));
      logger.error('   - Promo appliquée:', promoDiscount > 0 ? `${promoDiscount.toFixed(2)}€` : 'non');
      
      return res.status(400).json({
        error: 'Montant de paiement insuffisant',
        details: `Le montant total payé (${amountPaid.toFixed(2)}€) est inférieur au total de la commande (${totalAmount.toFixed(2)}€). Il manque ${remainingAmount.toFixed(2)}€.`,
        totals: {
          total: totalAmount.toFixed(2),
          paid: amountPaid.toFixed(2),
          remaining: remainingAmount.toFixed(2),
          promoDiscount: promoDiscount.toFixed(2)
        }
      });
    }
    
    // ✅ Log pour diagnostic (toujours visible en cas de différence)
    if (Math.abs(amountPaid - totalAmount) > tolerance) {
      logger.warn('⚠️ Payment workflow - Différence entre montant payé et total:', {
        totalAmount: totalAmount.toFixed(2),
        amountPaid: amountPaid.toFixed(2),
        difference: (amountPaid - totalAmount).toFixed(2),
        remainingAmount: remainingAmount.toFixed(2),
        changeAmount: changeAmount.toFixed(2),
        isUnderpaid,
        isTryingToFinalize,
        promoDiscount: promoDiscount.toFixed(2)
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

    // ✅ SUPABASE: Construire l'objet de mise à jour directement
    const updateData = {
      subtotal: recalculatedSubtotal,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      change_amount: changeAmount,
      payment_status: paymentStatus,
      payment_method: normalizedPaymentMethod,
      payment_details: JSON.stringify(paymentDetails),
      updated_at: new Date().toISOString()
    };

    // Gérer les notes (ne mettre à jour que si fourni)
    if (notes != null) {
      updateData.notes = String(notes);
    }

    let statusChanged = false;
    let nextStatus = null;

    if (typeof statusNext === 'string') {
      const candidateStatus = statusNext.toLowerCase();
      const allowedStatuses = ['pending','preparing','ready','served','cancelled'];
      if (allowedStatuses.includes(candidateStatus) && candidateStatus !== currentOrder.status) {
        statusChanged = true;
        nextStatus = candidateStatus;
        updateData.status = candidateStatus;

        if (currentOrder.status === 'pending' && candidateStatus === 'preparing') {
          updateData.taken_at = new Date().toISOString();
        }

        if (candidateStatus === 'ready') {
          updateData.prepared_at = new Date().toISOString();
        }

        if (candidateStatus === 'served') {
          updateData.completed_at = new Date().toISOString();
        }
      }
    }

    // ✅ SUPABASE: Mettre à jour directement avec Supabase
    const supabase = pool.getClient();
    const { data: updatedOrderData, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      logger.error('❌ Erreur mise à jour commande:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour de la commande',
        ...(process.env.NODE_ENV === 'development' ? { details: updateError.message } : {})
      });
    }

    // Si la commande passe à "completed" et qu'elle n'était pas déjà "completed", ajouter les points
    if (paymentStatus === 'completed' && oldPaymentStatus !== 'completed' && userId) {
      // ✅ Ne jamais attribuer de points de fidélité aux comptes staff (admin / manager)
      const isStaffUser = req.user && (req.user.role === 'admin' || req.user.role === 'manager');
      if (isStaffUser) {
        logger.debug('ℹ️ Workflow paiement - Pas de points fidélité pour un compte staff', {
          orderId,
          userId,
          role: req.user.role
        });
      } else {
        try {
      // Vérifier si les points ont déjà été ajoutés pour cette commande
      const [existingTransaction] = await pool.query(
        'SELECT id FROM loyalty_transactions WHERE order_id = ? AND transaction_type = ?',
        [orderId, 'earned']
      );

      // Si aucune transaction n'existe, ajouter les points
      if (existingTransaction.length === 0) {
        const pointsToAdd = Math.floor(totalAmount); // Points = total de la commande (arrondi à l'entier inférieur)
        
        if (pointsToAdd > 0) {
          // Récupérer les points actuels
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

                // Enregistrer la transaction dans l'historique de fidélité
            await pool.query(
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
        } catch (loyaltyError) {
          // ✅ CORRECTION CRITIQUE : ne jamais bloquer le workflow de paiement à cause des points fidélité
          logger.error('❌ Workflow paiement - Erreur ajout points fidélité (ignorée pour ne pas bloquer le paiement):', {
            message: loyaltyError.message,
            code: loyaltyError.code,
            orderId,
            userId
          });
          // On nève pas l'erreur : le paiement reste validé même si l'écriture de fidélité échoue
        }
      }
    }

    // ✅ SUPABASE: Récupérer la commande mise à jour avec les relations Supabase
    // Utiliser l'ordre déjà mis à jour (updatedOrderData) si disponible, sinon récupérer
    let orderData = updatedOrderData;
    
    if (!orderData) {
      logger.warn('⚠️ updatedOrderData non disponible, récupération depuis Supabase');
      // Récupérer la commande
      const { data: fetchedOrder, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !fetchedOrder) {
        logger.error('❌ Erreur récupération commande:', orderError);
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la récupération de la commande mise à jour' 
        });
      }
      orderData = fetchedOrder;
    }
    
    // Récupérer l'utilisateur séparément
    let userData = null;
    if (orderData && orderData.user_id) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', orderData.user_id)
        .single();
      
      if (!userError && user) {
        userData = user;
      } else if (userError) {
        logger.warn('⚠️ Erreur récupération utilisateur:', userError);
      }
    }

    // Récupérer les paiements
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('order_payments')
      .select('id, method, amount, reference, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (paymentsError) {
      logger.warn('⚠️ Erreur récupération paiements:', paymentsError);
    }

    // Récupérer les items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_id, product_name, quantity, unit_price, subtotal')
      .eq('order_id', orderId)
      .order('id', { ascending: true });

    if (itemsError) {
      logger.warn('⚠️ Erreur récupération items:', itemsError);
    }

    // Récupérer les produits et catégories pour les items
    const itemsWithDetails = [];
    if (itemsData && itemsData.length > 0) {
      const productIds = [...new Set(itemsData.map(item => item.product_id).filter(Boolean))];
      
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, image_url, category_id')
          .in('id', productIds);

        if (productsError) {
          logger.warn('⚠️ Erreur récupération produits:', productsError);
        }

        const categoryIds = [...new Set((productsData || []).map(p => p.category_id).filter(Boolean))];
        let categoriesData = [];
        
        if (categoryIds.length > 0) {
          const { data: catsData, error: catsError } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', categoryIds);

          if (catsError) {
            logger.warn('⚠️ Erreur récupération catégories:', catsError);
          } else {
            categoriesData = catsData || [];
          }
        }

        // Créer des maps pour accès rapide
        const productsMap = new Map((productsData || []).map(p => [p.id, p]));
        const categoriesMap = new Map(categoriesData.map(c => [c.id, c]));

        // Construire les items avec détails
        for (const item of itemsData) {
          const product = productsMap.get(item.product_id) || {};
          const category = product.category_id ? categoriesMap.get(product.category_id) : null;
          const categoryName = category?.name || '';
          
          // Déterminer le type de catégorie
          let categoryType = 'plat';
          const lowerName = categoryName.toLowerCase();
          if (lowerName.includes('entrée') || lowerName.includes('entree') || lowerName.includes('starter')) {
            categoryType = 'entree';
          } else if (lowerName.includes('dessert') || lowerName.includes('sweet')) {
            categoryType = 'dessert';
          }

          itemsWithDetails.push({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            image_url: product.image_url || null,
            category_name: categoryName,
            category_type: categoryType
          });
        }
      } else {
        // Pas de product_id, utiliser les données de base
        itemsWithDetails.push(...itemsData.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          image_url: null,
          category_name: '',
          category_type: 'plat'
        })));
      }
    }

    // Construire l'objet commande mis à jour
    const updatedOrder = {
      ...orderData,
      first_name: userData?.first_name || '',
      last_name: userData?.last_name || 'Invité',
      email: userData?.email || '',
      payments: (paymentsData || []).map(p => ({
        id: p.id,
        method: p.method,
        amount: p.amount,
        reference: p.reference,
        created_at: p.created_at
      })),
      items: itemsWithDetails
    };

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
    // ✅ SUPABASE: Pas de rollback nécessaire (pas de transactions MySQL)
    logger.error('❌ Erreur workflow paiement - Exception complète:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      orderId: req.params.id,
      identifier,
      userId: req.user?.id,
      userRole: req.user?.role,
      errorCode: error.code,
      errorDetails: error.details
    });
    
    // ✅ SÉCURITÉ: Masquer les détails d'erreur en production
    const isProd = process.env.NODE_ENV === 'production';
    
    // ✅ Message d'erreur plus explicite selon le type d'erreur
    let errorMessage = 'Erreur serveur lors du workflow paiement';
    let statusCode = 500;
    
    if (error.message && error.message.includes('Commande introuvable')) {
      errorMessage = 'Commande introuvable';
      statusCode = 404;
    } else if (error.message && (error.message.includes('insuffisant') || error.message.includes('invalide'))) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message && error.message.includes('timeout')) {
      errorMessage = 'Délai d\'attente dépassé. Veuillez réessayer.';
      statusCode = 504;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      ...(isProd ? {} : { 
        details: error.message, 
        stack: error.stack,
        orderId: req.params.id
      })
    });
  }
});

// ================================================================
// ADMIN - PARAMÈTRES
// ================================================================

// Liste tous les paramètres
app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  logger.log('⚙️ GET /api/admin/settings - Récupération paramètres');
  try {
    // ✅ SUPABASE: Récupérer tous les paramètres
    const [settings] = await supabaseService.select('app_settings', {
      select: '*',
      orderBy: ['setting_key ASC']
    });
    
    logger.log(`✅ ${settings ? settings.length : 0} paramètre(s) récupéré(s)`);
    res.json({ success: true, data: settings || [] });
  } catch (error) {
    logger.error('❌ Erreur récupération settings:', error);
    logger.error('   Stack:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Récupérer un paramètre spécifique (route publique pour le frontend)
app.get('/api/settings/:key', async (req, res) => {
  logger.log(`⚙️ GET /api/settings/:key - Récupération paramètre ${req.params.key}`);
  try {
    const { key } = req.params;
    // ✅ SUPABASE: Récupérer le paramètre
    const [settings] = await supabaseService.select('app_settings', {
      where: { setting_key: key },
      select: '*'
    });
    
    if (!settings || settings.length === 0) {
      logger.warn(`⚠️ Paramètre ${key} non trouvé`);
      return res.status(404).json({ success: false, error: 'Paramètre non trouvé' });
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
        logger.error('❌ Erreur parse JSON:', e);
      }
    }
    
    logger.log(`✅ Paramètre ${key} récupéré`);
    res.json({ success: true, data: { key: setting.setting_key, value, type: setting.setting_type } });
  } catch (error) {
    logger.error('❌ Erreur récupération setting:', error);
    logger.error('   Stack:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Modifier un paramètre (Admin only)
app.put('/api/admin/settings/:key', authenticateToken, requireAdmin, async (req, res) => {
  logger.log('🔧 PUT /api/admin/settings/:key');
  try {
    const { key } = req.params;
    const { value, setting_type } = req.body;

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

    // ✅ SUPABASE: Vérifier si le paramètre existe
    const [existingSettings] = await supabaseService.select('app_settings', {
      where: { setting_key: key },
      select: 'setting_key'
    });

    if (existingSettings && existingSettings.length > 0) {
      // Mettre à jour le paramètre existant
      await supabaseService.update('app_settings', { setting_key: key }, {
        setting_value: stringValue,
        setting_type: finalType
      });
      logger.log('   ✅ Paramètre mis à jour');
    } else {
      // Insérer un nouveau paramètre
      await supabaseService.insert('app_settings', {
        setting_key: key,
        setting_value: stringValue,
        setting_type: finalType
      });
      logger.log('   ✅ Nouveau paramètre créé');
    }

    // Vérifier la nouvelle valeur
    const [rows] = await supabaseService.select('app_settings', {
      where: { setting_key: key },
      select: 'setting_value,setting_type'
    });
    
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
    logger.error('   Stack:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ================================================================
// GESTION DES PROMOS DE PAIEMENT
// ================================================================

// Incrémenter le compteur d'utilisations d'une promo
app.post('/api/admin/promos/:index/increment', authenticateToken, requireManager, async (req, res) => {
  logger.log('🎁 POST /api/admin/promos/:index/increment');
  try {
    const { index } = req.params;
    const promoIndex = parseInt(index);
    
    if (isNaN(promoIndex) || promoIndex < 0) {
      return res.status(400).json({ success: false, error: 'Index invalide' });
    }

    // Récupérer les promos depuis app_settings
    const [settingsRows] = await supabaseService.select('app_settings', {
      where: { setting_key: 'payment_promos' },
      select: 'setting_value'
    });

    if (!settingsRows || settingsRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Promos non trouvées' });
    }

    let promos;
    try {
      const settingValue = settingsRows[0].setting_value;
      promos = typeof settingValue === 'string' ? JSON.parse(settingValue) : settingValue;
    } catch (e) {
      logger.error('❌ Erreur parsing promos:', e);
      return res.status(500).json({ success: false, error: 'Erreur parsing promos' });
    }

    if (!Array.isArray(promos) || promoIndex >= promos.length) {
      return res.status(404).json({ success: false, error: 'Promo non trouvée' });
    }

    // Incrémenter le compteur
    if (!promos[promoIndex].usesCount) {
      promos[promoIndex].usesCount = 0;
    }
    promos[promoIndex].usesCount = (promos[promoIndex].usesCount || 0) + 1;

    // Sauvegarder les promos mises à jour
    await supabaseService.update('app_settings', { setting_key: 'payment_promos' }, {
      setting_value: JSON.stringify(promos),
      setting_type: 'json'
    });

    logger.log(`✅ Compteur promo ${promoIndex} incrémenté: ${promos[promoIndex].usesCount}`);

    res.json({
      success: true,
      usesCount: promos[promoIndex].usesCount
    });
  } catch (error) {
    logger.error('❌ Erreur incrément promo:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ================================================================
// RESTAURANT INFO (via app_settings)
// ================================================================

// Helper: get setting by key
async function getSettingValue(pool, key) {
  // ✅ SUPABASE: Récupérer le paramètre
  const [rows] = await supabaseService.select('app_settings', {
    where: { setting_key: key },
    select: 'setting_value'
  });
  return rows && rows.length > 0 ? rows[0].setting_value : null;
}

// Helper: upsert setting
async function upsertSetting(pool, key, value) {
  // ✅ SUPABASE: Vérifier si le paramètre existe
  const [existing] = await supabaseService.select('app_settings', {
    where: { setting_key: key },
    select: 'setting_key'
  });
  
  if (existing && existing.length > 0) {
    // Mettre à jour
    await supabaseService.update('app_settings', { setting_key: key }, {
      setting_value: String(value)
    });
  } else {
    // Insérer
    await supabaseService.insert('app_settings', {
      setting_key: key,
      setting_value: String(value),
      setting_type: 'string'
    });
  }
}

// GET restaurant info agrégée
app.get('/api/restaurant-info', async (req, res) => {
  logger.log('🍽️ GET /api/restaurant-info - Récupération infos restaurant');
  try {
    // ✅ SUPABASE: Récupérer tous les paramètres
    const [rows] = await supabaseService.select('app_settings', {
      select: 'setting_key,setting_value'
    });
    const map = Object.fromEntries((rows || []).map(r => [r.setting_key, r.setting_value]));
    let openingHours = {};
    try { openingHours = map.opening_hours ? JSON.parse(map.opening_hours) : {}; } catch { openingHours = {}; }
    const businessDefaults = {
      name: 'BLOSSOM CAFE',
      address: '',
      phone: '',
      siret: '',
      vatNumber: '',
      website: '',
      email: '',
      legalForm: '',
      shareCapital: '',
      rcs: '',
      paymentMention: '',
      legalMentions: '',
      returnPolicy: '',
      foodInfo: '',
      customerService: ''
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
          // Utiliser les valeurs personnalisées ticket_value_* si disponibles, sinon business_*
          name: map.ticket_value_name || map.business_name || businessDefaults.name,
          address: map.ticket_value_address || map.business_address || map.restaurant_address || businessDefaults.address,
          phone: map.ticket_value_phone || map.business_phone || map.phone_main || map.contact_phone || businessDefaults.phone,
          siret: map.ticket_value_siret || map.business_siret || businessDefaults.siret,
          vatNumber: map.ticket_value_vat || map.business_vat_number || businessDefaults.vatNumber,
          website: map.ticket_value_website || map.business_website || businessDefaults.website,
          email: map.ticket_value_email || map.business_email || businessDefaults.email,
          legalForm: map.ticket_value_legal_form || map.business_legal_form || businessDefaults.legalForm,
          shareCapital: map.business_share_capital || businessDefaults.shareCapital,
          rcs: map.ticket_value_rcs || map.business_rcs || businessDefaults.rcs,
          paymentMention: map.ticket_value_payment_mention || map.business_payment_mention || businessDefaults.paymentMention,
          legalMentions: map.ticket_value_legal_mentions || map.business_legal_mentions || businessDefaults.legalMentions,
          returnPolicy: map.ticket_value_return_policy || map.business_return_policy || businessDefaults.returnPolicy,
          foodInfo: map.ticket_value_food_info || map.business_food_info || businessDefaults.foodInfo,
          customerService: map.ticket_value_customer_service || map.business_customer_service || businessDefaults.customerService
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
    
    // ✅ SUPABASE: Convertir les dates en format ISO pour Supabase
    const startDateTime = new Date(startDate + 'T00:00:00').toISOString();
    const endDateTime = new Date(endDate + 'T23:59:59.999').toISOString();
    
    const compareStartDateTime = new Date(compareStartDate + 'T00:00:00').toISOString();
    const compareEndDateTime = new Date(compareEndDate + 'T23:59:59.999').toISOString();
    
    // ✅ SUPABASE: Récupérer toutes les commandes (on filtre ensuite en JavaScript)
    // Récupérer toutes les commandes non annulées depuis le début de la période
    const [allOrdersData] = await supabaseService.select('orders', {
      where: {
        created_at: { operator: '>=', value: startDateTime }
      },
      select: 'id,created_at,total_amount,status',
      orderBy: ['created_at ASC']
    });
    
    // Filtrer en JavaScript: exclure les annulées et filtrer par dates
    const currentOrders = (allOrdersData || []).filter(order => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(startDateTime) && orderDate <= new Date(endDateTime);
    });
    
    // ✅ SUPABASE: Récupérer toutes les commandes de la période de comparaison
    const [allPreviousOrdersData] = await supabaseService.select('orders', {
      where: {
        created_at: { operator: '>=', value: compareStartDateTime }
      },
      select: 'id,created_at,total_amount,status',
      orderBy: ['created_at ASC']
    });
    
    // Filtrer en JavaScript
    const previousOrders = (allPreviousOrdersData || []).filter(order => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(compareStartDateTime) && orderDate <= new Date(compareEndDateTime);
    });
    
    // Calculer les statistiques période actuelle
    const ordersCurrent = currentOrders.length;
    const revenueCurrent = parseFloat(currentOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0).toFixed(2));
    
    // Calculer les statistiques période précédente
    const ordersPrevious = previousOrders.length;
    const revenuePrevious = parseFloat(previousOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0).toFixed(2));
    
    // Vérifier si c'est une seule journée pour affichage heure par heure
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isSingleDay = start.toDateString() === end.toDateString();
    
    logger.log('   Mode:', isSingleDay ? 'HEURE PAR HEURE' : 'JOUR PAR JOUR');
    logger.log(`   Commandes période actuelle: ${ordersCurrent}`);
    logger.log(`   Commandes période précédente: ${ordersPrevious}`);
    
    // Calculer les détails par période
    let dailyStats = [];
    
    if (isSingleDay) {
      // Une seule journée : détails HEURE PAR HEURE
      const hourMap = {};
      currentOrders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const hour = orderDate.getHours();
        if (!hourMap[hour]) {
          hourMap[hour] = {
            hour: hour,
            date: startDate,
            total_orders: 0,
            total_revenue: 0
          };
        }
        hourMap[hour].total_orders++;
        hourMap[hour].total_revenue = parseFloat((hourMap[hour].total_revenue + (parseFloat(order.total_amount) || 0)).toFixed(2));
      });
      
      // Convertir en tableau et trier par heure
      dailyStats = Object.values(hourMap).sort((a, b) => a.hour - b.hour);
    } else {
      // Plusieurs jours : détails JOUR PAR JOUR
      const dayMap = {};
      currentOrders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const dateKey = orderDate.toISOString().split('T')[0];
        if (!dayMap[dateKey]) {
          dayMap[dateKey] = {
            date: dateKey,
            total_orders: 0,
            total_revenue: 0
          };
        }
        dayMap[dateKey].total_orders++;
        dayMap[dateKey].total_revenue = parseFloat((dayMap[dateKey].total_revenue + (parseFloat(order.total_amount) || 0)).toFixed(2));
      });
      
      // Convertir en tableau et trier par date
      dailyStats = Object.values(dayMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    logger.log(`✅ ${dailyStats.length} entrées de détails récupérées`);
    if (dailyStats.length > 0) {
      logger.log('   - Première entrée:', dailyStats[0]);
      logger.log('   - Dernière entrée:', dailyStats[dailyStats.length - 1]);
    }
    
    // Calcul des variations réelles
    const revenueGrowth = revenuePrevious > 0 
      ? ((revenueCurrent - revenuePrevious) / revenuePrevious) * 100 
      : 0;
    
    const ordersGrowth = ordersPrevious > 0 
      ? ((ordersCurrent - ordersPrevious) / ordersPrevious) * 100 
      : 0;
    
    const avgOrderCurrent = parseFloat((ordersCurrent > 0 ? revenueCurrent / ordersCurrent : 0).toFixed(2));
    const avgOrderPrevious = parseFloat((ordersPrevious > 0 ? revenuePrevious / ordersPrevious : 0).toFixed(2));
    const avgOrderGrowth = parseFloat((avgOrderPrevious > 0 
      ? ((avgOrderCurrent - avgOrderPrevious) / avgOrderPrevious) * 100 
      : 0).toFixed(2));
    
    // Calcul TVA (10%)
    const totalHT = parseFloat((revenueCurrent / 1.1).toFixed(2));
    const totalTVA = parseFloat((revenueCurrent - totalHT).toFixed(2));
    
    logger.log('✅ Statistiques calculées:');
    logger.log('   CA actuel:', revenueCurrent.toFixed(2), '€');
    logger.log('   CA précédent:', revenuePrevious.toFixed(2), '€');
    logger.log('   Croissance CA:', revenueGrowth.toFixed(2), '%');
    logger.log('   Croissance commandes:', ordersGrowth.toFixed(2), '%');
    logger.log('   Croissance panier moyen:', avgOrderGrowth.toFixed(2), '%');
    
    // Arrondir les détails à 2 décimales
    const formattedDetails = dailyStats.map(stat => ({
      ...stat,
      total_revenue: parseFloat((stat.total_revenue || 0).toFixed(2))
    }));
    
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
        details: formattedDetails
      }
    });
  } catch (error) {
    logger.error('❌ Erreur revenue-comparison:', error);
    logger.error('   Stack:', error.stack);
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
// ✅ MIGRATION SUPABASE: Utiliser Supabase pour la suppression d'image
app.delete('/api/admin/products/:id/image', authenticateToken, requireAdmin, csrfProtection, validateId, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.log(`🖼️ DELETE /api/admin/products/${id}/image - Suppression image`);
  
  // ✅ SUPABASE: Récupérer l'image actuelle
  const [products] = await supabaseService.select('products', {
    where: { id: parseInt(id) },
    select: 'id, image_url, deleted_at',
    limit: 1
  });
  
  if (!products || products.length === 0) {
    return res.status(404).json({ 
      success: false,
      error: 'Produit non trouvé' 
    });
  }

  if (products[0].deleted_at) {
    return res.status(400).json({ 
      success: false,
      error: 'Impossible de modifier un produit supprimé' 
    });
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
  
  // ✅ SUPABASE: Mettre à jour la BDD
  await supabaseService.update('products', 
    { id: parseInt(id) },
    { 
      image_url: null,
      updated_at: new Date().toISOString()
    }
  );
  
  logger.log(`✅ Image du produit ${id} supprimée`);
  
  res.json({
    success: true,
    message: 'Image supprimée avec succès'
  });
}));

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
    // ✅ SUPABASE: Récupérer les produits avec stock <= 10
    const [productsData] = await supabaseService.select('products', {
      where: {
        stock: { operator: '<=', value: 10 },
        deleted_at: null
      },
      select: 'id,name,stock,category_id',
      orderBy: ['stock ASC', 'name ASC']
    });
    
    // ✅ SUPABASE: Récupérer les catégories
    const categoryIds = [...new Set((productsData || []).map(p => p.category_id).filter(Boolean))];
    const categoriesMap = {};
    if (categoryIds.length > 0) {
      const [categoriesData] = await supabaseService.select('categories', {
        where: { id: categoryIds },
        select: 'id,name'
      });
      (categoriesData || []).forEach(cat => {
        categoriesMap[cat.id] = cat.name;
      });
    }
    
    // Calculer le statut pour chaque produit
    const products = (productsData || []).map(p => {
      const stock = parseInt(p.stock) || 0;
      let alert_level = 'ok';
      if (stock === 0) {
        alert_level = 'critical';
      } else if (stock <= 5) {
        alert_level = 'warning';
      } else if (stock <= 10) {
        alert_level = 'low';
      }
      
      return {
        id: p.id,
        name: p.name,
        stock: stock,
        category_id: p.category_id,
        category_name: categoriesMap[p.category_id] || 'Non catégorisé',
        alert_level: alert_level
      };
    });
    
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('❌ Erreur alertes stock:', error);
    logger.error('   Stack:', error.stack);
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
    // ✅ SUPABASE: Récupérer tous les ingrédients (on filtre deleted_at en JavaScript)
    logger.log('📦 Requête Supabase pour récupérer les ingrédients...');
    const [allIngredientsData] = await supabaseService.select('ingredients', {
      select: 'id,name,category_inventory,quantity,price_per_unit,min_quantity,unit,supplier,description,created_at,deleted_at',
      orderBy: ['name ASC']
    });
    
    logger.log(`📦 Données brutes récupérées: ${allIngredientsData ? allIngredientsData.length : 0} ingrédient(s)`);
    
    // Si aucun ingrédient trouvé, peut-être qu'ils sont tous supprimés - réactiver ceux qui ont deleted_at
    if (!allIngredientsData || allIngredientsData.length === 0) {
      logger.warn('⚠️ Aucun ingrédient trouvé dans la base de données');
    } else {
      const deletedCount = (allIngredientsData || []).filter(i => i.deleted_at).length;
      const activeCount = (allIngredientsData || []).filter(i => !i.deleted_at).length;
      logger.log(`📦 Ingrédients actifs: ${activeCount}, supprimés: ${deletedCount}`);
      
      // Si tous les ingrédients sont supprimés, les réactiver automatiquement
      if (activeCount === 0 && deletedCount > 0) {
        logger.warn(`⚠️ Tous les ingrédients sont supprimés (${deletedCount}). Réactivation automatique...`);
        const deletedIds = allIngredientsData.filter(i => i.deleted_at).map(i => i.id);
        
        // Réactiver tous les ingrédients supprimés
        for (const id of deletedIds) {
          try {
            await supabaseService.update('ingredients',
              { id: id },
              { deleted_at: null }
            );
          } catch (updateError) {
            logger.error(`❌ Erreur réactivation ingrédient ${id}:`, updateError);
          }
        }
        
        logger.log(`✅ ${deletedIds.length} ingrédient(s) réactivé(s)`);
        
        // Recharger les données après réactivation
        const [reloadedData] = await supabaseService.select('ingredients', {
          select: 'id,name,category_inventory,quantity,price_per_unit,min_quantity,unit,supplier,description,created_at,deleted_at',
          orderBy: ['name ASC']
        });
        
        const ingredientsData = (reloadedData || []).filter(i => !i.deleted_at);
        logger.log(`📦 Après réactivation: ${ingredientsData.length} ingrédient(s) actif(s)`);
        
        // Continuer avec les données rechargées
        const inventory = ingredientsData.map(i => {
          const quantity = parseFloat(i.quantity) || 0;
          const minQuantity = parseFloat(i.min_quantity) || 0;
          
          let status = 'available';
          if (quantity === 0) {
            status = 'out';
          } else if (quantity <= minQuantity) {
            status = 'low';
          }
          
          return {
            id: i.id,
            name: i.name,
            category: i.category_inventory || 'Autres',
            quantity: parseFloat(quantity.toFixed(2)),
            price: parseFloat((parseFloat(i.price_per_unit) || 0).toFixed(2)),
            minQuantity: parseFloat(minQuantity.toFixed(2)),
            unit: i.unit || 'kg',
            supplier: i.supplier || '',
            description: i.description || '',
            dateAdded: i.created_at,
            status: status
          };
        });
        
        logger.log(`✅ ${inventory.length} matières premières récupérées (après réactivation)`);
        return res.json({ 
          success: true, 
          data: inventory 
        });
      }
    }
    
    // Filtrer les ingrédients non supprimés
    const ingredientsData = (allIngredientsData || []).filter(i => !i.deleted_at);
    logger.log(`📦 Ingrédients non supprimés: ${ingredientsData.length} ingrédient(s)`);
    
    // Formater les données et calculer le statut
    const inventory = ingredientsData.map(i => {
      const quantity = parseFloat(i.quantity) || 0;
      const minQuantity = parseFloat(i.min_quantity) || 0;
      
      let status = 'available';
      if (quantity === 0) {
        status = 'out';
      } else if (quantity <= minQuantity) {
        status = 'low';
      }
      
      return {
        id: i.id,
        name: i.name,
        category: i.category_inventory || 'Autres',
        quantity: parseFloat(quantity.toFixed(2)),
        price: parseFloat((parseFloat(i.price_per_unit) || 0).toFixed(2)),
        minQuantity: parseFloat(minQuantity.toFixed(2)),
        unit: i.unit || 'kg',
        supplier: i.supplier || '',
        description: i.description || '',
        dateAdded: i.created_at,
        status: status
      };
    });
    
    logger.log(`✅ ${inventory.length} matières premières récupérées`);
    res.json({ 
      success: true, 
      data: inventory 
    });
  } catch (error) {
    logger.error('❌ Erreur récupération inventaire:', error);
    logger.error('   Stack:', error.stack);
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
    
    // ✅ SUPABASE: Vérifier si le slug existe déjà dans ingredients
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await supabaseService.select('ingredients', {
        where: { slug: slug },
        select: 'id',
        limit: 1
      });
      if (!existing || existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    logger.log('   Nom:', name);
    logger.log('   Slug généré:', slug);
    logger.log('   Catégorie inventaire:', category);
    logger.log('   Unité:', unit || 'kg');
    
    // Calculer automatiquement le statut en fonction de la quantité
    const qty = parseFloat(quantity) || 0;
    const isAvailable = qty > 0 ? 1 : 0;
    logger.log('   Quantité:', qty, '→ Statut:', isAvailable ? 'disponible' : 'rupture');
    
    // ✅ SUPABASE: Insérer l'ingrédient
    const [result] = await supabaseService.insert('ingredients', {
      name: name,
      slug: slug,
      category_inventory: category,
      quantity: parseFloat(qty.toFixed(2)),
      unit: unit || 'kg',
      price_per_unit: parseFloat((parseFloat(price) || 0).toFixed(2)),
      min_quantity: parseFloat((parseFloat(minQuantity) || 0).toFixed(2)),
      supplier: supplier || '',
      description: description || 'Ingrédient ajouté depuis l\'inventaire',
      is_available: isAvailable
    });
    
    const insertedId = result && result[0] ? result[0].id : null;
    logger.log('✅ Ingrédient ajouté, ID:', insertedId);
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
    // ✅ SUPABASE: Vérifier si l'ingrédient existe
    const [allExisting] = await supabaseService.select('ingredients', {
      where: { id: parseInt(id) },
      select: '*',
      limit: 1
    });
    
    // Filtrer les supprimés
    const existing = (allExisting || []).filter(e => !e.deleted_at);
    
    if (!existing || existing.length === 0) {
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
      const qty = parseFloat(quantity) || 0;
      const isAvailable = qty > 0 ? 1 : 0;
      
      // ✅ SUPABASE: Mettre à jour uniquement la quantité (vérifier deleted_at en JavaScript)
      const [checkExisting] = await supabaseService.select('ingredients', {
        where: { id: parseInt(id) },
        select: 'deleted_at',
        limit: 1
      });
      
      if (!checkExisting || checkExisting.length === 0 || checkExisting[0].deleted_at) {
        return res.status(404).json({ 
          success: false, 
          error: 'Ingrédient non trouvé' 
        });
      }
      
      await supabaseService.update('ingredients', 
        { id: parseInt(id) },
        { 
          quantity: parseFloat(qty.toFixed(2)), 
          is_available: isAvailable 
        }
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
    
    // ✅ SUPABASE: Vérifier unicité (sauf pour l'ingrédient actuel)
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await supabaseService.select('ingredients', {
        where: { slug: slug },
        select: 'id',
        limit: 1
      });
      if (!existing || existing.length === 0 || existing[0].id === parseInt(id)) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Calculer automatiquement le statut en fonction de la quantité
    const qty = parseFloat(quantity) || 0;
    const isAvailable = qty > 0 ? 1 : 0;
    logger.log(`   Quantité: ${qty} → Statut: ${isAvailable ? 'disponible' : 'rupture'}`);
    
    // ✅ SUPABASE: Vérifier que l'ingrédient n'est pas supprimé avant mise à jour
    const [checkExisting] = await supabaseService.select('ingredients', {
      where: { id: parseInt(id) },
      select: 'deleted_at',
      limit: 1
    });
    
    if (!checkExisting || checkExisting.length === 0 || checkExisting[0].deleted_at) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ingrédient non trouvé' 
      });
    }
    
    // ✅ SUPABASE: Mettre à jour l'ingrédient
    await supabaseService.update('ingredients',
      { id: parseInt(id) },
      {
        name: name,
        slug: slug,
        category_inventory: category,
        quantity: parseFloat(qty.toFixed(2)),
        unit: unit || 'kg',
        price_per_unit: parseFloat((parseFloat(price) || 0).toFixed(2)),
        min_quantity: parseFloat((parseFloat(minQuantity) || 0).toFixed(2)),
        supplier: supplier || '',
        description: description || '',
        is_available: isAvailable
      }
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
    // ✅ SUPABASE: Vérifier si l'ingrédient existe
    const [allExisting] = await supabaseService.select('ingredients', {
      where: { id: parseInt(id) },
      select: 'name,deleted_at',
      limit: 1
    });
    
    // Filtrer les supprimés
    const existing = (allExisting || []).filter(e => !e.deleted_at);
    
    if (!existing || existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ingrédient non trouvé' 
      });
    }
    
    // ✅ SUPABASE: Soft delete
    await supabaseService.update('ingredients',
      { id: parseInt(id) },
      { deleted_at: new Date().toISOString() }
    );
    
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
    const targetStatus = status || 'pending';
    
    // ✅ SUPABASE: Récupérer tous les items de la liste de courses
    const [allShoppingListItems] = await supabaseService.select('shopping_list', {
      where: {
        status: targetStatus
      },
      select: 'id,ingredient_id,quantity_needed,unit,added_at,status,notes,priority',
      orderBy: ['added_at ASC']
    });
    
    if (!allShoppingListItems || allShoppingListItems.length === 0) {
      logger.log('✅ Aucun article dans la liste de courses');
      return res.json({ 
        success: true, 
        data: [] 
      });
    }
    
    // ✅ SUPABASE: Récupérer tous les ingrédients correspondants
    const ingredientIds = [...new Set(allShoppingListItems.map(item => item.ingredient_id).filter(Boolean))];
    const [allIngredientsData] = await supabaseService.select('ingredients', {
      where: {
        id: ingredientIds
      },
      select: 'id,name,category_inventory,min_quantity,quantity,deleted_at'
    });
    
    // Filtrer les ingrédients non supprimés et créer un map
    const ingredientsMap = {};
    (allIngredientsData || []).filter(i => !i.deleted_at).forEach(ing => {
      ingredientsMap[ing.id] = {
        name: ing.name,
        category: ing.category_inventory || 'Autres',
        min_quantity: parseFloat(ing.min_quantity) || 0,
        current_quantity: parseFloat(ing.quantity) || 0
      };
    });
    
    // Joindre les données et filtrer les ingrédients supprimés
    const items = allShoppingListItems
      .filter(item => ingredientsMap[item.ingredient_id]) // Filtrer les ingrédients supprimés
      .map(item => ({
        id: item.id,
        ingredient_id: item.ingredient_id,
        quantity_needed: parseFloat(item.quantity_needed) || 0,
        unit: item.unit || null,
        added_at: item.added_at,
        status: item.status,
        notes: item.notes || null,
        priority: item.priority || 'medium',
        ingredient_name: ingredientsMap[item.ingredient_id].name,
        category: ingredientsMap[item.ingredient_id].category,
        min_quantity: ingredientsMap[item.ingredient_id].min_quantity,
        current_quantity: ingredientsMap[item.ingredient_id].current_quantity
      }))
      .sort((a, b) => {
        // Trier par priorité
        const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
        const aPriority = priorityOrder[a.priority] || 5;
        const bPriority = priorityOrder[b.priority] || 5;
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        // Puis par date d'ajout
        return new Date(a.added_at) - new Date(b.added_at);
      });
    
    logger.log(`✅ ${items.length} articles dans la liste de courses`);
    res.json({ 
      success: true, 
      data: items 
    });
  } catch (error) {
    logger.error('❌ Erreur récupération liste de courses:', error);
    logger.error('   Stack:', error.stack);
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
    // ✅ SUPABASE: Trouver tous les ingrédients en rupture ou en stock bas
    // - Produits en rupture (quantity = 0)
    // - Produits en stock bas (quantity <= min_quantity ET min_quantity > 0)
    const [allIngredientsData] = await supabaseService.select('ingredients', {
      select: 'id,name,quantity,min_quantity,unit,deleted_at'
    });
    
    // Filtrer les ingrédients non supprimés
    const allIngredients = (allIngredientsData || []).filter(i => !i.deleted_at);
    
    // Filtrer et calculer quantity_needed en JavaScript
    const lowStockItems = (allIngredients || [])
      .map(i => {
        const quantity = parseFloat(i.quantity) || 0;
        const minQuantity = parseFloat(i.min_quantity) || 0;
        
        // Vérifier si en rupture ou stock bas
        const isOut = quantity === 0;
        const isLow = minQuantity > 0 && quantity <= minQuantity;
        
        if (!isOut && !isLow) return null;
        
        // Calculer quantity_needed
        let quantityNeeded = 0;
        if (isOut) {
          quantityNeeded = minQuantity > 0 ? minQuantity : 1;
        } else if (isLow) {
          quantityNeeded = minQuantity - quantity;
        }
        
        return {
          id: i.id,
          name: i.name,
          quantity: quantity,
          min_quantity: minQuantity,
          unit: i.unit || 'kg',
          quantity_needed: parseFloat(quantityNeeded.toFixed(2))
        };
      })
      .filter(item => item !== null);
    
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
    const errors = [];
    
    for (const item of lowStockItems) {
      try {
        // ✅ SUPABASE: Vérifier si déjà dans la liste
        const [existing] = await supabaseService.select('shopping_list', {
          where: {
            ingredient_id: item.id,
            status: 'pending'
          },
          select: 'id',
          limit: 1
        });
        
        // Vérifier que quantity_needed est valide (peut être décimal)
        const quantityNeeded = parseFloat(item.quantity_needed) || 0;
        if ((!existing || existing.length === 0) && quantityNeeded > 0) {
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
          
          // ✅ SUPABASE: Ajouter à la liste de courses
          await supabaseService.insert('shopping_list', {
            ingredient_id: item.id,
            quantity_needed: parseFloat(quantityNeeded.toFixed(2)),
            unit: item.unit || null,
            priority: priority
          });
          addedCount++;
          addedItems.push({
            ingredient_id: item.id,
            name: item.name,
            quantity_needed: item.quantity_needed,
            status: item.quantity === 0 ? 'rupture' : 'stock_bas'
          });
        }
      } catch (itemError) {
        // Logger l'erreur pour cet item mais continuer avec les autres
        logger.error(`❌ Erreur ajout item ${item.id} (${item.name}):`, itemError);
        errors.push({ item: item.name, error: itemError.message || 'Erreur inconnue' });
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
    
    // Si des erreurs se sont produites mais qu'on a quand même ajouté des items, retourner un succès partiel
    if (errors.length > 0 && addedCount > 0) {
      logger.warn(`⚠️ ${errors.length} erreur(s) lors de l'ajout automatique, mais ${addedCount} produit(s) ajouté(s)`);
    }
    
    res.json({ 
      success: true, 
      message: message,
      added: addedCount,
      data: addedItems,
      errors: errors.length > 0 ? errors : undefined
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
app.get('/api/admin/analytics/top-products-period', authenticateToken, requireManager, async (req, res) => {
  const { startDate, endDate, limit = 8 } = req.query;
  
  logger.log('📊 GET /api/admin/analytics/top-products-period');
  logger.log('   Période:', startDate, '→', endDate);
  logger.log('   Limite:', limit);
  
  try {
    // ✅ SUPABASE: Convertir les dates
    const startDateTime = new Date(startDate + 'T00:00:00').toISOString();
    const endDateTime = new Date(endDate + 'T23:59:59.999').toISOString();
    
    // ✅ SUPABASE: Récupérer les commandes de la période
    const [ordersData] = await supabaseService.select('orders', {
      where: {
        created_at: { operator: '>=', value: startDateTime }
      },
      select: 'id,created_at,status'
    });
    
    // Filtrer par dates et exclure les annulées
    const validOrders = (ordersData || []).filter(order => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(startDateTime) && orderDate <= new Date(endDateTime);
    });
    
    const orderIds = validOrders.map(o => o.id);
    logger.log(`✅ ${orderIds.length} commandes valides trouvées`);
    
    if (orderIds.length === 0) {
      return res.json({
      success: true,
        data: []
      });
    }
    
    // ✅ SUPABASE: Récupérer les order_items pour ces commandes
    const [orderItemsData] = await supabaseService.select('order_items', {
      where: { order_id: orderIds },
      select: 'id,order_id,product_id,quantity,subtotal'
    });
    
    // ✅ SUPABASE: Récupérer les produits
    const productIds = [...new Set((orderItemsData || []).map(oi => oi.product_id))];
    const [productsData] = await supabaseService.select('products', {
      where: { id: productIds },
      select: 'id,name,image_url,category_id'
    });
    
    // ✅ SUPABASE: Récupérer les catégories
    const categoryIds = [...new Set((productsData || []).map(p => p.category_id).filter(Boolean))];
    const categoriesMap = {};
    if (categoryIds.length > 0) {
      const [categoriesData] = await supabaseService.select('categories', {
        where: { id: categoryIds },
        select: 'id,name'
      });
      (categoriesData || []).forEach(cat => {
        categoriesMap[cat.id] = cat.name;
      });
    }
    
    // Calculer les statistiques par produit
    const productsMap = {};
    (productsData || []).forEach(p => {
      productsMap[p.id] = {
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        category: categoriesMap[p.category_id] || 'Non catégorisé'
      };
    });
    
    const productStats = {};
    (orderItemsData || []).forEach(oi => {
      if (!productStats[oi.product_id]) {
        productStats[oi.product_id] = {
          total_sold: 0,
          revenue_ttc: 0,
          revenue_ht: 0,
          order_ids: new Set()
        };
      }
      productStats[oi.product_id].total_sold += parseInt(oi.quantity) || 0;
      const subtotal = parseFloat(oi.subtotal) || 0;
      productStats[oi.product_id].revenue_ttc = parseFloat((productStats[oi.product_id].revenue_ttc + subtotal).toFixed(2));
      productStats[oi.product_id].revenue_ht = parseFloat((productStats[oi.product_id].revenue_ht + subtotal / 1.10).toFixed(2));
      productStats[oi.product_id].order_ids.add(oi.order_id);
    });
    
    // Formater les résultats
    const topProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({
        ...productsMap[productId],
        total_sold: stats.total_sold,
        revenue_ttc: parseFloat(stats.revenue_ttc.toFixed(2)),
        revenue_ht: parseFloat((stats.revenue_ht).toFixed(2)),
        total_orders: stats.order_ids.size
      }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, parseInt(limit))
      .map((p, index) => ({
        ...p,
        rank: index + 1
      }));
    
    logger.log(`✅ ${topProducts.length} top produits récupérés`);
    
    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    logger.error('❌ Erreur récupération top products:', error);
    logger.error('   Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des top produits' 
    });
  }
});

// ⏰ HEURES DE POINTE
app.get('/api/admin/analytics/peak-hours', authenticateToken, requireManager, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  logger.log('📊 GET /api/admin/analytics/peak-hours');
  logger.log('   Période:', startDate, '→', endDate);
  
  try {
    // ✅ SUPABASE: Convertir les dates
    const startDateTime = new Date(startDate + 'T00:00:00').toISOString();
    const endDateTime = new Date(endDate + 'T23:59:59.999').toISOString();
    
    // ✅ SUPABASE: Récupérer les commandes de la période
    const [ordersData] = await supabaseService.select('orders', {
      where: {
        created_at: { operator: '>=', value: startDateTime }
      },
      select: 'id,created_at,total_amount,status'
    });
    
    // Filtrer par dates et exclure les annulées
    const validOrders = (ordersData || []).filter(order => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(startDateTime) && orderDate <= new Date(endDateTime);
    });
    
    // Calculer les statistiques par heure
    const hourStats = {};
    validOrders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const hour = orderDate.getHours();
      if (!hourStats[hour]) {
        hourStats[hour] = {
          hour: hour,
          total_orders: 0,
          total_revenue: 0,
          orders: []
        };
      }
      hourStats[hour].total_orders++;
      const orderAmount = parseFloat(order.total_amount) || 0;
      hourStats[hour].total_revenue = parseFloat((hourStats[hour].total_revenue + orderAmount).toFixed(2));
      hourStats[hour].orders.push(orderAmount);
    });
    
    // Remplir les heures manquantes avec 0 et calculer la moyenne
    const allHours = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourStats[i];
      const avgOrderValue = hourData && hourData.orders.length > 0
        ? hourData.total_revenue / hourData.orders.length
        : 0;
      
      return {
        hour: i,
        label: `${i}h`,
        total_orders: hourData ? hourData.total_orders : 0,
        total_revenue: hourData ? parseFloat(hourData.total_revenue.toFixed(2)) : 0,
        avg_order_value: parseFloat(avgOrderValue.toFixed(2))
      };
    });
    
    logger.log(`✅ Données heures de pointe récupérées (24h)`);
    
    res.json({
      success: true,
      data: allHours
    });
  } catch (error) {
    logger.error('❌ Erreur récupération heures de pointe:', error);
    logger.error('   Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des heures de pointe' 
    });
  }
});

// 📊 RÉPARTITION PAR CATÉGORIE
app.get('/api/admin/analytics/category-distribution', authenticateToken, requireManager, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  logger.log('📊 GET /api/admin/analytics/category-distribution');
  logger.log('   Période:', startDate, '→', endDate);
  
  try {
    // ✅ SUPABASE: Convertir les dates
    const startDateTime = new Date(startDate + 'T00:00:00').toISOString();
    const endDateTime = new Date(endDate + 'T23:59:59.999').toISOString();
    
    // ✅ SUPABASE: Récupérer les commandes de la période
    const [ordersData] = await supabaseService.select('orders', {
      where: {
        created_at: { operator: '>=', value: startDateTime }
      },
      select: 'id,created_at,status'
    });
    
    // Filtrer par dates et exclure les annulées
    const validOrders = (ordersData || []).filter(order => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(startDateTime) && orderDate <= new Date(endDateTime);
    });
    
    const orderIds = validOrders.map(o => o.id);
    logger.log(`✅ ${orderIds.length} commandes valides trouvées`);
    
    if (orderIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        total_revenue: 0
      });
    }
    
    // ✅ SUPABASE: Récupérer les order_items pour ces commandes
    const [orderItemsData] = await supabaseService.select('order_items', {
      where: { order_id: orderIds },
      select: 'id,order_id,product_id,quantity,subtotal'
    });
    
    // ✅ SUPABASE: Récupérer les produits avec catégories
    const productIds = [...new Set((orderItemsData || []).map(oi => oi.product_id))];
    const [productsData] = await supabaseService.select('products', {
      where: { id: productIds },
      select: 'id,category_id'
    });
    
    const productsMap = {};
    (productsData || []).forEach(p => {
      productsMap[p.id] = p.category_id;
    });
    
    // ✅ SUPABASE: Récupérer les catégories
    const categoryIds = [...new Set(Object.values(productsMap).filter(Boolean))];
    const categoriesMap = {};
    if (categoryIds.length > 0) {
      const [categoriesData] = await supabaseService.select('categories', {
        where: { id: categoryIds },
        select: 'id,name,icon'
      });
      (categoriesData || []).forEach(cat => {
        categoriesMap[cat.id] = {
      id: cat.id,
      name: cat.name,
          icon: cat.icon
        };
      });
    }
    
    // Calculer les statistiques par catégorie
    const categoryStats = {};
    (orderItemsData || []).forEach(oi => {
      const categoryId = productsMap[oi.product_id];
      if (!categoryId) return;
      
      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = {
          revenue_ttc: 0,
          revenue_ht: 0,
          total_quantity: 0,
          order_ids: new Set()
        };
      }
      
      const subtotal = parseFloat(oi.subtotal) || 0;
      categoryStats[categoryId].revenue_ttc = parseFloat((categoryStats[categoryId].revenue_ttc + subtotal).toFixed(2));
      categoryStats[categoryId].revenue_ht = parseFloat((categoryStats[categoryId].revenue_ht + subtotal / 1.10).toFixed(2));
      categoryStats[categoryId].total_quantity += parseInt(oi.quantity) || 0;
      categoryStats[categoryId].order_ids.add(oi.order_id);
    });
    
    // Formater les résultats
    const result = Object.entries(categoryStats)
      .map(([categoryId, stats]) => ({
        id: parseInt(categoryId),
        name: categoriesMap[categoryId]?.name || 'Non catégorisé',
        icon: categoriesMap[categoryId]?.icon || null,
        revenue_ttc: parseFloat(stats.revenue_ttc.toFixed(2)),
        revenue_ht: parseFloat(stats.revenue_ht.toFixed(2)),
        total_quantity: stats.total_quantity,
        total_orders: stats.order_ids.size,
        percentage: 0 // Sera calculé après
      }))
      .sort((a, b) => b.revenue_ttc - a.revenue_ttc);
    
    // Calculer le total pour les pourcentages
    const totalRevenue = parseFloat(result.reduce((sum, cat) => sum + cat.revenue_ttc, 0).toFixed(2));
    
    // Ajouter les pourcentages
    result.forEach(cat => {
      cat.percentage = totalRevenue > 0 ? parseFloat((cat.revenue_ttc / totalRevenue * 100).toFixed(2)) : 0;
    });
    
    logger.log(`✅ ${result.length} catégories récupérées`);
    logger.log(`   Total CA: ${totalRevenue.toFixed(2)}€`);
    
    res.json({
      success: true,
      data: result,
      total_revenue: totalRevenue
    });
  } catch (error) {
    logger.error('❌ Erreur récupération répartition catégories:', error);
    logger.error('   Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la répartition par catégorie' 
    });
  }
});

// ADMIN - LISTE DES COMMANDES PAR PERIODE (détail transactions)
app.get('/api/admin/analytics/orders-period', authenticateToken, requireManager, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    logger.log('📊 GET /api/admin/analytics/orders-period');
    logger.log('   Période:', startDate, '→', endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate et endDate requis (YYYY-MM-DD)' });
    }

    // ✅ SUPABASE: Convertir les dates en format ISO
    const startDateTime = new Date(startDate + 'T00:00:00').toISOString();
    const endDateTime = new Date(endDate + 'T23:59:59.999').toISOString();

    // ✅ SUPABASE: Récupérer les commandes (on filtre ensuite en JavaScript)
    const [ordersData] = await supabaseService.select('orders', {
      where: {
        created_at: { operator: '>=', value: startDateTime }
      },
      select: 'id,order_number,created_at,updated_at,total_amount,payment_method,payment_status,status,user_id',
      orderBy: ['created_at DESC']
    });

    // Filtrer par date de fin et exclure les annulées en JavaScript
    let orders = (ordersData || []).filter(order => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(startDateTime) && orderDate <= new Date(endDateTime);
    });

    logger.log(`✅ ${orders.length} commandes récupérées pour la période`);

    // ✅ SUPABASE: Récupérer les users et order_items pour chaque commande
    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
    const usersMap = {};
    
    if (userIds.length > 0) {
      const [usersData] = await supabaseService.select('users', {
        where: { id: userIds },
        select: 'id,first_name,last_name,email'
      });
      
      (usersData || []).forEach(user => {
        usersMap[user.id] = user;
      });
    }

    // Récupérer les items_count pour chaque commande
    const orderIds = orders.map(o => o.id);
    const itemsCountMap = {};
    
    if (orderIds.length > 0) {
      // Récupérer tous les order_items pour ces commandes
      const [orderItemsData] = await supabaseService.select('order_items', {
        where: { order_id: orderIds },
        select: 'order_id'
      });
      
      // Compter les items par commande
      (orderItemsData || []).forEach(item => {
        itemsCountMap[item.order_id] = (itemsCountMap[item.order_id] || 0) + 1;
      });
    }

    // Formater les données pour le frontend
    const formattedOrders = orders.map(order => {
      const user = order.user_id ? usersMap[order.user_id] : null;
      return {
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        updated_at: order.updated_at,
        total_amount: parseFloat((parseFloat(order.total_amount) || 0).toFixed(2)),
        payment_method: order.payment_method || 'Non spécifié',
        payment_status: order.payment_status || 'pending',
        paymentStatus: order.payment_status || 'pending', // Alias pour compatibilité
        status: order.status,
        items_count: itemsCountMap[order.id] || 0,
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || ''
      };
    });

    logger.log(`✅ ${formattedOrders.length} commandes formatées`);

    res.json({ success: true, data: formattedOrders, count: formattedOrders.length });
  } catch (error) {
    logger.error('❌ Erreur orders-period:', error);
    logger.error('   Stack:', error.stack);
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
app.get('/api/admin/analytics/critical-stock', authenticateToken, requireManager, async (req, res) => {
  logger.log('📊 GET /api/admin/analytics/critical-stock');
  
  try {
    // ✅ SUPABASE: Récupérer tous les produits (on filtre deleted_at en JavaScript)
    const [allProductsData] = await supabaseService.select('products', {
      select: 'id,name,image_url,stock,min_stock,category_id,deleted_at'
    });
    
    // Filtrer les produits non supprimés
    const productsData = (allProductsData || []).filter(p => !p.deleted_at);
    
    // ✅ SUPABASE: Récupérer les catégories
    const categoryIds = [...new Set((productsData || []).map(p => p.category_id).filter(Boolean))];
    const categoriesMap = {};
    if (categoryIds.length > 0) {
      const [categoriesData] = await supabaseService.select('categories', {
        where: { id: categoryIds },
        select: 'id,name'
      });
      (categoriesData || []).forEach(cat => {
        categoriesMap[cat.id] = cat.name;
      });
    }
    
    // Calculer le statut et l'urgence pour chaque produit
    const criticalProducts = (productsData || [])
      .map(p => {
        const currentStock = parseInt(p.stock) || 0;
        const minStock = parseInt(p.min_stock) || 0;
        const minStockThreshold = minStock * 1.5;
        
        let status = 'ok';
        if (currentStock === 0) {
          status = 'out';
        } else if (currentStock <= minStock) {
          status = 'critical';
        } else if (currentStock <= minStockThreshold) {
          status = 'low';
        }
        
        let urgencyLevel = 0;
        if (currentStock === 0) {
          urgencyLevel = 100;
        } else if (minStock > 0) {
          const ratio = 1 - (currentStock / Math.max(minStock, 1));
          urgencyLevel = Math.max(0, Math.min(100, ratio * 100));
        }
        
        return {
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          category: categoriesMap[p.category_id] || 'Non catégorisé',
          current_stock: currentStock,
          min_stock: minStock,
          status: status,
          urgency_level: parseFloat(urgencyLevel.toFixed(2))
        };
      })
      .filter(p => p.status !== 'ok') // Filtrer uniquement les produits en stock critique/bas
      .sort((a, b) => {
        // Trier par priorité: out (0) > critical (1) > low (2)
        const priority = { 'out': 0, 'critical': 1, 'low': 2 };
        const priorityDiff = (priority[a.status] || 99) - (priority[b.status] || 99);
        if (priorityDiff !== 0) return priorityDiff;
        // Ensuite par stock croissant
        return a.current_stock - b.current_stock;
      });
    
    logger.log(`✅ ${criticalProducts.length} produits en stock critique`);
    
    res.json({
      success: true,
      data: criticalProducts,
      total_critical: criticalProducts.filter(p => p.status === 'critical' || p.status === 'out').length,
      total_low: criticalProducts.filter(p => p.status === 'low').length
    });
  } catch (error) {
    logger.error('❌ Erreur récupération stock critique:', error);
    logger.error('   Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des produits en stock critique' 
    });
  }
});

// GET - Récupérer les ingrédients en stock avec leur valeur totale (inventaire)
app.get('/api/admin/analytics/stock-value', authenticateToken, requireManager, async (req, res) => {
  logger.log('📊 GET /api/admin/analytics/stock-value - Valeur inventaire');
  
  try {
    // ✅ SUPABASE: Récupérer tous les ingrédients (inventaire - matières premières)
    const [allIngredientsData] = await supabaseService.select('ingredients', {
      select: 'id,name,quantity,price_per_unit,deleted_at'
    });
    
    // Filtrer les ingrédients non supprimés
    const ingredientsData = (allIngredientsData || []).filter(i => !i.deleted_at);
    
    // Calculer la valeur totale du stock
    let totalStockValue = 0;
    let totalProducts = 0;
    let totalItems = 0;
    
    const stockDetails = (ingredientsData || []).map(i => {
      const quantity = parseFloat(i.quantity) || 0;
      const price = parseFloat(i.price_per_unit) || 0;
      const ingredientValue = parseFloat((quantity * price).toFixed(2));
      
      totalStockValue = parseFloat((totalStockValue + ingredientValue).toFixed(2));
      if (quantity > 0) {
        totalProducts++;
        totalItems = parseFloat((totalItems + quantity).toFixed(2));
      }
      
      return {
        id: i.id,
        name: i.name,
        stock: parseFloat(quantity.toFixed(2)),
        price: parseFloat(price.toFixed(2)),
        value: ingredientValue
      };
    }).filter(i => i.stock > 0); // Seulement les ingrédients en stock
    
    logger.log(`✅ ${totalProducts} ingrédients en stock, ${totalItems} unités, valeur totale: ${totalStockValue}€`);
    
    res.json({
      success: true,
      data: stockDetails,
      total_products: totalProducts,
      total_items: parseFloat(totalItems.toFixed(2)),
      total_value: totalStockValue
    });
  } catch (error) {
    logger.error('❌ Erreur récupération valeur stock:', error);
    logger.error('   Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la valeur du stock' 
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