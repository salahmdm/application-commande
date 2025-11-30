import React from 'react';
import { Search, X } from 'lucide-react';
import logger from '../../utils/logger';

/**
 * Composant CategoryFilterPOS - Filtrage par catégories optimisé pour le POS
 * Design simple et moderne
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
    <div className="w-full">
      {/* Bandeau glassmorphism avec effet miroir */}
      <div className="relative bg-white/30 backdrop-blur-xl rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.15)] px-4 py-3 border border-white/50 mb-3">
        {/* Effet de reflet miroir */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
        
        <div className="relative flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Icône de recherche ou champ de recherche */}
        {isSearchExpanded ? (
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="pl-10 pr-9 py-2 rounded-lg border border-neutral-300 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all text-sm w-48"
              autoFocus
            />
            <button
              onClick={() => {
                onSearchChange && onSearchChange('');
                onSearchToggle && onSearchToggle(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded hover:bg-neutral-100 flex items-center justify-center transition-all"
            >
              <X className="w-3.5 h-3.5 text-neutral-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSearchToggle && onSearchToggle(true)}
            className="flex-shrink-0 w-9 h-9 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:border-black hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-95"
            title="Rechercher"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
        
        {/* Bouton "Toutes" */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`
            rounded-lg px-4 py-2
            transition-all
            flex-shrink-0
            font-semibold text-sm
            ${!selectedCategory
              ? 'bg-black text-white'
              : 'bg-white border border-neutral-300 text-neutral-700 hover:border-black hover:bg-neutral-50'
            }
            active:scale-95
          `}
        >
          Toutes
        </button>

        {/* Boutons catégories */}
        {categoriesArray.map((category) => {
          const categoryKey = category.id || category.slug;
          const isActive = selectedCategory === categoryKey;

          return (
            <button
              key={categoryKey}
              onClick={() => {
                logger.log('🏷️ CategoryFilterPOS - Clic sur catégorie:', categoryKey, category.name);
                onSelectCategory(categoryKey);
              }}
              className={`
                rounded-lg px-4 py-2
                transition-all
                flex-shrink-0
                font-semibold text-sm
                ${isActive
                  ? 'bg-black text-white'
                  : 'bg-white border border-neutral-300 text-neutral-700 hover:border-black hover:bg-neutral-50'
                }
                active:scale-95
              `}
            >
              {category.name}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilterPOS;

