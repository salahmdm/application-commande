/**
 * Constantes de tarification et TVA
 */

// Taux de TVA (10%)
export const TAX_RATE = 0.10;

// Multiplicateur pour calcul TTC
export const TAX_MULTIPLIER = 1 + TAX_RATE; // 1.10

/**
 * Calculer le prix TTC à partir du HT
 * @param {number} priceHT - Prix hors taxes
 * @returns {number} Prix TTC
 */
export const calculateTTC = (priceHT) => {
  const ht = parseFloat(priceHT) || 0;
  return ht * TAX_MULTIPLIER;
};

/**
 * Calculer le montant de la TVA
 * @param {number} priceHT - Prix hors taxes
 * @returns {number} Montant de la TVA
 */
export const calculateTVA = (priceHT) => {
  const ht = parseFloat(priceHT) || 0;
  return ht * TAX_RATE;
};

/**
 * Obtenir le symbole de devise depuis les paramètres ou localStorage
 * @returns {string} Symbole de devise
 */
const getCurrencySymbol = () => {
  // Essayer localStorage d'abord (plus rapide)
  const stored = localStorage.getItem('currency_symbol');
  if (stored) {
    return stored;
  }
  // Par défaut €
  return '€';
};

/**
 * Formater un prix pour l'affichage
 * @param {number} price - Prix à formater
 * @param {boolean} includeTTC - Ajouter "TTC" après le prix
 * @param {string} currency - Symbole de devise (optionnel, utilise les settings si non fourni)
 * @returns {string} Prix formaté
 */
export const formatPrice = (price, includeTTC = false, currency = null) => {
  const num = parseFloat(price) || 0;
  const symbol = currency || getCurrencySymbol();
  const formatted = num.toFixed(2) + symbol;
  return includeTTC ? formatted + ' TTC' : formatted;
};

/**
 * Calculer le total TTC d'une commande
 * @param {number} subtotalHT - Sous-total HT
 * @param {number} discountAmount - Montant de la réduction
 * @returns {object} { subtotalHT, tva, totalTTC }
 */
export const calculateOrderTotal = (subtotalHT, discountAmount = 0) => {
  const ht = parseFloat(subtotalHT) || 0;
  const discount = parseFloat(discountAmount) || 0;
  const baseTaxable = ht - discount;
  const tva = baseTaxable * TAX_RATE;
  const totalTTC = baseTaxable + tva;
  
  return {
    subtotalHT: ht,
    discountAmount: discount,
    baseTaxable,
    tva,
    totalTTC
  };
};

export default {
  TAX_RATE,
  TAX_MULTIPLIER,
  calculateTTC,
  calculateTVA,
  formatPrice,
  calculateOrderTotal
};

