import { create } from 'zustand';
// ⚠️ PERSIST TEMPORAIREMENT DÉSACTIVÉ pour debug "React is null"
// import { persist } from 'zustand/middleware';
// ✅ Supabase Authentication activé (migration complète)
import authServiceSupabase from '../services/authServiceSupabase';
import supabaseService from '../services/supabaseService';
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
          // Connexion avec Supabase Auth
          const response = await authServiceSupabase.login(email, password);
          
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

          // Inscription avec Supabase Auth
          const response = await authServiceSupabase.register(userData);
          
          if (response && response.success) {
            // ✅ Vérifier si l'email doit être confirmé
            if (response.requiresEmailConfirmation || !response.emailConfirmed) {
              logger.log('⚠️ Inscription réussie mais email non confirmé');
              return {
                success: true,
                user: response.user,
                requiresEmailConfirmation: true,
                message: 'Compte créé avec succès ! Vérifiez votre boîte email et cliquez sur le lien de confirmation avant de vous connecter.'
              };
            }
            
            logger.log('✅ Inscription réussie, connexion automatique...');
            // ✅ Login automatique après inscription réussie (seulement si email confirmé)
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
                  user: response.user,
                  message: 'Compte créé avec succès. Veuillez vous connecter.',
                  warning: loginResult?.error || 'Connexion automatique échouée'
                };
              }
            } catch (loginError) {
              logger.error('❌ Erreur lors de la connexion automatique:', loginError);
              // Retourner succès quand même car le compte est créé
              return { 
                success: true, 
                user: response.user,
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
          // Déconnexion Supabase
          await authServiceSupabase.logout();
        } catch (error) {
          logger.warn('⚠️ Erreur lors du logout Supabase:', error);
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
        // avant que Supabase Auth ne tente de restaurer la session
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // ✅ SÉCURITÉ: Vérifier une dernière fois que le store est bien vide
        const finalState = get();
        if (finalState.user || finalState.isAuthenticated) {
          logger.warn('⚠️ authStore.logout - Le store n\'est pas vide après déconnexion, forcer la réinitialisation');
          set({ user: null, isAuthenticated: false, role: null, token: null });
        }
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
      
      // Rafraîchir les points depuis Supabase
      refreshPoints: async () => {
        try {
          const currentUser = get().user;
          if (!currentUser || !currentUser.email || currentUser.isGuest) {
            return null;
          }
          
          // Récupérer le profil utilisateur depuis Supabase
          const userResult = await supabaseService.getUserByEmail(currentUser.email);
          
          if (userResult.success && userResult.data) {
            const userData = userResult.data;
            // Mettre à jour les points avec les valeurs de Supabase
            const loyaltyPoints = userData.loyalty_points || 0;
            
            // ✅ Mettre à jour avec toutes les données utilisateur
            const updatedUser = {
              ...currentUser,
              ...userData,
              points: loyaltyPoints,
              loyalty_points: loyaltyPoints
            };
            set({ user: updatedUser });
            // Mettre à jour aussi localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
          } else {
            logger.warn('⚠️ refreshPoints - Utilisateur non trouvé dans Supabase');
            return null;
          }
        } catch (error) {
          logger.error('❌ Erreur refreshPoints:', error);
          logger.error('   Message:', error.message);
          logger.error('   Stack:', error.stack);
          // Ne pas propager l'erreur pour éviter de bloquer l'interface
          return null;
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
      
      // Restaurer l'état d'authentification au chargement de la page - OPTIMISÉ pour Supabase
      restoreAuth: async () => {
        try {
          // ✅ OPTIMISATION: Vérifier localStorage d'abord (instantané)
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const cachedUser = JSON.parse(userStr);
              if (cachedUser && cachedUser.role !== 'kiosk' && !cachedUser.isGuest) {
                // Vérifier si un utilisateur Supabase est connecté (vérification rapide)
                const supabaseUser = await authServiceSupabase.getCurrentUser();
                if (supabaseUser && supabaseUser.uid === cachedUser.uid) {
                  // ✅ OPTIMISATION: Restaurer depuis le cache immédiatement
                  set({ 
                    user: cachedUser, 
                    isAuthenticated: true, 
                    role: cachedUser.role,
                    token: null
                  });
                  
                  // Mettre à jour depuis Supabase en arrière-plan (sans bloquer)
                  supabaseService.getUserByEmail(supabaseUser.email).then(userResult => {
                    if (userResult.success && userResult.data) {
                      const userData = userResult.data;
                      const updatedUser = {
                        ...cachedUser,
                        id: userData.id,
                        firstName: userData.first_name || cachedUser.firstName,
                        lastName: userData.last_name || cachedUser.lastName,
                        role: userData.role || cachedUser.role,
                        loyalty_points: userData.loyalty_points || cachedUser.loyalty_points,
                        points: userData.loyalty_points || cachedUser.points,
                        phone: userData.phone || cachedUser.phone,
                        photoURL: userData.avatar_url || cachedUser.photoURL
                      };
                      set({ user: updatedUser });
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                  }).catch(err => {
                    logger.warn('⚠️ Erreur mise à jour Supabase en arrière-plan:', err);
                  });
                  
                  return { success: true, user: cachedUser };
                }
              }
            } catch (parseError) {
              // Ignorer les erreurs de parsing
            }
          }
          
          // Récupérer l'utilisateur Supabase actuel
          const supabaseUser = await authServiceSupabase.getCurrentUser();
          
          if (!supabaseUser) {
            if (!userStr) {
              set({ user: null, isAuthenticated: false, role: null, token: null });
              return { success: false, error: 'Aucun utilisateur trouvé' };
            }
            
            // Si on a des données en cache mais Supabase n'est pas connecté, utiliser le cache temporairement
            try {
              const cachedUser = JSON.parse(userStr);
              if (cachedUser && cachedUser.uid && cachedUser.role !== 'kiosk' && !cachedUser.isGuest) {
                logger.warn('⚠️ Supabase Auth pas encore initialisé, utilisation du cache temporaire');
                set({ 
                  user: cachedUser, 
                  isAuthenticated: true, 
                  role: cachedUser.role,
                  token: null
                });
                // Supabase s'initialisera via onAuthStateChange dans App.jsx
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
          
          // Récupérer les données utilisateur depuis Supabase
          const userResult = await supabaseService.getUserByEmail(supabaseUser.email);
          
          if (!userResult.success || !userResult.data) {
            // Si pas de données dans Supabase, utiliser les données de base
            if (userStr) {
              try {
                const cachedUser = JSON.parse(userStr);
                if (cachedUser && cachedUser.uid === supabaseUser.uid) {
                  logger.warn('⚠️ Utilisateur Supabase connecté mais pas dans table users, utilisation du cache');
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
            
            // Si vraiment aucune donnée, créer un utilisateur minimal
            logger.warn('⚠️ Utilisateur Supabase connecté mais pas de données, création profil minimal');
            const minimalUser = {
              id: supabaseUser.uid,
              uid: supabaseUser.uid,
              email: supabaseUser.email,
              firstName: supabaseUser.firstName || '',
              lastName: supabaseUser.lastName || '',
              name: supabaseUser.name || supabaseUser.email,
              role: 'client',
              loyalty_points: 0,
              points: 0,
              emailVerified: supabaseUser.emailVerified || false,
              photoURL: supabaseUser.photoURL || null
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
          
          const userData = userResult.data;
          
          // ✅ SÉCURITÉ: Ne pas restaurer les comptes kiosk
          if (userData.role === 'kiosk') {
            logger.warn('⚠️ authStore.restoreAuth - Compte kiosk détecté, déconnexion');
            await authServiceSupabase.logout();
            set({ user: null, isAuthenticated: false, role: null, token: null });
            return { success: false, error: 'Les comptes kiosk ne peuvent pas être utilisés dans l\'application principale' };
          }
          
          // Construire l'objet utilisateur
          const user = {
            id: userData.id,
            uid: supabaseUser.uid,
            email: supabaseUser.email,
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || supabaseUser.email,
            role: userData.role || 'client',
            loyalty_points: userData.loyalty_points || 0,
            points: userData.loyalty_points || 0,
            emailVerified: supabaseUser.emailVerified || false,
            photoURL: userData.avatar_url || supabaseUser.photoURL || null,
            phone: userData.phone || null,
            address: null
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

