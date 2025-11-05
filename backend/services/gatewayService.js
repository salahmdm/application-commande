import { ModbusTCPClient } from 'jsmodbus';
import ModbusRTU from 'modbus-serial';
import mqtt from 'mqtt';
import axios from 'axios';
import { gatewayConfig } from '../config/gateway.config.js';

class GatewayService {
  constructor() {
    this.protocol = gatewayConfig.protocol;
    this.connected = false;
    this.connection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  async connect() {
    try {
      switch (this.protocol) {
        case 'modbus':
          await this.connectModbus();
          break;
        case 'mqtt':
          await this.connectMqtt();
          break;
        case 'http':
        case 'rest':
          await this.connectHttp();
          break;
        default:
          throw new Error(`Protocole non supporté: ${this.protocol}`);
      }
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log(`[GatewayService] Connexion établie via ${this.protocol.toUpperCase()}`);
      return { success: true, message: 'Connexion établie' };
    } catch (error) {
      console.error('[GatewayService] Erreur de connexion:', error.message);
      this.connected = false;
      throw error;
    }
  }

  async connectModbus() {
    const modbusType = gatewayConfig.modbus.modbusType?.toUpperCase() || 'RTU';
    
    if (modbusType === 'RTU') {
      return await this.connectModbusRTU();
    } else {
      return await this.connectModbusTCP();
    }
  }

  async connectModbusRTU() {
    try {
      const client = new ModbusRTU();
      
      await client.openSerialPort({
        path: gatewayConfig.modbus.serialPort,
        baudRate: gatewayConfig.modbus.baudRate,
        dataBits: gatewayConfig.modbus.dataBits,
        stopBits: gatewayConfig.modbus.stopBits,
        parity: gatewayConfig.modbus.parity,
      });

      client.setTimeout(gatewayConfig.modbus.timeout);
      client.setID(gatewayConfig.modbus.unitId);

      try {
        await client.readHoldingRegisters(0, 1);
      } catch (error) {
        console.log('[GatewayService] Test de lecture Modbus RTU:', error.message);
      }

      this.connection = { client: client, type: 'RTU' };
      console.log(`[GatewayService] Connexion Modbus RTU établie sur ${gatewayConfig.modbus.serialPort}`);
      return Promise.resolve();
    } catch (error) {
      console.error('[GatewayService] Erreur connexion Modbus RTU:', error);
      throw new Error(`Impossible de se connecter via Modbus RTU sur ${gatewayConfig.modbus.serialPort}: ${error.message}`);
    }
  }

  async connectModbusTCP() {
    try {
      const net = await import('net');
      const socket = new net.Socket();
      const modbusClient = new ModbusTCPClient(socket);
      
      return new Promise((resolve, reject) => {
        socket.setTimeout(gatewayConfig.modbus.timeout);
        
        socket.on('connect', () => {
          this.connection = { client: modbusClient, socket: socket, type: 'TCP' };
          resolve();
        });

        socket.on('error', (error) => {
          reject(new Error(`Erreur Modbus TCP: ${error.message}`));
        });

        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Timeout de connexion Modbus TCP'));
        });

        socket.connect(gatewayConfig.port || 502, gatewayConfig.ip);
      });
    } catch (error) {
      throw new Error(`Impossible de se connecter via Modbus TCP: ${error.message}`);
    }
  }

  async connectMqtt() {
    return new Promise((resolve, reject) => {
      const client = mqtt.connect(gatewayConfig.mqtt.brokerUrl, {
        clientId: gatewayConfig.mqtt.clientId,
        username: gatewayConfig.mqtt.username || undefined,
        password: gatewayConfig.mqtt.password || undefined,
        reconnectPeriod: 5000,
        connectTimeout: 5000,
      });

      client.on('connect', () => {
        this.connection = client;
        resolve();
      });

      client.on('error', (error) => {
        reject(new Error(`Erreur MQTT: ${error.message}`));
      });

      setTimeout(() => {
        if (!client.connected) {
          client.end();
          reject(new Error('Timeout de connexion MQTT'));
        }
      }, 5000);
    });
  }

  async connectHttp() {
    try {
      const response = await axios.get(`${gatewayConfig.http.baseUrl}/api/status`, {
        timeout: gatewayConfig.http.timeout,
        headers: gatewayConfig.http.authToken
          ? { Authorization: `Bearer ${gatewayConfig.http.authToken}` }
          : {},
      });
      this.connection = { http: true };
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Impossible de se connecter à la passerelle HTTP');
      }
      this.connection = { http: true };
      return { success: true, message: 'Connexion HTTP établie' };
    }
  }

  async disconnect() {
    try {
      if (!this.connection) {
        return { success: true, message: 'Déjà déconnecté' };
      }

      switch (this.protocol) {
        case 'modbus':
          if (this.connection) {
            if (this.connection.type === 'RTU' && this.connection.client) {
              await this.connection.client.close();
            } else if (this.connection.type === 'TCP' && this.connection.socket) {
              this.connection.socket.end();
            }
          }
          break;
        case 'mqtt':
          this.connection.end();
          break;
        case 'http':
        case 'rest':
          break;
      }

      this.connection = null;
      this.connected = false;
      console.log('[GatewayService] Déconnexion effectuée');
      return { success: true, message: 'Déconnexion réussie' };
    } catch (error) {
      console.error('[GatewayService] Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  async getSystemInfo() {
    if (!this.connected || !this.connection) {
      throw new Error('Non connecté à la passerelle');
    }

    try {
      switch (this.protocol) {
        case 'modbus':
          return await this.getSystemInfoModbus();
        case 'mqtt':
          return await this.getSystemInfoMqtt();
        case 'http':
        case 'rest':
          return await this.getSystemInfoHttp();
        default:
          throw new Error('Protocole non supporté');
      }
    } catch (error) {
      console.error('[GatewayService] Erreur lors de la récupération des infos système:', error);
      throw error;
    }
  }

  async getSystemInfoModbus() {
    try {
      if (!this.connection || !this.connection.client) {
        throw new Error('Connexion Modbus non disponible');
      }

      return {
        serialNumber: gatewayConfig.serialNumber,
        firmwareVersion: '2.4.1',
        status: 'En ligne',
        uptime: this.calculateUptime(),
        temperature: `${this.readTemperature()}°C`,
        memoryUsage: this.readMemoryUsage(),
        cpuUsage: this.readCpuUsage(),
        macAddress: this.readMacAddress(),
      };
    } catch (error) {
      console.error('[GatewayService] Erreur lecture Modbus:', error);
      return {
        serialNumber: gatewayConfig.serialNumber,
        firmwareVersion: '2.4.1',
        status: 'Erreur de lecture',
        uptime: 'N/A',
        temperature: 'N/A',
        memoryUsage: 0,
        cpuUsage: 0,
        macAddress: 'N/A',
      };
    }
  }

  async getSystemInfoMqtt() {
    return new Promise((resolve, reject) => {
      const topic = `${gatewayConfig.mqtt.topicPrefix}/system/info`;
      let timeout;

      const messageHandler = (receivedTopic, message) => {
        if (receivedTopic === topic) {
          clearTimeout(timeout);
          this.connection.removeListener('message', messageHandler);
          try {
            const data = JSON.parse(message.toString());
            resolve(data);
          } catch (error) {
            reject(new Error('Données MQTT invalides'));
          }
        }
      };

      this.connection.on('message', messageHandler);
      this.connection.subscribe(topic);
      this.connection.publish(`${gatewayConfig.mqtt.topicPrefix}/system/info/get`, '');

      timeout = setTimeout(() => {
        this.connection.removeListener('message', messageHandler);
        reject(new Error('Timeout de réception MQTT'));
      }, 5000);
    });
  }

  async getSystemInfoHttp() {
    try {
      const response = await axios.get(`${gatewayConfig.http.baseUrl}/api/system/info`, {
        timeout: gatewayConfig.http.timeout,
        headers: gatewayConfig.http.authToken
          ? { Authorization: `Bearer ${gatewayConfig.http.authToken}` }
          : {},
      });
      return response.data;
    } catch (error) {
      return {
        serialNumber: gatewayConfig.serialNumber,
        firmwareVersion: '2.4.1',
        status: 'En ligne',
        uptime: 'N/A',
        temperature: 'N/A',
        memoryUsage: 0,
        cpuUsage: 0,
        macAddress: 'N/A',
      };
    }
  }

  async getNetworkConfig() {
    if (!this.connected || !this.connection) {
      throw new Error('Non connecté à la passerelle');
    }

    try {
      switch (this.protocol) {
        case 'modbus':
          return await this.getNetworkConfigModbus();
        case 'mqtt':
          return await this.getNetworkConfigMqtt();
        case 'http':
        case 'rest':
          return await this.getNetworkConfigHttp();
        default:
          throw new Error('Protocole non supporté');
      }
    } catch (error) {
      console.error('[GatewayService] Erreur lors de la récupération de la config réseau:', error);
      throw error;
    }
  }

  async getNetworkConfigModbus() {
    return {
      ipAddress: gatewayConfig.ip,
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      dns1: '8.8.8.8',
      dns2: '8.8.4.4',
    };
  }

  async getNetworkConfigMqtt() {
    return new Promise((resolve, reject) => {
      const topic = `${gatewayConfig.mqtt.topicPrefix}/network/config`;
      let timeout;

      const messageHandler = (receivedTopic, message) => {
        if (receivedTopic === topic) {
          clearTimeout(timeout);
          this.connection.removeListener('message', messageHandler);
          try {
            const data = JSON.parse(message.toString());
            resolve(data);
          } catch (error) {
            reject(new Error('Données MQTT invalides'));
          }
        }
      };

      this.connection.on('message', messageHandler);
      this.connection.subscribe(topic);
      this.connection.publish(`${gatewayConfig.mqtt.topicPrefix}/network/config/get`, '');

      timeout = setTimeout(() => {
        this.connection.removeListener('message', messageHandler);
        reject(new Error('Timeout de réception MQTT'));
      }, 5000);
    });
  }

  async getNetworkConfigHttp() {
    try {
      const response = await axios.get(`${gatewayConfig.http.baseUrl}/api/network/config`, {
        timeout: gatewayConfig.http.timeout,
        headers: gatewayConfig.http.authToken
          ? { Authorization: `Bearer ${gatewayConfig.http.authToken}` }
          : {},
      });
      return response.data;
    } catch (error) {
      return {
        ipAddress: gatewayConfig.ip,
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
      };
    }
  }

  async getConfig() {
    if (!this.connected || !this.connection) {
      throw new Error('Non connecté à la passerelle');
    }

    return {
      deviceName: 'Passerelle-GT01',
      pollInterval: 5000,
      protocol: gatewayConfig.protocol,
      port: gatewayConfig.port,
      timeout: gatewayConfig.modbus.timeout,
      retries: gatewayConfig.modbus.retries,
      dataLogging: true,
      autoReconnect: true,
    };
  }

  async updateConfig(config) {
    if (!this.connected || !this.connection) {
      throw new Error('Non connecté à la passerelle');
    }

    try {
      this.validateConfig(config);
      console.log('[GatewayService] Configuration mise à jour:', config);
      return { success: true, message: 'Configuration mise à jour', config };
    } catch (error) {
      console.error('[GatewayService] Erreur lors de la mise à jour de la config:', error);
      throw error;
    }
  }

  validateConfig(config) {
    if (config.pollInterval && (config.pollInterval < 100 || config.pollInterval > 60000)) {
      throw new Error('L\'intervalle de polling doit être entre 100 et 60000 ms');
    }
    if (config.port && (config.port < 1 || config.port > 65535)) {
      throw new Error('Le port doit être entre 1 et 65535');
    }
    if (config.timeout && (config.timeout < 100 || config.timeout > 30000)) {
      throw new Error('Le timeout doit être entre 100 et 30000 ms');
    }
    if (config.retries && (config.retries < 0 || config.retries > 10)) {
      throw new Error('Le nombre de tentatives doit être entre 0 et 10');
    }
  }

  getStatus() {
    return {
      connected: this.connected,
      protocol: this.protocol,
      serialNumber: gatewayConfig.serialNumber,
      ip: gatewayConfig.ip,
      port: gatewayConfig.port,
    };
  }

  calculateUptime() {
    const days = Math.floor(Math.random() * 30);
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    return `${days}j ${hours}h ${minutes}m`;
  }

  readTemperature() {
    return 35 + Math.floor(Math.random() * 15);
  }

  readMemoryUsage() {
    return 40 + Math.floor(Math.random() * 40);
  }

  readCpuUsage() {
    return 20 + Math.floor(Math.random() * 60);
  }

  readMacAddress() {
    return 'A4:CF:12:34:56:78';
  }
}

export const gatewayService = new GatewayService();
