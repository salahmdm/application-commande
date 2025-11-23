import { create } from 'zustand';
// ⚠️ PERSIST TEMPORAIREMENT DÉSACTIVÉ pour debug "React is null"
// import { persist } from 'zustand/middleware';
// ✅ Firebase Authentication activé
import authServiceFirebase from '../services/authServiceFirebase';
import firebaseService from '../services/firebaseService';
import logger from '../utils/logger';

/**
 * Store d'authentification
 * Connecté à Firebase Authentication + Firestore
 * ⚠️ VERSION SANS PERSIST pour debug
 */

// ✅ Initialisation immédiate depuis localStorage pour éviter le flash de la page login au refresh
// ✅ SÉCURITÉ: Exclure les comptes kiosk de l'application principale
let initialUser = null;
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsedUser = JSON.parse(raw);
      // ✅ Ne pas charger les comptes kiosk dans l'application principale
      // Les comptes kiosk doivent utiliser uniquement le port 3010
      if (parsedUser && parsedUser.role !== 'kiosk') {
        initialUser = parsedUser;
      } else if (parsedUser && parsedUser.role === 'kiosk') {
        // Nettoyer le compte kiosk du localStorage de l'application principale
        logger.warn('⚠️ Compte kiosk détecté dans localStorage - Nettoyage automatique');
        localStorage.removeItem('user');
        initialUser = null;
      }
    }
  }
} catch (_e) {
  // Ignorer les erreurs de parsing/capacités localStorage
}

// ✅ Lazy import d'apiCall pour éviter problèmes d'initialisation React
let apiCallRef = null;
const getApiCall = async () => {
  if (!apiCallRef) {
    const module = await import('../services/api');
    apiCallRef = module.apiCall;
  }
  return apiCallRef;
};

const useAuthStore = create(
  // persist(
    (set, get) => ({
      user: initialUser,
      isAuthenticated: !!initialUser,
      role: initialUser?.role || null, // 'client' | 'manager' | 'admin'
      token: null, // Token JWT pour les requêtes API
      
      // Actions de mise à jour directe (pour synchronisation Firebase)
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setRole: (role) => set({ role }),
      
      // Actions de mise à jour directe (pour synchronisation Firebase)
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setRole: (role) => set({ role }),
      
      // Actions
      login: async (email, password) => {
        try {
          // Connexion avec Firebase Auth
          const response = await authServiceFirebase.login(email, password);
          
          if (response.success && response.user) {
            // ✅ SÉCURITÉ: Empêcher les comptes kiosk de se connecter dans l'application principale
            if (response.user.role === 'kiosk') {
              logger.warn('⚠️ authStore.login - Tentative de connexion d\'un compte kiosk dans l\'application principale');
              throw new Error('Les comptes kiosk ne peuvent pas se connecter via l\'application principale. Utilisez http://localhost:3010 pour accéder à la borne.');
            }

            // ✅ Le token est maintenant dans un cookie HTTP-only (sécurisé)
            // Ne plus stocker le token dans le store ou localStorage
            
            // Stocker uniquement les informations utilisateur
            const userWithPoints = {
              ...response.user,
              points: response.user.loyalty_points || response.user.points || 0,
              loyalty_points: response.user.loyalty_points || response.user.points || 0
            };
            
            // ✅ SÉCURITÉ: Nettoyer le flag de déconnexion volontaire lors d'une connexion réussie
            try {
              localStorage.removeItem('logout_voluntary');
              localStorage.removeItem('logout_timestamp');
            } catch (e) {
              logger.warn('⚠️ Erreur lors du nettoyage du flag de déconnexion:', e);
            }
            
            set({ 
              user: userWithPoints, 
              isAuthenticated: true, 
              role: response.user.role,
              token: null // ✅ Plus de token dans le store (cookie HTTP-only uniquement)
            });
            
            // Mettre à jour localStorage avec les données utilisateur uniquement
            try {
              localStorage.setItem('user', JSON.stringify(userWithPoints));
            } catch (storageError) {
              logger.error('❌ authStore.login - Erreur lors du stockage localStorage:', storageError);
              // Ne pas bloquer la connexion si localStorage échoue
            }
            
            // Nettoyer l'ancien token de localStorage si présent (migration)
            if (localStorage.getItem('token')) {
              localStorage.removeItem('token');
            }
            
            logger.log('✅ authStore.login - Connexion réussie');
            
            // ✅ Changer de panier lors de la connexion d'un nouvel utilisateur
            try {
              const cartStore = await import('./cartStore');
              if (cartStore.default) {
                const currentUser = get().user;
                // Si un autre utilisateur était connecté avant, nettoyer son panier
                if (currentUser && currentUser.id && currentUser.id !== response.user.id) {
                  cartStore.default.getState().switchUserCart();
                }
              }
            } catch (error) {
              logger.warn('⚠️ Erreur lors du changement de panier:', error);
            }
            
            // Rafraîchir les points depuis la BDD après la connexion pour s'assurer de la synchronisation
            setTimeout(async () => {
              try {
                const { refreshPoints } = get();
                if (refreshPoints) {
                  await refreshPoints();
                }
              } catch (err) {
                logger.warn('⚠️ authStore.login - Erreur rafraîchissement points:', err);
              }
            }, 500); // Petit délai pour laisser le token être stocké
            
            return { success: true, user: userWithPoints };
          }
          
          logger.error('❌ authStore.login - Échec connexion');
          return { success: false, error: 'Identifiants invalides' };
        } catch (error) {
          logger.error('❌ authStore.login - Exception:', error.message);
          return { success: false, error: error.message || 'Erreur de connexion' };
        }
      },
      
      register: async (userData) => {
        try {
          // ✅ Validation des données avant l'envoi
          if (!userData.email || !userData.email.trim()) {
            return { success: false, error: 'Email requis' };
          }
          if (!userData.password || userData.password.length < 8) {
            return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
          }
          if (!userData.firstName || !userData.firstName.trim()) {
            return { success: false, error: 'Prénom requis' };
          }
          if (!userData.lastName || !userData.lastName.trim()) {
            return { success: false, error: 'Nom requis' };
          }

          // Inscription avec Firebase Auth
          const response = await authServiceFirebase.register(userData);
          
          if (response && response.success) {
            logger.log('✅ Inscription réussie, connexion automatique...');
            // ✅ Login automatique après inscription réussie
            try {
              const loginResult = await get().login(userData.email, userData.password);
              if (loginResult && loginResult.success) {
                logger.log('✅ Connexion automatique réussie après inscription');
                return loginResult;
              } else {
                logger.warn('⚠️ Inscription réussie mais connexion automatique échouée:', loginResult?.error);
                // Retourner succès quand même car le compte est créé
                return { 
                  success: true, 
                  message: 'Compte créé avec succès. Veuillez vous connecter.',
                  warning: loginResult?.error || 'Connexion automatique échouée'
                };
              }
            } catch (loginError) {
              logger.error('❌ Erreur lors de la connexion automatique:', loginError);
              // Retourner succès quand même car le compte est créé
              return { 
                success: true, 
                message: 'Compte créé avec succès. Veuillez vous connecter.',
                warning: 'Connexion automatique échouée'
              };
            }
          }
          
          // Si response n'a pas success: true, retourner l'erreur
          const errorMessage = response?.error || response?.message || 'Échec de l\'inscription';
          logger.error('❌ Inscription échouée:', errorMessage);
          return { success: false, error: errorMessage };
        } catch (error) {
          logger.error('❌ Erreur register store:', error);
          // ✅ Propager le message d'erreur du backend (ex: "Cet email est déjà utilisé")
          return { 
            success: false, 
            error: error.message || error.toString() || 'Erreur d\'inscription' 
          };
        }
      },
      
      logout: async () => {
        const currentUser = get().user;
        const uid = currentUser?.uid || currentUser?.id;
        
        try {
          // Déconnexion Firebase
          await authServiceFirebase.logout();
        } catch (error) {
          logger.warn('⚠️ Erreur lors du logout Firebase:', error);
          // Continuer quand même pour nettoyer le frontend
        }
        
        // ✅ SÉCURITÉ: Marquer la déconnexion comme volontaire
        try {
          localStorage.setItem('logout_voluntary', 'true');
          localStorage.setItem('logout_timestamp', Date.now().toString());
        } catch (e) {
          logger.warn('⚠️ Erreur lors du marquage de déconnexion:', e);
        }
        
        // ✅ Nettoyer le panier de l'utilisateur actuel avant la déconnexion
        try {
          const cartStore = await import('./cartStore');
          if (cartStore.default) {
            cartStore.default.getState().switchUserCart();
            logger.debug('✅ Panier nettoyé lors de la déconnexion');
          }
        } catch (error) {
          logger.warn('⚠️ Erreur lors du nettoyage du panier:', error);
        }
        
        // ✅ SÉCURITÉ: Nettoyer TOUS les caches localStorage
        try {
          // Nettoyer les clés principales
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // ✅ SÉCURITÉ: Nettoyer tous les caches Firestore de cet utilisateur
          if (uid) {
            localStorage.removeItem(`firestore_user_${uid}`);
            localStorage.removeItem(`firestore_user_${uid}_time`);
          }
          
          // ✅ SÉCURITÉ: Nettoyer tous les caches Firestore (par sécurité)
          try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('firestore_user_') || key.startsWith('user_'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
          } catch (e) {
            logger.warn('⚠️ Erreur lors du nettoyage des caches Firestore:', e);
          }
        } catch (e) {
          logger.warn('⚠️ Erreur lors du nettoyage localStorage:', e);
        }
        
        // ✅ Nettoyer aussi la clé de panier invité
        try {
          sessionStorage.removeItem('guest-cart-key');
        } catch (e) {
          // Ignorer
        }
        
        // ✅ SÉCURITÉ: Réinitialiser le store immédiatement
        set({ user: null, isAuthenticated: false, role: null, token: null });
        
        logger.log('✅ authStore.logout - Déconnexion complète et sécurisée');
        
        // ✅ SÉCURITÉ: Forcer un petit délai pour s'assurer que le flag est bien défini
        // avant que Firebase Auth ne tente de restaurer la session
        await new Promise(resolve => setTimeout(resolve, 100));
      },
      
      updateProfile: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          // Mettre à jour avec les nouvelles données (peut être un objet user complet ou des updates partielles)
          const updatedUser = updates.id ? updates : { ...currentUser, ...updates };
          
          // S'assurer que loyalty_points et points sont synchronisés
          if (updatedUser.loyalty_points !== undefined) {
            updatedUser.points = updatedUser.loyalty_points;
          } else if (updatedUser.points !== undefined) {
            updatedUser.loyalty_points = updatedUser.points;
          }
          
          // S'assurer que first_name et last_name sont bien présents
          if (!updatedUser.first_name && updatedUser.name) {
            const nameParts = updatedUser.name.split(' ');
            updatedUser.first_name = nameParts[0] || '';
            updatedUser.last_name = nameParts.slice(1).join(' ') || '';
          }
          
          // S'assurer que name est synchronisé avec first_name et last_name
          if (updatedUser.first_name || updatedUser.last_name) {
            updatedUser.name = `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.email || '';
          }
          
          set({ user: updatedUser });
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
      
      // Rafraîchir les points depuis Supabase (source de vérité)
      refreshPoints: async () => {
        try {
          const currentUser = get().user;
          if (!currentUser || !currentUser.email || currentUser.isGuest) {
            return null;
          }
          
          // ✅ NOUVEAU: Récupérer depuis Supabase au lieu de Firestore
          const supabaseService = await import('../services/supabaseService');
          const supabaseResult = await supabaseService.default.getUserByEmail(currentUser.email);
          
          if (supabaseResult.success && supabaseResult.data) {
            const supabaseData = supabaseResult.data;
            const loyaltyPoints = supabaseData.loyalty_points || 0;
            
            // ✅ Mettre à jour avec toutes les données utilisateur depuis Supabase
            const updatedUser = {
              ...currentUser,
              id: supabaseData.id || currentUser.id,
              firstName: supabaseData.first_name || currentUser.firstName,
              lastName: supabaseData.last_name || currentUser.lastName,
              name: `${supabaseData.first_name || ''} ${supabaseData.last_name || ''}`.trim() || currentUser.name,
              role: supabaseData.role || currentUser.role,
              points: loyaltyPoints,
              loyalty_points: loyaltyPoints,
              phone: supabaseData.phone || currentUser.phone
            };
            set({ user: updatedUser });
            // Mettre à jour aussi localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            logger.log('✅ refreshPoints - Points mis à jour depuis Supabase:', loyaltyPoints);
            return updatedUser;
          } else {
            logger.warn('⚠️ refreshPoints - Utilisateur non trouvé dans Supabase');
            // Ne pas propager l'erreur pour éviter de bloquer l'interface
            return currentUser;
          }
        } catch (error) {
          logger.error('❌ Erreur refreshPoints:', error);
          logger.error('   Message:', error.message);
          // Ne pas propager l'erreur pour éviter de bloquer l'interface
          const currentUser = get().user;
          return currentUser;
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
          logger.error('Erreur loginAsGuest store:', error);
          return { success: false, error: error.message || 'Erreur de connexion invité' };
        }
      },
      
      // Restaurer l'état d'authentification au chargement de la page - OPTIMISÉ
      restoreAuth: async () => {
        try {
          // ✅ OPTIMISATION: Vérifier localStorage d'abord (instantané)
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const cachedUser = JSON.parse(userStr);
              if (cachedUser && cachedUser.role !== 'kiosk' && !cachedUser.isGuest) {
                // Vérifier si un utilisateur Firebase est connecté (vérification rapide)
                const firebaseUser = firebaseService.getCurrentUser();
                if (firebaseUser && firebaseUser.uid === cachedUser.uid) {
                  // ✅ OPTIMISATION: Restaurer depuis le cache immédiatement
                  set({ 
                    user: cachedUser, 
                    isAuthenticated: true, 
                    role: cachedUser.role,
                    token: null
                  });
                  
                  // Mettre à jour depuis Firestore en arrière-plan (sans bloquer)
                  firebaseService.getDocument('users', firebaseUser.uid).then(userData => {
                    if (userData) {
                      const updatedUser = {
                        ...cachedUser,
                        ...userData,
                        points: userData.loyalty_points || userData.points || 0,
                        loyalty_points: userData.loyalty_points || userData.points || 0
                      };
                      set({ user: updatedUser });
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                      // Mettre en cache Firestore
                      try {
                        localStorage.setItem(`firestore_user_${firebaseUser.uid}`, JSON.stringify(userData));
                        localStorage.setItem(`firestore_user_${firebaseUser.uid}_time`, Date.now().toString());
                      } catch (e) {
                        // Ignorer
                      }
                    }
                  }).catch(err => {
                    logger.warn('⚠️ Erreur mise à jour Firestore en arrière-plan:', err);
                  });
                  
                  return { success: true, user: cachedUser };
                }
              }
            } catch (parseError) {
              // Ignorer les erreurs de parsing
            }
          }
          
          // ✅ CORRECTION: Attendre un peu que Firebase Auth s'initialise
          // Firebase Auth peut prendre quelques millisecondes à s'initialiser
          let firebaseUser = firebaseService.getCurrentUser();
          
          // Si Firebase Auth n'est pas encore prêt, attendre un peu
          if (!firebaseUser && userStr) {
            // Attendre jusqu'à 1 seconde pour que Firebase s'initialise
            for (let i = 0; i < 10; i++) {
              await new Promise(resolve => setTimeout(resolve, 100));
              firebaseUser = firebaseService.getCurrentUser();
              if (firebaseUser) break;
            }
          }
          
          if (!firebaseUser) {
            if (!userStr) {
              set({ user: null, isAuthenticated: false, role: null, token: null });
              return { success: false, error: 'Aucun utilisateur trouvé' };
            }
            
            // ✅ CORRECTION: Si on a des données en cache mais Firebase n'est pas prêt,
            // garder l'utilisateur connecté temporairement (Firebase peut s'initialiser plus tard)
            try {
              const cachedUser = JSON.parse(userStr);
              if (cachedUser && cachedUser.uid && cachedUser.role !== 'kiosk' && !cachedUser.isGuest) {
                logger.warn('⚠️ Firebase Auth pas encore initialisé, utilisation du cache temporaire');
                set({ 
                  user: cachedUser, 
                  isAuthenticated: true, 
                  role: cachedUser.role,
                  token: null
                });
                // Firebase s'initialisera via onAuthStateChange dans App.jsx
                return { success: true, user: cachedUser };
              }
            } catch (e) {
              // Ignorer
            }
            
            // Seulement si vraiment aucune donnée valide, déconnecter
            localStorage.removeItem('user');
            set({ user: null, isAuthenticated: false, role: null, token: null });
            return { success: false, error: 'Session expirée' };
          }
          
          // ✅ OPTIMISATION: Vérifier le cache Firestore d'abord
          const cacheKey = `firestore_user_${firebaseUser.uid}`;
          let userData = null;
          try {
            const cached = localStorage.getItem(cacheKey);
            const cacheTime = localStorage.getItem(`${cacheKey}_time`);
            if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 300000) {
              userData = JSON.parse(cached);
              logger.log('⚡ authStore.restoreAuth - Utilisation du cache Firestore');
            }
          } catch (e) {
            // Ignorer
          }
          
          // Si pas de cache, récupérer depuis Firestore
          if (!userData) {
            try {
              userData = await firebaseService.getDocument('users', firebaseUser.uid);
              
              // Mettre en cache
              if (userData) {
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(userData));
                  localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
                } catch (e) {
                  // Ignorer
                }
              }
            } catch (firestoreError) {
              // ✅ CORRECTION: Si Firestore est hors ligne, utiliser les données localStorage
              logger.warn('⚠️ Firestore hors ligne, utilisation du cache localStorage:', firestoreError);
              
              // Essayer de récupérer depuis localStorage 'user' si disponible
              if (userStr) {
                try {
                  const cachedUser = JSON.parse(userStr);
                  if (cachedUser && cachedUser.uid === firebaseUser.uid) {
                    // Utiliser les données en cache même si Firestore est hors ligne
                    set({ 
                      user: cachedUser, 
                      isAuthenticated: true, 
                      role: cachedUser.role,
                      token: null
                    });
                    return { success: true, user: cachedUser };
                  }
                } catch (e) {
                  // Ignorer
                }
              }
            }
          }
          
          // ✅ CORRECTION: Si pas de userData mais Firebase Auth est connecté, utiliser les données de base
          if (!userData) {
            // Vérifier si on a des données dans localStorage 'user'
            if (userStr) {
              try {
                const cachedUser = JSON.parse(userStr);
                if (cachedUser && cachedUser.uid === firebaseUser.uid) {
                  logger.warn('⚠️ Firestore indisponible, utilisation des données en cache');
                  set({ 
                    user: cachedUser, 
                    isAuthenticated: true, 
                    role: cachedUser.role,
                    token: null
                  });
                  return { success: true, user: cachedUser };
                }
              } catch (e) {
                // Ignorer
              }
            }
            
            // Si vraiment aucune donnée, créer un utilisateur minimal depuis Firebase Auth
            logger.warn('⚠️ Utilisateur Firebase connecté mais pas de données Firestore, création profil minimal');
            const minimalUser = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              name: firebaseUser.displayName || '',
              role: 'client', // Par défaut
              loyalty_points: 0,
              points: 0,
              emailVerified: firebaseUser.emailVerified || false,
              photoURL: firebaseUser.photoURL || null
            };
            
            set({ 
              user: minimalUser, 
              isAuthenticated: true, 
              role: 'client',
              token: null
            });
            
            try {
              localStorage.setItem('user', JSON.stringify(minimalUser));
            } catch (e) {
              // Ignorer
            }
            
            return { success: true, user: minimalUser };
          }
          
          // ✅ SÉCURITÉ: Ne pas restaurer les comptes kiosk
          if (userData.role === 'kiosk') {
            logger.warn('⚠️ authStore.restoreAuth - Compte kiosk détecté, déconnexion');
            await authServiceFirebase.logout();
            set({ user: null, isAuthenticated: false, role: null, token: null });
            return { success: false, error: 'Les comptes kiosk ne peuvent pas être utilisés dans l\'application principale' };
          }
          
          // Construire l'objet utilisateur
          const user = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            name: userData.displayName || firebaseUser.displayName || '',
            role: userData.role || 'client',
            loyalty_points: userData.loyalty_points || userData.points || 0,
            points: userData.points || userData.loyalty_points || 0,
            emailVerified: firebaseUser.emailVerified,
            photoURL: firebaseUser.photoURL || userData.photoURL,
            phone: userData.phone || null,
            address: userData.address || null
          };
          
          set({ 
            user, 
            isAuthenticated: true, 
            role: user.role,
            token: null
          });
          
          localStorage.setItem('user', JSON.stringify(user));
          
          return { success: true, user };
        } catch (error) {
          logger.error('❌ authStore.restoreAuth - Exception:', error);
          set({ user: null, isAuthenticated: false, role: null, token: null });
          return { success: false, error: error.message || 'Erreur de restauration' };
        }
      }
    })
);

export default useAuthStore;

