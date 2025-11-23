import { apiCall } from './api';
import supabaseService from './supabaseService';
import logger from '../utils/logger';

/**
 * Déterminer si on doit utiliser Supabase directement
 */
const shouldUseSupabase = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return !apiUrl || apiUrl === '';
};

/**
 * Service pour gérer les actualités
 */
const newsService = {
  /**
   * Récupérer toutes les actualités
   */
  async getNews() {
    try {
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 newsService.getNews - Utilisation Supabase direct');
        const result = await supabaseService.getNews({ isActive: 1 });
        if (result.success) {
          logger.log(`✅ newsService.getNews - ${result.data.length} actualités récupérées depuis Supabase`);
          return result;
        } else {
          throw new Error(result.error || 'Erreur Supabase');
        }
      }

      logger.log('🔄 newsService.getNews - Appel API');
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

