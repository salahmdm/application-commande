import React from 'react';
import { Home, ShoppingBag, User, Package, Settings, Clock, X, PlusCircle, DollarSign, Warehouse, Palette } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useUIStore from '../../store/uiStore';

/**
 * Sidebar moderne - Noir & Blanc Uni
 * Navigation minimaliste avec couleurs solides
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, role } = useAuth();
  const { currentView, setCurrentView } = useUIStore();
  
  const handleNavigation = (view) => {
    setCurrentView(view);
    if (onClose) onClose();
  };
  
  // Menu selon le rôle
  const getMenuItems = () => {
    const baseItems = [
      { id: 'home', label: 'Accueil', icon: Home, roles: ['client', 'manager', 'admin'] },
    ];
    
    const clientItems = [
      { id: 'products', label: 'Produits', icon: ShoppingBag, roles: ['client'] },
      { id: 'orders', label: 'Mes Commandes', icon: Clock, roles: ['client'] },
      { id: 'profile', label: 'Mon Profil', icon: User, roles: ['client'] },
    ];
    
    const managerItems = [
      { id: 'manager-pos', label: 'Prise de commande', icon: PlusCircle, roles: ['manager', 'admin'] },
      { id: 'manager-orders', label: 'Gestion commandes', icon: Package, roles: ['manager', 'admin'] },
    ];
    
    const adminItems = [
      { id: 'admin-dashboard', label: 'Dashboard CA', icon: DollarSign, roles: ['admin'] },
      { id: 'admin-products', label: 'Gestion Produits', icon: ShoppingBag, roles: ['manager', 'admin'] },
      { id: 'admin-inventory', label: 'Inventaire', icon: Warehouse, roles: ['manager', 'admin'] },
      { id: 'admin-appearance', label: 'Apparence', icon: Palette, roles: ['admin'] },
    { id: 'admin-settings', label: 'Paramètres', icon: Settings, roles: ['admin'] },
    ];
    
    const allItems = [...baseItems, ...clientItems, ...managerItems, ...adminItems];
    
    return allItems.filter(item => item.roles.includes(role));
  };
  
  const menuItems = isAuthenticated ? getMenuItems() : [];
  
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - Toujours en overlay, se superpose au contenu */}
      <aside
        className={`
          fixed top-0 left-0 h-screen
          w-72 
          bg-white/95 backdrop-blur-sm
          md:bg-white/10 md:backdrop-blur-2xl
          border-r border-white/20 
          shadow-soft
          z-40
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto
          scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100
        `}
      >
        <div className="p-4 space-y-6 pt-28">
          {/* Bouton fermeture - visible sur toutes les tailles d'écran */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-3 rounded-xl hover:bg-neutral-100 transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Fermer le menu"
              title="Fermer le menu"
            >
              <X className="w-7 h-7 text-black" />
            </button>
          </div>
          
          {/* Navigation principale */}
          {isAuthenticated && (
            <div>
              <h4 className="text-xs font-heading font-semibold text-neutral-600 uppercase tracking-wider mb-4">
                Navigation
              </h4>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                        transition-all duration-200 text-left
                        ${isActive 
                          ? 'bg-black text-white shadow-elegant scale-105' 
                          : 'text-black hover:bg-neutral-100 hover:scale-105'
                        }
                        active:scale-95
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-heading font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
          
          {/* Informations utilisateur */}
          {isAuthenticated && user && (
            <div className="pt-4 border-t-2 border-neutral-200">
              <div className="flex items-center gap-3 p-3 bg-neutral-100 rounded-2xl border-2 border-neutral-200 shadow-soft">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-heading font-bold text-lg shadow-medium">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-sm truncate text-black">{user.name}</div>
                  <div className="text-xs text-neutral-600 capitalize font-sans">{role}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
