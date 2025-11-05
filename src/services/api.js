/**
 * Configuration API
 * Point d'entrée pour tous les appels API - Connecté à MySQL Backend
 */

// URL du backend API (connecté à MySQL)
const API_BASE_URL = 'http://localhost:5000/api';

// Délai simulé pour les appels API mock (utilisé pour fallback)
const MOCK_DELAY = 500;

/**
 * Fonction utilitaire pour simuler un délai réseau
 */
const delay = (ms = MOCK_DELAY) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Récupérer le token JWT depuis le localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Wrapper pour les appels fetch avec gestion des erreurs et authentification
 */
export const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 API Call:', options.method || 'GET', url);
    console.log('🔑 Token présent:', token ? 'OUI ✅' : 'NON ❌');
    console.log('📦 Body:', options.body || 'Aucun');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 RÉPONSE HTTP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:', response.status, response.statusText);
    console.log('OK:', response.ok);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERREUR RÉPONSE API (HTTP', response.status, ')');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error Data:', errorData);
      console.error('Error Message:', errorData.error || errorData.message);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Gestion spécifique des erreurs d'authentification
      if (response.status === 401 || response.status === 403) {
        console.warn('🔐 Token invalide ou expiré - Déconnexion automatique');
        
        // Vérifier si c'est un invité (pas de token attendu)
        const userStr = localStorage.getItem('user');
        const isGuest = userStr ? JSON.parse(userStr).isGuest : false;
        
        // Nettoyer le stockage local
        localStorage.removeItem('token');
        
        // Ne pas recharger pour les invités ou si c'est juste une erreur API normale
        // Recharger seulement si c'est un utilisateur authentifié avec un token invalide
        if (!isGuest && token) {
          localStorage.removeItem('user');
          console.warn('🔄 Rechargement de la page pour utilisateur authentifié...');
          window.location.reload();
        } else {
          console.warn('ℹ️ Erreur auth ignorée (invité ou pas de token)');
        }
      }
      
      throw new Error(errorData.error || errorData.message || `Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const jsonData = await response.json();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DONNÉES REÇUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Success:', jsonData?.success);
    console.log('Data:', jsonData?.data);
    console.log('Error:', jsonData?.error);
    console.log('Message:', jsonData?.message);
    console.log('JSON complet:', jsonData);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return jsonData;
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌❌❌ API Call - Exception finale');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Endpoint:', endpoint);
    console.error('Method:', options.method || 'GET');
    console.error('URL complète:', url);
    console.error('Type erreur:', error?.name);
    console.error('Message erreur:', error?.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Gestion spécifique des erreurs de connexion réseau
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
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

