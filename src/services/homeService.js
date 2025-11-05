import { apiCall } from './api';

/**
 * Service pour les données de la page d'accueil
 */
const homeService = {
  /**
   * Récupère les statistiques pour la page d'accueil
   */
  async getHomeStats() {
    console.log('📊 homeService.getHomeStats - Récupération des stats home...');
    
    try {
      const response = await apiCall('/home/stats', {
        method: 'GET'
      });
      
      console.log('✅ homeService.getHomeStats - Stats reçues:', response);
      return response;
    } catch (error) {
      console.error('❌ homeService.getHomeStats - Erreur:', error);
      throw error;
    }
  }
};

export default homeService;

