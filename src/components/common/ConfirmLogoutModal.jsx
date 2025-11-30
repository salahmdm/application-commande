import React, { useState } from 'react';
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
  const { showLogoutConfirm, setShowLogoutConfirm } = useUIStore((state) => ({
    showLogoutConfirm: state.showLogoutConfirm,
    setShowLogoutConfirm: state.setShowLogoutConfirm,
  }));
  const { logout, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
      setErrorMessage(
        "Une erreur est survenue lors de la déconnexion. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
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
  const shouldShowClientView = isClient || (!isClient && !isManager);

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
      {shouldShowClientView ? (
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

          {errorMessage && (
            <div
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleCancel}
              className="h-12 flex-1 bg-gray-500 hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleConfirm}
              className="h-12 flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Déconnexion...' : 'Se déconnecter'}
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

          {errorMessage && (
            <div
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

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
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleCancel}
              className="h-12 flex-1 bg-gray-500 hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleConfirm}
              className="h-12 flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Déconnexion...' : 'Se déconnecter'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ConfirmLogoutModal;
