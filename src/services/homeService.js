import { apiCall } from './api';
import logger from '../utils/logger';

/**
 * Service pour les données de la page d'accueil
 */
const homeService = {
  /**
   * Récupère les statistiques pour la page d'accueil
   */
  async getHomeStats() {
    logger.log('📊 homeService.getHomeStats - Récupération des stats home...');
    
    try {
      const response = await apiCall('/home/stats', {
        method: 'GET'
      });
      
      logger.log('✅ homeService.getHomeStats - Stats reçues:', response);
      return response;
    } catch (error) {
      logger.error('❌ homeService.getHomeStats - Erreur:', error);
      throw error;
    }
  }
};

export default homeService;

