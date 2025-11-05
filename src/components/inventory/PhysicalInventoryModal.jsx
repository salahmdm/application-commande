import React, { useState, useEffect } from 'react';
import { X, Save, Search, Package, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';

/**
 * Modal pour faire un inventaire physique
 * Permet de compter et mettre à jour les quantités réelles
 */
const PhysicalInventoryModal = ({ isOpen, onClose, items, onUpdate }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser les données d'inventaire
  useEffect(() => {
    if (isOpen && items) {
      setInventoryData(
        items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          currentQuantity: item.quantity,
          newQuantity: item.quantity,
          hasChanged: false
        }))
      );
    }
  }, [isOpen, items]);

  // Filtrer les produits par recherche
  const filteredData = inventoryData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mettre à jour la nouvelle quantité
  const handleQuantityChange = (id, value) => {
    setInventoryData(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              newQuantity: value === '' ? '' : parseFloat(value) || 0,
              hasChanged: true
            }
          : item
      )
    );
  };

  // Incrémenter la quantité
  const handleIncrement = (id) => {
    setInventoryData(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              newQuantity: (parseFloat(item.newQuantity) || 0) + 1,
              hasChanged: true
            }
          : item
      )
    );
  };

  // Décrémenter la quantité
  const handleDecrement = (id) => {
    setInventoryData(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              newQuantity: Math.max(0, (parseFloat(item.newQuantity) || 0) - 1),
              hasChanged: true
            }
          : item
      )
    );
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    const changedItems = inventoryData.filter(
      item => item.hasChanged && item.newQuantity !== item.currentQuantity
    );

    if (changedItems.length === 0) {
      alert('Aucune modification à enregistrer');
      return;
    }

    if (window.confirm(`Mettre à jour ${changedItems.length} article(s) ?`)) {
      setIsSaving(true);
      await onUpdate(changedItems);
      setIsSaving(false);
      onClose();
    }
  };

  // Compter les modifications
  const changedCount = inventoryData.filter(
    item => item.hasChanged && item.newQuantity !== item.currentQuantity
  ).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-2 md:p-3 bg-blue-600 rounded-lg md:rounded-xl">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-heading font-bold text-black">
                    Inventaire Physique
                  </h2>
                  <p className="text-xs md:text-sm text-neutral-600 mt-0.5 md:mt-1 hidden sm:block">
                    Comptez vos stocks et mettez à jour les quantités
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 hover:bg-white rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-neutral-600" />
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="mt-3 md:mt-4 relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 border-neutral-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Stats */}
            {changedCount > 0 && (
              <div className="mt-4 p-3 bg-orange-100 border-2 border-orange-300 rounded-xl">
                <p className="text-sm font-heading font-semibold text-orange-800">
                  ⚠️ {changedCount} modification(s) en attente
                </p>
              </div>
            )}
          </div>

          {/* Liste des produits */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6">
            <div className="space-y-2 md:space-y-3">
              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-400 text-lg">Aucun article trouvé</p>
                </div>
              ) : (
                filteredData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                      item.hasChanged && item.newQuantity !== item.currentQuantity
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-neutral-200 bg-neutral-50'
                    }`}
                  >
                    {/* Nom et catégorie */}
                    <div className="mb-3">
                      <h3 className="font-heading font-bold text-black text-sm md:text-base leading-tight">
                        {item.name}
                      </h3>
                      <span className="inline-block px-2 py-1 bg-neutral-200 rounded-lg text-xs font-medium mt-1">
                        {item.category}
                      </span>
                    </div>

                    {/* Desktop: Horizontal layout */}
                    <div className="hidden md:flex items-center gap-4">
                      {/* Quantité actuelle */}
                      <div className="text-center min-w-[120px]">
                        <p className="text-xs text-neutral-600 font-heading font-medium">
                          Qté actuelle
                        </p>
                        <p className="text-2xl font-heading font-bold text-neutral-800 mt-1">
                          {item.currentQuantity}
                        </p>
                      </div>

                      {/* Flèche */}
                      <div className="text-neutral-400">
                        <span className="text-2xl">→</span>
                      </div>

                      {/* Nouvelle quantité avec boutons +/- */}
                      <div className="min-w-[220px]">
                        <p className="text-xs text-neutral-600 font-heading font-medium mb-2">
                          Nouvelle qté
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecrement(item.id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors border-2 border-red-300"
                            title="Diminuer de 1"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.newQuantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-24 px-4 py-2 text-center text-xl font-heading font-bold rounded-lg border-2 border-blue-300 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleIncrement(item.id)}
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors border-2 border-green-300"
                            title="Augmenter de 1"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Différence */}
                      {item.hasChanged && item.newQuantity !== item.currentQuantity && (
                        <div className="text-center min-w-[80px]">
                          <p className="text-xs text-neutral-600 font-heading font-medium">
                            Écart
                          </p>
                          <p
                            className={`text-xl font-heading font-bold mt-1 ${
                              item.newQuantity > item.currentQuantity
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.newQuantity > item.currentQuantity ? '+' : ''}
                            {item.newQuantity - item.currentQuantity}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mobile: Vertical layout */}
                    <div className="md:hidden">
                      {/* Quantité actuelle - Centrée et mise en avant */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 mb-2 border-2 border-blue-200">
                        <p className="text-xs text-blue-700 font-heading font-medium text-center mb-1">
                          Quantité actuelle en stock
                        </p>
                        <p className="text-2xl font-heading font-bold text-blue-900 text-center">
                          {item.currentQuantity}
                        </p>
                      </div>

                      {/* Écart si modifié */}
                      {item.hasChanged && item.newQuantity !== item.currentQuantity && (
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-1.5 mb-2 border-2 border-orange-200">
                          <p className="text-xs text-orange-700 font-heading font-medium text-center mb-0.5">
                            Écart
                          </p>
                          <p
                            className={`text-xl font-heading font-bold text-center ${
                              item.newQuantity > item.currentQuantity
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.newQuantity > item.currentQuantity ? '+' : ''}
                            {item.newQuantity - item.currentQuantity}
                          </p>
                        </div>
                      )}

                      {/* Nouvelle quantité avec boutons +/- */}
                      <div>
                        <p className="text-xs text-neutral-600 font-heading font-medium text-center mb-2">
                          Nouvelle quantité
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleDecrement(item.id)}
                            className="p-3 bg-red-100 active:bg-red-200 text-red-700 rounded-xl transition-colors border-2 border-red-300 active:scale-95"
                          >
                            <Minus className="w-6 h-6" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.newQuantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-24 px-3 py-3 text-center text-2xl font-heading font-bold rounded-xl border-2 border-blue-400 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleIncrement(item.id)}
                            className="p-3 bg-green-100 active:bg-green-200 text-green-700 rounded-xl transition-colors border-2 border-green-300 active:scale-95"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 border-t border-neutral-200 bg-neutral-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
              <div className="text-xs md:text-sm text-neutral-600">
                <span className="font-heading font-semibold text-black">
                  {filteredData.length}
                </span>{' '}
                article(s)
              </div>
              <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={isSaving}
                  className="flex-1 sm:flex-none text-sm md:text-base px-4 py-2"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={changedCount === 0 || isSaving}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-sm md:text-base px-4 py-2"
                >
                  <Save className="w-4 h-4 md:w-5 md:h-5" />
                  {isSaving
                    ? 'Enregistrement...'
                    : `Enregistrer (${changedCount})`}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PhysicalInventoryModal;

