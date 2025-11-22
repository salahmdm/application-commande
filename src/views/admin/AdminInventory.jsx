import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Download, Upload, TrendingUp, Package, Trash2, ClipboardCheck, ListChecks } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import InventoryTable from '../../components/inventory/InventoryTable';
import InventoryModal from '../../components/inventory/InventoryModal';
import StockAlertsModal from '../../components/inventory/StockAlertsModal';
import PhysicalInventoryModal from '../../components/inventory/PhysicalInventoryModal';
import ShoppingListModal from '../../components/inventory/ShoppingListModal';
import useNotifications from '../../hooks/useNotifications';
import inventoryService from '../../services/inventoryService';
import shoppingListService from '../../services/shoppingListService';
import logger from '../../utils/logger';

/**
 * Page principale de gestion d'inventaire
 * Connectée à la base de données MySQL
 */
const AdminInventory = () => {
  const { success: showSuccess, error: showError } = useNotifications();
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  // Catégories spécifiques à l'inventaire (matières premières)
  const categories = ['Surgelé', 'Frais', 'Autres'];
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isPhysicalInventoryOpen, setIsPhysicalInventoryOpen] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isImporting, setIsImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Calculer le statut en fonction de la quantité
  const calculateStatus = (quantity, minQuantity) => {
    if (quantity === 0) {
      return 'out'; // Rupture
    } else if (quantity <= (minQuantity || 0)) {
      return 'low'; // Stock bas
    } else {
      return 'available'; // Disponible
    }
  };

  // Charger l'inventaire depuis la base de données
  const loadInventory = React.useCallback(async () => {
    try {
      setIsLoading(true);
      logger.debug('📦 Chargement inventaire...');
      const response = await inventoryService.getInventory();
      if (response.success) {
        // Mettre à jour le statut en fonction de la quantité
        const itemsWithStatus = (response.data || []).map(item => ({
          ...item,
          status: calculateStatus(item.quantity, item.minQuantity)
        }));
        setItems(itemsWithStatus);
        // ✅ SÉCURITÉ: Ne pas logger les données complètes d'inventaire (données sensibles)
        logger.debug('✅ Inventaire chargé');
      }
    } catch (error) {
      logger.error('❌ Erreur chargement inventaire:', error);
      showError('Erreur lors du chargement de l\'inventaire');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Ajouter automatiquement les produits sous stock minimal à la liste de courses
  const autoAddLowStockToShoppingList = React.useCallback(async () => {
    try {
      const response = await shoppingListService.autoAddLowStock();
      if (response.success && response.added > 0) {
        logger.log(`✅ ${response.added} produit(s) ajouté(s) automatiquement à la liste de courses`);
      }
    } catch (error) {
      logger.error('❌ Erreur ajout automatique:', error);
    }
  }, []);

  // Charger les données au démarrage et ajouter automatiquement les produits sous stock
  useEffect(() => {
    loadInventory();
    // Ajouter automatiquement les produits sous stock minimal
    autoAddLowStockToShoppingList();
  }, [loadInventory, autoAddLowStockToShoppingList]);

  // Produits en alerte de stock
  // Inclut seulement les produits avec minQuantity > 0 ET (quantity = 0 OU quantity <= minQuantity)
  const alertItems = useMemo(() => {
    return items.filter(item => {
      const minQty = item.minQuantity || 0;
      const qty = item.quantity || 0;
      // Uniquement les produits avec un minimum défini et qui sont en rupture ou en stock bas
      return minQty > 0 && (qty === 0 || qty <= minQty);
    });
  }, [items]);

  // Filtrage et tri
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Recherche
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (filterCategory) {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Filtre par statut
    if (filterStatus) {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Gestion spéciale pour les dates
      if (sortConfig.key === 'dateAdded') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [items, searchQuery, filterCategory, filterStatus, sortConfig]);

  // Statistiques
  const stats = useMemo(() => {
    const totalItems = items.filter(item => item.quantity > 0).length; // Nombre d'articles différents en stock
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0); // Quantité totale
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    // Compter les produits en alerte (même logique que alertItems)
    const alertCount = items.filter(item => {
      const minQty = item.minQuantity || 0;
      const qty = item.quantity || 0;
      return minQty > 0 && (qty === 0 || qty <= minQty);
    }).length;

    return { totalItems, totalQuantity, totalValue, lowStockCount: alertCount };
  }, [items]);

  // Gestion du tri
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Ajouter un article
  const handleAdd = async (formData) => {
    try {
      logger.log('📦 Ajout article:', formData);
      const response = await inventoryService.addInventoryItem(formData);
      if (response.success) {
        showSuccess('Article ajouté avec succès !');
        loadInventory(); // Recharger l'inventaire
      }
    } catch (error) {
      logger.error('❌ Erreur ajout:', error);
      showError('Erreur lors de l\'ajout de l\'article');
    }
  };

  // Modifier un article
  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleUpdate = async (formData) => {
    try {
      logger.log('📦 Modification article:', editingItem.id, formData);
      const response = await inventoryService.updateInventoryItem(editingItem.id, formData);
      if (response.success) {
        showSuccess('Article modifié avec succès !');
        loadInventory(); // Recharger l'inventaire
      }
      setEditingItem(null);
    } catch (error) {
      logger.error('❌ Erreur modification:', error);
      showError('Erreur lors de la modification de l\'article');
    }
  };

  // Supprimer un article
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        logger.log('📦 Suppression article:', id);
        const response = await inventoryService.deleteInventoryItem(id);
        if (response.success) {
          showSuccess('Article supprimé avec succès !');
          loadInventory(); // Recharger l'inventaire
        }
      } catch (error) {
        logger.error('❌ Erreur suppression:', error);
        showError('Erreur lors de la suppression de l\'article');
      }
    }
  };

  // Sélectionner/Désélectionner un produit
  const handleSelectItem = (id, isSelected) => {
    if (isSelected) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // Sélectionner/Désélectionner tous les produits
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedIds(filteredItems.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Supprimer les produits sélectionnés
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const count = selectedIds.length;
    const message = count === 1 
      ? 'Êtes-vous sûr de vouloir supprimer cet article ?' 
      : `Êtes-vous sûr de vouloir supprimer ${count} articles ?`;

    if (window.confirm(message)) {
      try {
        let successCount = 0;
        let errorCount = 0;

        for (const id of selectedIds) {
          try {
            const response = await inventoryService.deleteInventoryItem(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            logger.error('❌ Erreur suppression:', id, error);
            errorCount++;
          }
        }

        // Recharger l'inventaire
        await loadInventory();
        
        // Réinitialiser la sélection
        setSelectedIds([]);

        // Afficher le résultat
        if (successCount > 0 && errorCount === 0) {
          showSuccess(`✅ ${successCount} article(s) supprimé(s) avec succès !`);
        } else if (successCount > 0 && errorCount > 0) {
          showSuccess(`⚠️ ${successCount} article(s) supprimé(s), ${errorCount} erreur(s)`);
        } else {
          showError(`❌ Échec de la suppression (${errorCount} erreur(s))`);
        }
      } catch (error) {
        logger.error('❌ Erreur suppression multiple:', error);
        showError('Erreur lors de la suppression des articles');
      }
    }
  };

  // Mettre à jour les quantités depuis l'inventaire physique
  const handlePhysicalInventoryUpdate = async (changedItems) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const item of changedItems) {
        try {
          logger.log(`📦 MAJ quantité: ${item.name} ${item.currentQuantity} → ${item.newQuantity}`);
          const response = await inventoryService.updateInventoryItem(item.id, {
            quantity: item.newQuantity
          });
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          logger.error('❌ Erreur MAJ quantité:', item.id, error);
          errorCount++;
        }
      }

      // Recharger l'inventaire après mise à jour
      await loadInventory();
      
      // Ajouter automatiquement les produits sous stock minimal après mise à jour
      await autoAddLowStockToShoppingList();

      // Afficher le résultat
      if (successCount > 0 && errorCount === 0) {
        showSuccess(`✅ Inventaire mis à jour : ${successCount} article(s) modifié(s) !`);
      } else if (successCount > 0 && errorCount > 0) {
        showSuccess(`⚠️ ${successCount} article(s) modifié(s), ${errorCount} erreur(s)`);
      } else {
        showError(`❌ Échec de la mise à jour (${errorCount} erreur(s))`);
      }
    } catch (error) {
      logger.error('❌ Erreur mise à jour inventaire:', error);
      showError('Erreur lors de la mise à jour de l\'inventaire');
    }
  };

  // Modifier une quantité directement depuis le tableau
  const handleQuantityChange = async (id, newQuantity) => {
    try {
      logger.log(`📦 MAJ quantité rapide: ID ${id} → ${newQuantity}`);
      const response = await inventoryService.updateInventoryItem(id, {
        quantity: newQuantity
      });
      if (response.success) {
        // Mettre à jour localement pour un feedback instantané avec recalcul du statut
        setItems(prev => 
          prev.map(item => {
            if (item.id === id) {
              const newStatus = calculateStatus(newQuantity, item.minQuantity);
              return { ...item, quantity: newQuantity, status: newStatus };
            }
            return item;
          })
        );
        showSuccess(`✅ Quantité mise à jour !`);
      } else {
        showError('Erreur lors de la mise à jour');
      }
    } catch (error) {
      logger.error('❌ Erreur MAJ quantité:', error);
      showError('Erreur lors de la mise à jour de la quantité');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Nom', 'Catégorie', 'Quantité', 'Prix', 'Qté Min', 'Date', 'Statut'];
    const csvData = [
      headers.join(','),
      ...filteredItems.map(item =>
        [
          `"${item.name}"`,
          `"${item.category}"`,
          item.quantity,
          item.price,
          item.minQuantity || 0,
          item.dateAdded,
          item.status
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaire_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showSuccess('Export CSV réussi !');
  };

  // Import CSV
  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est un fichier CSV
    if (!file.name.endsWith('.csv')) {
      showError('Veuillez sélectionner un fichier CSV');
      return;
    }

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Ignorer la ligne d'en-tête
      const dataLines = lines.slice(1);
      
      if (dataLines.length === 0) {
        showError('Le fichier CSV est vide');
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Mapping des catégories CSV vers les catégories d'inventaire
      const categoryMapping = {
        'Épicerie Sèche': 'Autres',
        'Épicerie Sucrée': 'Autres',
        'Fromage': 'Frais',
        'Traiteur': 'Frais',
        'Glace / Dessert': 'Surgelé',
        'Surgelés': 'Surgelé',
        'Fruits et Légumes': 'Frais',
        // Catégories déjà valides (inventaire)
        'Surgelé': 'Surgelé',
        'Frais': 'Frais',
        'Autres': 'Autres'
      };

      // Parser et importer chaque ligne
      for (let lineIndex = 0; lineIndex < dataLines.length; lineIndex++) {
        const line = dataLines[lineIndex];
        
        // Parser CSV intelligent - Sépare par virgules en gérant les guillemets
        const allParts = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            allParts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        allParts.push(current.trim());
        
        // Nettoyer les guillemets
        const cleanParts = allParts.map(v => v.replace(/^"|"$/g, '').trim());
        
        // Format: Article,Catégorie,Quantité,Prix unitaire (€),Qté Min,Date d'ajout,Statut
        let name, category, quantity, price, minQuantity;
        
        if (cleanParts.length >= 7) {
          // Format complet avec 7 colonnes - on prend les 5 premières
          [name, category, quantity, price, minQuantity] = cleanParts.slice(0, 5);
        } else if (cleanParts.length >= 5) {
          // Format sans Date et Statut
          [name, category, quantity, price, minQuantity] = cleanParts;
        } else {
          errors.push(`Ligne ${lineIndex + 2}: Format invalide (${cleanParts.length} colonnes au lieu de 5+)`);
          errorCount++;
          continue;
        }

        // Validation du nom
        if (!name || name.trim() === '') {
          errors.push(`Ligne ${lineIndex + 2}: Nom d'article manquant`);
          errorCount++;
          continue;
        }

        // Mapper la catégorie
        let mappedCategory = category;
        if (categoryMapping[category]) {
          mappedCategory = categoryMapping[category];
        } else if (!categories.includes(category)) {
          // Si la catégorie n'existe pas, on la met dans "Autres" par défaut
          mappedCategory = 'Autres';
          logger.log(`⚠️ Catégorie "${category}" non reconnue, mappée vers "Autres"`);
        }

        const itemData = {
          name: name.trim(),
          category: mappedCategory,
          quantity: parseFloat(quantity) || 0,
          price: parseFloat(price) || 0,
          minQuantity: parseFloat(minQuantity) || 0,
          status: 'available'
        };

        try {
          logger.log(`📦 Import: "${itemData.name}" → ${itemData.category}`);
          const response = await inventoryService.addInventoryItem(itemData);
          if (response.success) {
            successCount++;
          } else {
            errors.push(`Ligne ${lineIndex + 2} (${name}): ${response.error || 'Erreur inconnue'}`);
            errorCount++;
          }
        } catch (error) {
          logger.error('Erreur import ligne:', error);
          errors.push(`Ligne ${lineIndex + 2} (${name}): ${error.message}`);
          errorCount++;
        }
      }

      // Recharger l'inventaire
      await loadInventory();

      // Afficher le résultat
      if (successCount > 0 && errorCount === 0) {
        showSuccess(`✅ ${successCount} article(s) importé(s) avec succès !`);
      } else if (successCount > 0 && errorCount > 0) {
        logger.warn('⚠️ Erreurs d\'importation:', errors);
        showSuccess(`⚠️ ${successCount} article(s) importé(s), ${errorCount} erreur(s)`);
      } else {
        logger.error('❌ Erreurs d\'importation:', errors);
        const errorMessage = errors.length > 0 
          ? `❌ Échec de l'importation:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`
          : `❌ Échec de l'importation (${errorCount} erreur(s))`;
        showError(errorMessage);
      }

    } catch (error) {
      logger.error('Erreur lecture fichier:', error);
      showError('Erreur lors de la lecture du fichier CSV');
    } finally {
      setIsImporting(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement de l&apos;inventaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-black flex items-center gap-3">
            <Package className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
            Gestion d&apos;Inventaire
          </h1>
          <p className="text-sm md:text-base text-neutral-600 mt-1">
            Gérez vos articles, stocks et alertes
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 text-sm md:text-base px-3 py-2 md:px-4 md:py-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Supprimer</span> ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsPhysicalInventoryOpen(true)}
            className="flex items-center gap-2 bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 font-bold text-sm md:text-base px-3 py-2 md:px-4 md:py-2"
          >
            <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5" />
            INVENTAIRE
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsShoppingListOpen(true)}
            className="flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 font-bold text-sm md:text-base px-3 py-2 md:px-4 md:py-2"
          >
            <ListChecks className="w-4 h-4 md:w-5 md:h-5" />
            LISTE DE COURSES
          </Button>
          <Button
            variant="outline"
            onClick={handleImportCSV}
            disabled={isImporting}
            className="flex items-center gap-2 text-sm md:text-base px-3 py-2 md:px-4 md:py-2"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{isImporting ? 'Import...' : 'CSV'}</span>
            <span className="sm:hidden">↑</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-sm md:text-base px-3 py-2 md:px-4 md:py-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">↓</span>
          </Button>
          <Button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base px-3 py-2 md:px-4 md:py-2"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Nouvel article</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </div>
        {/* Input file caché pour l'import CSV */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Statistiques - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-heading font-medium text-blue-700">Articles en stock</p>
                  <p className="text-xl md:text-2xl font-heading font-bold text-blue-900 mt-1">{stats.totalItems}</p>
                </div>
                <div className="p-2 md:p-3 bg-blue-200 rounded-xl">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-700" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-heading font-medium text-green-700">Valeur totale</p>
                  <p className="text-xl md:text-2xl font-heading font-bold text-green-900 mt-1">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(stats.totalValue)}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-green-200 rounded-xl">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-700" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <Card 
            className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 cursor-pointer hover:shadow-lg transition-all active:scale-95 md:hover:scale-105"
            onClick={() => setIsAlertsModalOpen(true)}
          >
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-heading font-medium text-orange-700">Alertes stock</p>
                  <p className="text-xl md:text-2xl font-heading font-bold text-orange-900 mt-1">{stats.lowStockCount}</p>
                  <p className="text-xs text-orange-600 mt-1">👆 Cliquer pour voir</p>
                </div>
                <div className="p-2 md:p-3 bg-orange-200 rounded-xl">
                  <span className="text-xl md:text-2xl">⚠️</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filtres et Recherche */}
      <Card>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Filtre Catégorie */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
              >
                <option value="">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Filtre Statut */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
              >
                <option value="">Tous statuts</option>
                <option value="available">✅ Disponible</option>
                <option value="low">⚠️ Stock bas</option>
                <option value="out">❌ Rupture</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="p-4 md:p-6">
          <div className="mb-3 md:mb-4 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-heading font-bold text-black">
              <span className="hidden sm:inline">Liste d&apos;inventaire</span>
              <span className="sm:hidden">Inventaire</span>
              <span className="text-neutral-500 font-normal ml-2">({filteredItems.length})</span>
            </h2>
          </div>
          <InventoryTable
            items={filteredItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSort={handleSort}
            sortConfig={sortConfig}
            selectedIds={selectedIds}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onQuantityChange={handleQuantityChange}
          />
        </div>
      </Card>

      {/* Modal Ajout/Modification */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleUpdate : handleAdd}
        item={editingItem}
        categories={categories}
      />

      {/* Modal Alertes Stock */}
      <StockAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        items={alertItems}
      />

      {/* Modal Inventaire Physique */}
      <PhysicalInventoryModal
        isOpen={isPhysicalInventoryOpen}
        onClose={() => setIsPhysicalInventoryOpen(false)}
        items={items}
        onUpdate={handlePhysicalInventoryUpdate}
      />

      {/* Modal Liste de Courses */}
      <ShoppingListModal
        isOpen={isShoppingListOpen}
        onClose={() => setIsShoppingListOpen(false)}
      />
    </div>
  );
};

export default AdminInventory;
