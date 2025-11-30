// Import React non nécessaire avec JSX transform automatique
import { Home as HomeIcon, PlusCircle, Package } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useUIStore from '../../store/uiStore';
// ConfirmLogoutModal déplacé dans MainLayout pour être au premier plan

/**
 * 🎨 Header Ultra-Moderne avec Design Futuriste
 * Design avec gradients, effets de verre et animations fluides
 */
const Header = () => {
  const { user } = useAuth();
  const { setShowCart, currentView } = useUIStore((state) => ({
    setShowCart: state.setShowCart,
    currentView: state.currentView
  }));
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isOnManagerHomePage = currentView === 'manager-admin-home';

  const handleHomeClick = () => {
    // Fermer le panier si ouvert
    setShowCart(false);
    // Aller à la page d'accueil
    if (isManager) {
      setCurrentView('manager-admin-home');
    } else {
      setCurrentView('home');
    }
  };

  const handleManagerHomeClick = () => {
    // Fermer le panier si ouvert
    setShowCart(false);
    // Aller à la page d'accueil manager/admin
    setCurrentView('manager-admin-home');
  };
  
  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 fixed top-0 left-0 right-0 z-[100] shadow-[0_4px_12px_rgba(0,0,0,0.15)] overflow-x-hidden will-change-transform h-16 md:h-20">
      <div className="w-full h-full px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 md:gap-4 min-w-0 h-full">
          {/* Espace gauche pour équilibrer */}
          <div className="flex items-center gap-3 flex-shrink-0 h-full">
            <div className="flex items-center gap-3 sm:gap-6 md:gap-8 h-full">
              {/* Logo Blossom Café à gauche pour manager/admin */}
              {isManager && (
                <button
                  onClick={handleHomeClick}
                  className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-black via-neutral-800 to-black bg-clip-text text-transparent whitespace-nowrap transition-transform duration-200 cursor-pointer focus:outline-none focus:ring-0 rounded-lg px-2 py-1 drop-shadow-2xl shadow-black/50"
                  aria-label="Aller à la page d'accueil"
                  title="Accueil"
                >
                  Blossom Café
                </button>
              )}
              
              {/* Bouton maison pour managers/admins - Style glassmorphism moderne */}
              {isManager && !isOnManagerHomePage && (
                <button
                  onClick={handleManagerHomeClick}
                  className={`h-full px-8 md:px-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 text-slate-800 font-semibold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center flex-shrink-0 group overflow-hidden relative ${
                    currentView === 'manager-admin-home' ? 'bg-white/20 border-white/40 shadow-2xl shadow-slate-400/30' : ''
                  }`}
                  aria-label="Retour à l'accueil"
                  title="Retour à l'accueil"
                >
                  {/* Effet de lumière au survol */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Ligne de lumière animée */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                  
                  <HomeIcon className="w-[1.8rem] h-[1.8rem] md:w-[2.16rem] md:h-[2.16rem] relative z-10 text-slate-700 group-hover:text-slate-900 transition-colors" />
                  
                  {/* Indicateur actif - point lumineux */}
                  {currentView === 'manager-admin-home' && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-600 rounded-full animate-pulse"></div>
                  )}
                </button>
              )}
              
              {/* Boutons mobiles - Style glassmorphism avec couleurs subtiles */}
              {isManager && (
                <div className="flex items-center gap-2 md:hidden h-full">
                  <button
                    onClick={() => setCurrentView('manager-pos')}
                    className={`h-full px-4 rounded-2xl bg-blue-50/80 backdrop-blur-md border border-blue-200/50 hover:border-blue-300/70 text-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 flex-shrink-0 group overflow-hidden relative ${
                      currentView === 'manager-pos' ? 'bg-blue-100/90 border-blue-300/80 shadow-2xl shadow-blue-400/30' : ''
                    }`}
                  >
                    {/* Effet de lumière douce */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/0 via-blue-100/20 to-blue-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Ligne de lumière */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent"></div>
                    
                    <PlusCircle className="w-5 h-5 relative z-10 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    <span className="relative z-10 text-sm font-bold text-blue-700">POS</span>
                    
                    {/* Indicateur actif */}
                    {currentView === 'manager-pos' && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setCurrentView('manager-orders')}
                    className={`h-full px-4 rounded-2xl bg-emerald-50/80 backdrop-blur-md border border-emerald-200/50 hover:border-emerald-300/70 text-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 flex-shrink-0 group overflow-hidden relative ${
                      currentView === 'manager-orders' ? 'bg-emerald-100/90 border-emerald-300/80 shadow-2xl shadow-emerald-400/30' : ''
                    }`}
                  >
                    {/* Effet de lumière douce */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 via-emerald-100/20 to-emerald-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Ligne de lumière */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"></div>
                    
                    <Package className="w-5 h-5 relative z-10 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                    <span className="relative z-10 text-sm font-bold text-emerald-700">CMD</span>
                    
                    {/* Indicateur actif */}
                    {currentView === 'manager-orders' && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Logo centré avec effet moderne - Uniquement pour les clients */}
          {!isManager && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-full">
              <button
                onClick={handleHomeClick}
                className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-black via-neutral-800 to-black bg-clip-text text-transparent whitespace-nowrap transition-transform duration-200 cursor-pointer focus:outline-none focus:ring-0 rounded-lg px-2 py-1 drop-shadow-2xl shadow-black/50"
                aria-label="Aller à la page d'accueil"
                title="Accueil"
              >
                Blossom Café
              </button>
            </div>
          )}
          
          {/* Espace droit pour équilibrer */}
          <div className="flex items-center gap-3 flex-shrink-0 h-full">
          </div>
          
          {/* Boutons centraux (Manager/Admin uniquement) - Style glassmorphism élégant */}
          {isManager && (
            <div className="hidden md:flex items-center gap-3 md:gap-4 flex-1 justify-center h-full">
              <button
                onClick={() => {
                  setShowCart(false);
                  setCurrentView('manager-pos');
                }}
                className={`h-full px-6 md:px-10 rounded-2xl bg-blue-50/80 backdrop-blur-lg border border-blue-200/60 hover:border-blue-300/80 text-blue-700 font-semibold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 flex-shrink-0 group overflow-hidden relative ${
                  currentView === 'manager-pos' ? 'bg-blue-100/90 border-blue-300/90 shadow-2xl shadow-blue-400/40' : ''
                }`}
              >
                {/* Effet de lumière douce au survol */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/0 via-blue-100/30 to-blue-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Ligne de lumière supérieure */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent"></div>
                
                {/* Reflet subtil */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <PlusCircle className="w-5 h-5 md:w-6 md:h-6 relative z-10 text-blue-600 group-hover:text-blue-800 transition-colors" />
                <span className="relative z-10 font-bold text-blue-700 group-hover:text-blue-800 transition-colors">Prise de commande</span>
                
                {/* Indicateur actif - point lumineux */}
                {currentView === 'manager-pos' && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowCart(false);
                  setCurrentView('manager-orders');
                }}
                className={`h-full px-6 md:px-10 rounded-2xl bg-emerald-50/80 backdrop-blur-lg border border-emerald-200/60 hover:border-emerald-300/80 text-emerald-700 font-semibold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 flex-shrink-0 group overflow-hidden relative ${
                  currentView === 'manager-orders' ? 'bg-emerald-100/90 border-emerald-300/90 shadow-2xl shadow-emerald-400/40' : ''
                }`}
              >
                {/* Effet de lumière douce au survol */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 via-emerald-100/30 to-emerald-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Ligne de lumière supérieure */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"></div>
                
                {/* Reflet subtil */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <Package className="w-5 h-5 md:w-6 md:h-6 relative z-10 text-emerald-600 group-hover:text-emerald-800 transition-colors" />
                <span className="relative z-10 font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">Gestion de commande</span>
                
                {/* Indicateur actif - point lumineux */}
                {currentView === 'manager-orders' && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                )}
              </button>
            </div>
          )}
          
          {/* Actions - À droite avec design moderne */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          </div>
        </div>
      </div>
      
    </header>
  );
};

export default Header;