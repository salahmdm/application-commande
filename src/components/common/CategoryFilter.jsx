import React from 'react';
import { Utensils, Coffee, UtensilsCrossed, Salad, Cake, IceCream, CupSoda } from 'lucide-react';

/**
 * Composant CategoryFilter - Filtrage par catégories
 * Design moderne avec icônes et style rounded-full
 */
const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  const categoriesArray = Array.isArray(categories) ? categories : Object.values(categories);

  // Fonction pour obtenir l'icône selon le nom de la catégorie
  const getCategoryIcon = (categoryName) => {
    const name = (categoryName || '').toLowerCase();
    // Boissons froides en premier pour prioriser cette détection
    if (name.includes('boisson froide') || name.includes('boissons froides') || name.includes('froid') || name.includes('glacé') || name.includes('ice latte') || name.includes('ice coffee')) {
      return CupSoda;
    }
    // Boissons chaudes
    if (name.includes('boisson') || name.includes('café') || name.includes('cafe') || name.includes('thé') || name.includes('the')) {
      return Coffee;
    }
    if (name.includes('délices salés') || name.includes('delices sales') || name.includes('salé') || name.includes('sale') || name.includes('sandwich') || name.includes('quiche')) {
      return UtensilsCrossed;
    }
    if (name.includes('dessert') || name.includes('délices sucrés') || name.includes('delices sucres') || name.includes('gâteau') || name.includes('gateau') || name.includes('pâtisserie') || name.includes('patisserie')) {
      return Cake;
    }
    if (name.includes('salade')) {
      return Salad;
    }
    // Glaces (mais pas les boissons glacées)
    if (name.includes('glace') && !name.includes('boisson')) {
      return IceCream;
    }
    // Par défaut
    return Utensils;
  };

  return (
    <div className="fixed top-16 md:top-20 inset-x-0 z-20 pb-2 pt-4 px-2">
      {/* Bandeau avec style arrondi réduit et pleine largeur */}
      <div className="w-full">
        <div className="flex gap-2 bg-gray-100 rounded-lg py-1.5 px-2 shadow-inner overflow-x-auto scrollbar-hide">
          {/* Bouton "Toutes" */}
          <button
            onClick={() => onSelectCategory(null)}
            className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 flex-shrink-0 ${
              !selectedCategory
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="font-medium text-xs whitespace-nowrap">Toutes</span>
          </button>

          {/* Catégories */}
          {categoriesArray.map((category) => {
            const categoryKey = category.slug || category.id;
            const isActive = selectedCategory === categoryKey;
            const Icon = getCategoryIcon(category.name);

            return (
              <button
                key={categoryKey}
                onClick={() => onSelectCategory(categoryKey)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 flex-shrink-0 ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon 
                  size={16} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-gray-900' : 'text-gray-600'}
                />
                <span className="font-medium text-xs whitespace-nowrap">{category.name}</span>
              </button>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;

