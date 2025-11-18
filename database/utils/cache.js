/**
 * Système de cache centralisé pour les données fréquemment accédées
 * Utilise node-cache pour un cache en mémoire avec TTL configurable
 */

const NodeCache = require('node-cache');
const logger = require('./logger');

// ✅ OPTIMISATION: Configuration du cache selon l'environnement
const isProd = process.env.NODE_ENV === 'production';

// Cache principal avec TTL par défaut
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes par défaut
  checkperiod: 60, // Vérifier les entrées expirées toutes les 60 secondes
  useClones: false, // Performance : ne pas cloner les objets (plus rapide)
  deleteOnExpire: true, // Supprimer automatiquement les entrées expirées
  enableLegacyCallbacks: false // Utiliser les promesses modernes
});

// ✅ OPTIMISATION: TTL spécifiques selon le type de données
const TTL_CONFIG = {
  // Données rarement modifiées (5 minutes)
  PRODUCTS: 300,
  CATEGORIES: 300,
  SETTINGS: 300,
  
  // Données modérément modifiées (2 minutes)
  NEWS: 120,
  STATS: 120,
  
  // Données fréquemment modifiées (30 secondes)
  ORDERS: 30,
  DASHBOARD: 30,
  
  // Données très dynamiques (10 secondes)
  USER_PROFILE: 10
};

/**
 * Obtenir une valeur du cache
 * @param {string} key - Clé du cache
 * @returns {any|null} - Valeur en cache ou null
 */
const get = (key) => {
  try {
    const value = cache.get(key);
    if (value !== undefined) {
      logger.debug('Cache hit', { key });
      return value;
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
};

/**
 * Stocker une valeur dans le cache
 * @param {string} key - Clé du cache
 * @param {any} value - Valeur à stocker
 * @param {number} ttl - TTL en secondes (optionnel, utilise TTL_CONFIG si non fourni)
 * @returns {boolean} - Succès de l'opération
 */
const set = (key, value, ttl = null) => {
  try {
    // Déterminer le TTL selon le type de clé
    let cacheTTL = ttl;
    if (!cacheTTL) {
      if (key.includes('products')) cacheTTL = TTL_CONFIG.PRODUCTS;
      else if (key.includes('categories')) cacheTTL = TTL_CONFIG.CATEGORIES;
      else if (key.includes('settings')) cacheTTL = TTL_CONFIG.SETTINGS;
      else if (key.includes('news')) cacheTTL = TTL_CONFIG.NEWS;
      else if (key.includes('stats')) cacheTTL = TTL_CONFIG.STATS;
      else if (key.includes('orders')) cacheTTL = TTL_CONFIG.ORDERS;
      else if (key.includes('dashboard')) cacheTTL = TTL_CONFIG.DASHBOARD;
      else if (key.includes('user') || key.includes('profile')) cacheTTL = TTL_CONFIG.USER_PROFILE;
      else cacheTTL = 300; // 5 minutes par défaut
    }
    
    const success = cache.set(key, value, cacheTTL);
    if (success) {
      logger.debug('Cache set', { key, ttl: cacheTTL });
    }
    return success;
  } catch (error) {
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
};

/**
 * Supprimer une clé du cache
 * @param {string} key - Clé à supprimer
 * @returns {number} - Nombre de clés supprimées
 */
const del = (key) => {
  try {
    const deleted = cache.del(key);
    if (deleted > 0) {
      logger.debug('Cache delete', { key });
    }
    return deleted;
  } catch (error) {
    logger.error('Cache delete error', { key, error: error.message });
    return 0;
  }
};

/**
 * Invalider plusieurs clés selon un pattern
 * @param {string} pattern - Pattern de clés à invalider (ex: 'products:*')
 * @returns {number} - Nombre de clés supprimées
 */
const invalidatePattern = (pattern) => {
  try {
    const keys = cache.keys();
    const patternRegex = new RegExp(pattern.replace('*', '.*'));
    let deleted = 0;
    
    keys.forEach(key => {
      if (patternRegex.test(key)) {
        cache.del(key);
        deleted++;
      }
    });
    
    if (deleted > 0) {
      logger.debug('Cache invalidate pattern', { pattern, deleted });
    }
    return deleted;
  } catch (error) {
    logger.error('Cache invalidate pattern error', { pattern, error: error.message });
    return 0;
  }
};

/**
 * Vider complètement le cache
 * @returns {void}
 */
const flush = () => {
  try {
    cache.flushAll();
    logger.info('Cache flushed');
  } catch (error) {
    logger.error('Cache flush error', { error: error.message });
  }
};

/**
 * Obtenir les statistiques du cache
 * @returns {Object} - Statistiques du cache
 */
const getStats = () => {
  try {
    const stats = cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0
    };
  } catch (error) {
    logger.error('Cache stats error', { error: error.message });
    return null;
  }
};

/**
 * Middleware Express pour wrapper une route avec cache
 * @param {Function} handler - Handler de la route
 * @param {string} cacheKey - Clé de cache (peut être une fonction pour générer dynamiquement)
 * @param {number} ttl - TTL en secondes (optionnel)
 * @returns {Function} - Middleware Express
 */
const cacheMiddleware = (handler, cacheKey, ttl = null) => {
  return async (req, res, next) => {
    // Générer la clé de cache
    const key = typeof cacheKey === 'function' ? cacheKey(req) : cacheKey;
    
    // Vérifier le cache
    const cached = get(key);
    if (cached !== null) {
      return res.json(cached);
    }
    
    // Intercepter la réponse pour la mettre en cache
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      set(key, data, ttl);
      return originalJson(data);
    };
    
    // Appeler le handler
    return handler(req, res, next);
  };
};

// ✅ OPTIMISATION: Invalider automatiquement le cache lors des modifications
const invalidateOnModify = {
  // Invalider les produits lors des modifications
  products: () => {
    invalidatePattern('products:*');
    invalidatePattern('categories:*'); // Les catégories peuvent changer aussi
  },
  
  // Invalider les catégories lors des modifications
  categories: () => {
    invalidatePattern('categories:*');
    invalidatePattern('products:*'); // Les produits dépendent des catégories
  },
  
  // Invalider les paramètres lors des modifications
  settings: () => {
    invalidatePattern('settings:*');
    invalidatePattern('home:*'); // Les stats de la page d'accueil peuvent changer
  },
  
  // Invalider les actualités lors des modifications
  news: () => {
    invalidatePattern('news:*');
    invalidatePattern('home:*');
  },
  
  // Invalider les commandes lors des modifications
  orders: () => {
    invalidatePattern('orders:*');
    invalidatePattern('dashboard:*');
    invalidatePattern('stats:*');
  }
};

module.exports = {
  get,
  set,
  del,
  invalidatePattern,
  flush,
  getStats,
  cacheMiddleware,
  invalidateOnModify,
  TTL_CONFIG
};

