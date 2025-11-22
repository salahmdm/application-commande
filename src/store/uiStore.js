import { create } from 'zustand';
import logger from '../utils/logger';
// ⚠️ PERSIST TEMPORAIREMENT DÉSACTIVÉ pour debug "React is null"
// import { persist } from 'zustand/middleware';

/**
 * Store de l'interface utilisateur
 * Gère le thème, les modales, les notifications et l'état de l'UI
 * ⚠️ VERSION SANS PERSIST pour debug
 */
const useUIStore = create(
  // persist(
    (set) => ({
      theme: 'light', // 'light' | 'dark'
      showCart: false,
      showWelcome: true,
      showOrderTypeSelection: false,
      showOrderSuccessModal: false,
      orderSuccessMessage: '',
      showLogoutConfirm: false,
      currentView: 'home', // 'home' | 'products' | 'profile' | 'orders' | etc.
      viewMode: 'grid', // 'grid' | 'list'
      notifications: [],
      isLoading: false,
      
      // Actions
      toggleTheme: () => {
        set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
      },
      
      setTheme: (theme) => {
        set({ theme });
      },
      
      toggleCart: () => {
        set(state => ({ showCart: !state.showCart }));
      },
      
      setShowCart: (show) => {
        set({ showCart: show });
      },
      
      setShowWelcome: (show) => {
        set({ showWelcome: show });
      },
      
      setShowOrderTypeSelection: (show) => {
        set({ showOrderTypeSelection: show });
      },
      
      setShowOrderSuccessModal: (show) => {
        set({ showOrderSuccessModal: show });
      },
      
      setOrderSuccessMessage: (message) => {
        set({ orderSuccessMessage: message });
      },
      
      setShowLogoutConfirm: (show) => {
        set({ showLogoutConfirm: show });
      },
      
      setCurrentView: (view) => {
        set({ currentView: view });
      },
      
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      
      addNotification: (notification) => {
        const id = Date.now();
        set(state => ({
          notifications: [
            ...state.notifications,
            { 
              id, 
              ...notification, 
              createdAt: new Date().toISOString() 
            }
          ]
        }));
        
        // Auto-remove après 5 secondes
        setTimeout(() => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        }, 5000);
        
        return id;
      },
      
      removeNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      setLoading: (isLoading) => {
        set({ isLoading });
      }
    })
);

export default useUIStore;

