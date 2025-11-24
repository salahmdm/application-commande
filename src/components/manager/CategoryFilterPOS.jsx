import React from 'react';
import { Search, X } from 'lucide-react';
import logger from '../../utils/logger';

/**
 * Composant CategoryFilterPOS - Filtrage par catégories optimisé pour le POS
 * Design minimaliste noir & blanc, texte uniquement
 */
const CategoryFilterPOS = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  isSearchExpanded = false,
  onSearchToggle
}) => {
  const categoriesArray = Array.isArray(categories) ? categories : Object.values(categories);

  return (
    <div>
      {/* Conteneur avec cadre et indicateurs de scroll sur mobile */}
      <div className="relative md:static">
        {/* Indicateur ombre pulsante à droite - visible sur mobile uniquement */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none z-100 md:hidden">
          {/* Ombre verticale pulsante plus visible */}
          <div className="relative">
  <div 
    className="absolute w-1 h-20 bg-gradient-to-b from-transparent via-black/40 to-transparent rounded-full shadow-2xl animate-pulse"
    style={{
      top: '-40px',      // Modifie la position verticale
      right: '0px',    // Modifie la position horizontale (ou utilise left)
      // left: '0px',  // Décommente pour positionner à gauche
      width: '4px',    // Modifie la largeur
      height: '80px',  // Modifie la hauteur
    }}
  ></div>
  <div 
    className="absolute w-1-20 bg-gradient-to-b from-transparent via-black/50 to-transparent rounded-full blur-sm animate-pulse"
    style={{
      top: '-40px',
      right: '0px',
      // left: '0px',
      width: '7px',
      height: '80px',
    }}
  ></div>
</div>
        </div>
        
        {/* Scroll horizontal avec cadre sur mobile */}
        <div className="
          flex items-center gap-3 overflow-x-auto md:flex-wrap scrollbar-hide pb-3 pt-1
          md:border-0 border-2 border-neutral-200 rounded-2xl p-4 md:p-0 md:pb-3 md:pt-1
          bg-gradient-to-br from-neutral-50 to-white md:bg-transparent
          overflow-y-visible
        ">
        {/* Icône de recherche ou champ de recherche */}
        {isSearchExpanded ? (
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="pl-11 pr-10 py-2.5 rounded-xl border-2 border-neutral-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 font-sans text-sm w-56 shadow-sm"
              autoFocus
            />
            <button
              onClick={() => {
                onSearchChange && onSearchChange('');
                onSearchToggle && onSearchToggle(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-neutral-200 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSearchToggle && onSearchToggle(true)}
            className="flex-shrink-0 w-11 h-11 rounded-xl border-2 border-neutral-300 bg-white text-neutral-700 hover:border-black hover:bg-black hover:text-white hover:shadow-lg shadow-md flex items-center justify-center transition-all duration-200 active:scale-95 group"
            title="Rechercher"
          >
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        )}
        
        {/* Badge "Toutes" */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`
            rounded-xl px-5 py-3
            transition-all duration-300
            flex-shrink-0
            font-heading font-bold text-sm
            ${!selectedCategory
              ? 'bg-gradient-to-r from-black to-neutral-800 text-white shadow-xl scale-105 border-2 border-black border-t-black'
              : 'bg-white border-2 border-neutral-300 border-t-neutral-300 text-neutral-700 hover:border-black hover:border-t-black hover:bg-neutral-50 hover:shadow-lg shadow-md hover:scale-105'
            }
            active:scale-95
            relative overflow-visible
          `}
        >
          {!selectedCategory && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-xl"></div>
          )}
          <span className="relative whitespace-nowrap">
            Toutes
          </span>
        </button>

        {/* Badges catégories */}
        {categoriesArray.map((category) => {
          // Utiliser l'ID comme clé principale pour plus de fiabilité
          const categoryKey = category.id || category.slug;
          const isActive = selectedCategory === categoryKey;
          
          logger.log('🏷️ CategoryFilterPOS - Catégorie:', {
            name: category.name,
            id: category.id,
            slug: category.slug,
            categoryKey,
            isActive
          });

          return (
            <button
              key={categoryKey}
              onClick={() => {
                logger.log('🏷️ CategoryFilterPOS - Clic sur catégorie:', categoryKey, category.name);
                logger.log('🏷️ CategoryFilterPOS - Valeur envoyée:', categoryKey, typeof categoryKey);
                onSelectCategory(categoryKey);
              }}
              className={`
                rounded-xl px-5 py-3
                transition-all duration-300
                flex-shrink-0
                font-heading font-bold text-sm
                relative overflow-visible
                ${isActive
                  ? 'bg-gradient-to-r from-black to-neutral-800 text-white shadow-xl scale-105 border-2 border-black border-t-black'
                  : 'bg-white border-2 border-neutral-300 border-t-neutral-300 text-neutral-700 hover:border-black hover:border-t-black hover:bg-neutral-50 hover:shadow-lg shadow-md hover:scale-105'
                }
                active:scale-95
              `}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-xl"></div>
              )}
              <span className="relative whitespace-nowrap">
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

export default CategoryFilterPOS;

