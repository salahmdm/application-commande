import React from 'react';
import { Edit2, Trash2, Power, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Tableau des produits avec sélection multiple et actions en lot
 */
const AdminProductsTable = ({ 
  products, 
  categoriesObj, 
  selectedIds, 
  onSelectItem, 
  onSelectAll, 
  onEdit, 
  onDelete, 
  onToggleAvailability,
  onSort,
  sortColumn,
  sortDirection
}) => {
  const allSelected = selectedIds.length === products.length && products.length > 0;
  const someSelected = selectedIds.length > 0 && selectedIds.length < products.length;

  // Fonction pour rendre les icônes de tri
  const renderSortIcon = (column) => {
    if (sortColumn !== column) {
      return (
        <div className="flex flex-col ml-1">
          <ChevronUp className="w-3 h-3 text-gray-400" />
          <ChevronDown className="w-3 h-3 text-gray-400 -mt-1" />
        </div>
      );
    }
    
    return (
      <div className="flex flex-col ml-1">
        <ChevronUp className={`w-3 h-3 ${sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
        <ChevronDown className={`w-3 h-3 -mt-1 ${sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    );
  };

  return (
    <>
      {/* Vue desktop - Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '5%' }} />  {/* Checkbox */}
            <col style={{ width: '35%' }} /> {/* Produit */}
            <col style={{ width: '15%' }} /> {/* Catégorie */}
            <col style={{ width: '10%' }} /> {/* Prix */}
            <col style={{ width: '12%' }} /> {/* Statut */}
            <col style={{ width: '12%' }} /> {/* Activer/Désactiver */}
            <col style={{ width: '10%' }} /> {/* Modifier */}
            <col style={{ width: '10%' }} /> {/* Supprimer */}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-center p-3 font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th 
                className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center">
                  Produit
                  {renderSortIcon('name')}
                </div>
              </th>
              <th 
                className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                onClick={() => onSort('category')}
              >
                <div className="flex items-center">
                  Catégorie
                  {renderSortIcon('category')}
                </div>
              </th>
              <th 
                className="text-right p-3 font-semibold cursor-pointer hover:bg-gray-50"
                onClick={() => onSort('price')}
              >
                <div className="flex items-center justify-end">
                  Prix
                  {renderSortIcon('price')}
                </div>
              </th>
              <th 
                className="text-center p-3 font-semibold cursor-pointer hover:bg-gray-50"
                onClick={() => onSort('is_available')}
              >
                <div className="flex items-center justify-center">
                  Statut
                  {renderSortIcon('is_available')}
                </div>
              </th>
              <th className="text-center p-3 font-semibold">Activer/Désactiver</th>
              <th className="text-center p-3 font-semibold">Modifier</th>
              <th className="text-center p-3 font-semibold">Supprimer</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => onSelectItem(product.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img 
                        src={`http://localhost:5000${product.image_url}`}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-xl border-2 border-neutral-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center text-2xl border-2 border-neutral-200">
                        {product.image || '🫖'}
                      </div>
                    )}
                    <div>
                      <div className="font-heading font-semibold text-black">{product.name}</div>
                      <div className="text-sm text-neutral-600 truncate max-w-xs font-sans">
                        {product.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-left">
                  <span className="px-3 py-2 bg-gray-100 rounded-full text-sm font-heading font-semibold inline-block">
                    {product.category_name || categoriesObj[product.category]?.name || 'Non définie'}
                  </span>
                </td>
                <td className="p-3 text-right font-semibold">
                  {parseFloat(product.price).toFixed(2)}€
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {(product.is_featured || product.popular) && (
                      <span className="px-3 py-1 bg-accent-500 text-white rounded-full text-xs font-heading font-bold">
                        Populaire
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold ${
                      product.is_available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.is_available ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onToggleAvailability(product)}
                    className={`px-2 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 font-heading font-semibold text-xs ${
                      product.is_available 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border-2 border-green-200'
                    }`}
                    aria-label={product.is_available ? 'Désactiver' : 'Activer'}
                    title={product.is_available ? 'Désactiver le produit' : 'Activer le produit'}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Power className="w-4 h-4" />
                      <span>{product.is_available ? 'OFF' : 'ON'}</span>
                    </div>
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => {
                      console.log('🔧 Bouton Modifier cliqué pour:', product);
                      onEdit(product);
                    }}
                    className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-blue-200"
                    aria-label="Modifier"
                    title="Modifier le produit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onDelete(product)}
                    className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-red-200"
                    aria-label="Supprimer"
                    title="Supprimer le produit"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue mobile/tablette - Cards */}
      <div className="lg:hidden space-y-4">
        {products.map((product) => (
          <div key={product.id} className="bg-neutral-50 rounded-2xl p-4 border-2 border-neutral-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => onSelectItem(product.id)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                {product.image_url ? (
                  <img 
                    src={`http://localhost:5000${product.image_url}`}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-xl border-2 border-neutral-300 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-neutral-100 rounded-xl flex items-center justify-center text-3xl border-2 border-neutral-300 flex-shrink-0">
                    {product.image || '🫖'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-lg text-black">{product.name}</div>
                  <div className="text-sm text-neutral-600 font-sans line-clamp-2">{product.description}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Catégorie</div>
                <span className="px-2 py-1 bg-white rounded-lg text-sm font-medium">
                  {product.category_name || categoriesObj[product.category]?.name || 'Non définie'}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Prix</div>
                <div className="text-lg font-heading font-bold text-black">{parseFloat(product.price).toFixed(2)}€</div>
              </div>
              <div>
                <div className="text-xs text-neutral-600 mb-1 font-sans">Statut</div>
                <div className="flex flex-col gap-1">
                  {(product.is_featured || product.popular) && (
                    <span className="inline-block px-2 py-1 bg-accent-500 text-white rounded-lg text-xs font-heading font-bold">
                      Populaire
                    </span>
                  )}
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-heading font-bold ${
                    product.is_available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {product.is_available ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-3 border-t-2 border-neutral-200">
              {/* Bouton Activer/Désactiver */}
              <button
                onClick={() => onToggleAvailability(product)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-heading font-semibold ${
                  product.is_available
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200'
                    : 'bg-green-50 text-green-600 hover:bg-green-100 border-2 border-green-200'
                } active:scale-95`}
                title={product.is_available ? 'Désactiver' : 'Activer'}
              >
                <Power className="w-4 h-4" />
                <span>{product.is_available ? 'Désactiver le produit' : 'Activer le produit'}</span>
              </button>
              
              {/* Bouton Modifier */}
              <button
                onClick={() => {
                  console.log('🔧 Bouton Modifier mobile cliqué pour:', product);
                  onEdit(product);
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl hover:bg-blue-100 transition-all duration-200 font-heading font-semibold active:scale-95 border-2 border-blue-200"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier le produit</span>
              </button>
              
              {/* Bouton Supprimer */}
              <button
                onClick={() => onDelete(product)}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl hover:bg-red-100 transition-all duration-200 active:scale-95 border-2 border-red-200 font-heading font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer le produit</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminProductsTable;
