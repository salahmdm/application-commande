import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';

/**
 * Hook personnalisé pour l'authentification
 * Facilite l'utilisation du store d'auth et des services
 */
const useAuth = () => {
  const { user, isAuthenticated, role, login: storeLogin, logout: storeLogout, register: storeRegister, updateProfile, loginAsGuest: storeLoginAsGuest } = useAuthStore();
  
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 useAuth.login - Tentative de connexion:', email);
      const result = await storeLogin(email, password);
      console.log('✅ useAuth.login - Résultat:', result);
      return result;
    } catch (error) {
      console.error('❌ useAuth.login - Erreur:', error);
      return { success: false, error: error.message || 'Erreur de connexion' };
    }
  }, [storeLogin]);
  
  const register = useCallback(async (userData) => {
    try {
      const result = await storeRegister(userData);
      return result;
    } catch (error) {
      console.error('Erreur register hook:', error);
      return { success: false, error: error.message || 'Erreur d\'inscription' };
    }
  }, [storeRegister]);
  
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      storeLogout();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [storeLogout]);
  
  const loginAsGuest = useCallback(async (name) => {
    try {
      console.log('🔐 useAuth.loginAsGuest - Nom invité:', name);
      const result = await storeLoginAsGuest(name);
      console.log('✅ useAuth.loginAsGuest - Résultat:', result);
      return result;
    } catch (error) {
      console.error('❌ useAuth.loginAsGuest - Erreur:', error);
      return { success: false, error: error.message || 'Erreur de connexion invité' };
    }
  }, [storeLoginAsGuest]);
  
  const update = useCallback(async (updates) => {
    try {
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }
      
      const result = await authService.updateProfile(user.id, updates);
      if (result.data.user) {
        updateProfile(updates);
        return { success: true, user: result.data.user };
      }
      return { success: false, error: 'Échec de la mise à jour' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, updateProfile]);
  
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
    hasRole,
    isClient: role === 'client',
    isManager: role === 'manager',
    isAdmin: role === 'admin',
    isGuest: user?.isGuest === true
  };
};

export default useAuth;

