import { apiCall } from './api';

const restaurantInfoService = {
  async getAll() {
    return apiCall('/restaurant-info');
  },

  async updateHours(hours) {
    return apiCall('/restaurant-info/hours', {
      method: 'PUT',
      body: JSON.stringify({ hours })
    });
  },

  async updateAddress(address) {
    return apiCall('/restaurant-info/address', {
      method: 'PUT',
      body: JSON.stringify(address)
    });
  },

  async updateContact(contact) {
    return apiCall('/restaurant-info/contact', {
      method: 'PUT',
      body: JSON.stringify(contact)
    });
  }
};

export default restaurantInfoService;


