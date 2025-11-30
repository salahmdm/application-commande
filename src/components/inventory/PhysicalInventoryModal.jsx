import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Search, Package, Plus, Minus, ShoppingCart, AlertCircle, CheckCircle, Filter, TrendingDown, TrendingUp, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import shoppingListService from '../../services/shoppingListService';
import useNotifications from '../../hooks/useNotifications';
import logger from '../../utils/logger';

/**
 * Modal pour faire un inventaire physique - Design sobre noir et blanc
 */
const PhysicalInventoryModal = ({ isOpen, onClose, items, onUpdate }) => {
  const { success: showSuccess, error: showError } = useNotifications();
  const [inventoryData, setInventoryData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [autoAddStatus, setAutoAddStatus] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [itemsInShoppingList, setItemsInShoppingList] = useState(new Map()); // Map<ingredient_id, shopping_list_id>
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Charger la liste de courses pour savoir quels articles sont déjà dedans
  const loadShoppingList = useCallback(async (preserveExisting = false) => {
    try {
      const response = await shoppingListService.getShoppingList('pending');
      if (response && response.success) {
        const map = new Map();
        (response.data || []).forEach(item => {
          if (item.ingredient_id) {
            map.set(parseInt(item.ingredient_id), item.id); // ingredient_id -> shopping_list_id
          }
        });
        logger.log('🛒 Liste de courses chargée:', map.size, 'article(s)', Array.from(map.keys()));
        
        // Si preserveExisting est true, fusionner avec la Map existante
        // On garde les items de la Map existante qui ne sont pas dans la réponse du serveur
        // (au cas où le serveur n'a pas encore propagé les changements)
        if (preserveExisting) {
          setItemsInShoppingList(prev => {
            const merged = new Map(prev);
            // Ajouter/mettre à jour tous les items du serveur
            map.forEach((value, key) => {
              merged.set(key, value);
            });
            // Garder les items de la Map précédente qui ne sont pas dans la réponse du serveur
            // (ils pourraient être des ajouts récents qui ne sont pas encore dans la réponse)
            prev.forEach((value, key) => {
              if (!map.has(key)) {
                // Si l'item n'est pas dans la réponse du serveur mais était dans la Map précédente,
                // on le garde seulement s'il a un ID valide (pas un ID temporaire)
                if (typeof value === 'number' || (typeof value === 'string' && !value.startsWith('temp-'))) {
                  merged.set(key, value);
                }
              }
            });
            logger.log('🛒 Map fusionnée:', merged.size, 'article(s)', Array.from(merged.keys()));
            return merged;
          });
        } else {
          setItemsInShoppingList(map);
        }
        return map;
      } else {
        // Si pas de succès, réinitialiser la map seulement si preserveExisting est false
        if (!preserveExisting) {
          setItemsInShoppingList(new Map());
        }
        return new Map();
      }
    } catch (error) {
      logger.error('Erreur chargement liste de courses:', error);
      // En cas d'erreur, réinitialiser la map seulement si preserveExisting est false
      if (!preserveExisting) {
        setItemsInShoppingList(new Map());
      }
      return new Map();
    }
  }, []);

  // Ajouter automatiquement les produits sous stock_min
  const handleAutoAddLowStock = useCallback(async () => {
    try {
      setAutoAddStatus({ loading: true, message: 'Ajout automatique en cours...' });
      const response = await shoppingListService.autoAddLowStock();
      
      // Vérifier si la réponse est valide
      if (!response) {
        logger.error('Réponse vide de autoAddLowStock');
        setAutoAddStatus(null);
        return;
      }
      
      logger.log('🛒 Réponse autoAddLowStock:', { success: response.success, added: response.added, error: response.error });
      
      // Si l'API retourne success: false, c'est une erreur
      if (response.success === false) {
        const errorMessage = response.error || response.message || 'Erreur lors de l\'ajout automatique';
        logger.error('Erreur API ajout automatique:', errorMessage);
        setAutoAddStatus({ 
          error: true, 
          message: errorMessage
        });
        showError(errorMessage);
        return;
      }
      
      // Si succès et des produits ont été ajoutés
      if (response.success && response.added > 0) {
        setAutoAddStatus({ 
          success: true, 
          message: `${response.added} produit(s) ajouté(s) automatiquement à la liste de courses`,
          count: response.added
        });
        showSuccess(`${response.added} produit(s) ajouté(s) automatiquement à la liste de courses`);
        // Recharger la liste de courses pour mettre à jour les boutons
        await loadShoppingList();
      } else if (response.success && response.added === 0) {
        // Succès mais aucun produit ajouté (normal - pas de produits en stock bas)
        setAutoAddStatus(null);
      } else {
        // Cas inattendu
        logger.warn('Réponse inattendue de autoAddLowStock:', response);
        setAutoAddStatus(null);
      }
    } catch (error) {
      logger.error('Erreur ajout automatique (exception):', error);
      const errorMessage = error.message || error.error || 'Erreur lors de l\'ajout automatique';
      setAutoAddStatus({ 
        error: true, 
        message: errorMessage
      });
      showError(errorMessage);
    }
  }, [showSuccess, showError, loadShoppingList]);

  // Initialiser les données d'inventaire
  useEffect(() => {
    if (isOpen && items) {
      setInventoryData(
        items.map(item => {
          const quantity = item.quantity || 0;
          const minQuantity = item.minQuantity || 0;
          let stockStatus = 'good';
          
          if (quantity === 0) {
            stockStatus = 'out';
          } else if (minQuantity > 0 && quantity < minQuantity) {
            stockStatus = 'low';
          } else {
            stockStatus = 'good';
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

      handleAutoAddLowStock();
      // Charger la liste de courses pour savoir quels articles sont déjà dedans
      loadShoppingList();
    }
  }, [isOpen, items, handleAutoAddLowStock, loadShoppingList]);

  // Ajouter ou retirer un produit de la liste de courses
  const handleToggleShoppingList = async (item) => {
    // Vérifier avec les deux types possibles (string et number)
    const itemIdNum = parseInt(item.id);
    const isInList = itemsInShoppingList.has(itemIdNum) || itemsInShoppingList.has(item.id);
    logger.log('🛒 Toggle liste:', { itemId: item.id, itemIdNum, itemName: item.name, isInList, mapKeys: Array.from(itemsInShoppingList.keys()) });
    
    try {
      setAddingToCart(prev => ({ ...prev, [item.id]: true }));
      
      if (isInList) {
        // Retirer de la liste
        const shoppingListId = itemsInShoppingList.get(itemIdNum) || itemsInShoppingList.get(item.id);
        logger.log('🛒 Suppression de la liste, shoppingListId:', shoppingListId);
        const response = await shoppingListService.deleteShoppingListItem(shoppingListId);
        
        if (response && response.success) {
          // Mettre à jour la Map immédiatement en retirant l'item
          setItemsInShoppingList(prev => {
            const next = new Map(prev);
            next.delete(itemIdNum);
            next.delete(item.id);
            logger.log('🛒 Map mise à jour immédiatement (suppression):', { itemIdNum, mapSize: next.size });
            return next;
          });
          
          // Recharger depuis le serveur pour avoir l'état à jour
          await new Promise(resolve => setTimeout(resolve, 200));
          await loadShoppingList();
          showSuccess(`"${item.name}" retiré de la liste de courses`);
        } else {
          showError('Erreur lors de la suppression de la liste de courses');
          await loadShoppingList();
        }
      } else {
        // Ajouter à la liste
      const quantityNeeded = item.minQuantity > 0 && item.currentQuantity < item.minQuantity
        ? item.minQuantity - item.currentQuantity
          : 1;
      
      let priority = 'medium';
      if (item.currentQuantity === 0) priority = 'urgent';
      else if (item.currentQuantity < item.minQuantity * 0.3) priority = 'high';
      
        logger.log('🛒 Ajout à la liste:', { itemId: item.id, quantityNeeded, priority });
      const response = await shoppingListService.addToShoppingList(
        item.id,
        quantityNeeded,
        null,
        priority
      );
      
        if (response && response.success) {
          // Mettre à jour la Map immédiatement avec l'ID retourné par l'API
          const shoppingListItemId = response.data?.id;
          
          if (shoppingListItemId) {
            // Mettre à jour la Map immédiatement pour que le bouton change tout de suite
            // On crée une nouvelle Map pour forcer React à détecter le changement
            const newMap = new Map(itemsInShoppingList);
            newMap.set(itemIdNum, shoppingListItemId);
            // Aussi avec item.id au cas où (string)
            if (String(item.id) !== String(itemIdNum)) {
              newMap.set(item.id, shoppingListItemId);
            }
            logger.log('🛒 Map mise à jour immédiatement:', { itemIdNum, itemId: item.id, shoppingListItemId, mapSize: newMap.size, mapKeys: Array.from(newMap.keys()) });
            setItemsInShoppingList(newMap);
            
            // Ne pas recharger automatiquement - la Map est déjà à jour avec l'ID de l'API
            // Le rechargement se fera lors de l'ouverture suivante du modal ou lors d'autres actions
          } else {
            // Si pas d'ID retourné, recharger depuis le serveur
            await loadShoppingList();
          }
          
        showSuccess(`"${item.name}" ajouté à la liste de courses`);
        } else {
          showError('Erreur lors de l\'ajout à la liste de courses');
          await loadShoppingList();
        }
      }
    } catch (error) {
      logger.error('Erreur toggle liste de courses:', error);
      showError(`Erreur lors de ${isInList ? 'la suppression' : "l'ajout"} à la liste de courses`);
      await loadShoppingList();
    } finally {
      setAddingToCart(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Calculer le statut de stock
  const calculateStockStatus = (quantity, minQuantity) => {
    const qty = parseFloat(quantity) || 0;
    const min = parseFloat(minQuantity) || 0;
    
    if (qty === 0) return 'out';
    else if (min > 0 && qty < min) return 'low';
    else return 'good';
  };

  // Mettre à jour la quantité
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

  // Incrémenter/Décrémenter (par pas de 0.5)
  const handleQuantityAdjust = (id, delta) => {
    setInventoryData(prev =>
      prev.map(item => {
        if (item.id === id) {
          const currentQty = parseFloat(item.newQuantity) || 0;
          const newQuantity = Math.max(0, currentQty + (delta * 0.5));
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

  // Réinitialiser une quantité
  const handleReset = (id) => {
    setInventoryData(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            newQuantity: item.currentQuantity,
            hasChanged: false,
            stockStatus: calculateStockStatus(item.currentQuantity, item.minQuantity)
          };
        }
        return item;
      })
    );
  };

  // Réinitialiser toutes les modifications
  const handleResetAll = () => {
    if (window.confirm('Réinitialiser toutes les modifications ?')) {
      setInventoryData(prev =>
        prev.map(item => ({
          ...item,
          newQuantity: item.currentQuantity,
          hasChanged: false,
          stockStatus: calculateStockStatus(item.currentQuantity, item.minQuantity)
        }))
      );
    }
  };

  // Filtrer et trier
  const filteredAndSortedData = useMemo(() => {
    let filtered = inventoryData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || item.stockStatus === filterStatus;
      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'status') {
        const statusOrder = { out: 0, low: 1, good: 2 };
        return statusOrder[a.stockStatus] - statusOrder[b.stockStatus];
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });

    return filtered;
  }, [inventoryData, searchQuery, filterStatus, sortBy]);

  // Sauvegarder
  const handleSave = async () => {
    const changedItems = inventoryData.filter(
      item => item.hasChanged && item.newQuantity !== item.currentQuantity
    );

    if (changedItems.length === 0) {
      showError('Aucune modification à enregistrer');
      return;
    }

      setIsSaving(true);
    try {
      await onUpdate(changedItems);
      showSuccess(`${changedItems.length} article(s) mis à jour avec succès !`);
      onClose();
    } catch (error) {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = inventoryData.length;
    const out = inventoryData.filter(i => i.stockStatus === 'out').length;
    const low = inventoryData.filter(i => i.stockStatus === 'low').length;
    const good = inventoryData.filter(i => i.stockStatus === 'good').length;
    const changed = inventoryData.filter(i => i.hasChanged && i.newQuantity !== i.currentQuantity).length;
    return { total, out, low, good, changed };
  }, [inventoryData]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 pt-20 md:pt-24 lg:pt-28 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-7xl max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden"
        >
          {/* Header blanc */}
          <div className="bg-white border-b border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-xl border border-gray-300">
                  <Package className="w-6 h-6 md:w-7 md:h-7 text-gray-900" />
                </div>
                <div>
                  <h2 className="text-xl md:text-3xl font-heading font-bold text-gray-900">
                    Inventaire Physique
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mt-1">
                    Comptez et mettez à jour vos stocks
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Statistiques en noir et blanc - Sur une seule ligne même sur mobile */}
            <div className="grid grid-cols-4 gap-1.5 md:gap-3">
              <div className="bg-gray-50 rounded-lg p-1.5 md:p-3 text-center border border-gray-300">
                <p className="text-[10px] md:text-xs text-gray-600">Total</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-1.5 md:p-3 text-center border border-gray-300">
                <p className="text-[10px] md:text-xs text-gray-600">⚠️ Rupture</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900">{stats.out}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-1.5 md:p-3 text-center border border-gray-300">
                <p className="text-[10px] md:text-xs text-gray-600">⚠️ Stock bas</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900">{stats.low}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-1.5 md:p-3 text-center border border-gray-300">
                <p className="text-[10px] md:text-xs text-gray-600">Modifiés</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900">{stats.changed}</p>
              </div>
            </div>

            {/* Barre de recherche et filtres - Sur la même ligne */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                  placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="min-w-[140px] px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="out">Rupture</option>
                  <option value="low">Stock bas</option>
                  <option value="good">Stock OK</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="min-w-[160px] px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="name">Trier par nom</option>
                  <option value="status">Trier par statut</option>
                  <option value="category">Trier par catégorie</option>
                </select>
              </div>
            </div>

            {/* Notification auto-add */}
              {autoAddStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-300"
              >
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {autoAddStatus.loading && <span className="animate-spin">⏳</span>}
                    {autoAddStatus.success && autoAddStatus.count > 0 && <CheckCircle className="w-4 h-4" />}
                    {autoAddStatus.error && <AlertCircle className="w-4 h-4" />}
                    {autoAddStatus.message}
                  </p>
              </motion.div>
            )}
          </div>

          {/* Liste des produits */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            {filteredAndSortedData.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Aucun produit trouvé</p>
                </div>
              ) : (
              <div className="space-y-2 md:space-y-3">
                {filteredAndSortedData.map((item, index) => {
                  const difference = item.newQuantity - item.currentQuantity;
                  const isIncreased = difference > 0;
                  const isDecreased = difference < 0;
                  
                  return (
                  <motion.div
                    key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`relative p-3 md:p-4 rounded-2xl border-2 shadow-lg bg-white transition-all ${
                      item.stockStatus === 'out'
                          ? 'border-gray-800'
                        : item.stockStatus === 'low'
                          ? 'border-gray-600'
                          : 'border-gray-300'
                      } ${item.hasChanged ? 'ring-2 ring-gray-400 ring-offset-2' : ''}`}
                    >
                      {/* Badge de statut - Seulement rupture et stock bas */}
                      {(item.stockStatus === 'out' || item.stockStatus === 'low') && (
                        <div className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.stockStatus === 'out'
                            ? 'bg-black text-white'
                            : 'bg-gray-700 text-white'
                        }`}>
                          {item.stockStatus === 'out' ? '⚠️ Rupture' : '⚠️ Stock bas'}
                        </div>
                      )}

                    {/* Nom et catégorie */}
                      <div className="mb-3 pr-20">
                        <h3 className="text-base md:text-lg font-heading font-bold text-gray-900 mb-1.5">
                            {item.name}
                          </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-300">
                            📦 {item.category}
                          </span>
                          {item.minQuantity > 0 && (
                            <span className="text-xs text-gray-600 font-medium">
                              Min: {item.minQuantity} {item.unit || ''}
                            </span>
                          )}
                        </div>
                    </div>

                      {/* Quantités */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        {/* Quantité actuelle */}
                        <div className="bg-gray-50 rounded-xl p-3 text-center border-2 border-gray-200">
                          <p className="text-xs text-gray-600 font-medium mb-1.5">Quantité actuelle</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900">
                            {item.currentQuantity}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{item.unit || ''}</p>
                        </div>

                        {/* Nouvelle quantité avec écart à droite */}
                        <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-400">
                          <div className="flex items-start gap-3">
                            {/* Nouvelle quantité */}
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 font-medium mb-1.5 text-center">Nouvelle quantité</p>
                              <div className="flex items-center justify-center gap-2.5">
                                <button
                                  onClick={() => handleQuantityAdjust(item.id, -1)}
                                  className="p-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors border-2 border-gray-400 shadow-sm hover:shadow-md"
                                  title="Diminuer de 0,5"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={item.newQuantity}
                                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                  className="w-20 md:w-28 px-3 py-2 text-center text-lg md:text-xl font-bold rounded-xl border-2 border-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                />
                                <button
                                  onClick={() => handleQuantityAdjust(item.id, 1)}
                                  className="p-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors border-2 border-gray-400 shadow-sm hover:shadow-md"
                                  title="Augmenter de 0,5"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              {item.hasChanged && (
                                <button
                                  onClick={() => handleReset(item.id)}
                                  className="mt-2 w-full py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Réinitialiser
                                </button>
                              )}
                            </div>

                            {/* Écart à droite */}
                            {item.hasChanged && difference !== 0 && (
                              <div className="bg-gray-100 rounded-xl p-3 text-center border-2 border-gray-400 min-w-[80px]">
                                <p className="text-xs text-gray-600 font-medium mb-1.5">Écart</p>
                                <div className={`flex items-center justify-center gap-1 text-lg md:text-xl font-bold ${
                                  isIncreased ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {isIncreased ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                  {isIncreased ? '+' : ''}{difference}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2.5 border-t border-gray-300">
                        <button
                          onClick={() => handleToggleShoppingList(item)}
                          disabled={addingToCart[item.id]}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                            addingToCart[item.id]
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : itemsInShoppingList.has(parseInt(item.id)) || itemsInShoppingList.has(item.id)
                              ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg'
                              : 'bg-gray-900 hover:bg-black text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          {itemsInShoppingList.has(parseInt(item.id)) || itemsInShoppingList.has(item.id) ? (
                            <>
                              <X className="w-4 h-4" />
                              Annuler
                            </>
                          ) : (
                            <>
                              <ShoppingCart className={`w-4 h-4 ${addingToCart[item.id] ? 'animate-pulse' : ''}`} />
                              {addingToCart[item.id] ? 'Ajout...' : 'Ajouter à la liste'}
                            </>
                          )}
                          </button>
                      </div>
                    </motion.div>
                  );
                })}
                    </div>
              )}
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 bg-gray-100 border-t border-gray-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">{filteredAndSortedData.length}</span> article(s)
                </div>
                {stats.changed > 0 && (
                  <div className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-semibold border border-gray-400">
                    {stats.changed} modification(s)
                  </div>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {stats.changed > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleResetAll}
                    className="flex-1 sm:flex-none border-gray-400 text-gray-700 hover:bg-gray-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Tout réinitialiser
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={isSaving}
                  className="flex-1 sm:flex-none border-gray-400 text-gray-700 hover:bg-gray-200"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={stats.changed === 0 || isSaving}
                  className="flex-1 sm:flex-none bg-gray-900 hover:bg-black text-white shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Enregistrement...' : `Enregistrer (${stats.changed})`}
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
