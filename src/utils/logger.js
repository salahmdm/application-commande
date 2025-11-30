/**
 * 🔧 Logger intelligent et optimisé pour réduire les logs en production
 * - Ne plante jamais (try/catch sécurisés)
 * - Réduit automatiquement les logs selon l'environnement
 * - Très haute performance (aucune création de fonction inutile)
 */

// ✅ FRONTEND: Utiliser uniquement import.meta.env (pas process.env qui n'existe pas dans le navigateur)
// ✅ SÉCURITÉ: Vérification robuste pour éviter les erreurs si import.meta n'est pas disponible
let ENV = "development";
try {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
    ENV = import.meta.env.MODE;
  } else if (typeof import.meta !== 'undefined' && import.meta.env?.DEV !== undefined) {
    ENV = import.meta.env.DEV ? "development" : "production";
  }
} catch {
  // Fallback en cas d'erreur
  ENV = "development";
}

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
    // ✅ Vérifications de sécurité avant toute opération
    if (typeof console === "undefined") {
      return; // Pas de console disponible, sortir silencieusement
    }
    
    if (!fn || typeof fn !== 'function') {
      return; // Pas une fonction valide, sortir silencieusement
    }
    
    // ✅ Vérifier que args est un tableau valide avant le spread
    if (!Array.isArray(args)) {
      // Si args n'est pas un tableau (cas très rare), le convertir
      args = [args];
    }
    
    // ✅ Appeler la fonction avec les arguments (protégé par try/catch)
    fn(...args);
  } catch {
    // ✅ Silence total - pas besoin de capturer l'erreur
    // Toute erreur (spread operator, appel de fonction, etc.) est silencieusement ignorée
  }
};

// 🔒 Masquer les données sensibles dans les logs
// ✅ PROTECTION: Limite de profondeur et détection de références circulaires pour éviter les récursions infinies
const sanitizeData = (data, depth = 0, maxDepth = 10, visited = new WeakSet()) => {
  // ✅ Protection : Limite de profondeur pour éviter les stack overflows
  if (depth > maxDepth) {
    return '[Max depth reached]';
  }
  
  if (data === null || data === undefined) return data;
  
  // Si c'est une string, vérifier si elle contient des tokens ou URLs sensibles
  if (typeof data === 'string') {
    // ✅ Masquer les tokens JWT (commencent par "eyJ" et ont une structure spécifique)
    if (data.startsWith('eyJ') && data.length > 50) {
      // Vérifier que c'est un vrai JWT (3 parties séparées par des points)
      const parts = data.split('.');
      if (parts.length === 3) {
        return '***TOKEN_MASKED***';
      }
    }
    
    // ✅ Masquer les URLs avec tokens dans query params ou path
    if (data.includes('http') && (data.includes('token=') || data.includes('/token/') || data.includes('?token') || data.includes('&token'))) {
      return data.replace(/([?&]token=)[^&]*/gi, '$1***MASKED***').replace(/\/token\/[^/\s]+/gi, '/token/***MASKED***');
    }
    
    // ✅ Masquer les emails partiellement (avec regex pour meilleure détection)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(data.trim())) {
      const [local, domain] = data.split('@');
      if (local && domain) {
        const maskedLocal = local.length > 2 ? `${local.substring(0, 2)}***` : '***';
        return `${maskedLocal}@${domain}`;
      }
    }
    return data;
  }
  
  // Si c'est un objet, masquer les champs sensibles
  if (typeof data === 'object') {
    // ✅ Protection : Vérifier si l'objet a déjà été visité (référence circulaire)
    if (visited.has(data)) {
      return '[Circular reference]';
    }
    
    const sensitiveFields = ['token', 'password', 'secret', 'email', 'authorization', 'cookie', 'role', 'loyalty_points', 'points', 'order_number', 'orderNumber', 'first_name', 'last_name', 'name', 'user_id', 'userId', 'client_identifier'];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    // ✅ Marquer cet objet comme visité avant de le traiter
    visited.add(data);
    
    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        if (lowerKey.includes('email')) {
          // ✅ Masquer partiellement les emails avec la même logique robuste
          const email = sanitized[key];
          if (typeof email === 'string' && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(email.trim())) {
              const [local, domain] = email.split('@');
              if (local && domain) {
                const maskedLocal = local.length > 2 ? `${local.substring(0, 2)}***` : '***';
                sanitized[key] = `${maskedLocal}@${domain}`;
              } else {
                sanitized[key] = '***EMAIL_MASKED***';
              }
            } else {
              sanitized[key] = '***EMAIL_MASKED***';
            }
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
        // ✅ Protection : Passer la profondeur et visited pour éviter les récursions infinies
        sanitized[key] = sanitizeData(sanitized[key], depth + 1, maxDepth, visited);
      }
    }
    return sanitized;
  }
  
  return data;
};

// 🔒 Sanitizer pour les arguments de log
const sanitizeArgs = (args) => {
  // ✅ Protection : Vérifier que args est un tableau valide
  if (!Array.isArray(args)) {
    // Si args n'est pas un tableau (cas très rare), le convertir et sanitizer
    return [sanitizeData(args)];
  }
  // ✅ Sanitizer chaque argument (chacun aura son propre WeakSet pour visited)
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
