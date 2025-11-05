/**
 * Constantes pour les statuts de commande
 * Utilisé dans toute l'application pour la gestion des commandes
 */

export const ORDER_STATUS = {
  PENDING: 'pending',           // En attente (statut initial)
  PREPARING: 'preparing',       // Prendre en charge
  READY: 'ready',               // Terminée
  SERVED: 'served',             // Remise (statut final)
  CANCELLED: 'cancelled'        // Annulée
};

/**
 * Labels français pour chaque statut
 */
export const STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'En attente',
  [ORDER_STATUS.PREPARING]: 'Prendre en charge',
  [ORDER_STATUS.READY]: 'Terminée',
  [ORDER_STATUS.SERVED]: 'Remise',
  [ORDER_STATUS.CANCELLED]: 'Annulée'
};

/**
 * Couleurs pour chaque statut (Tailwind)
 */
export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800'
  },
  [ORDER_STATUS.PREPARING]: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800'
  },
  [ORDER_STATUS.READY]: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800'
  },
  [ORDER_STATUS.SERVED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  [ORDER_STATUS.CANCELLED]: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800'
  }
};

/**
 * Obtenir le label d'un statut
 */
export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status;
};

/**
 * Obtenir le prochain statut dans le workflow
 */
export const getNextStatus = (currentStatus) => {
  const workflow = {
    [ORDER_STATUS.PENDING]: ORDER_STATUS.PREPARING,    // En attente → Prendre en charge
    [ORDER_STATUS.PREPARING]: ORDER_STATUS.READY,      // Prendre en charge → Terminée
    [ORDER_STATUS.READY]: ORDER_STATUS.SERVED,         // Terminée → Remise
    [ORDER_STATUS.SERVED]: null,                       // Remise (final)
    [ORDER_STATUS.CANCELLED]: null                     // Annulée (final)
  };
  
  return workflow[currentStatus];
};

/**
 * Vérifier si une commande peut être annulée
 */
export const canBeCancelled = (status) => {
  return [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.PREPARING
  ].includes(status);
};

/**
 * Vérifier si une commande est terminée (fermée)
 */
export const isCompleted = (status) => {
  return [
    ORDER_STATUS.SERVED,
    ORDER_STATUS.CANCELLED
  ].includes(status);
};

/**
 * Obtenir les couleurs d'un statut
 */
export const getStatusColors = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS[ORDER_STATUS.PENDING];
};

// Export par défaut pour compatibilité
export default {
  ORDER_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
  getStatusLabel,
  getNextStatus,
  canBeCancelled,
  isCompleted,
  getStatusColors
};
