import React from 'react';
import { Home, ShoppingBag, Clock, User, Package, BarChart3, PlusCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useUIStore from '../../store/uiStore';
import useCart from '../../hooks/useCart';

/**
 * Navigation mobile moderne - Noir & Blanc Uni
 * Bottom bar minimaliste avec couleurs solides
 */
const MobileNav = () => {
  const { role } = useAuth();
  const { currentView, setCurrentView } = useUIStore();
  const { totalItems } = useCart();

  const getNavItems = () => {
    if (role === 'client') {
      return [
        { id: 'home', label: 'Accueil', icon: Home },
        { id: 'products', label: 'Produits', icon: ShoppingBag },
        { id: 'orders', label: 'Commandes', icon: Clock },
        { id: 'profile', label: 'Profil', icon: User }
      ];
    } else if (role === 'manager' || role === 'admin') {
      return [
        { id: 'manager-pos', label: 'POS', icon: PlusCircle },
        { id: 'manager-orders', label: 'Commandes', icon: Package },
        { id: 'manager-stats', label: 'Stats', icon: BarChart3 },
        { id: 'profile', label: 'Profil', icon: User }
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-neutral-200 z-40 shadow-elegant safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const showBadge = item.id === 'products' && totalItems > 0;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`
                flex flex-col items-center justify-center gap-1 relative
                transition-all duration-200 active:scale-95
                ${isActive 
                  ? 'text-black bg-neutral-100' 
                  : 'text-neutral-600 active:bg-neutral-50'
                }
              `}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-125' : ''}`} />
                {showBadge && (
                  <div className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-glow">
                    {totalItems}
                  </div>
                )}
              </div>
              <span className={`text-xs font-sans transition-all duration-200 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
