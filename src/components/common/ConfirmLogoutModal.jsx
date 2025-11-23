import React from 'react';
import Modal from './Modal';
import Button from './Button';
import useUIStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';

/**
 * Modal de Confirmation de Déconnexion
 * Version simple sans icône pour les clients
 * Version avec informations utilisateur pour admin et manager
 */
const ConfirmLogoutModal = () => {
  const showLogoutConfirm = useUIStore((state) => state.showLogoutConfirm);
  const setShowLogoutConfirm = useUIStore((state) => state.setShowLogoutConfirm);
  const { logout, user } = useAuth();

  const handleConfirm = async () => {
    setShowLogoutConfirm(false);
    try {
      const result = await logout();
      if (!result.success) {
        console.error('❌ Erreur lors de la déconnexion:', result.error);
        // Afficher un message d'erreur si nécessaire
        alert('Erreur lors de la déconnexion. Veuillez rafraîchir la page.');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      alert('Erreur lors de la déconnexion. Veuillez rafraîchir la page.');
    }
  };

  const handleCancel = () => {
    setShowLogoutConfirm(false);
  };

  // Ne pas afficher si pas d'utilisateur ou si la modale n'est pas demandée
  if (!user || !showLogoutConfirm) {
    return null;
  }

  const isClient = user.role === 'client';
  const isManager = user.role === 'manager' || user.role === 'admin';

  return (
    <Modal
      isOpen={showLogoutConfirm}
      onClose={handleCancel}
      title=""
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={true}
      variant="glass"
    >
      {isClient ? (
        // Version simple pour les clients - Sans icône ni informations utilisateur
        <div className="flex flex-col space-y-6 py-4">
          {/* Titre */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Confirmer la déconnexion
            </h3>
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={handleCancel}
              className="border border-slate-300 hover:bg-slate-100"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleConfirm}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      ) : isManager ? (
        // Version avec informations pour admin et manager
        <div className="flex flex-col space-y-6 py-4">
          {/* Titre */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Confirmer la déconnexion
            </h3>
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
          </div>

          {/* Informations utilisateur */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {user.name || 'Utilisateur'}
                </p>
                <p className="text-xs text-slate-600 truncate">{user.email}</p>
                <p className="text-xs text-slate-500 capitalize mt-1">
                  {user.role === 'admin' ? 'Administrateur' : 'Manager'}
                </p>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={handleCancel}
              className="border border-slate-300 hover:bg-slate-100"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleConfirm}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ConfirmLogoutModal;
