/**
 * Service d'authentification sécurisé pour le frontend
 * Protection contre les attaques XSS et gestion sécurisée des tokens
 */

import { apiCall } from './api';
import logger from '../utils/logger';

/**
 * Classe de gestion sécurisée des tokens côté client
 */
class SecureTokenManager {
  constructor() {
    this.TOKEN_KEY = 'blossom_auth_token';
    this.USER_KEY = 'blossom_user_data';
    this.REFRESH_KEY = 'blossom_refresh_token';
  }

  /**
   * Stocker un token de manière sécurisée
   */
  setToken(token) {
    try {
      // Utiliser sessionStorage au lieu de localStorage pour plus de sécurité
      sessionStorage.setItem(this.TOKEN_KEY, token);
      
      // Définir une expiration automatique
      const expirationTime = Date.now() + (60 * 60 * 1000); // 1 heure
      sessionStorage.setItem('token_expires', expirationTime.toString());
      
      logger.log('✅ Token stored securely');
    } catch (error) {
      logger.error('❌ Error storing token:', error);
      throw new Error('Erreur lors du stockage du token');
    }
  }

  /**
   * Récupérer le token de manière sécurisée
   */
  getToken() {
    try {
      const token = sessionStorage.getItem(this.TOKEN_KEY);
      const expiration = sessionStorage.getItem('token_expires');
      
      if (!token || !expiration) {
        return null;
      }
      
      // Vérifier l'expiration
      if (Date.now() > parseInt(expiration)) {
        this.clearTokens();
        return null;
      }
      
      return token;
    } catch (error) {
      logger.error('❌ Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Vérifier si le token est valide
   */
  isTokenValid() {
    const token = this.getToken();
    return token !== null;
  }

  /**
   * Stocker les données utilisateur de manière sécurisée
   */
  setUserData(userData) {
    try {
      // Nettoyer les données sensibles avant stockage
      const sanitizedUser = this.sanitizeUserData(userData);
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(sanitizedUser));
      logger.log('✅ User data stored securely');
    } catch (error) {
      logger.error('❌ Error storing user data:', error);
      throw new Error('Erreur lors du stockage des données utilisateur');
    }
  }

  /**
   * Récupérer les données utilisateur
   */
  getUserData() {
    try {
      const userStr = sessionStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      logger.error('❌ Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Nettoyer les données utilisateur sensibles
   */
  sanitizeUserData(userData) {
    const sanitized = { ...userData };
    
    // Supprimer les champs sensibles
    delete sanitized.password;
    delete sanitized.password_hash;
    delete sanitized.token;
    delete sanitized.secret;
    
    return sanitized;
  }

  /**
   * Effacer tous les tokens et données
   */
  clearTokens() {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem(this.REFRESH_KEY);
      sessionStorage.removeItem('token_expires');
      logger.log('✅ Tokens cleared securely');
    } catch (error) {
      logger.error('❌ Error clearing tokens:', error);
    }
  }

  /**
   * Rafraîchir le token automatiquement
   */
  async refreshToken() {
    try {
      const refreshToken = sessionStorage.getItem(this.REFRESH_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiCall('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });

      if (response.success && response.token) {
        this.setToken(response.token);
        return response.token;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      logger.error('❌ Token refresh error:', error);
      this.clearTokens();
      throw error;
    }
  }
}

/**
 * Classe de validation des entrées utilisateur
 */
class InputValidator {
  /**
   * Valider un email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider un mot de passe
   */
  static validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Minimum 8 caractères requis');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins une majuscule requise');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins une minuscule requise');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Au moins un chiffre requis');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Au moins un caractère spécial (@$!%*?&) requis');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Nettoyer une chaîne de caractères
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Supprimer les balises HTML
      .substring(0, 1000); // Limiter la longueur
  }

  /**
   * Valider les données d'un formulaire
   */
  static validateFormData(formData, rules) {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const value = formData[field];
      const rule = rules[field];
      
      if (rule.required && (!value || value.trim() === '')) {
        errors[field] = `${rule.label} est requis`;
        return;
      }
      
      if (value && rule.type === 'email' && !this.validateEmail(value)) {
        errors[field] = 'Email invalide';
        return;
      }
      
      if (value && rule.type === 'password' && !this.validatePassword(value).isValid) {
        errors[field] = 'Mot de passe invalide';
        return;
      }
      
      if (value && rule.minLength && value.length < rule.minLength) {
        errors[field] = `Minimum ${rule.minLength} caractères requis`;
        return;
      }
      
      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `Maximum ${rule.maxLength} caractères autorisés`;
        return;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

/**
 * Classe de protection contre XSS
 */
class XSSProtection {
  /**
   * Échapper les caractères HTML
   */
  static escapeHtml(text) {
    if (typeof text !== 'string') return text;
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Nettoyer le contenu HTML
   */
  static sanitizeHtml(html) {
    if (typeof html !== 'string') return html;
    
    // Supprimer les balises script et les attributs dangereux
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '');
  }

  /**
   * Valider les URLs
   */
  static validateUrl(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}

// Instance globale du gestionnaire de tokens
const tokenManager = new SecureTokenManager();

/**
 * Service d'authentification sécurisé
 */
const secureAuthService = {
  /**
   * Connexion sécurisée
   */
  async login(email, password) {
    try {
      // Valider les entrées
      if (!InputValidator.validateEmail(email)) {
        throw new Error('Email invalide');
      }
      
      if (!password || password.length < 1) {
        throw new Error('Mot de passe requis');
      }

      // Nettoyer les entrées
      const cleanEmail = InputValidator.sanitizeString(email);
      
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          email: cleanEmail, 
          password: password 
        })
      });
      
      if (response.success && response.token) {
        // Stocker le token de manière sécurisée
        tokenManager.setToken(response.token);
        tokenManager.setUserData(response.user);
        
        // Stocker le refresh token si fourni
        if (response.refreshToken) {
          sessionStorage.setItem('blossom_refresh_token', response.refreshToken);
        }
        
        logger.log('✅ Login successful and secure');
        return response;
      }
      
      throw new Error('Échec de la connexion');
    } catch (error) {
      logger.error('❌ Login error:', error);
      throw error;
    }
  },

  /**
   * Inscription sécurisée
   */
  async register(userData) {
    try {
      // Valider les données
      const rules = {
        email: { type: 'email', required: true, label: 'Email' },
        password: { type: 'password', required: true, label: 'Mot de passe' },
        firstName: { required: true, minLength: 1, maxLength: 100, label: 'Prénom' },
        lastName: { required: true, minLength: 1, maxLength: 100, label: 'Nom' }
      };
      
      const validation = InputValidator.validateFormData(userData, rules);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${Object.values(validation.errors).join(', ')}`);
      }

      // Nettoyer les données
      const cleanData = {
        email: InputValidator.sanitizeString(userData.email),
        password: userData.password, // Ne pas nettoyer le mot de passe
        firstName: InputValidator.sanitizeString(userData.firstName),
        lastName: InputValidator.sanitizeString(userData.lastName),
        phone: userData.phone ? InputValidator.sanitizeString(userData.phone) : null
      };
      
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(cleanData)
      });
      
      if (response.success) {
        logger.log('✅ Registration successful and secure');
        return response;
      }
      
      throw new Error('Échec de l\'inscription');
    } catch (error) {
      logger.error('❌ Registration error:', error);
      throw error;
    }
  },

  /**
   * Déconnexion sécurisée
   */
  async logout() {
    try {
      // Effacer tous les tokens localement
      tokenManager.clearTokens();
      
      // Notifier le serveur (optionnel)
      try {
        await apiCall('/auth/logout', { method: 'POST' });
      } catch (error) {
        logger.warn('Server logout failed, but local cleanup completed');
      }
      
      logger.log('✅ Logout successful and secure');
      return { success: true };
    } catch (error) {
      logger.error('❌ Logout error:', error);
      // Effacer les tokens même en cas d'erreur
      tokenManager.clearTokens();
      return { success: true };
    }
  },

  /**
   * Récupérer l'utilisateur actuel
   */
  getCurrentUser() {
    return tokenManager.getUserData();
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated() {
    return tokenManager.isTokenValid();
  },

  /**
   * Récupérer le token d'authentification
   */
  getToken() {
    return tokenManager.getToken();
  },

  /**
   * Rafraîchir le token
   */
  async refreshToken() {
    return await tokenManager.refreshToken();
  },

  /**
   * Mettre à jour le profil de manière sécurisée
   */
  async updateProfile(updates) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Valider les données de mise à jour
      const rules = {
        firstName: { maxLength: 100, label: 'Prénom' },
        lastName: { maxLength: 100, label: 'Nom' },
        phone: { maxLength: 20, label: 'Téléphone' },
        email: { type: 'email', label: 'Email' }
      };
      
      const validation = InputValidator.validateFormData(updates, rules);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${Object.values(validation.errors).join(', ')}`);
      }

      // Nettoyer les données
      const cleanUpdates = {};
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null) {
          cleanUpdates[key] = InputValidator.sanitizeString(updates[key]);
        }
      });

      const response = await apiCall('/profile', {
        method: 'PUT',
        body: JSON.stringify(cleanUpdates)
      });
      
      if (response.success && response.user) {
        // Mettre à jour les données utilisateur localement
        tokenManager.setUserData(response.user);
        logger.log('✅ Profile updated securely');
        return { success: true, user: response.user };
      }
      
      throw new Error('Échec de la mise à jour du profil');
    } catch (error) {
      logger.error('❌ Profile update error:', error);
      throw error;
    }
  }
};

export default secureAuthService;
export { InputValidator, XSSProtection, tokenManager };
