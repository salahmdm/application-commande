import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

/**
 * Store d'authentification
 * Connecté à MySQL via API
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      role: null, // 'client' | 'manager' | 'admin'
      
      // Actions
      login: async (email, password) => {
        try {
          // Appel API réel vers MySQL
          const response = await authService.login(email, password);
          
          if (response.success && response.user) {
            set({ 
              user: response.user, 
              isAuthenticated: true, 
              role: response.user.role 
            });
            return { success: true, user: response.user };
          }
          
          return { success: false, error: 'Identifiants invalides' };
        } catch (error) {
          console.error('Erreur login store:', error);
          return { success: false, error: error.message || 'Erreur de connexion' };
        }
      },
      
      register: async (userData) => {
        try {
          // Appel API réel vers MySQL
          const response = await authService.register(userData);
          
          if (response.success) {
            // Login automatique après inscription
            return await get().login(userData.email, userData.password);
          }
          
          return { success: false, error: 'Échec de l\'inscription' };
        } catch (error) {
          console.error('Erreur register store:', error);
          return { success: false, error: error.message || 'Erreur d\'inscription' };
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false, role: null });
      },
      
      updateProfile: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
          return { success: true };
        }
        return { success: false, error: 'Utilisateur non connecté' };
      },
      
      updatePoints: (points) => {
        const currentUser = get().user;
        // Ne pas accumuler de points pour les invités
        if (currentUser && currentUser.role === 'client' && !currentUser.isGuest) {
          set({ user: { ...currentUser, points: (currentUser.points || 0) + points } });
        }
      },
      
      // Connexion en tant qu'invité
      loginAsGuest: async (name) => {
        try {
          const guestUser = {
            id: `guest_${Date.now()}`,
            email: null,
            first_name: name,
            last_name: '',
            role: 'client',
            points: 0,
            isGuest: true,
            created_at: new Date().toISOString()
          };
          
          set({ 
            user: guestUser, 
            isAuthenticated: true, 
            role: 'client'
          });
          
          // Sauvegarder dans localStorage (sans token)
          localStorage.setItem('user', JSON.stringify(guestUser));
          
          return { success: true, user: guestUser };
        } catch (error) {
          console.error('Erreur loginAsGuest store:', error);
          return { success: false, error: error.message || 'Erreur de connexion invité' };
        }
      }
    }),
    {
      name: 'blossom-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        role: state.role 
      })
    }
  )
);

export default useAuthStore;

