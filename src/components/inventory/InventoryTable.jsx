import React from 'react';
import { Edit, Trash2, ArrowUpDown, Plus, Minus, Package } from 'lucide-react';
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
        bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        label: '✅ Disponible',
        shadow: 'shadow-emerald-200/50'
      },
      low: {
        bg: 'bg-gradient-to-r from-orange-100 to-amber-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
        label: '⚠️ Stock bas',
        shadow: 'shadow-orange-200/50'
      },
      out: {
        bg: 'bg-gradient-to-r from-red-100 to-rose-100',
        text: 'text-red-800',
        border: 'border-red-300',
        label: '❌ Rupture',
        shadow: 'shadow-red-200/50'
      }
    };

    const badge = badges[status] || badges.available;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${badge.bg} ${badge.text} ${badge.border} shadow-md ${badge.shadow}`}>
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
      <div className="text-center py-16 md:py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-full mb-4">
          <Package className="w-10 h-10 md:w-12 md:h-12 text-slate-400" />
        </div>
        <p className="text-slate-500 text-lg md:text-xl font-semibold">Aucun article dans l&apos;inventaire</p>
        <p className="text-slate-400 text-sm mt-2">Ajoutez votre premier article pour commencer</p>
      </div>
    );
  }

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  return (
    <>
      {/* Vue Mobile/Tablette - Cartes */}
      <div className="lg:hidden space-y-4">
        {items.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-5 rounded-2xl border-2 transition-all shadow-lg ${
                isSelected 
                  ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-blue-200/50' 
                  : 'border-slate-200 bg-white/80 backdrop-blur-sm hover:border-slate-300 hover:shadow-xl'
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
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 font-semibold mb-1 uppercase tracking-wide">Prix unitaire</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">{formatPrice(item.price)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-3 border border-orange-200">
                  <p className="text-xs text-orange-700 font-semibold mb-1 uppercase tracking-wide">Qté Min</p>
                  <p className="text-lg font-bold text-orange-700">{item.minQuantity || 0}</p>
                </div>
              </div>

              {/* Quantité avec boutons +/- */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-200 shadow-inner">
                <p className="text-xs text-blue-700 font-semibold mb-3 uppercase tracking-wide text-center">Quantité en stock</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      const newValue = Math.max(0, Math.round(((parseFloat(item.quantity) || 0) - 0.5) * 10) / 10);
                      onQuantityChange(item.id, newValue);
                    }}
                    className="p-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:from-red-600 hover:to-red-700 active:scale-90"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="font-bold text-slate-900 text-2xl md:text-3xl min-w-[80px] text-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-blue-200">
                    {item.quantity} {item.unit || 'kg'}
                  </span>
                  <button
                    onClick={() => {
                      const newValue = Math.round(((parseFloat(item.quantity) || 0) + 0.5) * 10) / 10;
                      onQuantityChange(item.id, newValue);
                    }}
                    className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:from-emerald-600 hover:to-teal-700 active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Date et Actions */}
              <div className="flex items-center justify-between pt-4 border-t-2 border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Ajouté le {formatDate(item.dateAdded)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 active:scale-90"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:from-red-600 hover:to-red-700 active:scale-90"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Vue Desktop - Tableau */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border-2 border-slate-200 bg-white/50 backdrop-blur-sm">
        <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b-2 border-slate-200">
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
            <th className="text-left p-4 font-heading font-bold text-slate-700">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                Article
                {getSortIcon('name')}
              </button>
            </th>
            <th className="text-left p-4 font-heading font-bold text-slate-700">
              <button
                onClick={() => handleSort('category')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                Catégorie
                {getSortIcon('category')}
              </button>
            </th>
            <th className="text-center p-4 font-heading font-bold text-slate-700">
              <button
                onClick={() => handleSort('quantity')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors mx-auto"
              >
                Quantité
                {getSortIcon('quantity')}
              </button>
            </th>
            <th className="text-right p-4 font-heading font-bold text-slate-700">
              <button
                onClick={() => handleSort('price')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors ml-auto"
              >
                Prix unitaire
                {getSortIcon('price')}
              </button>
            </th>
            <th className="text-center p-4 font-heading font-bold text-slate-700">
              <button
                onClick={() => handleSort('minQuantity')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors mx-auto"
              >
                Qté Min
                {getSortIcon('minQuantity')}
              </button>
            </th>
            <th className="text-left p-4 font-heading font-bold text-slate-700">
              <button
                onClick={() => handleSort('dateAdded')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                Date d&apos;ajout
                {getSortIcon('dateAdded')}
              </button>
            </th>
            <th className="text-center p-4 font-heading font-bold text-slate-700">
              Statut
            </th>
            <th className="text-center p-4 font-heading font-bold text-slate-700">
              Modifier
            </th>
            <th className="text-center p-4 font-heading font-bold text-slate-700">
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
                className={`border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 ${
                  isSelected ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-white'
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
                    className="p-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:from-red-600 hover:to-red-700 active:scale-90"
                    title="Diminuer de 0.5"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-heading font-bold text-slate-900 min-w-[60px] bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                    {item.quantity} {item.unit || 'kg'}
                  </span>
                  <button
                    onClick={() => {
                      const newValue = Math.round(((parseFloat(item.quantity) || 0) + 0.5) * 10) / 10;
                      onQuantityChange(item.id, newValue);
                    }}
                    className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:from-emerald-600 hover:to-teal-700 active:scale-90"
                    title="Augmenter de 0.5"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="p-4 text-right font-sans font-semibold text-emerald-700">
                {formatPrice(item.price)}
              </td>
              <td className="p-4 text-center font-heading font-bold text-orange-700 bg-orange-50/50 rounded-lg">
                {item.minQuantity || 0}
              </td>
              <td className="p-4 text-slate-600 text-sm font-medium">
                {formatDate(item.dateAdded)}
              </td>
              <td className="p-4 text-center">
                {getStatusBadge(item.status)}
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onEdit(item)}
                  className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 active:scale-90"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:from-red-600 hover:to-red-700 active:scale-90"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
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

