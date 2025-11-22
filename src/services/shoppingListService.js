import { apiCall } from './api';
import logger from '../utils/logger';

/**
 * Service pour la gestion de la liste de courses
 */

// Récupérer la liste de courses
export const getShoppingList = async (status = 'pending') => {
  logger.debug('🛒 shoppingListService.getShoppingList - Récupération liste');
  try {
    const response = await apiCall(`/shopping-list?status=${status}`, {
      method: 'GET'
    });
    logger.debug('✅ Liste de courses récupérée');
    return response;
  } catch (error) {
    logger.error('❌ Erreur getShoppingList:', error);
    throw error;
  }
};

// Ajouter un produit à la liste
export const addToShoppingList = async (ingredient_id, quantity_needed, notes = null, priority = 'medium') => {
  logger.debug('🛒 shoppingListService.addToShoppingList - Ajout:', { ingredient_id, quantity_needed });
  try {
    const response = await apiCall('/shopping-list/add', {
      method: 'POST',
      body: JSON.stringify({
        ingredient_id,
        quantity_needed,
        notes,
        priority
      })
    });
    logger.debug('✅ Produit ajouté à la liste');
    return response;
  } catch (error) {
    logger.error('❌ Erreur addToShoppingList:', error);
    throw error;
  }
};

// Ajouter automatiquement les produits sous stock_min
export const autoAddLowStock = async () => {
  logger.debug('🛒 shoppingListService.autoAddLowStock - Ajout automatique');
  try {
    const response = await apiCall('/shopping-list/auto-add-low-stock', {
      method: 'POST'
    });
    logger.debug('✅ Produits ajoutés automatiquement');
    return response;
  } catch (error) {
    logger.error('❌ Erreur autoAddLowStock:', error);
    throw error;
  }
};

// Mettre à jour un item
export const updateShoppingListItem = async (id, data) => {
  logger.debug('🛒 shoppingListService.updateShoppingListItem - Mise à jour:', id);
  try {
    const response = await apiCall(`/shopping-list/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    logger.debug('✅ Item mis à jour');
    return response;
  } catch (error) {
    logger.error('❌ Erreur updateShoppingListItem:', error);
    throw error;
  }
};

// Supprimer un item
export const deleteShoppingListItem = async (id) => {
  logger.debug('🛒 shoppingListService.deleteShoppingListItem - Suppression:', id);
  try {
    const response = await apiCall(`/shopping-list/${id}`, {
      method: 'DELETE'
    });
    logger.debug('✅ Item supprimé');
    return response;
  } catch (error) {
    logger.error('❌ Erreur deleteShoppingListItem:', error);
    throw error;
  }
};

// Marquer comme commandé
export const markAsOrdered = async (id) => {
  logger.debug('🛒 shoppingListService.markAsOrdered - Marquer commandé:', id);
  try {
    const response = await apiCall(`/shopping-list/${id}/mark-ordered`, {
      method: 'POST'
    });
    logger.debug('✅ Item marqué comme commandé');
    return response;
  } catch (error) {
    logger.error('❌ Erreur markAsOrdered:', error);
    throw error;
  }
};

// Marquer comme reçu
export const markAsReceived = async (id) => {
  logger.debug('🛒 shoppingListService.markAsReceived - Marquer reçu:', id);
  try {
    const response = await apiCall(`/shopping-list/${id}/mark-received`, {
      method: 'POST'
    });
    logger.debug('✅ Item marqué comme reçu');
    return response;
  } catch (error) {
    logger.error('❌ Erreur markAsReceived:', error);
    throw error;
  }
};

// Exporter la liste
export const exportShoppingList = async (format = 'csv') => {
  logger.debug('🛒 shoppingListService.exportShoppingList - Export:', format);
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/shopping-list/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'export');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liste-courses-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : format === 'txt' ? 'txt' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    logger.debug('✅ Export réussi');
    return { success: true };
  } catch (error) {
    logger.error('❌ Erreur exportShoppingList:', error);
    throw error;
  }
};

export default {
  getShoppingList,
  addToShoppingList,
  autoAddLowStock,
  updateShoppingListItem,
  deleteShoppingListItem,
  markAsOrdered,
  markAsReceived,
  exportShoppingList
};

