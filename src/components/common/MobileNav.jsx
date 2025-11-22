import React from 'react';
import { Home, ShoppingBag, Clock, User, Package, BarChart3, PlusCircle, ShoppingCart } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useUIStore from '../../store/uiStore';
import useCart from '../../hooks/useCart';

/**
 * Navigation mobile moderne - Noir & Blanc Uni
 * Bottom bar minimaliste avec couleurs solides
 */
const MobileNav = () => {
  const { role } = useAuth();
  const { currentView, setCurrentView, setShowCart, toggleCart } = useUIStore();
  const { totalItems } = useCart();

  const getNavItems = () => {
    if (role === 'client') {
      return [
        { id: 'home', label: 'Accueil', icon: Home, action: 'navigate' },
        { id: 'products', label: 'Produits', icon: ShoppingBag, action: 'navigate' },
        { id: 'cart', label: 'Panier', icon: ShoppingCart, action: 'cart' },
        { id: 'orders', label: 'Commandes', icon: Clock, action: 'navigate' },
        { id: 'profile', label: 'Profil', icon: User, action: 'navigate' }
      ];
    } else if (role === 'manager' || role === 'admin') {
      return [
        { id: 'manager-pos', label: 'POS', icon: PlusCircle, action: 'navigate' },
        { id: 'manager-orders', label: 'Commandes', icon: Package, action: 'navigate' },
        { id: 'manager-stats', label: 'Stats', icon: BarChart3, action: 'navigate' },
        { id: 'profile', label: 'Profil', icon: User, action: 'navigate' }
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const handleItemClick = (item) => {
    if (item.action === 'cart') {
      toggleCart();
    } else {
      // Fermer le panier si ouvert quand on navigue
      setShowCart(false);
      setCurrentView(item.id);
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-neutral-200 z-40 shadow-elegant safe-area-inset-bottom">
      <div className={`grid h-16 ${role === 'client' ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.action === 'cart' ? false : currentView === item.id;
          const showBadge = item.id === 'cart' && totalItems > 0;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
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
                  <div className="absolute -top-2 -right-2 bg-black text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center font-bold shadow-lg px-1">
                    {totalItems > 99 ? '99+' : totalItems}
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
