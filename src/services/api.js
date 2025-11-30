/**
 * Configuration API
 * Point d'entrée pour tous les appels API - Connecté à MySQL Backend
 */

// Import jwt-decode (version 4.x utilise un export nommé)
// ✅ Protection contre erreur d'import avec fallback
import { jwtDecode as jwtDecodeImport } from 'jwt-decode';
import logger from '../utils/logger';

// Wrapper sécurisé pour jwtDecode
const jwtDecode = (token) => {
  try {
    return jwtDecodeImport(token);
  } catch (error) {
    logger.warn('⚠️ Erreur décodage JWT:', error);
    // Retourner un objet avec exp: 0 pour forcer l'expiration
    return { exp: 0 };
  }
};

// ✅ VERCEL: URL du backend API depuis variable d'environnement
// En production Vercel, utilisez VITE_API_URL
// En développement local, utilise localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

// ✅ SÉCURITÉ: Cache pour le token CSRF
let csrfTokenCache = null;
let csrfTokenExpiry = 0;

/**
 * Récupère le token CSRF depuis le serveur
 * Le token est aussi stocké dans un cookie HTTP-only par le serveur
 */
const getCsrfToken = async () => {
  // Vérifier si le token en cache est encore valide (23 heures)
  const now = Date.now();
  if (csrfTokenCache && now < csrfTokenExpiry) {
    return csrfTokenCache;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      method: 'GET',
      credentials: 'include' // Nécessaire pour recevoir les cookies
    });

    if (response.ok) {
      const data = await response.json();
      csrfTokenCache = data.csrfToken;
      // Le token expire dans 24h, on le cache pour 23h
      csrfTokenExpiry = now + (23 * 60 * 60 * 1000);
      return csrfTokenCache;
    }
  } catch (error) {
    logger.warn('⚠️ Erreur récupération token CSRF:', error);
  }

  return null;
};

const reportDiag = async (_payload) => {
  // Diagnostic externe désactivé -> no-op
  return;
};

// Délai simulé pour les appels API mock (utilisé pour fallback)
const MOCK_DELAY = 500;

/**
 * Fonction utilitaire pour simuler un délai réseau
 */
const delay = (ms = MOCK_DELAY) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Vérifier si un token JWT est expiré
 * @param {string} token - Token JWT à vérifier
 * @returns {boolean} - true si expiré, false sinon
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convertir en secondes
    
    // Vérifier si le token a un champ 'exp' et s'il est expiré
    if (decoded.exp && decoded.exp < currentTime) {
      return true;
    }
    
    return false;
  } catch (error) {
    // Si le token ne peut pas être décodé, considérer comme expiré
    logger.warn('⚠️ Erreur décodage token:', error);
    return true;
  }
};

/**
 * Rafraîchir le token via l'API refresh
 * @returns {Promise<boolean>} - true si rafraîchi avec succès
 */
const refreshToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Nécessaire pour envoyer les cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      logger.log('✅ Token rafraîchi avec succès');
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('❌ Erreur rafraîchissement token:', error);
    return false;
  }
};

/**
 * Récupérer le token JWT depuis les cookies (HTTP-only) ou localStorage (compatibilité)
 * ✅ PRIORITÉ: Les cookies HTTP-only sont maintenant utilisés (sécurisé)
 * ⚠️ FALLBACK: localStorage pour compatibilité pendant migration
 */
const getAuthToken = () => {
  // ✅ Les cookies HTTP-only sont automatiquement envoyés par le navigateur
  // Pas besoin de les lire côté JavaScript (ils sont inaccessibles de toute façon)
  // Le backend les lira automatiquement depuis req.cookies.token
  
  // ⚠️ FALLBACK: Vérifier localStorage pour compatibilité temporaire
  // (sera supprimé une fois la migration complète)
  let token = localStorage.getItem('token');
  
  if (!token) {
    try {
      const authStorage = localStorage.getItem('blossom-auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        token = parsed.state?.token || parsed.token || null;
      }
    } catch (e) {
      logger.warn('⚠️ Erreur parsing blossom-auth-storage pour token:', e);
    }
  }
  
  return token; // Retourner null si pas de token (les cookies seront utilisés automatiquement)
};

const getUserContext = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed) {
      return null;
    }

    const normalizeRole = (role) => {
      if (!role) return null;
      return role.toString().trim().toLowerCase();
    };

    const firstName = parsed.first_name ?? parsed.firstName ?? '';
    const lastName = parsed.last_name ?? parsed.lastName ?? '';

    const normalizedRole = normalizeRole(parsed.role);
    
    // ✅ CRITIQUE: Logger le rôle récupéré pour diagnostic
    if (!normalizedRole) {
      logger.warn('⚠️ getUserContext - Rôle manquant ou invalide dans localStorage:', {
        hasRole: !!parsed.role,
        roleRaw: parsed.role,
        roleType: typeof parsed.role,
        userId: parsed.uid || parsed.id || parsed.user_id
      });
    }
    
    return {
      id: parsed.uid || parsed.id || parsed.user_id || null,
      email: parsed.email || null,
      role: normalizedRole || 'client', // ✅ Toujours retourner un rôle (fallback: 'client')
      name: parsed.name || `${firstName} ${lastName}`.trim() || parsed.email || '',
      isGuest: parsed.isGuest === true,
    };
  } catch (error) {
    logger.warn('⚠️ Erreur récupération user context:', error);
    return null;
  }
};

/**
 * Wrapper pour les appels fetch avec gestion des erreurs et authentification
 */
export const apiCall = async (endpoint, options = {}) => {
  // ✅ Vérification de sécurité : endpoint doit être défini
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error(`Endpoint invalide pour l'appel API: ${endpoint}`);
  }
  
  // ✅ Vérifier si c'est une route publique (pas besoin de token)
  // ⚠️ CRITIQUE: Exclure les routes admin/manager de la liste des routes publiques
  const isAdminRoute = endpoint.startsWith('/admin/') || endpoint.startsWith('/manager/');
  const isPublicRoute = !isAdminRoute && (
                        endpoint === '/restaurant-info' ||
                        endpoint.startsWith('/restaurant-info') && !endpoint.includes('/admin/') ||
                        endpoint.startsWith('/settings/') ||
                        (endpoint === '/products' || endpoint.startsWith('/products/') || endpoint === '/products/all') ||
                        (endpoint === '/categories' || endpoint.startsWith('/categories/')) ||
                        endpoint.startsWith('/news') ||
                        endpoint.startsWith('/loyalty-rewards') ||
                        endpoint === '/csrf-token' ||
                        endpoint === '/health' ||
                        endpoint.startsWith('/auth/login') ||
                        endpoint.startsWith('/auth/register'));
  
  // ✅ SÉCURITÉ: Vérifier l'expiration du token avant la requête
  // ✅ Seulement pour les routes non publiques
  const token = getAuthToken();
  
  // Si un token existe dans localStorage (fallback), vérifier son expiration
  // ✅ Seulement pour les routes non publiques
  if (!isPublicRoute && token && isTokenExpired(token)) {
    logger.debug('⚠️ Token expiré détecté, tentative de rafraîchissement...');
    
    // Essayer de rafraîchir le token
    const refreshed = await refreshToken();
    
    if (!refreshed) {
      // Si le rafraîchissement échoue, nettoyer et lancer une erreur
      logger.warn('⚠️ Impossible de rafraîchir le token, déconnexion requise');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Ne pas lancer d'erreur ici pour les routes publiques
      // L'erreur sera gérée par la réponse 401 du serveur
      if (endpoint.includes('/auth/')) {
        // Pour les routes d'authentification, continuer normalement
      } else {
        // Pour les autres routes, on laisse passer (le serveur renverra 401)
      }
    }
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  // ✅ Sécuriser options pour éviter les erreurs (DOIT être fait AVANT toute utilisation)
  const safeOptions = options || {};
  const method = safeOptions.method || 'GET';
  
  try {
    // ✅ SÉCURITÉ: Masquer les tokens dans les URLs avant de logger
    const sanitizedUrl = url.replace(/([?&]token=)[^&]*/gi, '$1***MASKED***').replace(/\/token\/[^/\s]+/gi, '/token/***MASKED***');
    logger.debug('🌐 API Call:', method, sanitizedUrl);
    
    // ✅ SÉCURITÉ: Récupérer le token CSRF pour les requêtes modifiantes
    let csrfToken = null;
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(safeOptions.method || 'GET')) {
      csrfToken = await getCsrfToken();
    }
    
    // Construire les headers
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(safeOptions.headers || {}),
    };

    const userContext = getUserContext();
    if (userContext) {
      if (userContext.id) {
        headers['X-User-Id'] = userContext.id;
      }
      if (userContext.email) {
        headers['X-User-Email'] = userContext.email;
      }
      if (userContext.role) {
        headers['X-User-Role'] = userContext.role;
        headers['X-User-Is-Admin'] = (userContext.role === 'admin').toString();
      }
      headers['X-User-Is-Guest'] = userContext.isGuest ? 'true' : 'false';
    }
    
    // Préparer le body - stringify si c'est un objet
    const body = safeOptions.body 
      ? (typeof safeOptions.body === 'string' ? safeOptions.body : JSON.stringify(safeOptions.body))
      : undefined;
    
    // ✅ CRITIQUE: Inclure les cookies dans toutes les requêtes (credentials: 'include')
    // Cela permet d'envoyer automatiquement les cookies HTTP-only
    // ✅ STABILITÉ: Supporter AbortController signal pour les timeouts
    // ✅ CORRECTION: Ne pas écraser headers, body, credentials avec le spread options
    // Construire fetchOptions en excluant explicitement les propriétés qu'on gère séparément
    const signal = safeOptions.signal;
    
    // ✅ Construire les options fetch en préservant les valeurs critiques
    // Construire explicitement fetchOptions avec seulement les propriétés nécessaires
    const fetchOptions = {
      method: safeOptions.method || 'GET',
      headers,
      credentials: 'include', // ✅ Nécessaire pour envoyer les cookies HTTP-only (priorité absolue)
    };
    
    // Ajouter les propriétés optionnelles de safeOptions (cache, redirect, etc.) si présentes
    if (safeOptions.cache !== undefined) fetchOptions.cache = safeOptions.cache;
    if (safeOptions.redirect !== undefined) fetchOptions.redirect = safeOptions.redirect;
    if (safeOptions.referrer !== undefined) fetchOptions.referrer = safeOptions.referrer;
    if (safeOptions.referrerPolicy !== undefined) fetchOptions.referrerPolicy = safeOptions.referrerPolicy;
    if (safeOptions.mode !== undefined) fetchOptions.mode = safeOptions.mode;
    if (safeOptions.keepalive !== undefined) fetchOptions.keepalive = safeOptions.keepalive;
    
    // ✅ Ajouter body seulement s'il est défini (évite les erreurs si undefined)
    if (body !== undefined && body !== null) {
      fetchOptions.body = body;
    }
    
    // ✅ Ajouter le signal seulement s'il est défini (évite les erreurs si undefined)
    if (signal) {
      fetchOptions.signal = signal;
    }
    
    // ✅ Vérifications de sécurité avant l'appel fetch
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error(`URL invalide pour l'appel API: ${url}`);
    }
    
    if (!fetchOptions || typeof fetchOptions !== 'object') {
      throw new Error('Options fetch invalides');
    }
    
    if (!fetchOptions.headers || typeof fetchOptions.headers !== 'object') {
      throw new Error('Headers fetch invalides');
    }
    
    const response = await fetch(url, fetchOptions);
    
    // ✅ Log seulement si erreur (niveau INFO)
    if (!response.ok) {
      logger.debug('📡 Réponse erreur:', response.status, response.statusText);
    }
    
    if (!response.ok) {
      const isSettingsParam404 = response.status === 404 && endpoint?.startsWith('/settings/');
      if (isSettingsParam404) {
        logger.debug(`ℹ️ Paramètre ${endpoint} introuvable (404). Retour valeur par défaut.`);
        return { success: false, error: 'Paramètre non trouvé', status: 404 };
      }
      const errorData = await response.json().catch(() => ({}));
      // Reporter l'erreur HTTP si activé
      reportDiag({
        message: `HTTP ${response.status} on ${url}`,
        details: { endpoint, method: method, error: errorData?.error || errorData?.message },
        endpoint,
        method: method,
        responseStatus: response.status
      });
      // ✅ LOGGING INTELLIGENT: Ne logger que les erreurs importantes
      // - Les erreurs 401/403 sont déjà gérées par le fallback Supabase → logger.debug()
      // - Les erreurs 404 attendues (settings) → logger.debug()
      // - Les erreurs critiques (500, etc.) → logger.error()
      // - Les erreurs de validation → logger.warn()
      
      const isAuthError = response.status === 401 || response.status === 403;
      const isExpected404 = response.status === 404 && endpoint?.startsWith('/settings/');
      const isValidationError = errorData?.code === 'VALIDATION_ERROR';
      const isCriticalError = response.status >= 500;
      
      // ✅ Grouper toutes les infos dans un seul message compact
      if (isCriticalError) {
        // Erreurs serveur critiques → logger.error() (toujours visible)
        logger.error(`❌ ERREUR API [${response.status}] ${endpoint}:`, errorData?.error || errorData?.message || 'Erreur serveur');
      } else if (isValidationError) {
        // Erreurs de validation → logger.warn() (avertissement)
        logger.warn(`⚠️ Validation [${endpoint}]:`, errorData?.error || errorData?.message);
      } else if (isAuthError || isExpected404) {
        // Erreurs d'auth ou 404 attendus → logger.debug() (détails seulement en debug)
        logger.debug(`🔍 API [${response.status}] ${endpoint}:`, errorData?.error || errorData?.message || 'Non disponible');
      } else {
        // Autres erreurs (400, etc.) → logger.warn() (avertissement)
        logger.warn(`⚠️ API [${response.status}] ${endpoint}:`, errorData?.error || errorData?.message || 'Erreur');
      }
      // ✅ Afficher les détails de validation si disponibles
      if (errorData.code === 'VALIDATION_ERROR' && errorData.details && Array.isArray(errorData.details)) {
        logger.debug('Détails de validation:', errorData.details);
        errorData.details.forEach((detail, index) => {
          const fieldName = detail.field || 'champ non spécifié';
          logger.debug(`  ${index + 1}. ${fieldName}: ${detail.message}`);
        });
      }
      
      // Gestion spécifique des erreurs d'authentification
      if (response.status === 401 || response.status === 403) {
        // ✅ CRÉER UNE ERREUR STRUCTURÉE AVEC LE STATUS POUR PERMETTRE LE FALLBACK
        const authError = new Error(errorData?.error || errorData?.message || `HTTP ${response.status}`);
        authError.status = response.status;
        authError.statusCode = response.status;
        authError.isAuthError = true;
        authError.errorData = errorData;
        
        // Vérifier si c'est un invité (pas de token attendu)
        const userStr = localStorage.getItem('user');
        const isGuest = userStr ? JSON.parse(userStr).isGuest : false;
        const hasNoToken = !token;
        const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
        
        // ✅ Ne logger que si c'est une erreur inattendue
        // Conditions pour NE PAS logger (cas normaux) :
        // - Route publique (pas besoin d'auth)
        // - Invité (pas de token attendu)
        // - Pas de token (normal pour routes publiques)
        // - Déjà sur la page de login (normal)
        const shouldLogAuthError = !isPublicRoute && !isGuest && !hasNoToken && !isOnLoginPage;
        
        if (shouldLogAuthError) {
          logger.warn('🔐 Token invalide ou expiré');
        }
        
        // ✅ CORRECTION: Éviter les redirections en boucle
        // Vérifier si on est déjà en train de rediriger
        if (isOnLoginPage) {
          // On est déjà sur la page de login, ne pas rediriger (pas de log - c'est normal)
        } else {
          // ✅ SÉCURITÉ: Si la session a expiré, nettoyer et rediriger vers login
          const isSessionExpired = errorData.message && (errorData.message.includes('Session expirée') || errorData.message.includes('Session expired'));
          
          if (isSessionExpired) {
            logger.warn('⚠️ Session expirée - Déconnexion automatique');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // ✅ CORRECTION: Vérifier qu'on n'est pas déjà sur /login avant de rediriger
            // Utiliser un flag pour éviter les redirections multiples
            if (!sessionStorage.getItem('redirecting_to_login')) {
              sessionStorage.setItem('redirecting_to_login', 'true');
              // Nettoyer le flag après 2 secondes
              setTimeout(() => sessionStorage.removeItem('redirecting_to_login'), 2000);
              
              window.location.href = '/login?session=expired';
              return; // Arrêter ici pour éviter de continuer
            }
            } else {
              // Vérifier si c'est un invité (pas de token attendu)
              const userStr = localStorage.getItem('user');
              const isGuest = userStr ? JSON.parse(userStr).isGuest : false;
              
              // ✅ CORRECTION CRITIQUE: Ne JAMAIS recharger ou rediriger automatiquement
              // Ne pas modifier localStorage non plus pour éviter les changements d'état
              if (!isGuest && token && !isPublicRoute) {
                logger.warn('⚠️ Token invalide pour utilisateur authentifié');
                // ✅ CORRECTION: Ne PAS modifier localStorage pour éviter les re-renders
                // Le backend gère déjà l'erreur, pas besoin de modifier l'état frontend
              }
              // ✅ Pas de log pour les invités ou routes publiques - c'est normal
          }
        }
        
        // ✅ PROPAGER L'ERREUR D'AUTHENTIFICATION POUR PERMETTRE LES FALLBACKS
        // Les services qui appellent cette fonction peuvent alors détecter l'erreur 401/403
        // et activer leurs mécanismes de fallback (par exemple, Supabase direct)
        throw authError;
      }
      
      // ✅ Amélioration: Extraire les détails de validation pour un message plus clair
      let errorMessage = errorData.error || errorData.message || `Erreur HTTP ${response.status}: ${response.statusText}`;
      
      // Si c'est une erreur de validation avec des détails, formater un message plus descriptif
      if (errorData.code === 'VALIDATION_ERROR' && errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
        const validationMessages = errorData.details.map(detail => {
          // ✅ Gérer les cas où field peut être undefined ou vide
          const fieldName = detail.field || 'champ';
          const fieldLabel = {
            'email': 'Email',
            'password': 'Mot de passe',
            'firstName': 'Prénom',
            'lastName': 'Nom',
            'phone': 'Téléphone',
            'body': 'Données', // Fallback pour body()
            'params': 'Paramètres', // Fallback pour params
            'query': 'Requête', // Fallback pour query
            'cookies': 'Cookies' // Fallback pour cookies
          }[fieldName] || (fieldName !== 'champ' ? fieldName.charAt(0).toUpperCase() + fieldName.slice(1) : 'Données');
          
          // Si le champ est toujours "champ" (undefined), essayer d'extraire depuis le message
          if (fieldName === 'champ' || !fieldName) {
            // Pour les erreurs de mot de passe, détecter depuis le message
            if (detail.message && detail.message.includes('mot de passe')) {
              return `Mot de passe: ${detail.message}`;
            }
            // Pour les erreurs de téléphone, détecter depuis le message
            if (detail.message && detail.message.includes('téléphone')) {
              return `Téléphone: ${detail.message}`;
            }
            // Pour les autres, utiliser le message tel quel
            return detail.message;
          }
          
          return `${fieldLabel}: ${detail.message}`;
        });
        errorMessage = validationMessages.join('; ');
      }
      
      const error = new Error(errorMessage);
      // Ajouter le statut HTTP à l'erreur pour faciliter la gestion
      error.status = response.status;
      // Ajouter les détails pour un affichage plus détaillé si nécessaire
      error.details = errorData.details;
      error.code = errorData.code;
      throw error;
    }
    
    const jsonData = await response.json();
    // ✅ Log seulement si erreur (niveau INFO)
    if (!jsonData?.success) {
      logger.debug('✅ Réponse:', jsonData?.success ? 'OK' : 'ERREUR');
    }
    return jsonData;
  } catch (error) {
    // Reporter l'exception réseau si activé
    reportDiag({
      message: `Fetch error on ${url}`,
      details: { endpoint, method: method, name: error?.name, message: error?.message },
      endpoint,
      method: method,
      responseStatus: error?.status || null,
      stack: error?.stack || null
    });
    logger.error('❌ API Call - Exception:', error?.name, error?.message);
    
    // Gestion spécifique des erreurs de connexion réseau
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') || 
        error.message.includes('ECONNREFUSED') || 
        error.message.includes('fetch failed') ||
        error.name === 'TypeError' && error.message.includes('fetch')) {
      // ✅ AMÉLIORATION: Émettre un événement global de déconnexion serveur seulement pour les routes critiques
      // Ne pas émettre pour les routes publiques ou les health checks
      const isCriticalRoute = !endpoint.includes('/health') && 
                               !endpoint.includes('/auth/login') && 
                               !endpoint.includes('/auth/register');
      
      if (isCriticalRoute) {
        try {
          // Import dynamique pour éviter les dépendances circulaires
          import('./serverConnectionService').then(({ serverConnectionService }) => {
            serverConnectionService.emitConnectionFailed(error);
          }).catch((importError) => {
            logger.warn('⚠️ Impossible d\'importer serverConnectionService:', importError);
          });
        } catch (importError) {
          logger.warn('⚠️ Erreur lors de l\'import de serverConnectionService:', importError);
        }
      }
      
      const friendlyError = new Error(`Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré sur ${API_BASE_URL}`);
      friendlyError.name = 'ConnectionError';
      throw friendlyError;
    }
    
    // Si c'est une erreur d'authentification, propager le message original
    if (error.message.includes('Token') || error.message.includes('401') || error.message.includes('403')) {
      throw error;
    }
    
    throw error;
  }
};

/**
 * Fonction utilitaire pour mock API calls
 */
export const mockApiCall = async (data, shouldFail = false) => {
  await delay();
  
  if (shouldFail) {
    throw new Error('API call failed');
  }
  
  return { success: true, data };
};

export default {
  apiCall,
  mockApiCall,
  API_BASE_URL
};

