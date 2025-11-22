/**
 * Composant de protection des routes sécurisé
 * Vérification des autorisations et redirection sécurisée
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import secureAuthService from '../services/secureAuthService';
import logger from '../../utils/logger';

/**
 * Composant de protection des routes
 */
const SecureRoute = ({ 
  children, 
  requiredRole = null, 
  fallbackPath = '/auth',
  loadingComponent = null 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        if (!secureAuthService.isAuthenticated()) {
          logger.debug('🚨 Unauthorized access attempt - not authenticated');
          navigate(fallbackPath);
          return;
        }

        // Récupérer les données utilisateur
        const user = secureAuthService.getCurrentUser();
        if (!user) {
          logger.debug('🚨 Unauthorized access attempt - no user data');
          navigate(fallbackPath);
          return;
        }

        // Vérifier le rôle si requis
        if (requiredRole) {
          const hasRole = checkUserRole(user.role, requiredRole);
          if (!hasRole) {
            // ✅ SÉCURITÉ: Ne pas logger le rôle utilisateur (données sensibles)
            logger.debug(`🚨 Unauthorized access attempt - insufficient role (required: ${requiredRole})`);
            navigate('/unauthorized');
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        logger.error('❌ Authorization check error:', error);
        navigate(fallbackPath);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [requiredRole, fallbackPath, navigate]);

  /**
   * Vérifier si l'utilisateur a le rôle requis
   */
  const checkUserRole = (userRole, requiredRole) => {
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    // Hiérarchie des rôles
    const roleHierarchy = {
      'client': ['client'],
      'manager': ['manager', 'admin'],
      'admin': ['admin']
    };
    
    return roleHierarchy[userRole]?.includes(requiredRole) || false;
  };

  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
};

/**
 * Hook pour vérifier les autorisations
 */
export const useAuthorization = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (secureAuthService.isAuthenticated()) {
          const userData = secureAuthService.getCurrentUser();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error('❌ Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const hasRole = (role) => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    const roleHierarchy = {
      'client': ['client'],
      'manager': ['manager', 'admin'],
      'admin': ['admin']
    };
    
    return roleHierarchy[user.role]?.includes(role) || false;
  };

  const isClient = hasRole('client');
  const isManager = hasRole('manager');
  const isAdmin = hasRole('admin');

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasRole,
    isClient,
    isManager,
    isAdmin
  };
};

/**
 * Composant de protection conditionnelle
 */
export const ConditionalRender = ({ 
  children, 
  condition, 
  fallback = null 
}) => {
  return condition ? children : fallback;
};

/**
 * Composant de protection par rôle
 */
export const RoleGuard = ({ 
  children, 
  allowedRoles, 
  fallback = null 
}) => {
  const { hasRole, isLoading } = useAuthorization();

  if (isLoading) {
    return null;
  }

  const isAllowed = hasRole(allowedRoles);
  return isAllowed ? children : fallback;
};

/**
 * Composant de redirection sécurisée
 */
export const SecureRedirect = ({ 
  to, 
  condition, 
  children 
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (condition) {
      navigate(to);
    }
  }, [condition, to, navigate]);

  return children;
};

/**
 * Hook pour la gestion sécurisée des erreurs
 */
export const useSecureErrorHandler = () => {
  const handleError = (error, context = '') => {
    logger.error(`❌ Secure Error Handler [${context}]:`, error);
    
    // Ne pas exposer les détails d'erreur sensibles
    const sanitizedError = {
      message: 'Une erreur est survenue',
      code: 'GENERIC_ERROR',
      timestamp: new Date().toISOString()
    };

    // Log l'erreur complète côté serveur (si possible)
    if (process.env.NODE_ENV === 'development') {
      sanitizedError.details = error.message;
    }

    return sanitizedError;
  };

  return { handleError };
};

/**
 * Composant de protection contre XSS
 */
export const XSSProtection = ({ children, content }) => {
  if (content && typeof content === 'string') {
    // Échapper le contenu HTML
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // ✅ SÉCURITÉ: Utiliser textContent au lieu de dangerouslySetInnerHTML
    // React échappe automatiquement le contenu dans les éléments
    return <span>{escapedContent}</span>;
  }
  
  return children;
};

export default SecureRoute;
