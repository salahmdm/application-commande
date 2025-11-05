import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from '../common/MobileNav';
import CartDrawer from '../client/CartDrawer';
import { NotificationContainer } from '../common/Notification';
import useNotifications from '../../hooks/useNotifications';
import useResponsive from '../../hooks/useResponsive';
import useUIStore from '../../store/uiStore';

/**
 * Layout principal de l'application
 * Optimisé pour mobile, tablette et desktop
 */
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // true par défaut pour desktop
  const { notifications, dismiss } = useNotifications();
  const { isMobile } = useResponsive();
  const showCart = useUIStore((state) => state.showCart);
  const setShowCart = useUIStore((state) => state.setShowCart);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 overflow-x-hidden">
      {/* Header - adapté mobile/desktop */}
      <Header 
        onMenuClick={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex overflow-x-hidden">
        {/* Sidebar - peut être cachée sur toutes les tailles d'écran */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Contenu principal - padding bottom pour mobile nav */}
        <main className="flex-1 p-0 min-h-screen pb-20 lg:pb-8 overflow-x-hidden">
          <div className="max-w-none mx-0 w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      
      {/* Navigation mobile bottom bar - visible uniquement sur mobile */}
      {isMobile && <MobileNav />}
      
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
    </div>
  );
};

export default MainLayout;

