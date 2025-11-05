import { apiCall } from './api';

/**
 * Service pour la gestion de l'inventaire
 */

// Récupérer tous les articles d'inventaire
export const getInventory = async () => {
  console.log('📦 inventoryService.getInventory - Récupération de l\'inventaire');
  try {
    const response = await apiCall('/inventory', {
      method: 'GET'
    });
    console.log('✅ Inventaire récupéré:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur getInventory:', error);
    throw error;
  }
};

// Ajouter un article
export const addInventoryItem = async (itemData) => {
  console.log('📦 inventoryService.addInventoryItem - Ajout d\'un article:', itemData);
  try {
    const response = await apiCall('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    console.log('✅ Article ajouté:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur addInventoryItem:', error);
    throw error;
  }
};

// Modifier un article
export const updateInventoryItem = async (id, itemData) => {
  console.log('📦 inventoryService.updateInventoryItem - Modification:', id, itemData);
  try {
    const response = await apiCall(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
    console.log('✅ Article modifié:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur updateInventoryItem:', error);
    throw error;
  }
};

// Supprimer un article
export const deleteInventoryItem = async (id) => {
  console.log('📦 inventoryService.deleteInventoryItem - Suppression:', id);
  try {
    const response = await apiCall(`/inventory/${id}`, {
      method: 'DELETE'
    });
    console.log('✅ Article supprimé:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur deleteInventoryItem:', error);
    throw error;
  }
};

// Récupérer les catégories de produits
export const getProductCategories = async () => {
  console.log('📦 inventoryService.getProductCategories - Récupération des catégories');
  try {
    const response = await apiCall('/api/products/categories', {
      method: 'GET'
    });
    console.log('✅ Catégories récupérées:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur getProductCategories:', error);
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
