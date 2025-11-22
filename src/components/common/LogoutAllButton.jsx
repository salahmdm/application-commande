import { LogOut } from 'lucide-react';
import { logoutAll } from '../../utils/logoutAll';
import logger from '../../utils/logger';

/**
 * Bouton pour déconnecter de tous les comptes
 */
const LogoutAllButton = ({ className = '', variant = 'default' }) => {
  const handleLogoutAll = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter de tous les comptes ?')) {
      try {
        await logoutAll();
        logger.log('✅ Déconnexion complète effectuée');
      } catch (error) {
        logger.error('❌ Erreur lors de la déconnexion complète:', error);
        alert('Erreur lors de la déconnexion. Veuillez rafraîchir la page.');
      }
    }
  };

  const baseClasses = 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200';
  const variantClasses = {
    default: 'bg-red-500 hover:bg-red-600 text-white',
    outline: 'border-2 border-red-500 text-red-500 hover:bg-red-50',
    ghost: 'text-red-500 hover:bg-red-50'
  };

  return (
    <button
      onClick={handleLogoutAll}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title="Déconnecter de tous les comptes"
    >
      <LogOut className="w-5 h-5" />
      <span>Déconnexion complète</span>
    </button>
  );
};

export default LogoutAllButton;

