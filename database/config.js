/**
 * Configuration sécurisée pour Blossom Café
 * Variables d'environnement et constantes de sécurité
 */

const path = require('path');

// Charger le fichier .env depuis le répertoire database/
// Important : spécifier le chemin explicitement pour éviter les problèmes
// quand le script est exécuté depuis un autre répertoire
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Vérifier les variables essentielles au démarrage
const checkRequiredEnvVars = () => {
  const required = ['DB_PASSWORD'];
  // Vérifier si les variables sont manquantes ou vides (chaîne vide)
  const missing = required.filter(varName => {
    const value = process.env[varName];
    return !value || value.trim() === '';
  });
  
  if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
    console.error('\n❌ Variables d\'environnement manquantes:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Solution:');
    console.error('   1. Copiez database/.env.example en database/.env');
    console.error('   2. Configurez vos valeurs dans database/.env');
    console.error('   3. Redémarrez le serveur');
    console.error('\n📚 Documentation: Consultez database/README_ENV.md\n');
    
    // Ne jamais utiliser de mot de passe par défaut pour la sécurité
    // Forcer l'utilisateur à créer le fichier .env
    throw new Error('Variables d\'environnement requises manquantes. Consultez database/README_ENV.md');
  }
};

const config = {
  // Base de données
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: (() => {
      const port = parseInt(process.env.DB_PORT);
      return (!isNaN(port) && port > 0) ? port : 3306;
    })(),
    user: process.env.DB_USER || 'root',
    password: (() => {
      const password = process.env.DB_PASSWORD;
      if (!password || password.trim() === '') {
        checkRequiredEnvVars();
      }
      return password;
    })(),
    database: process.env.DB_NAME || 'blossom_cafe',
    waitForConnections: true,
    // ✅ OPTIMISATION: Limite de connexions selon l'environnement
    // Dev: 35 connexions (gère 3-5 managers + clients simultanés + marge)
    // Prod: 70 connexions (gère pics de charge avec plusieurs managers)
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 
      (process.env.NODE_ENV === 'production' ? 70 : 35),
    // ✅ OPTIMISATION: Limite de file d'attente pour éviter l'accumulation
    // 150 = marge pour gérer les pics (ouverture simultanée de dashboards)
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 150,
    // ✅ OPTIMISATION: Timeout pour acquérir une connexion (30s en prod, 60s en dev)
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 
      (process.env.NODE_ENV === 'production' ? 30000 : 60000),
    // ✅ OPTIMISATION: Paramètres pour maintenir les connexions actives
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // ✅ OPTIMISATION: Timeout pour établir la connexion (5s en prod, 10s en dev)
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 
      (process.env.NODE_ENV === 'production' ? 5000 : 10000),
    // ✅ SSL: Désactiver SSL en développement local (peut causer des problèmes de connexion)
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
    // ✅ OPTIMISATION: Timeout pour les requêtes (augmenté pour requêtes complexes)
    // 60s en prod, 90s en dev (requêtes JSON_ARRAYAGG et dashboard peuvent prendre 15-25s)
    timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 
      (process.env.NODE_ENV === 'production' ? 60000 : 90000),
    // ✅ OPTIMISATION: Réutiliser les connexions au lieu de les fermer
    // Le pool garde les connexions ouvertes et les réutilise
    // Ne pas fermer les connexions après chaque requête (c'est géré par le pool)
    // ✅ OPTIMISATION: Idle timeout - temps avant de fermer une connexion inutilisée
    // 8 heures en production, 4 heures en développement
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 
      (process.env.NODE_ENV === 'production' ? 28800000 : 14400000),
    // ✅ OPTIMISATION: Réessayer les connexions en cas d'échec
    reconnect: true,
    // ✅ OPTIMISATION: Délai entre les tentatives de reconnexion (2 secondes)
    reconnectDelay: parseInt(process.env.DB_RECONNECT_DELAY) || 2000,
    // ✅ OPTIMISATION: Nombre maximum de tentatives de reconnexion
    reconnectMaxAttempts: parseInt(process.env.DB_RECONNECT_MAX_ATTEMPTS) || 10
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      console.warn('⚠️ JWT_SECRET non défini dans .env - Utilisez un fichier .env pour la sécurité');
      return 'CHANGEZ_MOI_EN_PRODUCTION_' + Date.now();
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Serveur
  server: {
    port: (() => {
      const port = parseInt(process.env.PORT);
      return (!isNaN(port) && port > 0) ? port : 5000;
    })(),
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
    helmetEnabled: process.env.HELMET_ENABLED !== 'false', // true par défaut sauf si explicitement désactivé
    bcryptRounds: 12, // Augmenté pour plus de sécurité
    sessionSecret: process.env.SESSION_SECRET || (() => {
      console.warn('⚠️ SESSION_SECRET non défini dans .env - Utilisez un fichier .env pour la sécurité');
      return 'CHANGEZ_MOI_EN_PRODUCTION_' + Date.now();
    })()
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
