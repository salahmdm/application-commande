import { apiCall } from './api';
import logger from '../utils/logger';

/**
 * Service pour la gestion de l'inventaire
 */

// Récupérer tous les articles d'inventaire
export const getInventory = async () => {
  logger.debug('📦 inventoryService.getInventory - Récupération de l\'inventaire');
  try {
    const response = await apiCall('/inventory', {
      method: 'GET'
    });
    // ✅ SÉCURITÉ: Ne pas logger les données complètes d'inventaire (données sensibles)
    logger.debug('✅ Inventaire récupéré');
    return response;
  } catch (error) {
    logger.error('❌ Erreur getInventory:', error);
    throw error;
  }
};

// Ajouter un article
export const addInventoryItem = async (itemData) => {
  logger.log('📦 inventoryService.addInventoryItem - Ajout d\'un article:', itemData);
  try {
    const response = await apiCall('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    logger.log('✅ Article ajouté:', response);
    return response;
  } catch (error) {
    logger.error('❌ Erreur addInventoryItem:', error);
    throw error;
  }
};

// Modifier un article
export const updateInventoryItem = async (id, itemData) => {
  logger.log('📦 inventoryService.updateInventoryItem - Modification:', id, itemData);
  try {
    const response = await apiCall(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
    logger.log('✅ Article modifié:', response);
    return response;
  } catch (error) {
    logger.error('❌ Erreur updateInventoryItem:', error);
    throw error;
  }
};

// Supprimer un article
export const deleteInventoryItem = async (id) => {
  logger.log('📦 inventoryService.deleteInventoryItem - Suppression:', id);
  try {
    const response = await apiCall(`/inventory/${id}`, {
      method: 'DELETE'
    });
    logger.log('✅ Article supprimé:', response);
    return response;
  } catch (error) {
    logger.error('❌ Erreur deleteInventoryItem:', error);
    throw error;
  }
};

// Récupérer les catégories de produits
export const getProductCategories = async () => {
  logger.log('📦 inventoryService.getProductCategories - Récupération des catégories');
  try {
    const response = await apiCall('/api/products/categories', {
      method: 'GET'
    });
    logger.log('✅ Catégories récupérées:', response);
    return response;
  } catch (error) {
    logger.error('❌ Erreur getProductCategories:', error);
    throw error;
  }
};

export default {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getProductCategories
};
