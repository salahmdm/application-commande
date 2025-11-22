import { apiCall } from './api';
import { transformSettingsToBusinessInfo } from '../utils/businessInfo';
import logger from '../utils/logger';

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
      logger.error('Erreur getAllSettings:', error);
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
      logger.error(`Erreur getSetting ${key}:`, error);
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
      logger.error(`Erreur updateSetting ${key}:`, error);
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
      logger.error('Erreur isTableNumberEnabled:', error);
      return false; // En cas d'erreur, désactivé par défaut
    }
  },

  /**
   * Récupérer les informations business (nom, contacts, horaires)
   * ✅ Utilise la route publique /restaurant-info pour les clients
   */
  async getBusinessInfo() {
    try {
      // ✅ Utiliser la route publique /restaurant-info au lieu de /admin/settings
      // Cela évite les erreurs 401/403 pour les clients non authentifiés
      const response = await apiCall('/restaurant-info');
      if (response.success && response.data) {
        // Transformer les données de /restaurant-info vers le format attendu
        return {
          success: true,
          data: response.data.business || response.data
        };
      }
      return {
        success: false,
        error: response.error || 'Impossible de récupérer les paramètres.'
      };
    } catch (error) {
      logger.error('Erreur getBusinessInfo:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des informations.'
      };
    }
  },

  /**
   * Mettre à jour les informations business (nom, contact, horaires)
   */
  async updateBusinessInfo(updates = {}) {
    try {
      const tasks = [];

      if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
        tasks.push(this.updateSetting('app_name', String(updates.name ?? '')));
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'slogan')) {
        tasks.push(this.updateSetting('welcome_message', String(updates.slogan ?? '')));
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
        tasks.push(this.updateSetting('contact_email', String(updates.email ?? '')));
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'phone')) {
        tasks.push(this.updateSetting('contact_phone', String(updates.phone ?? '')));
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'address')) {
        tasks.push(this.updateSetting('restaurant_address', String(updates.address ?? '')));
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'hours')) {
        const value = JSON.stringify(updates.hours ?? {});
        tasks.push(this.updateSetting('opening_hours', value));
      }

      await Promise.all(tasks);

      return { success: true };
    } catch (error) {
      logger.error('Erreur updateBusinessInfo:', error);
      return { success: false, error: error.message || 'Erreur lors de la mise à jour des informations.' };
    }
  }
};

export default settingsService;

