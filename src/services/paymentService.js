import { mockApiCall } from './api';

/**
 * Service de paiement
 * Simule l'intégration avec Stripe/PayPal
 */

const paymentService = {
  /**
   * Créer une session de paiement
   */
  async createPaymentIntent(amount, currency = 'EUR') {
    // Simuler la création d'un PaymentIntent Stripe
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      amount: Math.round(amount * 100), // Convertir en centimes
      currency: currency.toLowerCase(),
      status: 'requires_payment_method',
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`
    };
    
    return mockApiCall(paymentIntent);
  },
  
  /**
   * Confirmer un paiement
   */
  async confirmPayment(paymentIntentId, paymentMethod) {
    // Simuler la confirmation du paiement
    // Dans un vrai scénario, on utiliserait Stripe.js
    
    // Simuler une chance d'échec de 5%
    const shouldFail = Math.random() < 0.05;
    
    if (shouldFail) {
      throw new Error('Le paiement a échoué. Veuillez réessayer.');
    }
    
    const confirmedPayment = {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 0, // Sera rempli par le serveur
      paymentMethod,
      confirmedAt: new Date().toISOString()
    };
    
    return mockApiCall(confirmedPayment);
  },
  
  /**
   * Traiter un paiement par carte
   */
  async processCardPayment(cardDetails, amount) {
    // Valider les détails de la carte (validation basique)
    if (!cardDetails.number || cardDetails.number.length < 13) {
      throw new Error('Numéro de carte invalide');
    }
    
    if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      throw new Error('Date d\'expiration invalide');
    }
    
    if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
      throw new Error('CVC invalide');
    }
    
    // Carte de test qui échoue toujours (comme dans Stripe)
    if (cardDetails.number === '4000000000000002') {
      throw new Error('Carte refusée');
    }
    
    // Simuler le traitement du paiement
    const transaction = {
      id: `txn_${Date.now()}`,
      amount,
      status: 'success',
      cardLast4: cardDetails.number.slice(-4),
      timestamp: new Date().toISOString()
    };
    
    return mockApiCall(transaction);
  },
  
  /**
   * Traiter un paiement PayPal
   */
  async processPayPalPayment(amount) {
    // Simuler une redirection PayPal
    const paypalOrder = {
      id: `PAYPAL-${Date.now()}`,
      amount,
      approvalUrl: `https://www.paypal.com/checkoutnow?token=EC-${Math.random().toString(36).substring(7)}`,
      status: 'pending'
    };
    
    return mockApiCall(paypalOrder);
  },
  
  /**
   * Vérifier le statut d'un paiement
   */
  async getPaymentStatus(paymentId) {
    const status = {
      id: paymentId,
      status: 'succeeded',
      updatedAt: new Date().toISOString()
    };
    
    return mockApiCall(status);
  },
  
  /**
   * Rembourser un paiement
   */
  async refundPayment(paymentId, amount) {
    const refund = {
      id: `re_${Date.now()}`,
      paymentId,
      amount,
      status: 'succeeded',
      createdAt: new Date().toISOString()
    };
    
    return mockApiCall(refund);
  },
  
  /**
   * Sauvegarder une méthode de paiement
   */
  async savePaymentMethod(userId, paymentMethod) {
    const savedMethod = {
      id: `pm_${Date.now()}`,
      userId,
      type: paymentMethod.type, // 'card' | 'paypal'
      last4: paymentMethod.last4,
      brand: paymentMethod.brand,
      expiryMonth: paymentMethod.expiryMonth,
      expiryYear: paymentMethod.expiryYear,
      isDefault: paymentMethod.isDefault || false
    };
    
    return mockApiCall(savedMethod);
  },
  
  /**
   * Récupérer les méthodes de paiement sauvegardées
   */
  async getSavedPaymentMethods(userId) {
    // Mock data
    const methods = [
      {
        id: 'pm_1',
        userId,
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      }
    ];
    
    return mockApiCall(methods);
  }
};

export default paymentService;

