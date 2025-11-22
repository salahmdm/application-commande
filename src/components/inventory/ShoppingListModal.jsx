import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, ShoppingCart, Download, Trash2, Copy, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import shoppingListService from '../../services/shoppingListService';
import useNotifications from '../../hooks/useNotifications';
import logger from '../../utils/logger';

/**
 * Modal pour afficher la liste de courses
 * Similaire à PhysicalInventoryModal mais pour la liste de courses
 */
const ShoppingListModal = ({ isOpen, onClose, onRefresh }) => {
  const { success: showSuccess, error: showError } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const canShare = typeof navigator !== 'undefined' && navigator.share;

  // Charger la liste de courses depuis la base de données
  const loadShoppingList = useCallback(async () => {
    try {
      setLoading(true);
      logger.log('🛒 Chargement de la liste de courses depuis la BDD...');
      const response = await shoppingListService.getShoppingList('pending');
      logger.log('🛒 Réponse API:', response);
      if (response && response.success) {
        logger.log('✅ Liste chargée:', response.data?.length || 0, 'article(s)');
        setItems(response.data || []);
        // Notifier le parent si nécessaire
        if (onRefresh) {
          onRefresh(response.data || []);
        }
      } else {
        logger.error('❌ Réponse invalide:', response);
        showError('Erreur lors du chargement de la liste de courses');
        setItems([]);
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
  }, [isOpen, loadShoppingList]);

  // Recharger la liste périodiquement quand le modal est ouvert
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      loadShoppingList();
    }, 5000); // Recharger toutes les 5 secondes
    
    return () => clearInterval(interval);
  }, [isOpen, loadShoppingList]);

  // Filtrer les items
  const filteredItems = items.filter(item => {
    return item.ingredient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.category?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Marquer comme reçu
  const handleMarkAsReceived = async (id) => {
    logger.log('🛒 handleMarkAsReceived appelé avec ID:', id);
    try {
      const response = await shoppingListService.markAsReceived(id);
      logger.log('🛒 Réponse markAsReceived:', response);
      if (response && response.success) {
        showSuccess('Article marqué comme reçu et stock mis à jour');
        // Recharger immédiatement depuis la base de données
        await loadShoppingList();
      } else {
        logger.error('❌ Réponse invalide:', response);
        showError('Erreur lors de la mise à jour');
        // Recharger quand même pour avoir l'état actuel
        await loadShoppingList();
      }
    } catch (error) {
      logger.error('❌ Erreur markAsReceived:', error);
      showError(error.message || 'Erreur lors de la mise à jour');
      // Recharger en cas d'erreur pour avoir l'état actuel
      await loadShoppingList();
    }
  };

  // Supprimer
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet article de la liste ?')) return;
    try {
      const response = await shoppingListService.deleteShoppingListItem(id);
      if (response && response.success) {
        showSuccess('Article supprimé');
        // Recharger immédiatement depuis la base de données
        await loadShoppingList();
      } else {
        showError('Erreur lors de la suppression');
        // Recharger quand même pour avoir l'état actuel
        await loadShoppingList();
      }
    } catch (error) {
      logger.error('❌ Erreur suppression:', error);
      showError('Erreur lors de la suppression');
      // Recharger en cas d'erreur pour avoir l'état actuel
      await loadShoppingList();
    }
  };

  // Export
  const handleExport = async (format) => {
    try {
      await shoppingListService.exportShoppingList(format);
      showSuccess(`Liste exportée en ${format.toUpperCase()}`);
    } catch (error) {
      showError('Erreur lors de l\'export');
    }
  };

  // Copier dans le presse-papier (format simple)
  const handleCopyToClipboard = async () => {
    try {
      const listText = items.map(item => {
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
        // Fallback pour navigateurs plus anciens
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

  // Partager (API Web Share pour mobile)
  const handleShare = async () => {
    try {
      const listText = items.map(item => {
        let text = `- ${item.ingredient_name}`;
        if (item.quantity_needed) {
          text += ` (${item.quantity_needed}`;
          if (item.unit) text += ` ${item.unit}`;
          text += ')';
        }
        return text;
      }).join('\n');

      if (navigator.share) {
        // API Web Share disponible (mobile)
        await navigator.share({
          title: 'Liste de Courses',
          text: listText,
        });
        showSuccess('Liste partagée !');
      } else {
        // Fallback : copie dans le presse-papier
        handleCopyToClipboard();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.error('Erreur partage:', error);
        showError('Erreur lors du partage');
      }
    }
  };


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
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-heading font-bold text-black">
                    Liste de Courses
                  </h2>
                  <p className="text-xs md:text-sm text-neutral-600 mt-0.5 md:mt-1 hidden sm:block">
                    {items.length} article(s) à commander
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
            <div className="mt-3 md:mt-4 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 border-neutral-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyToClipboard}
                  className="flex-1 text-xs py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  disabled={items.length === 0}
                >
                  <Copy className="w-3 h-3" />
                  Copier
                </Button>
                {canShare && (
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex-1 text-xs py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                    disabled={items.length === 0}
                  >
                    <Share2 className="w-3 h-3" />
                    Partager
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleExport('txt')}
                  className="flex-1 text-xs py-1.5"
                  disabled={items.length === 0}
                >
                  <Download className="w-3 h-3" />
                  TXT
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  className="flex-1 text-xs py-1.5"
                  disabled={items.length === 0}
                >
                  <Download className="w-3 h-3" />
                  CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Liste des articles */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-neutral-600">Chargement...</p>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-400 text-lg">
                  {items.length === 0 ? 'Liste de courses vide' : 'Aucun article ne correspond aux filtres'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-3 md:p-4 rounded-xl border-2 border-neutral-200 bg-neutral-50"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-heading font-bold text-black text-sm md:text-base">
                          {item.ingredient_name}
                        </h3>
                        <span className="inline-block px-2 py-1 bg-neutral-200 rounded-lg text-xs font-medium mt-1">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-2">
                      <span className="text-sm text-neutral-600">Quantité à commander</span>
                      <span className="text-xl font-heading font-bold text-blue-700">
                        {item.quantity_needed} {item.unit || ''}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="p-2 bg-neutral-50 rounded-lg text-sm text-neutral-600 mb-2">
                        <strong>Note:</strong> {item.notes}
                      </div>
                    )}

                     {/* Actions */}
                     <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200">
                       <Button
                         variant="outline"
                         onClick={() => handleMarkAsReceived(item.id)}
                         className="flex-1 text-xs py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700"
                       >
                         Reçu
                       </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="text-xs py-1.5 bg-red-50 hover:bg-red-100 text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 border-t border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between">
              <div className="text-xs md:text-sm text-neutral-600">
                <span className="font-heading font-semibold text-black">
                  {filteredItems.length}
                </span>{' '}
                article(s)
              </div>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="text-sm md:text-base px-4 py-2"
              >
                Fermer
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShoppingListModal;

