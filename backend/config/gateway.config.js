import dotenv from 'dotenv';

dotenv.config();

export const gatewayConfig = {
  serialNumber: process.env.GATEWAY_SERIAL_NUMBER || 'GT01-ZG',
  ip: process.env.GATEWAY_IP || '192.168.1.100',
  port: parseInt(process.env.GATEWAY_PORT) || 502,
  protocol: process.env.GATEWAY_PROTOCOL?.toLowerCase() || 'modbus',

  modbus: {
    unitId: parseInt(process.env.MODBUS_UNIT_ID) || 1,
    timeout: parseInt(process.env.MODBUS_TIMEOUT) || 3000,
    retries: parseInt(process.env.MODBUS_RETRIES) || 3,
    serialPort: process.env.MODBUS_SERIAL_PORT || 'COM3',
    baudRate: parseInt(process.env.MODBUS_BAUD_RATE) || 9600,
    dataBits: parseInt(process.env.MODBUS_DATA_BITS) || 8,
    stopBits: parseInt(process.env.MODBUS_STOP_BITS) || 1,
    parity: process.env.MODBUS_PARITY || 'none',
    modbusType: process.env.MODBUS_TYPE || 'RTU',
  },

  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || `mqtt://${process.env.GATEWAY_IP || '192.168.1.100'}:1883`,
    clientId: process.env.MQTT_CLIENT_ID || 'gateway-manager',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    topicPrefix: process.env.MQTT_TOPIC_PREFIX || `gateway/${process.env.GATEWAY_SERIAL_NUMBER || 'GT01-ZG'}`,
  },

  http: {
    baseUrl: process.env.HTTP_BASE_URL || `http://${process.env.GATEWAY_IP || '192.168.1.100'}`,
    authToken: process.env.HTTP_AUTH_TOKEN || '',
    timeout: 5000,
  },

  server: {
    port: parseInt(process.env.API_PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  websocket: {
    enabled: process.env.WS_ENABLED === 'true' || true,
  },

  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};
