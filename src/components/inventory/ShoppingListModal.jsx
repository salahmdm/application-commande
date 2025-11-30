import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Search, ShoppingCart, Download, Trash2, Copy, Share2, RefreshCw, CheckCircle2, Filter, Package, AlertCircle, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import shoppingListService from '../../services/shoppingListService';
import useNotifications from '../../hooks/useNotifications';
import logger from '../../utils/logger';

/**
 * Modal Liste de Courses - Design sobre noir et blanc
 */
const ShoppingListModal = ({ isOpen, onClose, onRefresh }) => {
  const { success: showSuccess, error: showError } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [processingIds, setProcessingIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('shopping'); // 'shopping' ou 'orders'
  const canShare = typeof navigator !== 'undefined' && navigator.share;

  // Charger la liste (pending + ordered)
  const loadShoppingList = useCallback(async () => {
    try {
      setLoading(true);
      logger.log('🛒 Chargement de la liste de courses...');
      
      // Charger les items avec status 'pending' et 'ordered'
      const [pendingResponse, orderedResponse] = await Promise.all([
        shoppingListService.getShoppingList('pending'),
        shoppingListService.getShoppingList('ordered')
      ]);
      
      const allItems = [];
      if (pendingResponse && pendingResponse.success) {
        allItems.push(...(pendingResponse.data || []));
      }
      if (orderedResponse && orderedResponse.success) {
        allItems.push(...(orderedResponse.data || []));
      }
      
      setItems(allItems);
        if (onRefresh) {
        onRefresh(allItems);
      }
    } catch (error) {
      logger.error('❌ Erreur chargement liste:', error);
      showError('Erreur lors du chargement de la liste de courses');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [showError, onRefresh]);

  useEffect(() => {
    if (isOpen) {
      loadShoppingList();
    }
  }, [isOpen]);

  // Filtrer et trier
  const filteredAndSortedItems = useMemo(() => {
    // Filtrer selon l'onglet actif
    let tabFiltered = items;
    if (activeTab === 'shopping') {
      tabFiltered = items.filter(item => item.status === 'pending');
    } else if (activeTab === 'orders') {
      tabFiltered = items.filter(item => item.status === 'ordered');
    }
    
    let filtered = tabFiltered.filter(item => {
      const matchesSearch = item.ingredient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterPriority === 'all' || item.priority === filterPriority;
      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
      } else if (sortBy === 'name') {
        return (a.ingredient_name || '').localeCompare(b.ingredient_name || '');
      } else if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return 0;
    });

    return filtered;
  }, [items, searchQuery, filterPriority, sortBy, activeTab]);

  // Statistiques
  const stats = useMemo(() => {
    // Filtrer selon l'onglet actif
    let tabItems = items;
    if (activeTab === 'shopping') {
      tabItems = items.filter(i => i.status === 'pending');
    } else if (activeTab === 'orders') {
      tabItems = items.filter(i => i.status === 'ordered');
    }
    
    const total = tabItems.length;
    const urgent = tabItems.filter(i => i.priority === 'urgent').length;
    const high = tabItems.filter(i => i.priority === 'high').length;
    const medium = tabItems.filter(i => i.priority === 'medium').length;
    const low = tabItems.filter(i => i.priority === 'low').length;
    return { total, urgent, high, medium, low };
  }, [items, activeTab]);

  // Marquer comme commandé
  const handleMarkAsOrdered = async (id) => {
    if (processingIds.has(id)) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Mise à jour optimiste de l'état local
    setItems(prev => prev.map(i => 
      i.id === id 
        ? { ...i, status: 'ordered' }
        : i
    ));
    
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const response = await shoppingListService.markAsOrdered(id);
      if (!response || !response.success) {
        // En cas d'erreur, restaurer le status précédent
        setItems(prev => prev.map(i => 
          i.id === id 
            ? { ...i, status: item.status }
            : i
        ));
        showError('Erreur lors de la mise à jour');
      } else {
        showSuccess('Article marqué comme commandé');
      }
    } catch (error) {
      logger.error('❌ Erreur markAsOrdered:', error);
      // En cas d'erreur, restaurer le status précédent
      setItems(prev => prev.map(i => 
        i.id === id 
          ? { ...i, status: item.status }
          : i
      ));
      showError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Marquer comme reçu (seulement si status = "ordered")
  const handleMarkAsReceived = async (id) => {
    if (processingIds.has(id)) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Mise à jour optimiste : retirer l'item de la liste (car status = 'received' n'est pas affiché)
    setItems(prev => prev.filter(i => i.id !== id));
    
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const response = await shoppingListService.markAsReceived(id);
      if (!response || !response.success) {
        // En cas d'erreur, restaurer l'item
        setItems(prev => [...prev, item].sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const aPriority = priorityOrder[a.priority] || 4;
          const bPriority = priorityOrder[b.priority] || 4;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return new Date(a.added_at) - new Date(b.added_at);
        }));
        showError('Erreur lors de la mise à jour');
      } else {
        showSuccess('Article marqué comme reçu et stock mis à jour');
        if (onRefresh) {
          onRefresh(items.filter(i => i.id !== id));
        }
      }
    } catch (error) {
      logger.error('❌ Erreur markAsReceived:', error);
      // En cas d'erreur, restaurer l'item
      setItems(prev => [...prev, item].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority] || 4;
        const bPriority = priorityOrder[b.priority] || 4;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.added_at) - new Date(b.added_at);
      }));
      showError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Modifier la quantité à commander
  const handleQuantityAdjust = async (id, delta) => {
    if (processingIds.has(id)) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const currentQty = parseFloat(item.quantity_needed) || 0;
    const newQuantity = Math.max(0, currentQty + (delta * 0.5));
    
    // Mise à jour optimiste de l'état local
    setItems(prev => prev.map(i => 
      i.id === id 
        ? { ...i, quantity_needed: parseFloat(newQuantity.toFixed(2)) }
        : i
    ));
    
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const response = await shoppingListService.updateShoppingListItem(id, {
        quantity_needed: parseFloat(newQuantity.toFixed(2))
      });
      if (!response || !response.success) {
        // En cas d'erreur, restaurer la valeur précédente
        setItems(prev => prev.map(i => 
          i.id === id 
            ? { ...i, quantity_needed: currentQty }
            : i
        ));
        showError('Erreur lors de la mise à jour de la quantité');
      }
    } catch (error) {
      logger.error('❌ Erreur modification quantité:', error);
      // En cas d'erreur, restaurer la valeur précédente
      setItems(prev => prev.map(i => 
        i.id === id 
          ? { ...i, quantity_needed: currentQty }
          : i
      ));
      showError('Erreur lors de la mise à jour de la quantité');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Supprimer
  const handleDelete = async (id) => {
    if (processingIds.has(id)) return;
    
    if (!window.confirm('Supprimer cet article de la liste ?')) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Mise à jour optimiste : retirer l'item de la liste
    setItems(prev => prev.filter(i => i.id !== id));
    
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const response = await shoppingListService.deleteShoppingListItem(id);
      if (!response || !response.success) {
        // En cas d'erreur, restaurer l'item
        setItems(prev => [...prev, item].sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const aPriority = priorityOrder[a.priority] || 4;
          const bPriority = priorityOrder[b.priority] || 4;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return new Date(a.added_at) - new Date(b.added_at);
        }));
        showError('Erreur lors de la suppression');
      } else {
        showSuccess('Article supprimé');
        if (onRefresh) {
          onRefresh(items.filter(i => i.id !== id));
        }
      }
    } catch (error) {
      logger.error('❌ Erreur suppression:', error);
      // En cas d'erreur, restaurer l'item
      setItems(prev => [...prev, item].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority] || 4;
        const bPriority = priorityOrder[b.priority] || 4;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.added_at) - new Date(b.added_at);
      }));
      showError('Erreur lors de la suppression');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Export (uniquement les produits commandés)
  const handleExport = async (format) => {
    try {
      const orderedItems = items.filter(item => item.status === 'ordered');
      
      if (format === 'txt') {
        const content = orderedItems.map(item => {
          let text = `- ${item.ingredient_name}`;
          if (item.quantity_needed) {
            text += ` (${item.quantity_needed}`;
            if (item.unit) text += ` ${item.unit}`;
            text += ')';
          }
          return text;
        }).join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commande-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === 'csv') {
        const headers = ['Produit', 'Quantité', 'Unité', 'Priorité'];
        const rows = orderedItems.map(item => [
          item.ingredient_name || '',
          item.quantity_needed || '',
          item.unit || '',
          item.priority || ''
        ]);
        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commande-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      showSuccess(`Commande exportée en ${format.toUpperCase()}`);
    } catch (error) {
      logger.error('Erreur export:', error);
      showError('Erreur lors de l\'export');
    }
  };

  // Copier (uniquement les produits commandés)
  const handleCopyToClipboard = async () => {
    try {
      const orderedItems = items.filter(item => item.status === 'ordered');
      const listText = orderedItems.map(item => {
        let text = `- ${item.ingredient_name}`;
        if (item.quantity_needed) {
          text += ` (${item.quantity_needed}`;
          if (item.unit) text += ` ${item.unit}`;
          text += ')';
        }
        return text;
      }).join('\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(listText);
        showSuccess('Liste copiée dans le presse-papier !');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = listText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('Liste copiée dans le presse-papier !');
      }
    } catch (error) {
      logger.error('Erreur copie:', error);
      showError('Erreur lors de la copie');
    }
  };

  // Partager (uniquement les produits commandés)
  const handleShare = async () => {
    try {
      const orderedItems = items.filter(item => item.status === 'ordered');
      const listText = orderedItems.map(item => {
        let text = `- ${item.ingredient_name}`;
        if (item.quantity_needed) {
          text += ` (${item.quantity_needed}`;
          if (item.unit) text += ` ${item.unit}`;
          text += ')';
        }
        return text;
      }).join('\n');

      if (navigator.share) {
        await navigator.share({
          title: 'Liste de Courses',
          text: listText,
        });
        showSuccess('Liste partagée !');
      } else {
        handleCopyToClipboard();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.error('Erreur partage:', error);
        showError('Erreur lors du partage');
      }
    }
  };

  // Obtenir le style de priorité en noir et blanc
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return { bg: 'bg-black', text: 'text-white', border: 'border-black', label: '🔴 Urgent' };
      case 'high':
        return { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-800', label: '🟠 Élevée' };
      case 'medium':
        return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500', label: '🟡 Moyenne' };
      case 'low':
        return { bg: 'bg-gray-300', text: 'text-gray-900', border: 'border-gray-300', label: '🔵 Faible' };
      default:
        return { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-400', label: 'Priorité' };
    }
  };

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
              <div className="flex-1">
                {/* Onglets */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab('shopping')}
                    className={`flex-1 py-3 md:py-4 px-4 md:px-6 text-base md:text-lg font-bold rounded-lg transition-all ${
                      activeTab === 'shopping'
                        ? 'bg-gray-900 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Liste de courses
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 py-3 md:py-4 px-4 md:px-6 text-base md:text-lg font-bold rounded-lg transition-all relative ${
                      activeTab === 'orders'
                        ? 'bg-gray-900 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Commande
                    {items.filter(i => i.status === 'ordered').length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {items.filter(i => i.status === 'ordered').length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors ml-4"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Statistiques en noir et blanc - Seulement rupture et stock bas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-300">
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-300">
                <p className="text-xs text-gray-600">⚠️ Rupture</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.urgent}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-300">
                <p className="text-xs text-gray-600">⚠️ Stock bas</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.high}</p>
              </div>
            </div>

            {/* Barre de recherche et filtres - Sur la même ligne */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="min-w-[140px] px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="all">Toutes priorités</option>
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 Élevée</option>
                  <option value="medium">🟡 Moyenne</option>
                  <option value="low">🔵 Faible</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="min-w-[160px] px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="priority">Trier par priorité</option>
                  <option value="name">Trier par nom</option>
                  <option value="category">Trier par catégorie</option>
                </select>
                <Button
                  variant="outline"
                  onClick={loadShoppingList}
                  disabled={loading}
                  className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Liste des articles */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Chargement de la liste...</p>
                </div>
              </div>
            ) : filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  {items.length === 0 ? 'Liste de courses vide' : 'Aucun article ne correspond aux filtres'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {filteredAndSortedItems.map((item, index) => {
                  const priorityStyle = getPriorityStyle(item.priority);
                  const isProcessing = processingIds.has(item.id);
                  
                  return (
                  <motion.div
                    key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`relative p-4 md:p-5 rounded-2xl border-2 shadow-lg bg-white transition-all ${
                        item.priority === 'urgent' 
                          ? 'border-black'
                          : item.priority === 'high'
                          ? 'border-gray-800'
                          : item.priority === 'medium'
                          ? 'border-gray-500'
                          : 'border-gray-300'
                      } ${isProcessing ? 'opacity-50' : ''}`}
                    >
                      {/* Badge de priorité - Seulement rupture et stock bas */}
                      {(item.priority === 'urgent' || item.priority === 'high') && (
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${priorityStyle.bg} ${priorityStyle.text} border ${priorityStyle.border}`}>
                          {item.priority === 'urgent' ? '⚠️ Rupture' : '⚠️ Stock bas'}
                        </div>
                      )}

                      {/* Nom et catégorie */}
                      <div className="mb-4 pr-20">
                        <h3 className="text-lg md:text-xl font-heading font-bold text-gray-900 mb-2">
                          {item.ingredient_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-300">
                            📦 {item.category || 'Sans catégorie'}
                        </span>
                      </div>
                    </div>

                      {/* Indicateur "En commande" pour les produits commandés */}
                      {item.status === 'ordered' && (
                        <div className="bg-blue-50 rounded-xl p-3 mb-4 border-2 border-blue-400">
                          <div className="flex items-center justify-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div className="text-center">
                              <p className="text-sm font-bold text-blue-900">En commande</p>
                              <p className="text-xs text-blue-700">
                                Quantité commandée : <span className="font-bold">{item.quantity_needed}</span> {item.unit || ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stock actuel et quantité à commander */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Stock actuel */}
                        <div className="bg-gray-50 rounded-xl p-3 text-center border-2 border-gray-200">
                          <p className="text-xs text-gray-600 font-medium mb-1.5">Stock actuel</p>
                          <p className="text-xl md:text-2xl font-bold text-gray-900">
                            {item.current_quantity || 0}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{item.unit || ''}</p>
                        </div>

                        {/* Quantité à commander avec boutons +/- */}
                        <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-400">
                          <p className="text-xs text-gray-600 font-medium mb-1.5 text-center">À commander</p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleQuantityAdjust(item.id, -1)}
                              disabled={processingIds.has(item.id) || item.status === 'ordered'}
                              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors border-2 border-gray-400 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Diminuer de 0,5"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <div className="text-center">
                              <p className="text-lg md:text-xl font-bold text-gray-900">
                                {item.quantity_needed}
                              </p>
                              <p className="text-xs text-gray-500">{item.unit || ''}</p>
                            </div>
                            <button
                              onClick={() => handleQuantityAdjust(item.id, 1)}
                              disabled={processingIds.has(item.id) || item.status === 'ordered'}
                              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors border-2 border-gray-400 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Augmenter de 0,5"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                    {item.notes && (
                        <div className="mb-4 p-3 bg-gray-100 rounded-xl border border-gray-300">
                          <p className="text-xs text-gray-600 font-medium mb-1">📝 Note</p>
                          <p className="text-sm text-gray-700">{item.notes}</p>
                      </div>
                    )}

                     {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-gray-300">
                        {item.status === 'pending' ? (
                          <button
                            onClick={() => handleMarkAsOrdered(item.id)}
                            disabled={isProcessing}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                              isProcessing
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-900 hover:bg-black text-white shadow-md hover:shadow-lg'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            {isProcessing ? 'Traitement...' : 'Commandé'}
                          </button>
                        ) : item.status === 'ordered' ? (
                          <button
                         onClick={() => handleMarkAsReceived(item.id)}
                            disabled={isProcessing}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                              isProcessing
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            {isProcessing ? 'Traitement...' : 'Produit reçu'}
                          </button>
                        ) : null}
                        <button
                        onClick={() => handleDelete(item.id)}
                          disabled={isProcessing}
                          className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                            isProcessing
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-800 hover:bg-gray-900 text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          <Trash2 className="w-5 h-5" />
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
              <div className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{filteredAndSortedItems.length}</span> article(s)
                {items.length > 0 && filteredAndSortedItems.length < items.length && (
                  <span className="text-gray-500 ml-2">
                    ({items.length - filteredAndSortedItems.length} masqué(s))
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
                {activeTab === 'orders' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCopyToClipboard}
                      disabled={items.filter(i => i.status === 'ordered').length === 0}
                      className="flex-1 sm:flex-none border-gray-400 text-gray-700 hover:bg-gray-200"
                    >
                      <Copy className="w-4 h-4" />
                      Copier
                    </Button>
                    {canShare && (
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        disabled={items.filter(i => i.status === 'ordered').length === 0}
                        className="flex-1 sm:flex-none border-gray-400 text-gray-700 hover:bg-gray-200"
                      >
                      <Share2 className="w-4 h-4" />
                      Partager
                    </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleExport('txt')}
                      disabled={items.filter(i => i.status === 'ordered').length === 0}
                      className="flex-1 sm:flex-none border-gray-400 text-gray-700 hover:bg-gray-200"
                    >
                      <Download className="w-4 h-4" />
                      TXT
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('csv')}
                      disabled={items.filter(i => i.status === 'ordered').length === 0}
                      className="flex-1 sm:flex-none border-gray-400 text-gray-700 hover:bg-gray-200"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </Button>
                  </>
                )}
              <Button 
                variant="outline" 
                onClick={onClose}
                  className="flex-1 sm:flex-none border-gray-400 text-gray-700 hover:bg-gray-200"
              >
                Fermer
              </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShoppingListModal;
