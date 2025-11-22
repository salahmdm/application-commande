import { apiCall } from './api';
import logger from '../utils/logger';

/**
 * Service pour gérer les actualités
 */
const newsService = {
  /**
   * Récupérer toutes les actualités
   */
  async getNews() {
    try {
      const response = await apiCall('/home/news');
      return response;
    } catch (error) {
      logger.error('Erreur getNews:', error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle actualité
   */
  async createNews(newsData) {
    try {
      const response = await apiCall('/admin/news', {
        method: 'POST',
        body: JSON.stringify(newsData)
      });
      return response;
    } catch (error) {
      logger.error('Erreur createNews:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une actualité
   */
  async updateNews(id, newsData) {
    try {
      logger.log('📝 newsService.updateNews - ID:', id, 'Data:', newsData);
      const response = await apiCall(`/admin/news/${id}`, {
        method: 'PUT',
        body: JSON.stringify(newsData)
      });
      logger.log('✅ newsService.updateNews - Réponse:', response);
      return response;
    } catch (error) {
      logger.error('❌ Erreur updateNews:', error);
      logger.error('  - ID:', id);
      logger.error('  - Data:', newsData);
      throw error;
    }
  },

  /**
   * Supprimer une actualité
   */
  async deleteNews(id) {
    try {
      const response = await apiCall(`/admin/news/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      logger.error('Erreur deleteNews:', error);
      throw error;
    }
  }
};

export default newsService;

