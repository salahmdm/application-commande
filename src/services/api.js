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

/**
 * Wrapper pour les appels fetch avec gestion des erreurs et authentification
 */
export const apiCall = async (endpoint, options = {}) => {
  // ✅ Vérifier si c'est une route publique (pas besoin de token)
  const isPublicRoute = endpoint.includes('/restaurant-info') || 
                        endpoint.includes('/settings/') || 
                        endpoint.includes('/products') || 
                        endpoint.includes('/categories') ||
                        endpoint.includes('/news') ||
                        endpoint.includes('/loyalty-rewards') ||
                        endpoint.includes('/csrf-token') ||
                        endpoint.includes('/health');
  
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
  
  try {
    // ✅ SÉCURITÉ: Masquer les tokens dans les URLs avant de logger
    const sanitizedUrl = url.replace(/([?&]token=)[^&]*/gi, '$1***MASKED***').replace(/\/token\/[^/\s]+/gi, '/token/***MASKED***');
    logger.debug('🌐 API Call:', options.method || 'GET', sanitizedUrl);
    
    // ✅ SÉCURITÉ: Récupérer le token CSRF pour les requêtes modifiantes
    let csrfToken = null;
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
      csrfToken = await getCsrfToken();
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...options.headers,
    };
    
    // Préparer le body - stringify si c'est un objet
    const body = options.body 
      ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      : undefined;
    
    // ✅ CRITIQUE: Inclure les cookies dans toutes les requêtes (credentials: 'include')
    // Cela permet d'envoyer automatiquement les cookies HTTP-only
    // ✅ STABILITÉ: Supporter AbortController signal pour les timeouts
    const response = await fetch(url, {
      ...options,
      headers,
      body,
      credentials: 'include', // ✅ Nécessaire pour envoyer les cookies HTTP-only
      signal: options.signal // ✅ Support du signal AbortController pour les timeouts
    });
    
    // ✅ Log seulement si erreur (niveau INFO)
    if (!response.ok) {
      logger.debug('📡 Réponse erreur:', response.status, response.statusText);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Reporter l'erreur HTTP si activé
      reportDiag({
        message: `HTTP ${response.status} on ${url}`,
        details: { endpoint, method: options.method || 'GET', error: errorData?.error || errorData?.message },
        endpoint,
        method: options.method || 'GET',
        responseStatus: response.status
      });
      logger.error('❌ ERREUR RÉPONSE API (HTTP', response.status, ')');
      logger.error('Error Data:', errorData);
      logger.error('Error Message:', errorData.error || errorData.message);
      logger.error('Endpoint:', endpoint);
      logger.error('URL complète:', url);
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
      }
      
      // ✅ CORRECTION CRITIQUE: Pour les erreurs 401/403, ne pas throw immédiatement
      // Cela permet aux composants de gérer l'erreur sans déclencher de re-renders
      // Seulement throw si ce n'est pas une erreur d'auth (pour les autres erreurs)
      if (response.status === 401 || response.status === 403) {
        // Ne pas throw pour les erreurs 401/403, retourner une erreur silencieuse
        // Les composants pourront gérer l'affichage sans causer de re-renders
        const authError = new Error(errorData.error || errorData.message || `Erreur HTTP ${response.status}`);
        authError.status = response.status;
        authError.silent = true; // Flag pour indiquer que c'est une erreur silencieuse
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
      details: { endpoint, method: options.method || 'GET', name: error?.name, message: error?.message },
      endpoint,
      method: options.method || 'GET',
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

