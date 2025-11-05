/**
 * Configuration de l'environnement
 * Centralise toutes les URLs et configurations
 */

export const ENV = {
  // URL du backend API
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // URL de base du backend (pour le health check)
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  
  // Port du backend
  BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT || 5000,
  
  // Port du frontend
  FRONTEND_PORT: import.meta.env.VITE_PORT || 3000,
  
  // Mode de développement
  isDevelopment: import.meta.env.DEV,
  
  // Mode de production
  isProduction: import.meta.env.PROD,
  
  // Timeout pour les requêtes API (ms)
  API_TIMEOUT: 10000,
  
  // Nombre de tentatives de reconnexion
  MAX_RETRY_ATTEMPTS: 3
};

export default ENV;






