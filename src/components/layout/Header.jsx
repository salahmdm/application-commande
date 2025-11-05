import React from 'react';
import { ShoppingCart, Menu, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import useUIStore from '../../store/uiStore';
import { formatPrice } from '../../constants/pricing';

/**
 * 🎨 Header Ultra-Moderne avec Design Futuriste
 * Design avec gradients, effets de verre et animations fluides
 */
const Header = ({ onMenuClick, sidebarOpen }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, total } = useCart();
  const setShowCart = useUIStore((state) => state.setShowCart);
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  
  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
    }
  };
  
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-lg shadow-slate-200/50 overflow-x-hidden">
      <div className="w-full px-4 sm:px-6 py-4 md:py-6">
        <div className="flex items-center justify-between gap-2 md:gap-6 min-w-0">
          {/* Logo avec effet moderne */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Bouton menu avec effet de verre */}
            <button
              onClick={onMenuClick}
              className="p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 flex-shrink-0 active:scale-95 group"
              aria-label={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
              title={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
            >
              <Menu className="w-6 h-6 text-slate-700 group-hover:text-purple-600 transition-colors duration-200" />
            </button>
            
            <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
              {/* Logo avec gradient */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap animate-pulse-slow">
                Blossom Café
              </h1>
              
              {/* Boutons mobiles modernes */}
              {isManager && (
                <div className="flex items-center gap-2 md:hidden">
                  <button
                    onClick={() => setCurrentView('manager-pos')}
                    className="group relative bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-blue-400/30 overflow-hidden"
                  >
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    {/* Particules flottantes */}
                    <div className="absolute top-1 left-2 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
                    <div className="absolute bottom-1 right-3 w-1 h-1 bg-white/40 rounded-full animate-ping animation-delay-200"></div>

                    <div className="relative z-10">
                      <span className="mobile-button-text">POS</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setCurrentView('manager-orders')}
                    className="group relative bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-emerald-400/30 overflow-hidden"
                  >
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    {/* Particules flottantes */}
                    <div className="absolute top-1 left-2 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
                    <div className="absolute bottom-1 right-3 w-1 h-1 bg-white/40 rounded-full animate-ping animation-delay-200"></div>

                    <div className="relative z-10">
                      <span className="mobile-button-text">CMD</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Boutons centraux (Manager/Admin uniquement) - Design futuriste */}
          {isManager && (
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <button
                onClick={() => setCurrentView('manager-pos')}
                className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white px-8 py-5 rounded-3xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 active:scale-95 border border-blue-400/30 overflow-hidden backdrop-blur-sm"
              >
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                {/* Effet de particules */}
                <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-3 left-6 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
                  <div className="absolute top-6 right-8 w-1 h-1 bg-white/40 rounded-full animate-ping animation-delay-200"></div>
                  <div className="absolute bottom-4 left-10 w-1 h-1 bg-white/50 rounded-full animate-ping animation-delay-400"></div>
                </div>

                <div className="relative z-10">
                  <span className="text-lg font-bold leading-tight">Prise de commande</span>
                </div>

                {/* Indicateur d'état actif avec animation */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse"></div>

                {/* Bordure lumineuse */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button
                onClick={() => setCurrentView('manager-orders')}
                className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white px-8 py-5 rounded-3xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 active:scale-95 border border-emerald-400/30 overflow-hidden backdrop-blur-sm"
              >
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                {/* Effet de particules */}
                <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-3 left-6 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
                  <div className="absolute top-6 right-8 w-1 h-1 bg-white/40 rounded-full animate-ping animation-delay-200"></div>
                  <div className="absolute bottom-4 left-10 w-1 h-1 bg-white/50 rounded-full animate-ping animation-delay-400"></div>
                </div>

                <div className="relative z-10">
                  <span className="text-lg font-bold leading-tight">Gestion de commande</span>
                </div>

                {/* Indicateur d'état actif avec animation */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse"></div>

                {/* Bordure lumineuse */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-400/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          )}
          
          {/* Actions - À droite avec design moderne */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">

            {user?.role === 'client' && (
              <button
                onClick={() => setShowCart(true)}
                className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-6 py-3 rounded-2xl flex items-center gap-2 md:gap-3 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 flex-shrink-0 hover:scale-105 active:scale-95"
                aria-label={`Panier: ${totalItems} articles, ${formatPrice(total)}`}
              >
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                
                <ShoppingCart className="w-5 h-5 relative z-10" />
                <span className="hidden sm:inline text-sm md:text-base font-semibold relative z-10">Panier</span>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs md:text-sm font-bold relative z-10">
                  {formatPrice(total)}
                </div>
                {totalItems > 0 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                    {totalItems}
                  </div>
                )}
              </button>
            )}
            
            {/* Bouton déconnexion avec effet moderne */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden lg:flex p-3 rounded-2xl hover:bg-red-50 text-red-600 transition-all duration-300 flex-shrink-0 hover:scale-105 active:scale-95 group"
                aria-label="Déconnexion"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5 group-hover:text-red-700 transition-colors duration-200" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;