import { apiCall } from './api';
import logger from '../utils/logger';

export const DEFAULT_TICKET_DISPLAY = {
  showName: true,
  showAddress: true,
  showPhone: true,
  showSiret: true,
  showVat: true,
  showWebsite: true,
  showEmail: true,
  showCustomerService: true,
  showLegalForm: true,
  showRcs: true,
  showPaymentMention: true,
  showLegalMentions: true,
  showReturnPolicy: true,
  showFoodInfo: true
};

export const DEFAULT_BUSINESS_INFO = {
  name: 'BLOSSOM CAFE',
  address: '15 Avenue des Champs-Élysées, 75008 PARIS',
  phone: '01 42 56 78 90',
  siret: '123 456 789 00012',
  vatNumber: 'FR 12 345678901',
  website: 'www.supermarche-dupont.fr',
  email: 'contact@supermarche-dupont.fr',
  legalForm: 'SAS',
  shareCapital: '100 000 €',
  rcs: 'RCS Paris B 123 456 789',
  paymentMention: 'TVA acquittée sur les encaissements',
  legalMentions: '',
  returnPolicy: 'Les produits alimentaires ne sont ni repris ni échangés. Merci de conserver votre ticket.',
  foodInfo: 'Les denrées alimentaires servies ne peuvent être reprises pour des raisons sanitaires.',
  customerService: '0800 123 456',
  displayPreferences: { ...DEFAULT_TICKET_DISPLAY }
};

const businessInfoService = {
  async getBusinessInfo() {
    try {
      const response = await apiCall('/restaurant-info');
      if (response.success && response.data?.business) {
        const business = { ...DEFAULT_BUSINESS_INFO, ...response.data.business };
        business.displayPreferences = {
          ...DEFAULT_TICKET_DISPLAY,
          ...(response.data.displayPreferences || business.displayPreferences || {})
        };
        return business;
      }
      return { ...DEFAULT_BUSINESS_INFO, displayPreferences: { ...DEFAULT_TICKET_DISPLAY } };
    } catch (error) {
      logger.error('Erreur getBusinessInfo:', error);
      return { ...DEFAULT_BUSINESS_INFO, displayPreferences: { ...DEFAULT_TICKET_DISPLAY } };
    }
  }
};

export default businessInfoService;

