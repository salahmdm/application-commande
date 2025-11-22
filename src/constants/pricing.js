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
 * Calculer le prix HT à partir du TTC
 * @param {number} priceTTC - Prix TTC
 * @returns {number} Prix HT
 */
export const calculateHT = (priceTTC) => {
  const ttc = parseFloat(priceTTC) || 0;
  return ttc / TAX_MULTIPLIER;
};

/**
 * Calculer le total TTC d'une commande
 * Logique selon les règles métier :
 * 1. Sous-total HT = somme des produits HT
 * 2. Réduction appliquée sur le sous-total HT
 * 3. Base taxable HT = sous-total HT - réduction HT
 * 4. Total TTC = Base taxable HT × 1.10 (comme avant)
 * 5. TVA pour affichage = (Sous-total TTC - Réduction TTC) × 10% (calculée sur le TTC)
 * 
 * @param {number} subtotalHT - Sous-total HT (sans TVA)
 * @param {number} discountAmount - Montant de la réduction HT
 * @returns {object} { subtotalHT, subtotalTTC, discountAmount, discountAmountTTC, baseTaxableHT, tva, totalTTC }
 */
export const calculateOrderTotal = (subtotalHT, discountAmount = 0) => {
  const ht = parseFloat(subtotalHT) || 0;
  const discount = parseFloat(discountAmount) || 0;
  
  // 1. Sous-total HT (déjà fourni en paramètre)
  // 2. Calculer le sous-total TTC pour l'affichage
  const subtotalTTC = ht * TAX_MULTIPLIER;
  
  // 3. Base après réduction (HT)
  const baseTaxableHT = Math.max(0, ht - discount);
  
  // 4. Total TTC = Base taxable HT × 1.10 (comme avant, inchangé)
  const totalTTC = baseTaxableHT * TAX_MULTIPLIER;
  
  // 5. TVA pour affichage : calculée sur le Total TTC (Sous-total TTC - Réduction TTC)
  const discountTTC = discount * TAX_MULTIPLIER;
  const baseTaxableTTC = Math.max(0, subtotalTTC - discountTTC);
  const tva = baseTaxableTTC * TAX_RATE; // TVA calculée sur le TTC pour l'affichage
  
  // Calculer la réduction TTC pour l'affichage
  const discountAmountTTC = discountTTC;
  
  return {
    subtotalHT: ht,
    subtotalTTC: subtotalTTC,
    discountAmount: discount,
    discountAmountTTC: discountAmountTTC,
    baseTaxableHT: baseTaxableHT,
    tva: tva,
    totalTTC: totalTTC
  };
};

export default {
  TAX_RATE,
  TAX_MULTIPLIER,
  calculateTTC,
  calculateHT,
  calculateTVA,
  formatPrice,
  calculateOrderTotal
};

