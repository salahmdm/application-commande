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
  const { currentView, setCurrentView, setShowCart, toggleCart, showCart } = useUIStore();
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
    <nav className="fixed bottom-0 left-0 right-0 z-[60] safe-area-inset-bottom pb-1">
      {/* Conteneur glassmorphism avec effet miroir */}
      <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl px-1 sm:px-7 py-3 border-2 border-black/35 w-full">
        {/* Effet de reflet miroir */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 via-white/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
        
        <div className="relative flex items-center justify-around w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCart = item.id === 'cart';
            const showBadge = isCart && totalItems > 0;
            
            // Déterminer si l'élément est actif
            // Pour le panier : actif seulement si showCart est true
            // Pour les autres : actif seulement si currentView correspond ET que le panier n'est pas ouvert
            const isActive = isCart 
              ? showCart 
              : (currentView === item.id && !showCart);

            // Style spécial pour le panier (mis en avant)
            if (isCart) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="relative transition-all duration-300 active:scale-95"
                >
                  <div className="relative">
                    {/* Cercle d'arrière-plan transparent et sombre */}
                    <div className="absolute inset-0 -m-2 bg-black/20 backdrop-blur-md rounded-full opacity-60"></div>
                    
                    {/* Bouton principal */}
                    <div className={`relative p-3 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'border-2 border-blue-500 shadow-lg'
                        : 'border-2 border-transparent'
                    }`}>
                      <Icon 
                        size={26} 
                        className="text-black transition-colors duration-300 relative z-10"
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      
                      {/* Badge avec animation */}
                      {showBadge && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center font-bold shadow-xl px-1.5 border-2 border-white animate-bounce">
                          {totalItems > 99 ? '99+' : totalItems}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            }

            // Style pour les autres boutons
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="relative transition-all duration-300 active:scale-95"
              >
                <div className={`p-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'border-2 border-blue-500 shadow-lg' 
                    : 'border-2 border-transparent'
                }`}>
                  <Icon 
                    size={26} 
                    className="text-black transition-colors duration-300"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
