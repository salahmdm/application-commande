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
import supabaseService from './services/supabaseService';
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
    
    // ✅ SÉCURITÉ CRITIQUE: Vérifier si l'utilisateur s'est déconnecté volontairement AVANT toute restauration
    const logoutVoluntary = localStorage.getItem('logout_voluntary');
    const logoutTimestamp = localStorage.getItem('logout_timestamp');
    
    // Si déconnexion volontaire récente (moins de 1 heure), NE PAS restaurer
    if (logoutVoluntary === 'true' && logoutTimestamp) {
      const logoutTime = parseInt(logoutTimestamp, 10);
      const oneHourAgo = Date.now() - 3600000; // 1 heure
      
      if (logoutTime > oneHourAgo) {
        logger.log('🔒 App - Déconnexion volontaire active, AUCUNE restauration automatique');
        // NE PAS nettoyer le flag ici, on le garde pour empêcher Firebase Auth de reconnecter
        // Ne pas restaurer la session du tout
        setUser(null);
        setAuthenticated(false);
        setRole(null);
        // Ne pas continuer, ignorer complètement la restauration
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
        
          // ✅ SÉCURITÉ CRITIQUE: Vérifier TOUJOURS le flag AVANT tout traitement
          const logoutVoluntary = localStorage.getItem('logout_voluntary');
          const logoutTimestamp = localStorage.getItem('logout_timestamp');
          
          // Si déconnexion volontaire récente (moins de 1 heure), IGNORER complètement Firebase Auth
          if (logoutVoluntary === 'true' && logoutTimestamp) {
            const logoutTime = parseInt(logoutTimestamp, 10);
            const oneHourAgo = Date.now() - 3600000; // 1 heure
            
            if (logoutTime > oneHourAgo) {
              logger.log('🔒 App - Déconnexion volontaire active, IGNORER Firebase Auth complètement');
              // Forcer la déconnexion même si Firebase Auth dit qu'il y a un utilisateur
              setUser(null);
              setAuthenticated(false);
              setRole(null);
              
              // Si Firebase Auth a encore un utilisateur, le déconnecter
              if (user) {
                try {
                  await firebaseService.signOut();
                  logger.log('🔒 App - Firebase Auth déconnecté après détection de déconnexion volontaire');
                } catch (err) {
                  logger.warn('⚠️ Erreur lors de la déconnexion Firebase Auth:', err);
                }
              }
              
              return; // NE PAS continuer, ignorer complètement
            } else {
              // Le flag est trop ancien, le nettoyer
              localStorage.removeItem('logout_voluntary');
              localStorage.removeItem('logout_timestamp');
            }
          }
          
          try {
            if (user) {
              // ✅ SÉCURITÉ: Vérifier à nouveau (double vérification)
              const currentLogoutVoluntary = localStorage.getItem('logout_voluntary');
              if (currentLogoutVoluntary === 'true') {
                logger.log('🔒 App - Déconnexion volontaire détectée (double vérification), déconnexion forcée');
                try {
                  await authServiceFirebase.logout();
                } catch (err) {
                  logger.error('❌ Erreur lors de la déconnexion forcée:', err);
                }
                setUser(null);
                setAuthenticated(false);
                setRole(null);
                return;
              }
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
                  
                  // ✅ NOUVEAU: Mettre à jour depuis Supabase en arrière-plan (sans bloquer)
                  supabaseService.getUserByEmail(user.email).then(supabaseResult => {
                    if (supabaseResult.success && supabaseResult.data && isMounted) {
                      const supabaseData = supabaseResult.data;
                      const updatedUser = {
                        ...fullUser,
                        firstName: supabaseData.first_name || fullUser.firstName,
                        lastName: supabaseData.last_name || fullUser.lastName,
                        role: supabaseData.role || fullUser.role, // ✅ Rôle depuis Supabase
                        loyalty_points: supabaseData.loyalty_points || fullUser.loyalty_points,
                        points: supabaseData.loyalty_points || fullUser.points,
                        photoURL: supabaseData.avatar_url || fullUser.photoURL,
                        phone: supabaseData.phone || fullUser.phone
                      };
                      setUser(updatedUser);
                      setRole(updatedUser.role);
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                  }).catch(err => {
                    logger.warn('⚠️ Erreur mise à jour Supabase en arrière-plan:', err);
                  });
                  
                  return;
                } catch (e) {
                  // Continuer avec Firestore si le cache est invalide
                }
              }
              
              // ✅ NOUVEAU: Récupérer depuis Supabase (source de vérité pour les rôles)
              try {
                const supabaseResult = await supabaseService.getUserByEmail(user.email);
                
                if (!supabaseResult.success || !supabaseResult.data) {
                  // ✅ Si Supabase ne retourne pas de données, utiliser le cache localStorage
                  const cachedUserStr = localStorage.getItem('user');
                  if (cachedUserStr) {
                    try {
                      const cachedUser = JSON.parse(cachedUserStr);
                      if (cachedUser && cachedUser.uid === (user.uid || user.id)) {
                        logger.warn('⚠️ App - Utilisateur non trouvé dans Supabase, utilisation du cache localStorage');
                        setUser(cachedUser);
                        setAuthenticated(true);
                        setRole(cachedUser.role);
                        
                        // ✅ SYNCHRONISATION AUTOMATIQUE: Créer l'utilisateur dans Supabase
                        logger.log('🔄 App - Synchronisation automatique Firebase → Supabase en cours...');
                        const syncResult = await supabaseService.syncFirebaseUser(user, {
                          firstName: cachedUser.firstName,
                          lastName: cachedUser.lastName,
                          role: cachedUser.role || 'client',
                          loyalty_points: cachedUser.loyalty_points || 0
                        });
                        
                        if (syncResult.success) {
                          logger.log('✅ App - Utilisateur synchronisé avec succès dans Supabase:', user.email);
                          // Mettre à jour avec les données Supabase fraîches
                          const updatedSupabaseUser = await supabaseService.getUserByEmail(user.email);
                          if (updatedSupabaseUser.success && updatedSupabaseUser.data) {
                            const supabaseData = updatedSupabaseUser.data;
                            const updatedUser = {
                              ...cachedUser,
                              id: supabaseData.id,
                              firstName: supabaseData.first_name || cachedUser.firstName,
                              lastName: supabaseData.last_name || cachedUser.lastName,
                              role: supabaseData.role || cachedUser.role,
                              loyalty_points: supabaseData.loyalty_points || cachedUser.loyalty_points,
                              points: supabaseData.loyalty_points || cachedUser.points
                            };
                            setUser(updatedUser);
                            setRole(updatedUser.role);
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                          }
                        } else {
                          logger.error('❌ App - Erreur synchronisation Supabase:', syncResult.error);
                        }
                        return;
                      }
                    } catch (e) {
                      // Ignorer
                    }
                  }
                  
                  logger.warn('⚠️ App - Utilisateur Firebase connecté mais pas dans Supabase, création automatique...');
                  // Créer un utilisateur minimal et synchroniser avec Supabase
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
                  
                  // ✅ SYNCHRONISATION AUTOMATIQUE: Créer l'utilisateur dans Supabase
                  logger.log('🔄 App - Synchronisation automatique Firebase → Supabase en cours...');
                  const syncResult = await supabaseService.syncFirebaseUser(user, {
                    firstName: minimalUser.firstName,
                    lastName: minimalUser.lastName,
                    role: 'client',
                    loyalty_points: 0
                  });
                  
                  if (syncResult.success) {
                    logger.log('✅ App - Utilisateur créé avec succès dans Supabase:', user.email);
                    // Mettre à jour avec les données Supabase fraîches
                    const updatedSupabaseUser = await supabaseService.getUserByEmail(user.email);
                    if (updatedSupabaseUser.success && updatedSupabaseUser.data) {
                      const supabaseData = updatedSupabaseUser.data;
                      const updatedUser = {
                        ...minimalUser,
                        id: supabaseData.id,
                        firstName: supabaseData.first_name || minimalUser.firstName,
                        lastName: supabaseData.last_name || minimalUser.lastName,
                        role: supabaseData.role || 'client',
                        loyalty_points: supabaseData.loyalty_points || 0,
                        points: supabaseData.loyalty_points || 0
                      };
                      setUser(updatedUser);
                      setRole(updatedUser.role);
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                  } else {
                    logger.error('❌ App - Erreur création utilisateur dans Supabase:', syncResult.error);
                  }
                  return;
                }
                
                const supabaseData = supabaseResult.data;
                
                // ✅ SÉCURITÉ: Ne pas autoriser les comptes kiosk
                if (supabaseData.role === 'kiosk') {
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
                
                // Construire l'objet utilisateur depuis Supabase
                const fullUser = {
                  id: user.uid || user.id,
                  uid: user.uid || user.id,
                  email: user.email,
                  firstName: supabaseData.first_name || '',
                  lastName: supabaseData.last_name || '',
                  name: `${supabaseData.first_name || ''} ${supabaseData.last_name || ''}`.trim() || user.displayName || user.email,
                  role: supabaseData.role || 'client', // ✅ Rôle depuis Supabase
                  loyalty_points: supabaseData.loyalty_points || 0,
                  points: supabaseData.loyalty_points || 0,
                  emailVerified: user.emailVerified || false,
                  photoURL: supabaseData.avatar_url || user.photoURL,
                  phone: supabaseData.phone || null,
                  address: null // Supabase n'a pas de champ address dans users
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
