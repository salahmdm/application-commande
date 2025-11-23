/**
 * Service d'authentification Supabase
 * Remplace Firebase Authentication par Supabase Auth
 * ✅ MIGRATION COMPLÈTE: Tous les utilisateurs sont maintenant dans Supabase
 */
import supabaseClient from './supabaseClient';
import supabaseService from './supabaseService';
import logger from '../utils/logger';

const authServiceSupabase = {
  /**
   * Login - Connexion avec Supabase Auth
   */
  async login(email, password) {
    try {
      logger.log('🔐 authServiceSupabase.login - Début');
      
      // Connexion avec Supabase Auth
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        logger.error('❌ authServiceSupabase.login - Erreur Supabase:', error);
        
        // Améliorer les messages d'erreur
        let errorMessage = 'Erreur de connexion';
        
        // Gérer les codes d'erreur Supabase
        if (error.code === 'invalid_credentials' || error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect. Si vous étiez un utilisateur Firebase, votre compte doit être migré vers Supabase. Utilisez "Mot de passe oublié" pour créer votre compte Supabase.';
        } else if (error.code === 'email_not_confirmed' || error.message?.includes('Email not confirmed')) {
          errorMessage = 'Votre email n\'est pas encore confirmé. Vérifiez votre boîte de réception et cliquez sur le lien de confirmation avant de vous connecter.';
        } else if (error.message?.includes('Email rate limit exceeded')) {
          errorMessage = 'Trop de tentatives. Veuillez attendre quelques minutes.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (data.user && data.session) {
        logger.log('✅ authServiceSupabase.login - Connexion Supabase réussie');
        
        // Récupérer les données utilisateur depuis la table users
        const userResult = await supabaseService.getUserByEmail(data.user.email);
        
        if (!userResult.success || !userResult.data) {
          logger.warn('⚠️ authServiceSupabase.login - Utilisateur non trouvé dans la table users, création...');
          
          // Créer l'utilisateur dans la table users si nécessaire
          const newUser = {
            email: data.user.email,
            password_hash: '$2b$10$SUPABASE_AUTH_USER', // Hash spécial pour Supabase Auth
            first_name: data.user.user_metadata?.first_name || data.user.user_metadata?.firstName || '',
            last_name: data.user.user_metadata?.last_name || data.user.user_metadata?.lastName || '',
            role: 'client', // Rôle par défaut
            loyalty_points: 0,
            is_active: 1,
            email_verified: data.user.email_confirmed_at ? 1 : 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: createdUser, error: createError } = await supabaseClient
            .from('users')
            .insert(newUser)
            .select()
            .single();
          
          if (createError && createError.code !== '23505') { // 23505 = duplicate key
            logger.error('❌ Erreur création utilisateur:', createError);
          } else if (createdUser) {
            logger.log('✅ Utilisateur créé dans la table users');
          }
        }
        
        // Récupérer à nouveau les données utilisateur
        const finalUserResult = await supabaseService.getUserByEmail(data.user.email);
        const userData = finalUserResult.data || {};
        
        // Construire l'objet utilisateur
        const user = {
          id: userData.id || data.user.id,
          uid: data.user.id, // UID Supabase Auth
          email: data.user.email,
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || data.user.email,
          role: userData.role || 'client',
          loyalty_points: userData.loyalty_points || 0,
          points: userData.loyalty_points || 0,
          emailVerified: !!data.user.email_confirmed_at,
          photoURL: userData.avatar_url || data.user.user_metadata?.avatar_url || null,
          phone: userData.phone || null,
          address: null
        };
        
        // Stocker dans localStorage
        try {
          localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
          logger.warn('⚠️ Erreur localStorage:', e);
        }
        
        logger.log('✅ authServiceSupabase.login - Connexion réussie');
        return {
          success: true,
          user,
          session: data.session
        };
      }
      
      throw new Error('Échec de la connexion');
    } catch (error) {
      logger.error('❌ authServiceSupabase.login - Erreur:', error);
      throw error;
    }
  },

  /**
   * Register - Inscription avec Supabase Auth
   */
  async register(userData) {
    try {
      logger.log('📝 authServiceSupabase.register - Début');
      
      // Validation
      if (!userData.email || !userData.password) {
        throw new Error('Email et mot de passe requis');
      }
      
      if (userData.password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }
      
      // Inscription avec Supabase Auth
      const { data, error } = await supabaseClient.auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            phone: userData.phone || null
          }
        }
      });

      if (error) {
        logger.error('❌ authServiceSupabase.register - Erreur Supabase:', error);
        
        // Améliorer les messages d'erreur
        let errorMessage = 'Erreur d\'inscription';
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          errorMessage = 'Cet email est déjà utilisé';
        } else if (error.message.includes('weak password')) {
          errorMessage = 'Le mot de passe est trop faible';
        } else if (error.message.includes('invalid email')) {
          errorMessage = 'Email invalide';
        }
        
        throw new Error(errorMessage);
      }

      if (data.user) {
        logger.log('✅ authServiceSupabase.register - Inscription Supabase réussie');
        
        // Créer l'utilisateur dans la table users
        const newUser = {
          email: data.user.email,
          password_hash: '$2b$10$SUPABASE_AUTH_USER', // Hash spécial pour Supabase Auth
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          phone: userData.phone || null,
          role: 'client', // Rôle par défaut
          loyalty_points: 0,
          is_active: 1,
          email_verified: data.user.email_confirmed_at ? 1 : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: createdUser, error: createError } = await supabaseClient
          .from('users')
          .insert(newUser)
          .select()
          .single();
        
        if (createError && createError.code !== '23505') {
          logger.error('❌ Erreur création utilisateur dans table users:', createError);
          // Continuer quand même, l'utilisateur sera créé lors de la prochaine connexion
        } else if (createdUser) {
          logger.log('✅ Utilisateur créé dans la table users');
        }
        
        // Construire l'objet utilisateur
        const user = {
          id: createdUser?.id || data.user.id,
          uid: data.user.id,
          email: data.user.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || data.user.email,
          role: 'client',
          loyalty_points: 0,
          points: 0,
          emailVerified: !!data.user.email_confirmed_at,
          photoURL: null,
          phone: userData.phone || null
        };
        
        // Stocker dans localStorage
        try {
          localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
          logger.warn('⚠️ Erreur localStorage:', e);
        }
        
        logger.log('✅ authServiceSupabase.register - Inscription réussie');
        
        // Vérifier si l'email est confirmé
        const emailConfirmed = !!data.user.email_confirmed_at;
        
        return {
          success: true,
          user,
          userId: data.user.id,
          emailConfirmed,
          requiresEmailConfirmation: !emailConfirmed
        };
      }
      
      throw new Error('Échec de l\'inscription');
    } catch (error) {
      logger.error('❌ authServiceSupabase.register - Erreur:', error);
      throw error;
    }
  },

  /**
   * Logout - Déconnexion
   */
  async logout() {
    try {
      logger.log('🚪 authServiceSupabase.logout - Début');
      
      // Déconnexion Supabase
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        logger.error('❌ authServiceSupabase.logout - Erreur:', error);
        throw error;
      }
      
      // Nettoyer localStorage
      try {
        localStorage.removeItem('user');
        localStorage.setItem('logout_voluntary', 'true');
        localStorage.setItem('logout_timestamp', Date.now().toString());
      } catch (e) {
        logger.warn('⚠️ Erreur localStorage:', e);
      }
      
      logger.log('✅ authServiceSupabase.logout - Déconnexion réussie');
      return { success: true };
    } catch (error) {
      logger.error('❌ authServiceSupabase.logout - Erreur:', error);
      throw error;
    }
  },

  /**
   * Update Profile - Mettre à jour le profil
   */
  async updateProfile(userId, updates) {
    try {
      logger.log('🔄 authServiceSupabase.updateProfile - Début');
      
      // Mettre à jour dans Supabase Auth (metadata)
      const { error: authError } = await supabaseClient.auth.updateUser({
        data: {
          first_name: updates.firstName || updates.first_name,
          last_name: updates.lastName || updates.last_name,
          phone: updates.phone
        }
      });
      
      if (authError) {
        logger.error('❌ Erreur mise à jour Supabase Auth:', authError);
      }
      
      // Mettre à jour dans la table users
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.photoURL !== undefined) updateData.avatar_url = updates.photoURL;
      
      const userResult = await supabaseService.updateUser(userId, updateData);
      
      if (!userResult.success) {
        throw new Error(userResult.error || 'Erreur mise à jour profil');
      }
      
      // Récupérer les données mises à jour
      const currentUser = supabaseClient.auth.getUser();
      if (currentUser.data?.user?.email) {
        const updatedUserResult = await supabaseService.getUserByEmail(currentUser.data.user.email);
        if (updatedUserResult.success && updatedUserResult.data) {
          const userData = updatedUserResult.data;
          const user = {
            id: userData.id,
            uid: currentUser.data.user.id,
            email: userData.email,
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email,
            role: userData.role || 'client',
            loyalty_points: userData.loyalty_points || 0,
            points: userData.loyalty_points || 0,
            emailVerified: !!currentUser.data.user.email_confirmed_at,
            photoURL: userData.avatar_url || null,
            phone: userData.phone || null
          };
          
          try {
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            logger.warn('⚠️ Erreur localStorage:', e);
          }
          
          logger.log('✅ authServiceSupabase.updateProfile - Profil mis à jour');
          return {
            success: true,
            user
          };
        }
      }
      
      throw new Error('Erreur récupération données utilisateur');
    } catch (error) {
      logger.error('❌ authServiceSupabase.updateProfile - Erreur:', error);
      throw error;
    }
  },

  /**
   * Reset Password - Réinitialiser le mot de passe
   */
  async resetPassword(email) {
    try {
      logger.log('📧 authServiceSupabase.resetPassword - Début');
      
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        logger.error('❌ authServiceSupabase.resetPassword - Erreur:', error);
        throw error;
      }
      
      logger.log('✅ authServiceSupabase.resetPassword - Email envoyé');
      return { success: true };
    } catch (error) {
      logger.error('❌ authServiceSupabase.resetPassword - Erreur:', error);
      throw error;
    }
  },

  /**
   * On Auth State Change - Écouter les changements d'état d'authentification
   */
  onAuthStateChange(callback) {
    logger.log('👂 authServiceSupabase.onAuthStateChange - Écoute activée');
    
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      logger.log('🔄 authServiceSupabase.onAuthStateChange - Événement:', event);
      
      // ✅ SÉCURITÉ: Vérifier le flag de déconnexion volontaire AVANT de traiter l'événement
      const logoutVoluntary = localStorage.getItem('logout_voluntary');
      const logoutTimestamp = localStorage.getItem('logout_timestamp');
      
      if (logoutVoluntary === 'true' && logoutTimestamp) {
        const logoutTime = parseInt(logoutTimestamp, 10);
        const oneHourAgo = Date.now() - 3600000; // 1 heure
        
        if (logoutTime > oneHourAgo) {
          logger.log('🔒 authServiceSupabase.onAuthStateChange - Déconnexion volontaire active, ignorer l\'événement:', event);
          // Si c'est un événement SIGNED_IN, l'ignorer complètement
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            callback(null);
            return;
          }
        } else {
          // Le flag est trop ancien, le nettoyer
          localStorage.removeItem('logout_voluntary');
          localStorage.removeItem('logout_timestamp');
        }
      }
      
      if (session?.user) {
        // ✅ SÉCURITÉ: Double vérification du flag avant de restaurer la session
        const currentLogoutVoluntary = localStorage.getItem('logout_voluntary');
        if (currentLogoutVoluntary === 'true') {
          logger.log('🔒 authServiceSupabase.onAuthStateChange - Déconnexion volontaire détectée, ignorer la session');
          callback(null);
          return;
        }
        
        // Récupérer les données utilisateur depuis la table users
        const userResult = await supabaseService.getUserByEmail(session.user.email);
        const userData = userResult.data || {};
        
        const user = {
          id: userData.id || session.user.id,
          uid: session.user.id,
          email: session.user.email,
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || session.user.email,
          role: userData.role || 'client',
          loyalty_points: userData.loyalty_points || 0,
          points: userData.loyalty_points || 0,
          emailVerified: !!session.user.email_confirmed_at,
          photoURL: userData.avatar_url || null,
          phone: userData.phone || null
        };
        
        callback(user);
      } else {
        callback(null);
      }
    });
    
    // Retourner une fonction pour se désabonner
    return () => {
      subscription.unsubscribe();
    };
  },

  /**
   * Get Current User - Obtenir l'utilisateur actuel
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      
      if (error || !user) {
        return null;
      }
      
      // Récupérer les données depuis la table users
      const userResult = await supabaseService.getUserByEmail(user.email);
      const userData = userResult.data || {};
      
      return {
        id: userData.id || user.id,
        uid: user.id,
        email: user.email,
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user.email,
        role: userData.role || 'client',
        loyalty_points: userData.loyalty_points || 0,
        points: userData.loyalty_points || 0,
        emailVerified: !!user.email_confirmed_at,
        photoURL: userData.avatar_url || null,
        phone: userData.phone || null
      };
    } catch (error) {
      logger.error('❌ authServiceSupabase.getCurrentUser - Erreur:', error);
      return null;
    }
  }
};

export default authServiceSupabase;

