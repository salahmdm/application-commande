import React, { useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import AuthView from './views/auth/AuthView';
import useAuth from './hooks/useAuth';
import useUIStore from './store/uiStore';
import useAuthStore from './store/authStore';
import useServerDisconnection from './hooks/useServerDisconnection';
import authServiceFirebase from './services/authServiceFirebase';
import firebaseService from './services/firebaseService';
import logger from './utils/logger';
import { testSupabaseConnection } from './utils/testSupabaseConnection';
import { testFirebaseConnection, testFirebaseLogin } from './utils/testFirebaseConnection';
import './utils/diagnosticFirebase'; // Import pour exposer les fonctions de diagnostic

// Client views
import HomeView from './views/client/HomeView';
import ProductsView from './views/client/ProductsView';
import MyOrders from './views/client/MyOrders';
import ProfileView from './views/client/ProfileView';

// Manager views
import ManagerDashboard from './views/manager/ManagerDashboard';
import ManagerPOS from './views/manager/ManagerPOS';

// Admin views
import AdminProducts from './views/admin/AdminProducts';
import AdminOrders from './views/admin/AdminOrders';
import AdminInventory from './views/admin/AdminInventory';
import AdminSettings from './views/admin/AdminSettings';
import AdminAccounts from './views/admin/AdminAccounts';
// RestaurantSettings retiré (doublon). Utiliser l'éditeur sur la page d'accueil.
import AdminAppearance from './views/admin/AdminAppearance';
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
      logger.log('💡 Pour tester la connexion Supabase, tapez dans la console : testSupabaseConnection()');
    }
  }, []);

  // ✅ Diagnostic Firebase : Exposer les fonctions de test dans la console
  useEffect(() => {
    window.testFirebaseConnection = testFirebaseConnection;
    window.testFirebaseLogin = testFirebaseLogin;
    if (import.meta.env.DEV) {
      logger.log('💡 Pour tester Firebase, tapez : testFirebaseConnection()');
      logger.log('💡 Pour tester la connexion, tapez : testFirebaseLogin("email@example.com", "password")');
    }
  }, []);
  
  // ✅ Synchronisation Firebase Authentication avec le store - OPTIMISÉ
  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;
    
    // ✅ OPTIMISATION: Restaurer immédiatement depuis localStorage pour affichage instantané
    const { setUser, setAuthenticated, setRole, restoreAuth } = useAuthStore.getState();
    
    // Restaurer depuis localStorage immédiatement (sans attendre Firebase)
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
    
    // Initialiser l'écouteur Firebase immédiatement (sans délai)
    const initFirebase = async () => {
      if (!isMounted) return;
      
      try {
        // Vérifier si authServiceFirebase est disponible
        if (!authServiceFirebase || typeof authServiceFirebase.onAuthStateChange !== 'function') {
          logger.warn('⚠️ App - authServiceFirebase.onAuthStateChange non disponible');
          if (restoreAuth) {
            await restoreAuth();
          }
          return;
        }
        
        // Écouter les changements d'état d'authentification Firebase
        unsubscribe = authServiceFirebase.onAuthStateChange(async (user) => {
        if (!isMounted) return;
        
          try {
            if (user) {
              // Si l'utilisateur a déjà toutes les données (depuis authServiceFirebase)
              if (user.uid && user.role) {
                // ✅ SÉCURITÉ: Ne pas autoriser les comptes kiosk
                if (user.role === 'kiosk') {
                  logger.warn('⚠️ App - Compte kiosk détecté, déconnexion');
                  try {
                    await authServiceFirebase.logout();
                  } catch (err) {
                    logger.error('❌ Erreur lors de la déconnexion kiosk:', err);
                  }
                  setUser(null);
                  setAuthenticated(false);
                  setRole(null);
                  return;
                }
                
                // Mettre à jour le store avec l'utilisateur complet
                setUser(user);
                setAuthenticated(true);
                setRole(user.role);
                try {
                  localStorage.setItem('user', JSON.stringify(user));
                } catch (err) {
                  logger.warn('⚠️ Erreur localStorage:', err);
                }
                return;
              }
              
              // Sinon, récupérer les données depuis Firestore (en arrière-plan)
              // ✅ OPTIMISATION: Ne pas bloquer l'interface, utiliser les données en cache si disponibles
              const cachedUserData = localStorage.getItem(`firestore_user_${user.uid}`);
              if (cachedUserData) {
                try {
                  const userData = JSON.parse(cachedUserData);
                  const fullUser = {
                    id: user.uid || user.id,
                    uid: user.uid || user.id,
                    email: user.email,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    name: userData.displayName || user.displayName || '',
                    role: userData.role || 'client',
                    loyalty_points: userData.loyalty_points || userData.points || 0,
                    points: userData.points || userData.loyalty_points || 0,
                    emailVerified: user.emailVerified || false,
                    photoURL: user.photoURL || userData.photoURL,
                    phone: userData.phone || null,
                    address: userData.address || null
                  };
                  
                  setUser(fullUser);
                  setAuthenticated(true);
                  setRole(fullUser.role);
                  localStorage.setItem('user', JSON.stringify(fullUser));
                  
                  // Mettre à jour depuis Firestore en arrière-plan (sans bloquer)
                  firebaseService.getDocument('users', user.uid || user.id).then(userData => {
                    if (userData && isMounted) {
                      localStorage.setItem(`firestore_user_${user.uid}`, JSON.stringify(userData));
                      const updatedUser = {
                        ...fullUser,
                        ...userData,
                        points: userData.loyalty_points || userData.points || 0,
                        loyalty_points: userData.loyalty_points || userData.points || 0
                      };
                      setUser(updatedUser);
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                  }).catch(err => {
                    logger.warn('⚠️ Erreur mise à jour Firestore en arrière-plan:', err);
                  });
                  
                  return;
                } catch (e) {
                  // Continuer avec Firestore si le cache est invalide
                }
              }
              
              // Récupérer depuis Firestore (seulement si pas de cache)
              try {
                const userData = await firebaseService.getDocument('users', user.uid || user.id);
                
                if (!userData) {
                  // ✅ CORRECTION: Si Firestore ne retourne pas de données, utiliser le cache localStorage
                  const cachedUserStr = localStorage.getItem('user');
                  if (cachedUserStr) {
                    try {
                      const cachedUser = JSON.parse(cachedUserStr);
                      if (cachedUser && cachedUser.uid === (user.uid || user.id)) {
                        logger.warn('⚠️ App - Firestore vide, utilisation du cache localStorage');
                        setUser(cachedUser);
                        setAuthenticated(true);
                        setRole(cachedUser.role);
                        return;
                      }
                    } catch (e) {
                      // Ignorer
                    }
                  }
                  
                  logger.warn('⚠️ App - Utilisateur Firebase connecté mais pas dans Firestore');
                  // Ne pas déconnecter, créer un utilisateur minimal
                  const minimalUser = {
                    id: user.uid || user.id,
                    uid: user.uid || user.id,
                    email: user.email,
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    name: user.displayName || '',
                    role: 'client',
                    loyalty_points: 0,
                    points: 0,
                    emailVerified: user.emailVerified || false,
                    photoURL: user.photoURL || null
                  };
                  setUser(minimalUser);
                  setAuthenticated(true);
                  setRole('client');
                  try {
                    localStorage.setItem('user', JSON.stringify(minimalUser));
                  } catch (err) {
                    // Ignorer
                  }
                  return;
                }
                
                // ✅ SÉCURITÉ: Ne pas autoriser les comptes kiosk
                if (userData.role === 'kiosk') {
                  logger.warn('⚠️ App - Compte kiosk détecté, déconnexion');
                  try {
                    await authServiceFirebase.logout();
                  } catch (err) {
                    logger.error('❌ Erreur lors de la déconnexion kiosk:', err);
                  }
                  setUser(null);
                  setAuthenticated(false);
                  setRole(null);
                  return;
                }
                
                // Mettre en cache les données Firestore
                try {
                  localStorage.setItem(`firestore_user_${user.uid}`, JSON.stringify(userData));
                } catch (e) {
                  // Ignorer les erreurs de cache
                }
                
                // Construire l'objet utilisateur
                const fullUser = {
                  id: user.uid || user.id,
                  uid: user.uid || user.id,
                  email: user.email,
                  firstName: userData.firstName || '',
                  lastName: userData.lastName || '',
                  name: userData.displayName || user.displayName || '',
                  role: userData.role || 'client',
                  loyalty_points: userData.loyalty_points || userData.points || 0,
                  points: userData.points || userData.loyalty_points || 0,
                  emailVerified: user.emailVerified || false,
                  photoURL: user.photoURL || userData.photoURL,
                  phone: userData.phone || null,
                  address: userData.address || null
                };
                
                // Mettre à jour le store
                setUser(fullUser);
                setAuthenticated(true);
                setRole(fullUser.role);
                try {
                  localStorage.setItem('user', JSON.stringify(fullUser));
                } catch (err) {
                  logger.warn('⚠️ Erreur localStorage:', err);
                }
              } catch (firestoreError) {
                logger.error('❌ Erreur lors de la récupération Firestore:', firestoreError);
                
                // ✅ CORRECTION: Si Firestore est hors ligne, utiliser le cache localStorage
                const cachedUserStr = localStorage.getItem('user');
                if (cachedUserStr) {
                  try {
                    const cachedUser = JSON.parse(cachedUserStr);
                    if (cachedUser && cachedUser.uid === (user.uid || user.id)) {
                      logger.warn('⚠️ App - Firestore hors ligne, utilisation du cache localStorage');
                      setUser(cachedUser);
                      setAuthenticated(true);
                      setRole(cachedUser.role);
                      return;
                    }
                  } catch (e) {
                    // Ignorer
                  }
                }
                
                // Si pas de cache, utiliser les données de base Firebase
                const minimalUser = {
                  id: user.uid || user.id,
                  uid: user.uid || user.id,
                  email: user.email,
                  firstName: user.displayName?.split(' ')[0] || '',
                  lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                  name: user.displayName || '',
                  role: 'client',
                  loyalty_points: 0,
                  points: 0,
                  emailVerified: user.emailVerified || false,
                  photoURL: user.photoURL || null
                };
                setUser(minimalUser);
                setAuthenticated(true);
                setRole('client');
                try {
                  localStorage.setItem('user', JSON.stringify(minimalUser));
                } catch (err) {
                  // Ignorer
                }
              }
            } else {
              setUser(null);
              setAuthenticated(false);
              setRole(null);
              try {
                localStorage.removeItem('user');
              } catch (err) {
                logger.warn('⚠️ Erreur localStorage:', err);
              }
            }
          } catch (error) {
            logger.error('❌ App - Erreur lors de la synchronisation Firebase:', error);
            setUser(null);
            setAuthenticated(false);
            setRole(null);
          }
        });
      } catch (error) {
        logger.error('❌ App - Erreur lors de l\'initialisation de l\'écouteur Firebase:', error);
        if (restoreAuth) {
          await restoreAuth();
        }
      }
    };
    
    // ✅ OPTIMISATION: Initialiser immédiatement (pas de délai)
    initFirebase();
    
    // Nettoyer au démontage
    return () => {
      isMounted = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          logger.warn('⚠️ Erreur lors du nettoyage Firebase:', error);
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
          'admin-dashboard': DashboardCA,
          'admin-products': AdminProducts,
          'admin-orders': AdminOrders,
          'admin-inventory': AdminInventory,
          'admin-accounts': AdminAccounts,
          'admin-settings': AdminSettings,
          'admin-appearance': AdminAppearance,

          'manager-pos': ManagerPOS,
          'manager-orders': ManagerDashboard,
          'manager-stats': DashboardCA,
        };
      case 'manager':
        return {
          home: HomeView,
          'manager-pos': ManagerPOS,
          'manager-orders': ManagerDashboard,
          'manager-stats': DashboardCA,
          'admin-products': AdminProducts,
          'admin-inventory': AdminInventory,
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
