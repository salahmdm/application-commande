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
  name: '',
  address: '',
  phone: '',
  siret: '',
  vatNumber: '',
  website: '',
  email: '',
  legalForm: '',
  shareCapital: '',
  rcs: '',
  paymentMention: '',
  legalMentions: '',
  returnPolicy: '',
  foodInfo: '',
  customerService: '',
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

