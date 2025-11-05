import { apiCall } from './api';

/**
 * Service pour le tableau de bord admin
 * Récupère les statistiques en temps réel depuis MySQL
 */

const dashboardService = {
  /**
   * Récupérer les statistiques du dashboard
   */
  async getDashboardStats() {
    try {
      const response = await apiCall('/admin/dashboard');
      return response;
    } catch (error) {
      console.error('Erreur getDashboardStats:', error);
      throw error;
    }
  },

  /**
   * Récupérer les statistiques de ventes
   */
  async getSalesStats(period = '7days') {
    try {
      const response = await apiCall(`/admin/analytics/sales?period=${period}`);
      return response;
    } catch (error) {
      console.error('Erreur getSalesStats:', error);
      throw error;
    }
  },

  /**
   * Récupérer les top produits
   */
  async getTopProducts(limit = 10) {
    try {
      const response = await apiCall(`/admin/analytics/top-products?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Erreur getTopProducts:', error);
      throw error;
    }
  },

  /**
   * Récupérer les revenus par catégorie
   */
  async getRevenueByCategory() {
    try {
      const response = await apiCall('/admin/analytics/revenue-by-category');
      return response;
    } catch (error) {
      console.error('Erreur getRevenueByCategory:', error);
      throw error;
    }
  },

  /**
   * Récupérer les statistiques de CA avec comparaison de périodes
   * @param {string} startDate - Date de début (YYYY-MM-DD)
   * @param {string} endDate - Date de fin (YYYY-MM-DD)
   * @param {string} compareStartDate - Date de début comparaison (YYYY-MM-DD)
   * @param {string} compareEndDate - Date de fin comparaison (YYYY-MM-DD)
   */
  async getRevenueStatsWithComparison(startDate, endDate, compareStartDate, compareEndDate) {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        compareStartDate,
        compareEndDate
      });
      const response = await apiCall(`/admin/analytics/revenue-comparison?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur getRevenueStatsWithComparison:', error);
      throw error;
    }
  },

  /**
   * Récupérer les top produits vendus sur une période
   * @param {string} startDate - Date de début (YYYY-MM-DD)
   * @param {string} endDate - Date de fin (YYYY-MM-DD)
   * @param {number} limit - Nombre de produits à retourner (défaut: 8)
   */
  async getTopProductsPeriod(startDate, endDate, limit = 8) {
    try {
      const params = new URLSearchParams({ startDate, endDate, limit: limit.toString() });
      const response = await apiCall(`/admin/analytics/top-products-period?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur getTopProductsPeriod:', error);
      throw error;
    }
  },

  /**
   * Récupérer les heures de pointe
   * @param {string} startDate - Date de début (YYYY-MM-DD)
   * @param {string} endDate - Date de fin (YYYY-MM-DD)
   */
  async getPeakHours(startDate, endDate) {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await apiCall(`/admin/analytics/peak-hours?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur getPeakHours:', error);
      throw error;
    }
  },

  /**
   * Récupérer la répartition du CA par catégorie
   * @param {string} startDate - Date de début (YYYY-MM-DD)
   * @param {string} endDate - Date de fin (YYYY-MM-DD)
   */
  async getCategoryDistribution(startDate, endDate) {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await apiCall(`/admin/analytics/category-distribution?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur getCategoryDistribution:', error);
      throw error;
    }
  },

  /**
   * Récupérer les produits en stock critique
   */
  async getCriticalStock() {
    try {
      const response = await apiCall('/admin/analytics/critical-stock');
      return response;
    } catch (error) {
      console.error('Erreur getCriticalStock:', error);
      throw error;
    }
  }
  ,
  /**
   * Récupérer les commandes (transactions) d'une période
   * @param {string} startDate
   * @param {string} endDate
   */
  async getOrdersPeriod(startDate, endDate) {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await apiCall(`/admin/analytics/orders-period?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur getOrdersPeriod:', error);
      throw error;
    }
  }
};

export default dashboardService;






