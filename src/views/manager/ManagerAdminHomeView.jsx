import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Package, 
  Settings, 
  PlusCircle, 
  DollarSign, 
  Warehouse, 
  Users,
  LogOut
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useUIStore from '../../store/uiStore';

/**
 * Page d'accueil pour Managers et Admins
 * Affiche tous les boutons de navigation dans une grille pleine écran
 */
const ManagerAdminHomeView = () => {
  const { user, role } = useAuth();
  const { setCurrentView, setShowLogoutConfirm, currentView } = useUIStore();

  // Menu selon le rôle
  const getMenuItems = () => {
    const baseItems = [
      { id: 'home', label: 'Accueil', icon: Home, roles: ['manager', 'admin'] },
    ];
    
    const managerItems = [
      { id: 'manager-pos', label: 'Prise de commande', icon: PlusCircle, roles: ['manager', 'admin'] },
      { id: 'manager-orders', label: 'Gestion commandes', icon: Package, roles: ['manager', 'admin'] },
    ];
    
    const adminItems = [
      { id: 'admin-dashboard', label: 'Dashboard CA', icon: DollarSign, roles: ['admin'] },
      { id: 'admin-products', label: 'Gestion Produits', icon: ShoppingBag, roles: ['manager', 'admin'] },
      { id: 'admin-inventory', label: 'Inventaire', icon: Warehouse, roles: ['manager', 'admin'] },
      { id: 'admin-accounts', label: 'Gestion des Comptes', icon: Users, roles: ['admin'] },
      { id: 'admin-settings', label: 'Paramètres', icon: Settings, roles: ['admin'] },
    ];
    
    const allItems = [...baseItems, ...managerItems, ...adminItems];
    
    return allItems.filter(item => item.roles.includes(role));
  };

  const menuItems = getMenuItems();

  const handleNavigation = (viewId) => {
    // Si c'est 'home', rediriger vers la page d'accueil client (HomeView)
    if (viewId === 'home') {
      setCurrentView('home');
      return;
    }
    // Si on clique sur manager-admin-home alors qu'on est déjà dessus, ne rien faire
    if (viewId === 'manager-admin-home' && currentView === 'manager-admin-home') {
      return;
    }
    // Sinon, naviguer vers la page demandée
    setCurrentView(viewId);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-gradient-to-br from-neutral-50 to-white p-6 md:p-8 lg:p-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-black mb-4">
            Blossom Café
          </h1>
          <p className="text-lg md:text-xl text-neutral-600">
            {role === 'admin' ? 'Administration' : 'Gestion'}
          </p>
        </div>

        {/* Grille de boutons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigation(item.id);
                }}
                className="group relative bg-white border-2 border-neutral-200 rounded-2xl p-6 md:p-8 hover:border-black hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-4 min-h-[180px] md:min-h-[220px] w-full isolate overflow-hidden"
                style={{ 
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-2xl pointer-events-none"></div>
                
                {/* Icône */}
                <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                
                {/* Label */}
                <span className="relative z-10 font-heading font-bold text-lg md:text-xl text-black text-center px-2">
                  {item.label}
                </span>
                
                {/* Indicateur de survol */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                {/* Ombre au survol */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                ></div>
              </button>
            );
          })}
        </div>

        {/* Bouton de déconnexion discret en bas à droite */}
        <div className="fixed bottom-6 right-6 z-[120]">
          <button
            onClick={handleLogout}
            className="group relative bg-white/80 backdrop-blur-sm border border-neutral-300 rounded-full px-4 py-3 hover:bg-white hover:border-neutral-400 hover:shadow-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 text-neutral-600 group-hover:text-red-600 transition-colors duration-200" />
            <span className="text-sm font-heading font-semibold text-neutral-600 group-hover:text-red-600 transition-colors duration-200">
              Déconnexion
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerAdminHomeView;

