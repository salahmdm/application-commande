/**
 * Utilitaires pour la pagination
 */

/**
 * Parse les paramètres de pagination depuis la requête
 * @param {Object} req - Requête Express
 * @returns {Object} - { page, limit, offset }
 */
const parsePaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50)); // Max 100, défaut 50
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Calcule les métadonnées de pagination
 * @param {number} total - Nombre total d'éléments
 * @param {number} page - Page actuelle
 * @param {number} limit - Nombre d'éléments par page
 * @returns {Object} - Métadonnées de pagination
 */
const getPaginationMetadata = (total, page, limit) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPreviousPage: page > 1
  };
};

/**
 * Formatte la réponse paginée
 * @param {Array} data - Données de la page actuelle
 * @param {Object} pagination - Métadonnées de pagination
 * @returns {Object} - Réponse formatée
 */
const formatPaginatedResponse = (data, pagination) => {
  return {
    success: true,
    data,
    pagination
  };
};

module.exports = {
  parsePaginationParams,
  getPaginationMetadata,
  formatPaginatedResponse
};

