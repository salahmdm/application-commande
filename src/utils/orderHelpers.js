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
 * Formater le numéro de commande (sans préfixe #CMD- et sans zéros à gauche)
 */
export const formatOrderNumber = (orderNumber, orderId) => {
  if (orderNumber) {
    // Retirer le préfixe #CMD- ou CMD- si présent
    let formatted = orderNumber.toString();
    if (formatted.startsWith('#CMD-')) {
      formatted = formatted.replace('#CMD-', '');
    } else if (formatted.startsWith('CMD-')) {
      formatted = formatted.replace('CMD-', '');
    } else if (formatted.startsWith('#')) {
      formatted = formatted.replace('#', '');
    }
    // Retirer les zéros à gauche (ex: 0001 -> 1, 0020 -> 20, 0100 -> 100)
    const numValue = parseInt(formatted, 10);
    if (!isNaN(numValue)) {
      return numValue.toString();
    }
    return formatted;
  }
  // Si pas de numéro, utiliser l'ID sans padding
  const idValue = parseInt(orderId, 10);
  if (!isNaN(idValue)) {
    return idValue.toString();
  }
  return 'XXXX';
};

export default {
  getOrderTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  formatOrderNumber
};

