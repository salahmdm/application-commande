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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-neutral-300 z-[60] shadow-2xl shadow-black/10 safe-area-inset-bottom">
      <div className={`grid h-20 ${role === 'client' ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.action === 'cart' ? false : currentView === item.id;
          const showBadge = item.id === 'cart' && totalItems > 0;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`
                flex flex-col items-center justify-center gap-1.5 relative
                transition-all duration-300 active:scale-95 group
                ${isActive 
                  ? 'text-black' 
                  : 'text-neutral-500 active:text-black'
                }
              `}
            >
              <div className="relative">
                {/* Fond actif avec effet de brillance */}
                {isActive && (
                  <div className="absolute inset-0 -m-2 bg-gradient-to-br from-black/10 to-black/5 rounded-2xl blur-sm"></div>
                )}
                <div className={`
                  relative p-2.5 rounded-xl transition-all duration-300
                  ${isActive 
                    ? 'bg-black text-white shadow-lg scale-110' 
                    : 'bg-transparent group-hover:bg-neutral-100 group-active:bg-neutral-200'
                  }
                `}>
                  <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                </div>
                {showBadge && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center font-bold shadow-lg px-1.5 animate-pulse">
                    {totalItems > 99 ? '99+' : totalItems}
                  </div>
                )}
              </div>
              <span className={`
                text-[10px] font-heading transition-all duration-300
                ${isActive 
                  ? 'font-bold text-black' 
                  : 'font-semibold group-hover:font-bold group-hover:text-black'
                }
              `}>
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
