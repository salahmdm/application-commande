/**
 * Modal de détails produit pour le POS
 * Affiche uniquement les ingrédients du produit
 */

import React from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { formatPrice, calculateTTC } from '../../constants/pricing';

const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  if (!isOpen || !product) return null;

  const priceTTC = calculateTTC(product.price);

  // Extraire les ingrédients depuis le champ allergens (qui contient les ingrédients)
  const extractIngredients = (allergens) => {
    if (!allergens) return [];
    
    let ingredients = [];
    
    // Si c'est un tableau, l'utiliser directement
    if (Array.isArray(allergens)) {
      ingredients = allergens.filter(Boolean);
    } 
    // Si c'est une chaîne JSON, la parser
    else if (typeof allergens === 'string') {
      try {
        const parsed = JSON.parse(allergens);
        if (Array.isArray(parsed)) {
          ingredients = parsed.filter(Boolean);
        } else if (parsed) {
          // Si c'est une chaîne simple, essayer de la séparer par virgules
          ingredients = parsed.split(',').map(ing => ing.trim()).filter(Boolean);
        }
      } catch {
        // Si ce n'est pas du JSON, traiter comme une chaîne séparée par virgules
        ingredients = allergens.split(',').map(ing => ing.trim()).filter(Boolean);
      }
    }
    
    return ingredients;
  };

  // Utiliser product.allergens qui contient les ingrédients saisis dans "Modifier le produit"
  const ingredients = extractIngredients(product.allergens);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="relative bg-white p-6 border-b border-neutral-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <X className="w-4 h-4 text-neutral-700" />
          </button>

          {/* Info principale */}
          <div className="flex-1 min-w-0 pr-10">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-black mb-3 leading-tight">
              {product.name}
            </h2>
            <div className="inline-block px-3 py-1.5 bg-neutral-100 rounded-md mb-3">
              <span className="text-xl font-heading font-bold text-black">
                {formatPrice(priceTTC, true)}
              </span>
            </div>
            
            {/* Catégorie */}
            {product.category_name && (
              <div className="block mt-2">
                <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-heading font-medium">
                  {product.category_name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          <div className="space-y-4">
            {/* Ingrédients - Section principale uniquement */}
            {ingredients.length > 0 ? (
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                <div className="mb-4">
                  <h3 className="text-lg font-heading font-bold text-black">Ingrédients</h3>
                </div>
                <ul className="space-y-2.5">
                  {ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-neutral-800 font-sans text-base">
                      <span className="text-blue-600 font-bold mt-0.5 text-lg leading-none">•</span>
                      <span className="flex-1 leading-relaxed">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                <div className="mb-4">
                  <h3 className="text-lg font-heading font-bold text-black">Ingrédients</h3>
                </div>
                <p className="text-neutral-600 font-sans">Aucun ingrédient renseigné pour ce produit.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Bouton d'action */}
        <div className="p-6 bg-white border-t border-neutral-200">
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            disabled={!product.is_available}
            className={`w-full py-4 px-6 rounded-lg font-heading font-semibold text-base transition-all duration-200 transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-3 ${
              product.is_available
                ? 'bg-black text-white shadow-md hover:bg-neutral-800 hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.is_available ? 'Ajouter au panier' : 'Produit indisponible'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

