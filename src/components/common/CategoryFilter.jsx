import React from 'react';

/**
 * Composant CategoryFilter - Filtrage par catégories
 * Design minimaliste noir & blanc, texte uniquement
 */
const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  const categoriesArray = Array.isArray(categories) ? categories : Object.values(categories);

  return (
    <div>
      {/* Conteneur avec cadre et indicateurs de scroll sur mobile */}
      <div className="relative md:static">
        {/* Indicateur ombre pulsante à droite - visible sur mobile uniquement */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 md:hidden">
          {/* Ombre verticale pulsante plus visible */}
          <div className="relative">
            <div className="absolute right-0 w-1 h-20 bg-gradient-to-b from-transparent via-black/40 to-transparent rounded-full shadow-2xl animate-pulse"></div>
            <div className="absolute right-0 w-1 h-20 bg-gradient-to-b from-transparent via-black/30 to-transparent rounded-full blur-sm animate-pulse"></div>
          </div>
        </div>
        
        {/* Scroll horizontal avec cadre sur mobile */}
        <div className="
          flex gap-2 overflow-x-auto md:flex-wrap scrollbar-hide pb-2
          md:border-0 border-2 border-neutral-200 rounded-xl p-3 md:p-0
        ">
        {/* Badge "Toutes" */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`
            rounded-xl px-4 py-2.5
            transition-all duration-200
            flex-shrink-0
            ${!selectedCategory
              ? 'bg-black text-white shadow-lg'
              : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 hover:shadow-md shadow-sm'
            }
            active:scale-95
          `}
        >
          <span className="font-heading font-semibold text-sm whitespace-nowrap">
            Toutes
          </span>
        </button>

        {/* Badges catégories */}
        {categoriesArray.map((category) => {
          const categoryKey = category.slug || category.id;
          const isActive = selectedCategory === categoryKey;

          return (
            <button
              key={categoryKey}
              onClick={() => onSelectCategory(categoryKey)}
              className={`
                rounded-xl px-4 py-2.5
                transition-all duration-200
                flex-shrink-0
                ${isActive
                  ? 'bg-black text-white shadow-lg'
                  : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 hover:shadow-md shadow-sm'
                }
                active:scale-95
              `}
            >
              <span className="font-heading font-semibold text-sm whitespace-nowrap">
                {category.name}
              </span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;

