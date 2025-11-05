/**
 * Utilitaires de sécurité pour Blossom Café
 * Gestion sécurisée des mots de passe, tokens et données sensibles
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./config');

/**
 * Classe de gestion sécurisée des mots de passe
 */
class PasswordSecurity {
  /**
   * Hacher un mot de passe avec bcrypt
   */
  static async hashPassword(password) {
    try {
      const saltRounds = config.security.bcryptRounds;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('✅ Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      console.error('❌ Error hashing password:', error);
      throw new Error('Erreur lors du hachage du mot de passe');
    }
  }

  /**
   * Vérifier un mot de passe
   */
  static async verifyPassword(password, hashedPassword) {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      if (!isValid) {
        console.log('🚨 Invalid password attempt');
      }
      return isValid;
    } catch (error) {
      console.error('❌ Error verifying password:', error);
      throw new Error('Erreur lors de la vérification du mot de passe');
    }
  }

  /**
   * Valider la force d'un mot de passe
   */
  static validatePasswordStrength(password) {
    const rules = config.validation.password;
    const errors = [];

    if (password.length < rules.minLength) {
      errors.push(`Minimum ${rules.minLength} caractères requis`);
    }

    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Au moins une majuscule requise');
    }

    if (rules.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Au moins une minuscule requise');
    }

    if (rules.requireNumbers && !/\d/.test(password)) {
      errors.push('Au moins un chiffre requis');
    }

    if (rules.requireSpecialChars && !/[@$!%*?&]/.test(password)) {
      errors.push('Au moins un caractère spécial (@$!%*?&) requis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Classe de gestion sécurisée des tokens JWT
 */
class TokenSecurity {
  /**
   * Générer un token JWT sécurisé
   */
  static generateToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID() // ID unique du token
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: 'blossom-cafe',
        audience: 'blossom-cafe-users'
      });

      console.log('✅ JWT token generated for user:', payload.id);
      return token;
    } catch (error) {
      console.error('❌ Error generating token:', error);
      throw new Error('Erreur lors de la génération du token');
    }
  }

  /**
   * Générer un refresh token
   */
  static generateRefreshToken(userId) {
    try {
      const refreshPayload = {
        userId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID()
      };

      const refreshToken = jwt.sign(refreshPayload, config.jwt.secret, {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: 'blossom-cafe',
        audience: 'blossom-cafe-refresh'
      });

      console.log('✅ Refresh token generated for user:', userId);
      return refreshToken;
    } catch (error) {
      console.error('❌ Error generating refresh token:', error);
      throw new Error('Erreur lors de la génération du refresh token');
    }
  }

  /**
   * Vérifier un token JWT
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'blossom-cafe',
        audience: ['blossom-cafe-users', 'blossom-cafe-refresh']
      });
      
      console.log('✅ Token verified for user:', decoded.id || decoded.userId);
      return decoded;
    } catch (error) {
      console.log('🚨 Token verification failed:', error.message);
      throw new Error('Token invalide ou expiré');
    }
  }

  /**
   * Extraire les informations du token sans vérification
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
  }
}

/**
 * Classe de gestion des données sensibles
 */
class DataSecurity {
  /**
   * Nettoyer les données sensibles d'un objet
   */
  static sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = { ...obj };
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });

    // Nettoyer récursivement les objets imbriqués
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * Masquer les données sensibles dans les logs
   */
  static maskSensitiveData(data) {
    if (!data || typeof data !== 'object') return data;

    const masked = { ...data };
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key', 'email'];

    sensitiveFields.forEach(field => {
      if (masked[field]) {
        if (field === 'email') {
          const [local, domain] = masked[field].split('@');
          masked[field] = `${local.substring(0, 2)}***@${domain}`;
        } else {
          masked[field] = '***MASKED***';
        }
      }
    });

    return masked;
  }

  /**
   * Valider et nettoyer les entrées utilisateur
   */
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Supprimer les balises HTML
        .substring(0, 1000); // Limiter la longueur
    }
    return input;
  }
}

/**
 * Classe de gestion des sessions sécurisées
 */
class SessionSecurity {
  /**
   * Générer un ID de session sécurisé
   */
  static generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Valider une session
   */
  static validateSession(sessionData) {
    if (!sessionData || !sessionData.userId || !sessionData.createdAt) {
      return false;
    }

    const sessionAge = Date.now() - new Date(sessionData.createdAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures

    return sessionAge < maxAge;
  }
}

module.exports = {
  PasswordSecurity,
  TokenSecurity,
  DataSecurity,
  SessionSecurity
};
