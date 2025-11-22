import React from 'react';

/**
 * Composant CategoryFilter - Filtrage par catégories
 * Design moderne avec layout sticky et responsive amélioré
 * Sans icônes ni emoji - focus sur la typographie et la hiérarchie visuelle
 */
const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  const categoriesArray = Array.isArray(categories) ? categories : Object.values(categories);

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm pb-4 -mx-2 sm:-mx-0 px-2 sm:px-0">
      {/* Conteneur avec cadre et indicateurs de scroll sur mobile */}
      <div className="relative">
        {/* Indicateur ombre pulsante à droite - visible sur mobile uniquement */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 lg:hidden">
          <div className="relative">
            <div 
              className="absolute w-1 h-20 bg-gradient-to-b from-transparent via-black/40 to-transparent rounded-full shadow-2xl animate-pulse"
              style={{
                top: '-40px',
                right: '0px',
                width: '4px',
                height: '80px',
              }}
            ></div>
            <div 
              className="absolute w-1-20 bg-gradient-to-b from-transparent via-black/50 to-transparent rounded-full blur-sm animate-pulse"
              style={{
                top: '-40px',
                right: '0px',
                width: '7px',
                height: '80px',
              }}
            ></div>
          </div>
        </div>
        
        {/* Version Desktop - Barre horizontale élégante */}
        <div className="hidden lg:flex gap-3 flex-wrap">
          {/* Bouton "Toutes" */}
          <button
            onClick={() => onSelectCategory(null)}
            className={`
              group relative flex items-center gap-3 px-6 py-3.5 rounded-xl
              transition-all duration-300 flex-shrink-0
              ${!selectedCategory
                ? 'bg-gradient-to-r from-black to-neutral-800 text-white shadow-xl scale-105 border-2 border-black'
                : 'bg-gradient-to-r from-white to-neutral-50 border-2 border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 hover:shadow-lg shadow-sm'
              }
              active:scale-95
            `}
          >
            <span className="font-heading font-bold text-sm whitespace-nowrap">
              Toutes
            </span>
            {!selectedCategory && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
            )}
          </button>

          {/* Catégories */}
          {categoriesArray.map((category) => {
            const categoryKey = category.slug || category.id;
            const isActive = selectedCategory === categoryKey;

            return (
              <button
                key={categoryKey}
                onClick={() => onSelectCategory(categoryKey)}
                className={`
                  group relative flex items-center gap-3 px-6 py-3.5 rounded-xl
                  transition-all duration-300 flex-shrink-0
                  ${isActive
                    ? 'bg-gradient-to-r from-black to-neutral-800 text-white shadow-xl scale-105 border-2 border-black'
                    : 'bg-gradient-to-r from-white to-neutral-50 border-2 border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 hover:shadow-lg shadow-sm'
                  }
                  active:scale-95
                `}
              >
                <span className="font-heading font-bold text-sm whitespace-nowrap">
                  {category.name}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Version Mobile/Tablette - Scroll horizontal avec cartes compactes */}
        <div className="lg:hidden flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 px-1">
          {/* Bouton "Toutes" */}
          <button
            onClick={() => onSelectCategory(null)}
            className={`
              flex items-center justify-center min-w-[100px] px-5 py-3.5 rounded-xl
              transition-all duration-300 flex-shrink-0
              ${!selectedCategory
                ? 'bg-gradient-to-r from-black to-neutral-800 text-white shadow-xl border-2 border-black'
                : 'bg-gradient-to-r from-white to-neutral-50 border-2 border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 hover:shadow-lg shadow-sm'
              }
              active:scale-95
            `}
          >
            <span className="font-heading font-bold text-sm whitespace-nowrap">
              Toutes
            </span>
          </button>

          {/* Catégories */}
          {categoriesArray.map((category) => {
            const categoryKey = category.slug || category.id;
            const isActive = selectedCategory === categoryKey;

            return (
              <button
                key={categoryKey}
                onClick={() => onSelectCategory(categoryKey)}
                className={`
                  flex items-center justify-center min-w-[100px] px-5 py-3.5 rounded-xl
                  transition-all duration-300 flex-shrink-0
                  ${isActive
                    ? 'bg-gradient-to-r from-black to-neutral-800 text-white shadow-xl border-2 border-black'
                    : 'bg-gradient-to-r from-white to-neutral-50 border-2 border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 hover:shadow-lg shadow-sm'
                  }
                  active:scale-95
                `}
              >
                <span className="font-heading font-bold text-sm whitespace-nowrap text-center px-1">
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

