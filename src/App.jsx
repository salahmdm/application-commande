import React, { useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import AuthView from './views/auth/AuthView';
import useAuth from './hooks/useAuth';
import useUIStore from './store/uiStore';
import useAuthStore from './store/authStore';
import useServerDisconnection from './hooks/useServerDisconnection';
import supabaseService from './services/supabaseService';
import logger from './utils/logger';
import { testSupabaseConnection } from './utils/testSupabaseConnection';
import { onAuthStateChange } from './utils/authStateChange';
import './utils/debugProducts'; // Charger les utilitaires de debug

// Client views
import HomeView from './views/client/HomeView';
import ProductsView from './views/client/ProductsView';
import MyOrders from './views/client/MyOrders';
import ProfileView from './views/client/ProfileView';

// Manager views
import ManagerDashboard from './views/manager/ManagerDashboard';
import ManagerPOS from './views/manager/ManagerPOS';
import ManagerAdminHomeView from './views/manager/ManagerAdminHomeView';

// Admin views
import AdminProducts from './views/admin/AdminProducts';
import AdminOrders from './views/admin/AdminOrders';
import AdminInventory from './views/admin/AdminInventory';
import AdminSettings from './views/admin/AdminSettings';
import AdminAccounts from './views/admin/AdminAccounts';
// RestaurantSettings retiré (doublon). Utiliser l'éditeur sur la page d'accueil.
import DashboardCA from './views/dashboard/DashboardCA';

function App() {
  // ✅ L'application principale (port 3000) ne doit JAMAIS afficher le kiosk
  // Le kiosk est complètement isolé sur le port 3010 avec son propre point d'entrée (main-kiosk.jsx)
  // Cette application sert uniquement l'interface principale (clients, managers, admins)
  // ✅ Appels des hooks (doivent être au niveau supérieur, toujours dans le même ordre)
  // Les hooks sont maintenant protégés par les stores (gestion erreur localStorage)
  const { user, isAuthenticated } = useAuth();
  const currentView = useUIStore((state) => state.currentView);
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  
  // ✅ Gestion automatique de la redirection vers la page d'accueil en cas de déconnexion serveur
  useServerDisconnection();

  // ✅ Diagnostic Supabase : Exposer la fonction de test dans la console (disponible en dev et production)
  useEffect(() => {
    window.testSupabaseConnection = testSupabaseConnection;
    if (import.meta.env.DEV) {
      // logger.log('💡 Pour tester la connexion Supabase, tapez dans la console : testSupabaseConnection()');
    }
  }, []);

  
  // ✅ Synchronisation de l'authentification avec le store - OPTIMISÉ
  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;
    
    // ✅ OPTIMISATION: Restaurer immédiatement depuis localStorage pour affichage instantané
    const { setUser, setAuthenticated, setRole, restoreAuth } = useAuthStore.getState();
    
    // ✅ SÉCURITÉ CRITIQUE: Vérifier si l'utilisateur s'est déconnecté volontairement AVANT toute restauration
    const logoutVoluntary = localStorage.getItem('logout_voluntary');
    const logoutTimestamp = localStorage.getItem('logout_timestamp');
    
    // Si déconnexion volontaire récente (moins de 1 heure), NE PAS restaurer
    if (logoutVoluntary === 'true' && logoutTimestamp) {
      const logoutTime = parseInt(logoutTimestamp, 10);
      const oneHourAgo = Date.now() - 3600000; // 1 heure
      
      if (logoutTime > oneHourAgo) {
        logger.log('🔒 App - Déconnexion volontaire active, AUCUNE restauration automatique');
        // Ne pas restaurer la session du tout
        setUser(null);
        setAuthenticated(false);
        setRole(null);
        // Le flag sera nettoyé lors d'une nouvelle connexion ou après 1 heure
        return;
      } else {
        // Le flag est trop ancien, le nettoyer
        logger.log('🔒 App - Flag de déconnexion expiré (>1h), nettoyage');
        localStorage.removeItem('logout_voluntary');
        localStorage.removeItem('logout_timestamp');
      }
    }
    
    // ✅ SÉCURITÉ: Vérifier à nouveau avant de restaurer depuis localStorage
    const currentLogoutVoluntary = localStorage.getItem('logout_voluntary');
    if (currentLogoutVoluntary === 'true') {
      logger.log('🔒 App - Déconnexion volontaire détectée (vérification finale), pas de restauration');
      setUser(null);
      setAuthenticated(false);
      setRole(null);
      return;
    }
    
    // Restaurer depuis localStorage immédiatement
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        if (user && user.role !== 'kiosk' && !user.isGuest) {
          // Restaurer l'état immédiatement pour un affichage rapide
          setUser(user);
          setAuthenticated(true);
          setRole(user.role);
          logger.log('⚡ App - État restauré depuis cache (affichage instantané)');
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }
    
    // Initialiser l'écouteur d'authentification
    const initAuth = async () => {
      if (!isMounted) return;
      
      try {
        // Écouter les changements d'état d'authentification via localStorage
        unsubscribe = onAuthStateChange(async (user) => {
          if (!isMounted) return;
          
          // Vérifier si déconnexion volontaire
          const logoutVoluntary = localStorage.getItem('logout_voluntary');
          if (logoutVoluntary === 'true') {
            setUser(null);
            setAuthenticated(false);
            setRole(null);
            return;
          }
          
          if (user) {
            // ✅ SÉCURITÉ: Ne pas autoriser les comptes kiosk
            if (user.role === 'kiosk') {
              logger.warn('⚠️ App - Compte kiosk détecté, déconnexion');
              setUser(null);
              setAuthenticated(false);
              setRole(null);
              return;
            }
            
            // Mettre à jour le store avec l'utilisateur
            setUser(user);
            setAuthenticated(true);
            setRole(user.role);
          } else {
            setUser(null);
            setAuthenticated(false);
            setRole(null);
          }
        });
        
        // Restaurer l'authentification au chargement
        if (restoreAuth) {
          await restoreAuth();
        }
      } catch (error) {
        logger.error('❌ App - Erreur lors de l\'initialisation de l\'authentification:', error);
        if (restoreAuth) {
          await restoreAuth();
        }
      }
    };
    
    // Initialiser immédiatement
    initAuth();
    
    // Nettoyer au démontage
    return () => {
      isMounted = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          logger.warn('⚠️ Erreur lors du nettoyage:', error);
        }
      }
    };
  }, []); // Seulement au montage
  
  // Synchroniser la vue par défaut au chargement (une seule fois)
  useEffect(() => {
    // Ne changer la vue que si elle n'est pas déjà définie
    try {
      if (!currentView || currentView === 'auth') {
        setCurrentView('home');
      }
    } catch (error) {
      logger.error('❌ Erreur setCurrentView dans useEffect:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Seulement au montage, pas à chaque changement

  // ✅ SÉCURITÉ: Empêcher les comptes kiosk d'utiliser l'application principale
  // Si un compte kiosk est connecté, déconnecter et afficher un message
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'kiosk') {
      logger.warn('⚠️ Compte kiosk détecté dans l\'application principale - Déconnexion automatique');
      // Déconnecter le compte kiosk
      const { logout } = useAuthStore.getState();
      if (logout) {
        logout();
      }
      // Afficher un message à l'utilisateur
      alert('Les comptes kiosk ne peuvent pas être utilisés dans l\'application principale.\nVeuillez utiliser http://localhost:3010 pour accéder à la borne.');
    }
  }, [isAuthenticated, user]);

  // Routes par rôle
  const getRoutes = () => {
    if (!isAuthenticated) {
      return { home: AuthView };
    }

    // ✅ Ne pas afficher de routes pour les comptes kiosk
    if (user?.role === 'kiosk') {
      return { home: AuthView };
    }

    switch (user?.role) {
      case 'admin':
        return {
          home: HomeView,
          'manager-admin-home': ManagerAdminHomeView,
          'admin-dashboard': DashboardCA,
          'admin-products': AdminProducts,
          'admin-orders': AdminOrders,
          'admin-inventory': AdminInventory,
          'admin-accounts': AdminAccounts,
          'admin-settings': AdminSettings,

          'manager-pos': ManagerPOS,
          'manager-orders': ManagerDashboard,
          'manager-stats': DashboardCA,
          profile: ProfileView,
        };
      case 'manager':
        return {
          home: HomeView,
          'manager-admin-home': ManagerAdminHomeView,
          'manager-pos': ManagerPOS,
          'manager-orders': ManagerDashboard,
          'manager-stats': DashboardCA,
          'admin-products': AdminProducts,
          'admin-inventory': AdminInventory,
          profile: ProfileView,
        };
      case 'client':
      default:
        return {
          home: HomeView,
          products: ProductsView,
          orders: MyOrders,
          profile: ProfileView,
        };
    }
  };

  const routes = getRoutes();
  const CurrentComponent = routes[currentView] || routes.home || AuthView;

  // ✅ Protection contre composant undefined
  if (!CurrentComponent) {
    logger.error('❌ CurrentComponent est undefined, utilisation de AuthView par défaut');
    return (
      <ErrorBoundary>
        <AuthView />
      </ErrorBoundary>
    );
  }

  // ✅ Version avec protections
  try {
  return (
    <ErrorBoundary>
      {/* Composants optionnels désactivés temporairement */}
      {/* <OfflineIndicator /> */}
      {/* <NotificationContainer notifications={notifications} onDismiss={dismiss} /> */}
      {isAuthenticated ? (
        <ErrorBoundary>
          <MainLayout>
            <ErrorBoundary>
              <CurrentComponent />
            </ErrorBoundary>
          </MainLayout>
        </ErrorBoundary>
      ) : (
        <ErrorBoundary>
          <CurrentComponent />
        </ErrorBoundary>
      )}
    </ErrorBoundary>
  );
  } catch (error) {
    logger.error('❌ App - Erreur lors du rendu:', error);
    return (
      <ErrorBoundary>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Erreur de rendu</h1>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>Recharger</button>
        </div>
      </ErrorBoundary>
    );
  }
}

export default App;
