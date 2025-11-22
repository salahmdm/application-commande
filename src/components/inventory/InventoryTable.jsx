import React from 'react';
import { Edit, Trash2, ArrowUpDown, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Tableau d'affichage de l'inventaire avec tri et actions
 */
const InventoryTable = ({ items, onEdit, onDelete, onSort, sortConfig, selectedIds, onSelectItem, onSelectAll, onQuantityChange }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: '✅ Disponible'
      },
      low: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        label: '⚠️ Stock bas'
      },
      out: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: '❌ Rupture'
      }
    };

    const badge = badges[status] || badges.available;

    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-heading font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleSort = (key) => {
    onSort(key);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    }
    return (
      <ArrowUpDown
        className={`w-4 h-4 transition-transform ${
          sortConfig.direction === 'desc' ? 'rotate-180' : ''
        }`}
      />
    );
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400 text-lg">Aucun article dans l&apos;inventaire</p>
      </div>
    );
  }

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  return (
    <>
      {/* Vue Mobile/Tablette - Cartes */}
      <div className="lg:hidden space-y-3">
        {items.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected ? 'border-blue-400 bg-blue-50' : 'border-neutral-200 bg-white'
              }`}
            >
              {/* Header avec checkbox et nom */}
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelectItem(item.id, e.target.checked)}
                  className="w-5 h-5 mt-1 text-blue-600 border-2 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-black text-lg leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-700">
                      {item.category}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-600 font-heading font-medium mb-1">Prix unitaire</p>
                  <p className="text-lg font-heading font-bold text-black">{formatPrice(item.price)}</p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-600 font-heading font-medium mb-1">Qté Min</p>
                  <p className="text-lg font-heading font-bold text-orange-700">{item.minQuantity || 0}</p>
                </div>
              </div>

              {/* Quantité avec boutons +/- */}
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-700 font-heading font-medium mb-2">Quantité en stock</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      const newValue = Math.max(0, Math.round(((parseFloat(item.quantity) || 0) - 0.5) * 10) / 10);
                      onQuantityChange(item.id, newValue);
                    }}
                    className="p-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors border-2 border-red-300 active:scale-95"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="font-heading font-bold text-black text-3xl min-w-[60px] text-center">
                    {item.quantity} {item.unit || 'kg'}
                  </span>
                  <button
                    onClick={() => {
                      const newValue = Math.round(((parseFloat(item.quantity) || 0) + 0.5) * 10) / 10;
                      onQuantityChange(item.id, newValue);
                    }}
                    className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors border-2 border-green-300 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Date et Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                <p className="text-xs text-neutral-500">
                  Ajouté le {formatDate(item.dateAdded)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors active:scale-95"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Vue Desktop - Tableau */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
        <thead>
          <tr className="border-b-2 border-neutral-200">
            <th className="text-center p-4 w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-2 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                title={allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              />
            </th>
            <th className="text-left p-4 font-heading font-bold text-black">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                Article
                {getSortIcon('name')}
              </button>
            </th>
            <th className="text-left p-4 font-heading font-bold text-black">
              <button
                onClick={() => handleSort('category')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                Catégorie
                {getSortIcon('category')}
              </button>
            </th>
            <th className="text-center p-4 font-heading font-bold text-black">
              <button
                onClick={() => handleSort('quantity')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors mx-auto"
              >
                Quantité
                {getSortIcon('quantity')}
              </button>
            </th>
            <th className="text-right p-4 font-heading font-bold text-black">
              <button
                onClick={() => handleSort('price')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors ml-auto"
              >
                Prix unitaire
                {getSortIcon('price')}
              </button>
            </th>
            <th className="text-center p-4 font-heading font-bold text-black">
              <button
                onClick={() => handleSort('minQuantity')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors mx-auto"
              >
                Qté Min
                {getSortIcon('minQuantity')}
              </button>
            </th>
            <th className="text-left p-4 font-heading font-bold text-black">
              <button
                onClick={() => handleSort('dateAdded')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                Date d&apos;ajout
                {getSortIcon('dateAdded')}
              </button>
            </th>
            <th className="text-center p-4 font-heading font-bold text-black">
              Statut
            </th>
            <th className="text-center p-4 font-heading font-bold text-black">
              Modifier
            </th>
            <th className="text-center p-4 font-heading font-bold text-black">
              Supprimer
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-b border-neutral-100 hover:bg-blue-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectItem(item.id, e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-2 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="p-4 font-heading font-semibold text-black">
                  {item.name}
                </td>
              <td className="p-4 text-neutral-700">
                <span className="px-3 py-1 bg-neutral-100 rounded-lg text-sm font-medium">
                  {item.category}
                </span>
              </td>
              <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      const newValue = Math.max(0, Math.round(((parseFloat(item.quantity) || 0) - 0.5) * 10) / 10);
                      onQuantityChange(item.id, newValue);
                    }}
                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors border border-red-300"
                    title="Diminuer de 0.5"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-heading font-bold text-black min-w-[40px]">
                    {item.quantity} {item.unit || 'kg'}
                  </span>
                  <button
                    onClick={() => {
                      const newValue = Math.round(((parseFloat(item.quantity) || 0) + 0.5) * 10) / 10;
                      onQuantityChange(item.id, newValue);
                    }}
                    className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors border border-green-300"
                    title="Augmenter de 0.5"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="p-4 text-right font-sans text-neutral-700">
                {formatPrice(item.price)}
              </td>
              <td className="p-4 text-center font-heading font-bold text-orange-700">
                {item.minQuantity || 0}
              </td>
              <td className="p-4 text-neutral-600 text-sm">
                {formatDate(item.dateAdded)}
              </td>
              <td className="p-4 text-center">
                {getStatusBadge(item.status)}
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onEdit(item)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </motion.tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
};

export default InventoryTable;

