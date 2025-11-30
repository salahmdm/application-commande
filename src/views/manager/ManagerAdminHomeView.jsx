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

  // Mapping des gradients pour chaque bouton (style Dashboard CA)
  const getGradientForItem = (itemId) => {
    const gradients = {
      'home': 'bg-gradient-to-br from-blue-500 to-cyan-600',
      'manager-pos': 'bg-gradient-to-br from-green-500 to-emerald-600',
      'manager-orders': 'bg-gradient-to-br from-orange-500 to-red-600',
      'admin-dashboard': 'bg-gradient-to-br from-purple-500 to-pink-600',
      'admin-products': 'bg-gradient-to-br from-indigo-500 to-purple-600',
      'admin-inventory': 'bg-gradient-to-br from-teal-500 to-cyan-600',
      'admin-accounts': 'bg-gradient-to-br from-amber-500 to-orange-600',
      'admin-settings': 'bg-gradient-to-br from-slate-500 to-gray-600',
    };
    return gradients[itemId] || 'bg-gradient-to-br from-blue-500 to-purple-600';
  };

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
    <div className="fixed inset-0 z-[110] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-10 md:mb-12 lg:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-2">
            Blossom Café
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            {role === 'admin' ? 'Administration' : 'Gestion'}
          </p>
        </div>

        {/* Grille de boutons - Style Dashboard CA - Centrée */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-8 lg:gap-y-10 justify-items-center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const gradient = getGradientForItem(item.id);
            
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigation(item.id);
                }}
                className={`group relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg md:shadow-xl ${gradient} transform transition-all duration-300 hover:scale-102 md:hover:scale-105 hover:shadow-2xl active:scale-[0.98] min-h-[160px] md:min-h-[200px] w-full flex flex-col items-center justify-center`}
              >
                {/* Fond décoratif - Icône en arrière-plan */}
                <div className="hidden md:block absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 transform translate-x-8 -translate-y-8">
                  <Icon className="w-full h-full text-white opacity-10" />
                </div>
                
                {/* Contenu centré */}
                <div className="relative z-10 w-full flex flex-col items-center justify-center gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-white bg-opacity-20 rounded-lg md:rounded-xl backdrop-blur-sm">
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <p className="text-white text-opacity-90 font-bold text-base md:text-lg lg:text-xl text-center uppercase tracking-wide">
                    {item.label}
                  </p>
                </div>
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

