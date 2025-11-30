import supabaseClient from './supabaseClient';
import logger from '../utils/logger';

/**
 * Service dédié aux opérations d'authentification côté Supabase.
 * Respecte le principe de responsabilité unique (SRP) en isolant:
 *  - La gestion des sessions (logout)
 *  - Les mutations du profil utilisateur
 *  - Les opérations de récupération (reset password)
 */

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  const loyaltyPoints = user.loyalty_points ?? user.points ?? 0;

  return {
    ...user,
    first_name: firstName,
    last_name: lastName,
    name: user.name || `${firstName} ${lastName}`.trim(),
    loyalty_points: loyaltyPoints,
    points: loyaltyPoints,
  };
};

const mapUpdatesToSupabase = (updates = {}) => {
  const payload = {};
  const mapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    phoneNumber: 'phone',
    loyaltyPoints: 'loyalty_points',
    points: 'loyalty_points',
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || key === 'id' || key === 'uid') {
      return;
    }

    if (mapping[key]) {
      payload[mapping[key]] = value;
      return;
    }

    payload[key] = value;
  });

  payload.updated_at = new Date().toISOString();
  return payload;
};

const buildResetRedirectUrl = () => {
  const envUrl =
    import.meta?.env?.VITE_AUTH_RESET_URL ||
    import.meta?.env?.VITE_APP_URL ||
    import.meta?.env?.VITE_PUBLIC_URL ||
    null;

  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/reset-password`;
  }

  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/reset-password`;
  }

  return 'http://localhost:5173/reset-password';
};

const authServiceSupabase = {
  async logout() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error) {
      logger.error('❌ authServiceSupabase.logout - Erreur:', error);
      return { success: false, error: error.message || 'Erreur lors de la déconnexion' };
    }
  },

  async updateProfile(userId, updates = {}) {
    if (!userId) {
      return { success: false, error: 'Identifiant utilisateur requis' };
    }

    const payload = mapUpdatesToSupabase(updates);
    if (Object.keys(payload).length === 1 && payload.updated_at) {
      return { success: false, error: 'Aucune donnée à mettre à jour' };
    }

    try {
      const { data, error } = await supabaseClient
        .from('users')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, user: normalizeUser(data) };
    } catch (error) {
      logger.error('❌ authServiceSupabase.updateProfile - Erreur:', error);
      return { success: false, error: error.message || 'Erreur lors de la mise à jour' };
    }
  },

  async resetPassword(email) {
    if (!email) {
      return { success: false, error: 'Email requis' };
    }

    try {
      const redirectTo = buildResetRedirectUrl();
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        throw error;
      }
      return {
        success: true,
        message: 'Email de réinitialisation envoyé',
      };
    } catch (error) {
      logger.error('❌ authServiceSupabase.resetPassword - Erreur:', error);
      return { success: false, error: error.message || 'Erreur lors de la réinitialisation' };
    }
  },
};

export default authServiceSupabase;
