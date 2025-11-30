import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import authServiceSupabase from '../services/authServiceSupabase';
import logger from '../utils/logger';

/**
 * Hook personnalisé pour l'authentification
 * Facilite l'utilisation du store d'auth et des services
 */
const useAuth = () => {
  const { user, isAuthenticated, role, login: storeLogin, logout: storeLogout, register: storeRegister, updateProfile, loginAsGuest: storeLoginAsGuest } = useAuthStore();
  
  const login = useCallback(async (email, password) => {
    try {
      logger.log('🔐 useAuth.login - Tentative de connexion:', email);
      const result = await storeLogin(email, password);
      logger.log('✅ useAuth.login - Résultat:', result);
      return result;
    } catch (error) {
      logger.error('❌ useAuth.login - Erreur:', error);
      return { success: false, error: error.message || 'Erreur de connexion' };
    }
  }, [storeLogin]);
  
  const register = useCallback(async (userData) => {
    try {
      const result = await storeRegister(userData);
      return result;
    } catch (error) {
      logger.error('Erreur register hook:', error);
      return { success: false, error: error.message || 'Erreur d\'inscription' };
    }
  }, [storeRegister]);
  
  const logout = useCallback(async () => {
    try {
      await authServiceSupabase.logout();
      storeLogout();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [storeLogout]);
  
  const loginAsGuest = useCallback(async (name) => {
    try {
      logger.log('🔐 useAuth.loginAsGuest - Nom invité:', name);
      const result = await storeLoginAsGuest(name);
      logger.log('✅ useAuth.loginAsGuest - Résultat:', result);
      return result;
    } catch (error) {
      logger.error('❌ useAuth.loginAsGuest - Erreur:', error);
      return { success: false, error: error.message || 'Erreur de connexion invité' };
    }
  }, [storeLoginAsGuest]);
  
  const update = useCallback(async (updates) => {
    try {
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }
      
      logger.log('🔄 useAuth.update - Mise à jour profil:', updates);
      const result = await authServiceSupabase.updateProfile(user.uid || user.id, updates);
      logger.log('📦 useAuth.update - Résultat:', result);
      
      if (result.success && result.user) {
        // Mettre à jour le store avec les nouvelles données utilisateur complètes
        // Le store Zustand avec persist mettra automatiquement à jour localStorage
        logger.log('🔄 useAuth.update - Mise à jour du store avec:', result.user);
        updateProfile(result.user);
        logger.log('✅ useAuth.update - Profil mis à jour avec succès dans le store');
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error || 'Échec de la mise à jour' };
    } catch (error) {
      logger.error('❌ useAuth.update - Erreur:', error);
      return { success: false, error: error.message || 'Erreur lors de la mise à jour' };
    }
  }, [user, updateProfile]);
  
  const resetPassword = useCallback(async (email) => {
    try {
      logger.log('📧 useAuth.resetPassword - Email:', email);
      const result = await authServiceSupabase.resetPassword(email);
      logger.log('✅ useAuth.resetPassword - Résultat:', result);
      return result;
    } catch (error) {
      logger.error('❌ useAuth.resetPassword - Erreur:', error);
      return { success: false, error: error.message || 'Erreur lors de la réinitialisation' };
    }
  }, []);

  const hasRole = useCallback((requiredRole) => {
    if (!isAuthenticated || !role) return false;
    if (requiredRole === 'admin') return role === 'admin';
    if (requiredRole === 'manager') return ['manager', 'admin'].includes(role);
    return true;
  }, [isAuthenticated, role]);
  
  return {
    user,
    isAuthenticated,
    role,
    login,
    register,
    logout,
    update,
    loginAsGuest,
    resetPassword,
    hasRole,
    isClient: role === 'client',
    isManager: role === 'manager',
    isAdmin: role === 'admin',
    isGuest: user?.isGuest === true
  };
};

export default useAuth;

