/**
 * Fonctions utilitaires pour les commandes
 */

/**
 * Convertir order_type MySQL vers français
 */
export const getOrderTypeLabel = (orderType) => {
  const labels = {
    'dine-in': 'Sur place',
    'takeaway': 'À emporter',
    'delivery': 'Livraison'
  };
  return labels[orderType] || orderType;
};

/**
 * Convertir payment_method MySQL vers français
 */
export const getPaymentMethodLabel = (paymentMethod) => {
  const labels = {
    'cash': 'En caisse',
    'card': 'Carte bancaire',
    'stripe': 'Carte (Stripe)',
    'paypal': 'PayPal'
  };
  return labels[paymentMethod] || paymentMethod;
};

/**
 * Convertir payment_status MySQL vers français
 */
export const getPaymentStatusLabel = (paymentStatus) => {
  const labels = {
    'pending': 'En attente',
    'completed': 'Payé',
    'failed': 'Échoué',
    'refunded': 'Remboursé'
  };
  return labels[paymentStatus] || paymentStatus;
};

/**
 * Formater le numéro de commande au format #CMD-XXXX
 */
export const formatOrderNumber = (orderNumber, orderId) => {
  if (orderNumber) {
    // Si le numéro commence déjà par CMD-, ajouter simplement le #
    if (orderNumber.startsWith('CMD-')) {
      return `#${orderNumber}`;
    }
    // Sinon, retourner tel quel avec #
    return `#${orderNumber}`;
  }
  // Si pas de numéro, utiliser l'ID avec le format CMD
  return `#CMD-${String(orderId || 'XXXX').padStart(4, '0')}`;
};

export default {
  getOrderTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  formatOrderNumber
};

