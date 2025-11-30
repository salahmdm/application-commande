import { apiCall } from './api';
import supabaseService from './supabaseService';
import { transformSettingsToBusinessInfo } from '../utils/businessInfo';
import logger from '../utils/logger';

const OPTIONAL_SETTING_DEFAULTS = {
  table_number_enabled: 'false',
  currency_symbol: '€',
};

const MISSING_SETTINGS_STORAGE_KEY = 'blossom_missing_settings_v1';
const canUseBrowserStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const loadMissingSettingsFromStorage = () => {
  if (!canUseBrowserStorage) {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(MISSING_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
    return new Set();
  } catch (error) {
    logger.warn('⚠️ settingsService - Impossible de charger le cache des paramètres manquants:', error);
    return new Set();
  }
};

const missingSettingsCache = loadMissingSettingsFromStorage();

const persistMissingSettings = () => {
  if (!canUseBrowserStorage) {
    return;
  }
  try {
    window.localStorage.setItem(
      MISSING_SETTINGS_STORAGE_KEY,
      JSON.stringify(Array.from(missingSettingsCache))
    );
  } catch (error) {
    logger.warn('⚠️ settingsService - Impossible de persister le cache des paramètres manquants:', error);
  }
};

const markSettingMissing = (key) => {
  if (!key || missingSettingsCache.has(key)) {
    return;
  }
  missingSettingsCache.add(key);
  persistMissingSettings();
};

const hasSettingBeenMarkedMissing = (key) => missingSettingsCache.has(key);

const buildDefaultSettingResponse = (key) => {
  if (!Object.prototype.hasOwnProperty.call(OPTIONAL_SETTING_DEFAULTS, key)) {
    return null;
  }
  const value = OPTIONAL_SETTING_DEFAULTS[key];
  return {
    success: true,
    data: {
      setting_key: key,
      setting_value: value,
      value
    },
    isDefault: true
  };
};

/**
 * Déterminer si on doit utiliser Supabase directement
 */
const shouldUseSupabase = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // En local on privilégie toujours le backend (port 5000)
  if (isLocalhost) {
    return false;
  }

  return !apiUrl || apiUrl === '';
};

/**
 * Service de gestion des paramètres de l'application
 */

const settingsService = {
  /**
   * Récupérer tous les paramètres (Admin)
   */
  async getAllSettings() {
    try {
      // ✅ VERCEL: Utiliser Supabase directement si pas de backend
      if (shouldUseSupabase()) {
        logger.log('🔄 settingsService.getAllSettings - Utilisation Supabase direct');
        const result = await supabaseService.getAllSettings();
        if (result.success) {
          logger.log(`✅ settingsService.getAllSettings - ${result.data.length} paramètres récupérés depuis Supabase`);
          return result;
        } else {
          throw new Error(result.error || 'Erreur Supabase');
        }
      }

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
    const useSupabase = shouldUseSupabase();
    const isLocalBackend = !useSupabase;

    if (isLocalBackend && hasSettingBeenMarkedMissing(key)) {
      const defaultResponse = buildDefaultSettingResponse(key);
      if (defaultResponse) {
        logger.debug(`ℹ️ settingsService.getSetting - Valeur par défaut (cache) utilisée pour ${key}`);
        return defaultResponse;
      }
    }

    if (useSupabase) {
      try {
        const supabaseResult = await supabaseService.getSetting(key);
        if (supabaseResult.success || supabaseResult.error === 'Paramètre non trouvé') {
          return supabaseResult;
        }
      } catch (error) {
        logger.warn(`⚠️ settingsService.getSetting - Supabase indisponible pour ${key}:`, error);
      }
    }

    const handleMissingSettingFallback = () => {
      if (isLocalBackend) {
        markSettingMissing(key);
      }
      const defaultResponse = buildDefaultSettingResponse(key);
      if (defaultResponse) {
        logger.debug(`ℹ️ settingsService.getSetting - Valeur par défaut utilisée pour ${key}`);
        return defaultResponse;
      }
      return { success: false, error: 'Paramètre non trouvé', data: null };
    };

    if (!useSupabase) {
      try {
        const response = await apiCall(`/settings/${key}`);
        if (response?.success) {
          return response;
        }
        if (response?.status === 404 || response?.error === 'Paramètre non trouvé') {
          return handleMissingSettingFallback();
        }
        return response;
      } catch (error) {
        if (error?.status === 404) {
          return handleMissingSettingFallback();
        }
        logger.warn(`⚠️ getSetting ${key} via API:`, error?.message);
        return { success: false, error: error.message || 'Paramètre non accessible', data: null };
      }
    }

    return handleMissingSettingFallback();
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
        // Gérer les différents formats de valeur (string, boolean, number)
        const value = response.data.setting_value || response.data.value;
        return value === true || value === 'true' || value === 1 || value === '1';
      }
      return false; // Par défaut désactivé
    } catch {
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

