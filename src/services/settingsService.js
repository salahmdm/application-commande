import { apiCall } from './api';

/**
 * Service de gestion des paramètres de l'application
 */

const settingsService = {
  /**
   * Récupérer tous les paramètres (Admin)
   */
  async getAllSettings() {
    try {
      const response = await apiCall('/admin/settings');
      return response;
    } catch (error) {
      console.error('Erreur getAllSettings:', error);
      throw error;
    }
  },

  /**
   * Récupérer un paramètre spécifique (Public)
   */
  async getSetting(key) {
    try {
      const response = await apiCall(`/settings/${key}`);
      return response;
    } catch (error) {
      console.error(`Erreur getSetting ${key}:`, error);
      throw error;
    }
  },

  /**
   * Mettre à jour un paramètre (Admin)
   */
  async updateSetting(key, value) {
    try {
      const response = await apiCall(`/admin/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      });
      return response;
    } catch (error) {
      console.error(`Erreur updateSetting ${key}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer le paramètre table_number_enabled
   */
  async isTableNumberEnabled() {
    try {
      const response = await this.getSetting('table_number_enabled');
      if (response.success && response.data) {
        return response.data.value === true || response.data.value === 'true';
      }
      return false; // Par défaut désactivé
    } catch (error) {
      console.error('Erreur isTableNumberEnabled:', error);
      return false; // En cas d'erreur, désactivé par défaut
    }
  }
};

export default settingsService;

