/**
 * 🔧 Logger intelligent et optimisé pour réduire les logs en production
 * - Ne plante jamais (try/catch sécurisés)
 * - Réduit automatiquement les logs selon l'environnement
 * - Très haute performance (aucune création de fonction inutile)
 */

const ENV = import.meta?.env?.MODE || process.env.NODE_ENV || "development";

// 🎯 Niveaux de logs
const LEVELS = {
  silent: 0,   // Aucun log
  error: 1,    // Seulement error()
  warn: 2,     // error + warn
  info: 3,     // error + warn + info
  debug: 4,    // tout activé
};

// 🎯 Niveau automatique selon l'environnement
// Production : ne log que les erreurs
// Development : log tout
// Preview/staging : log limité
let CURRENT_LEVEL =
  ENV === "production"
    ? LEVELS.error
    : ENV === "preview" || ENV === "staging"
    ? LEVELS.warn
    : LEVELS.debug; // dev

// 🔒 Sécurisation interne
const safeExec = (fn, ...args) => {
  try {
    if (typeof console !== "undefined" && fn) {
      fn(...args);
    }
  } catch (e) {
    // silence total
  }
};

// 🔒 Masquer les données sensibles dans les logs
const sanitizeData = (data) => {
  if (data === null || data === undefined) return data;
  
  // Si c'est une string, vérifier si elle contient des tokens ou URLs sensibles
  if (typeof data === 'string') {
    // Masquer les tokens JWT (commencent souvent par "eyJ")
    if (data.startsWith('eyJ') || (data.length > 50 && !data.includes('http'))) {
      return '***TOKEN_MASKED***';
    }
    // Masquer les URLs avec tokens dans query params ou path
    if (data.includes('http') && (data.includes('token=') || data.includes('/token/') || data.includes('?token') || data.includes('&token'))) {
      return data.replace(/([?&]token=)[^&]*/gi, '$1***MASKED***').replace(/\/token\/[^/\s]+/gi, '/token/***MASKED***');
    }
    // Masquer les emails partiellement
    if (data.includes('@') && data.includes('.')) {
      const [local, domain] = data.split('@');
      if (local && domain) {
        return `${local.substring(0, 2)}***@${domain}`;
      }
    }
    return data;
  }
  
  // Si c'est un objet, masquer les champs sensibles
  if (typeof data === 'object') {
    const sensitiveFields = ['token', 'password', 'secret', 'email', 'authorization', 'cookie', 'role', 'loyalty_points', 'points', 'order_number', 'orderNumber', 'first_name', 'last_name', 'name', 'user_id', 'userId', 'client_identifier'];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        if (lowerKey.includes('email')) {
          // Masquer partiellement les emails
          const email = sanitized[key];
          if (typeof email === 'string' && email.includes('@')) {
            const [local, domain] = email.split('@');
            sanitized[key] = `${local.substring(0, 2)}***@${domain}`;
          } else {
            sanitized[key] = '***EMAIL_MASKED***';
          }
        } else if (lowerKey.includes('token')) {
          sanitized[key] = '***TOKEN_MASKED***';
        } else if (lowerKey.includes('role')) {
          // Masquer le rôle pour éviter l'exposition du statut admin
          sanitized[key] = '***ROLE_MASKED***';
        } else if (lowerKey.includes('points') || lowerKey.includes('loyalty')) {
          // Masquer les points de fidélité
          sanitized[key] = '***POINTS_MASKED***';
        } else if (lowerKey.includes('order_number') || lowerKey.includes('ordernumber')) {
          // Masquer les numéros de commande
          sanitized[key] = '***ORDER_NUMBER_MASKED***';
        } else if (lowerKey.includes('first_name') || lowerKey.includes('last_name') || (lowerKey.includes('name') && !lowerKey.includes('category') && !lowerKey.includes('product'))) {
          // Masquer les noms et prénoms (données personnelles RGPD)
          sanitized[key] = '***NAME_MASKED***';
        } else if (lowerKey.includes('user_id') || lowerKey.includes('userid') || lowerKey.includes('client_identifier')) {
          // Masquer les IDs utilisateur
          sanitized[key] = '***USER_ID_MASKED***';
        } else {
          sanitized[key] = '***MASKED***';
        }
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};

// 🔒 Sanitizer pour les arguments de log
const sanitizeArgs = (args) => {
  return args.map(arg => sanitizeData(arg));
};

// 🧠 Logger optimisé
export const logger = {
  setLevel(levelName) {
    if (LEVELS[levelName] !== undefined) {
      CURRENT_LEVEL = LEVELS[levelName];
    }
  },

  /**
   * Logs disponibles selon le niveau actif
   */
  error: (...args) => {
    if (CURRENT_LEVEL >= LEVELS.error) {
      // ✅ SÉCURITÉ: Masquer les données sensibles même dans les erreurs
      const sanitized = sanitizeArgs(args);
      safeExec(console.error, ...sanitized);
    }
  },

  warn: (...args) => {
    if (CURRENT_LEVEL >= LEVELS.warn) {
      // ✅ SÉCURITÉ: Masquer les données sensibles
      const sanitized = sanitizeArgs(args);
      safeExec(console.warn, ...sanitized);
    }
  },

  info: (...args) => {
    if (CURRENT_LEVEL >= LEVELS.info) {
      // ✅ SÉCURITÉ: Masquer les données sensibles
      const sanitized = sanitizeArgs(args);
      safeExec(console.info, ...sanitized);
    }
  },

  debug: (...args) => {
    if (CURRENT_LEVEL >= LEVELS.debug) {
      // ✅ SÉCURITÉ: Masquer les données sensibles même en développement
      const sanitized = sanitizeArgs(args);
      safeExec(console.debug, ...sanitized);
    }
  },

  log: (...args) => {
    if (CURRENT_LEVEL >= LEVELS.debug) {
      // ✅ SÉCURITÉ: Masquer les données sensibles même en développement
      const sanitized = sanitizeArgs(args);
      safeExec(console.log, ...sanitized);
    }
  },

  /**
   * Groupes (avec sécurité)
   */
  group: (label) => {
    if (CURRENT_LEVEL >= LEVELS.debug)
      safeExec(console.group, label);
  },

  groupEnd: () => {
    if (CURRENT_LEVEL >= LEVELS.debug)
      safeExec(console.groupEnd);
  },

  /**
   * Log conditionnel
   */
  conditional: (condition, ...args) => {
    if (condition && CURRENT_LEVEL >= LEVELS.info) {
      safeExec(console.log, ...args);
    }
  },
};

export default logger;
