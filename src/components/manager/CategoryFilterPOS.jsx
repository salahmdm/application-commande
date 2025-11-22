import React from 'react';
import logger from '../../utils/logger';

/**
 * Composant CategoryFilterPOS - Filtrage par catégories optimisé pour le POS
 * Design minimaliste noir & blanc, texte uniquement
 */
const CategoryFilterPOS = ({ categories, selectedCategory, onSelectCategory }) => {
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

export default CategoryFilterPOS;

