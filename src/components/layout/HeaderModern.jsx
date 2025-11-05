/**
 * Header amélioré avec boutons modernes et indicateurs d'état
 * Design moderne et fonctionnel pour la prise de commande
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, LogOut, Package, ClipboardList, Bell, Settings } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import useUIStore from '../../store/uiStore';
import { formatPrice } from '../../constants/pricing';
import ModernActionButton, { CompactActionButton } from '../common/ModernActionButton';
import StatusIndicator, { NotificationBadge } from '../common/StatusIndicator';

/**
 * Header moderne avec boutons d'action améliorés
 */
const Header = ({ onMenuClick, sidebarOpen }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, total } = useCart();
  const setShowCart = useUIStore((state) => state.setShowCart);
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  const currentView = useUIStore((state) => state.currentView);
  
  const [notifications, setNotifications] = useState(0);
  
  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
    }
  };
  
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  
  // Simuler des notifications (à remplacer par de vraies données)
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(Math.floor(Math.random() * 5));
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <header className="bg-white/90 backdrop-blur-md border-b-2 border-gray-200 sticky top-0 z-50 shadow-lg overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 md:gap-4 h-16">
          
          {/* Logo et menu - À gauche */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 flex-shrink-0 active:scale-95 group"
              aria-label={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
              title={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
            >
              <Menu className="w-6 h-6 text-gray-900 group-hover:text-blue-600 transition-colors duration-200" />
            </button>
            
            <div className="flex items-center gap-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-gray-900 whitespace-nowrap">
                Blossom Café
              </h1>
              
              {/* Boutons mobiles - visibles uniquement sur mobile */}
              {isManager && (
                <div className="flex items-center gap-2 md:hidden">
                  <CompactActionButton
                    onClick={() => setCurrentView('manager-pos')}
                    variant="primary"
                    icon={Package}
                  >
                    POS
                  </CompactActionButton>
                  
                  <CompactActionButton
                    onClick={() => setCurrentView('manager-orders')}
                    variant="success"
                    icon={ClipboardList}
                  >
                    ORDERS
                  </CompactActionButton>
                </div>
              )}
            </div>
          </div>
          
          {/* Boutons centraux (Manager/Admin uniquement) */}
          {isManager && (
            <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
              <div className="relative">
                <ModernActionButton
                  onClick={() => setCurrentView('manager-pos')}
                  variant="primary"
                  size="lg"
                  icon={Package}
                  subtitle="Point de vente"
                  className={currentView === 'manager-pos' ? 'ring-2 ring-blue-300' : ''}
                >
                  Prise de commande
                </ModernActionButton>
                
                {/* Indicateur d'état actif */}
                <StatusIndicator 
                  isActive={currentView === 'manager-pos'} 
                  variant="primary" 
                  size="lg"
                />
              </div>
              
              <div className="relative">
                <ModernActionButton
                  onClick={() => setCurrentView('manager-orders')}
                  variant="success"
                  size="lg"
                  icon={ClipboardList}
                  subtitle="Suivi & contrôle"
                  className={currentView === 'manager-orders' ? 'ring-2 ring-green-300' : ''}
                >
                  Gestion de commande
                </ModernActionButton>
                
                {/* Indicateur d'état actif */}
                <StatusIndicator 
                  isActive={currentView === 'manager-orders'} 
                  variant="success" 
                  size="lg"
                />
              </div>
            </div>
          )}
          
          {/* Actions - À droite */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            
            {/* Bouton panier - Visible uniquement pour les clients */}
            {user?.role === 'client' && (
              <div className="relative">
                <button
                  onClick={() => setShowCart(true)}
                  className="relative bg-gray-900 text-white px-4 md:px-6 py-2.5 rounded-2xl flex items-center gap-2 md:gap-3 shadow-lg hover:bg-gray-800 transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95 group"
                  aria-label={`Panier: ${totalItems} articles, ${formatPrice(total)}`}
                >
                  <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <span className="hidden sm:inline text-sm md:text-base font-heading font-semibold">Panier</span>
                  <div className="bg-white text-gray-900 px-3 py-1 rounded-lg text-sm font-bold">
                    {formatPrice(total)}
                  </div>
                </button>
                
                {/* Badge de notification pour le panier */}
                <NotificationBadge count={totalItems} variant="warning" />
              </div>
            )}
            
            {/* Bouton notifications pour les managers */}
            {isManager && (
              <div className="relative">
                <button
                  className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95 group"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 group-hover:animate-pulse" />
                </button>
                
                {/* Badge de notification */}
                <NotificationBadge count={notifications} variant="danger" />
              </div>
            )}
            
            {/* Bouton paramètres pour les admins */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin-settings')}
                className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95 group"
                aria-label="Paramètres"
                title="Paramètres"
              >
                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            )}
            
            {/* Bouton déconnexion */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden lg:flex p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95 group"
                aria-label="Déconnexion"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-200" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Barre de progression pour les managers */}
      {isManager && (
        <div className="hidden md:block bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <span className="font-medium">État du système:</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>En ligne</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="font-medium">Dernière synchronisation:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
