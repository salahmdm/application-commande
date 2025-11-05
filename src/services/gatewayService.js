import { ENV } from '../config/env.js';

const GATEWAY_API_URL = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:3001/api';

class GatewayService {
  async request(endpoint, options = {}) {
    const url = `${GATEWAY_API_URL}/gateway${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[GatewayService] Erreur ${endpoint}:`, error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Impossible de contacter le backend. Vérifiez que le serveur est démarré sur le port 3001.');
      }
      throw error;
    }
  }

  async connect() {
    return this.request('/connect', { method: 'POST' });
  }

  async disconnect() {
    return this.request('/disconnect', { method: 'POST' });
  }

  async getStatus() {
    return this.request('/status', { method: 'GET' });
  }

  async getSystemInfo() {
    return this.request('/info', { method: 'GET' });
  }

  async getNetworkConfig() {
    return this.request('/network', { method: 'GET' });
  }

  async getConfig() {
    return this.request('/config', { method: 'GET' });
  }

  async updateConfig(config) {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async listSerialPorts() {
    return this.request('/ports', { method: 'GET' });
  }

  async detectGateway() {
    return this.request('/ports/detect', { method: 'POST' });
  }
}

export const gatewayService = new GatewayService();

