import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Search, Package, Plus, Minus, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import shoppingListService from '../../services/shoppingListService';
import useNotifications from '../../hooks/useNotifications';
import logger from '../../utils/logger';

/**
 * Modal pour faire un inventaire physique
 * Permet de compter et mettre à jour les quantités réelles
 */
const PhysicalInventoryModal = ({ isOpen, onClose, items, onUpdate }) => {
  const { success: showSuccess, error: showError } = useNotifications();
  const [inventoryData, setInventoryData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [autoAddStatus, setAutoAddStatus] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  // Ajouter automatiquement les produits sous stock_min
  const handleAutoAddLowStock = useCallback(async () => {
    try {
      setAutoAddStatus({ loading: true, message: 'Ajout automatique en cours...' });
      const response = await shoppingListService.autoAddLowStock();
      
      if (response.success && response.added > 0) {
        setAutoAddStatus({ 
          success: true, 
          message: `${response.added} produit(s) ajouté(s) automatiquement à la liste de courses`,
          count: response.added
        });
        showSuccess(`${response.added} produit(s) ajouté(s) automatiquement à la liste de courses`);
      } else {
        setAutoAddStatus({ 
          success: true, 
          message: 'Aucun produit sous stock minimal',
          count: 0
        });
      }
    } catch (error) {
      logger.error('Erreur ajout automatique:', error);
      setAutoAddStatus({ 
        error: true, 
        message: 'Erreur lors de l\'ajout automatique'
      });
      showError('Erreur lors de l\'ajout automatique');
    }
  }, [showSuccess, showError]);

  // Initialiser les données d'inventaire et ajout automatique
  useEffect(() => {
    if (isOpen && items) {
      setInventoryData(
        items.map(item => {
          const quantity = item.quantity || 0;
          const minQuantity = item.minQuantity || 0;
          let stockStatus = 'good'; // Vert par défaut
          
          if (quantity === 0) {
            stockStatus = 'out'; // Rouge - rupture
          } else if (minQuantity > 0 && quantity < minQuantity) {
            stockStatus = 'low'; // Orange - stock bas
          } else {
            stockStatus = 'good'; // Vert - bon stock
          }
          
          return {
            id: item.id,
            name: item.name,
            category: item.category,
            currentQuantity: quantity,
            newQuantity: quantity,
            minQuantity: minQuantity,
            unit: item.unit,
            hasChanged: false,
            isBelowMin: quantity < minQuantity && minQuantity > 0,
            stockStatus: stockStatus
          };
        })
      );

      // Ajouter automatiquement les produits sous stock_min
      handleAutoAddLowStock();
    }
  }, [isOpen, items, handleAutoAddLowStock]);

  // Ajouter un produit à la liste de courses
  const handleAddToShoppingList = async (item) => {
    try {
      setAddingToCart(prev => ({ ...prev, [item.id]: true }));
      
      // Calculer la quantité nécessaire (stock_min - quantité actuelle)
      const quantityNeeded = item.minQuantity > 0 && item.currentQuantity < item.minQuantity
        ? item.minQuantity - item.currentQuantity
        : 1; // Par défaut 1 si pas de stock_min défini
      
      // Déterminer la priorité
      let priority = 'medium';
      if (item.currentQuantity === 0) priority = 'urgent';
      else if (item.currentQuantity < item.minQuantity * 0.3) priority = 'high';
      
      const response = await shoppingListService.addToShoppingList(
        item.id,
        quantityNeeded,
        null,
        priority
      );
      
      if (response.success) {
        showSuccess(`"${item.name}" ajouté à la liste de courses`);
      }
    } catch (error) {
      logger.error('Erreur ajout à la liste:', error);
      showError('Erreur lors de l\'ajout à la liste de courses');
    } finally {
      setAddingToCart(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Filtrer les produits par recherche
  const filteredData = inventoryData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculer le statut de stock basé sur la quantité
  const calculateStockStatus = (quantity, minQuantity) => {
    const qty = parseFloat(quantity) || 0;
    const min = parseFloat(minQuantity) || 0;
    
    if (qty === 0) {
      return 'out'; // Rouge - rupture
    } else if (min > 0 && qty < min) {
      return 'low'; // Orange - stock bas
    } else {
      return 'good'; // Vert - bon stock
    }
  };

  // Mettre à jour la nouvelle quantité
  const handleQuantityChange = (id, value) => {
    setInventoryData(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = value === '' ? '' : parseFloat(value) || 0;
          const stockStatus = calculateStockStatus(newQuantity, item.minQuantity);
          return {
            ...item,
            newQuantity: newQuantity,
            hasChanged: true,
            stockStatus: stockStatus
          };
        }
        return item;
      })
    );
  };

  // Incrémenter la quantité
  const handleIncrement = (id) => {
    setInventoryData(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = (parseFloat(item.newQuantity) || 0) + 1;
          const stockStatus = calculateStockStatus(newQuantity, item.minQuantity);
          return {
            ...item,
            newQuantity: newQuantity,
            hasChanged: true,
            stockStatus: stockStatus
          };
        }
        return item;
      })
    );
  };

  // Décrémenter la quantité
  const handleDecrement = (id) => {
    setInventoryData(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, (parseFloat(item.newQuantity) || 0) - 1);
          const stockStatus = calculateStockStatus(newQuantity, item.minQuantity);
          return {
            ...item,
            newQuantity: newQuantity,
            hasChanged: true,
            stockStatus: stockStatus
          };
        }
        return item;
      })
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 pt-20 md:pt-24 lg:pt-28 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[calc(100vh-5rem-1rem)] md:max-h-[calc(100vh-6rem-2rem)] lg:max-h-[calc(100vh-7rem-2rem)] flex flex-col"
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

            {/* Stats et notifications */}
            <div className="mt-4 space-y-2">
              {autoAddStatus && (
                <div className={`p-3 rounded-xl border-2 ${
                  autoAddStatus.error 
                    ? 'bg-red-100 border-red-300 text-red-800'
                    : autoAddStatus.success && autoAddStatus.count > 0
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'bg-blue-100 border-blue-300 text-blue-800'
                }`}>
                  <p className="text-sm font-heading font-semibold flex items-center gap-2">
                    {autoAddStatus.loading && <span className="animate-spin">⏳</span>}
                    {autoAddStatus.success && autoAddStatus.count > 0 && <CheckCircle className="w-4 h-4" />}
                    {autoAddStatus.error && <AlertCircle className="w-4 h-4" />}
                    {autoAddStatus.message}
                  </p>
                </div>
              )}
              {changedCount > 0 && (
                <div className="p-3 bg-orange-100 border-2 border-orange-300 rounded-xl">
                  <p className="text-sm font-heading font-semibold text-orange-800">
                    ⚠️ {changedCount} modification(s) en attente
                  </p>
                </div>
              )}
            </div>
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
                      item.stockStatus === 'out'
                        ? 'border-red-500 bg-red-50'
                        : item.stockStatus === 'low'
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-green-400 bg-green-50'
                    }`}
                  >
                    {/* Nom et catégorie */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-black text-sm md:text-base leading-tight">
                            {item.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="inline-block px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-heading font-semibold border border-blue-200">
                            📦 {item.category}
                          </span>
                          {item.minQuantity > 0 && (
                            <span className="text-xs text-neutral-600 font-medium">
                              Min: {item.minQuantity} {item.unit || ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Bouton Ajouter à la liste */}
                      <button
                        onClick={() => handleAddToShoppingList(item)}
                        disabled={addingToCart[item.id]}
                        className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                          addingToCart[item.id]
                            ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title="Ajouter à la liste de courses"
                      >
                        <ShoppingCart className={`w-4 h-4 ${addingToCart[item.id] ? 'animate-pulse' : ''}`} />
                      </button>
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

