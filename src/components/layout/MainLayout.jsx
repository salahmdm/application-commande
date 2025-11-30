import Header from './Header';
import MobileNav from '../common/MobileNav';
import CartDrawer from '../client/CartDrawer';
import Modal from '../common/Modal';
import { NotificationContainer } from '../common/Notification';
import ConfirmLogoutModal from '../common/ConfirmLogoutModal';
import { CheckCircle } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import useUIStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';

/**
 * Layout principal de l'application
 * Optimisé pour mobile, tablette et desktop
 */
const MainLayout = ({ children }) => {
  const { notifications, dismiss } = useNotifications();
  const showCart = useUIStore((state) => state.showCart);
  const setShowCart = useUIStore((state) => state.setShowCart);
  const showOrderSuccessModal = useUIStore((state) => state.showOrderSuccessModal);
  const orderSuccessMessage = useUIStore((state) => state.orderSuccessMessage);
  const setShowOrderSuccessModal = useUIStore((state) => state.setShowOrderSuccessModal);
  const { role } = useAuth();
  
  // ✅ Masquer la barre de navigation pour admin et manager
  const showMobileNav = role !== 'admin' && role !== 'manager';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 overflow-x-hidden">
      {/* Header - adapté mobile/desktop */}
      <Header />
      
      <div className="flex overflow-x-hidden">
        {/* Sidebar - désactivée pour tous les utilisateurs */}
        
        {/* Contenu principal - padding top pour compenser le header fixed (h-16 md:h-20), padding bottom pour mobile nav (seulement si visible) */}
        <main className={`flex-1 p-0 min-h-screen pt-16 md:pt-20 overflow-x-hidden ${showMobileNav ? 'pb-20 lg:pb-8' : 'pb-8'}`}>
          <div className="max-w-none mx-0 w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      
      {/* Navigation mobile bottom bar - masquée pour admin et manager */}
      {showMobileNav && <MobileNav />}
      
      {/* Notifications - adaptées mobile */}
      <NotificationContainer 
        notifications={notifications}
        onDismiss={dismiss}
      />
      
      {/* Cart Drawer - visible uniquement pour les clients */}
      <CartDrawer 
        isOpen={showCart}
        onClose={() => setShowCart(false)}
      />
      
      {/* Modale de succès de commande */}
      <Modal
        isOpen={showOrderSuccessModal}
        onClose={() => setShowOrderSuccessModal(false)}
        size="sm"
        showCloseButton={false}
        closeOnOverlayClick={false}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Commande créée !</h3>
          <p className="text-gray-700 mb-4 whitespace-pre-line">
            {orderSuccessMessage}
          </p>
        </div>
      </Modal>
      
      {/* Modal de confirmation de déconnexion - Au premier plan de l'application */}
      <ConfirmLogoutModal />
    </div>
  );
};

export default MainLayout;

