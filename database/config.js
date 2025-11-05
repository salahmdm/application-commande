/**
 * Configuration sécurisée pour Blossom Café
 * Variables d'environnement et constantes de sécurité
 */

require('dotenv').config();

const config = {
  // Base de données
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Muheko,1991@', // Fallback pour développement
    database: process.env.DB_NAME || 'blossom_cafe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Serveur
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },

  // Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024, // 2MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['jpg', 'jpeg', 'png', 'webp'],
    uploadPath: './public/uploads'
  },

  // Security Headers
  security: {
    helmetEnabled: process.env.HELMET_ENABLED === 'true' || true,
    bcryptRounds: 12, // Augmenté pour plus de sécurité
    sessionSecret: process.env.SESSION_SECRET || 'session_secret_key_change_in_production'
  },

  // Validation Rules
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    email: {
      maxLength: 255
    },
    name: {
      maxLength: 100
    }
  }
};

module.exports = config;
