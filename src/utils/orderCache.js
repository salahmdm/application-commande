/**
 * Cache simple pour les commandes
 * Réduit les appels API et améliore les performances
 */

class OrderCache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 5 * 1000; // 5 secondes par défaut
    this.maxSize = 100; // Maximum 100 entrées
  }

  /**
   * Générer une clé de cache
   */
  getKey(endpoint, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}${paramStr ? `?${paramStr}` : ''}`;
  }

  /**
   * Obtenir une valeur du cache
   */
  get(endpoint, params = {}) {
    const key = this.getKey(endpoint, params);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Vérifier si le cache est expiré
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Mettre une valeur en cache
   */
  set(endpoint, params = {}, data) {
    const key = this.getKey(endpoint, params);

    // Limiter la taille du cache
    if (this.cache.size >= this.maxSize) {
      // Supprimer la plus ancienne entrée
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalider le cache pour un endpoint
   */
  invalidate(endpoint) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(endpoint)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Vider tout le cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Obtenir la taille du cache
   */
  size() {
    return this.cache.size;
  }
}

// Instance singleton
export const orderCache = new OrderCache();
export default orderCache;

