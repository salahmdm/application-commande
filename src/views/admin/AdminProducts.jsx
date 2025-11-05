import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Download, Search } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminProductsTable from "../../components/admin/AdminProductsTable";
import useProducts from '../../hooks/useProducts';
import useNotifications from '../../hooks/useNotifications';
import useProductStore from '../../store/productStore';
import { apiCall } from '../../services/api';

/**
 * Vue Gestion Produits Admin avec sélection multiple et CSV
 */
const AdminProducts = () => {
  const { allProducts, categories, addProduct, updateProduct, deleteProduct } = useProducts();
  const { fetchCategories, fetchAllProductsAdmin } = useProductStore();
  const { success, error: showError } = useNotifications();
  const fileInputRef = useRef(null);
  
  // États pour la sélection multiple
  const [selectedIds, setSelectedIds] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // États pour le tri
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // États existants
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image_url: null,
    category: 'thes',
    popular: false,
    ingredients: ''
  });
  
  // Charger les produits et catégories au montage du composant
  // IMPORTANT: Seuls les produits de la BDD MySQL sont affichés
  useEffect(() => {
    console.log('🔄 AdminProducts - Chargement depuis MySQL...');
    
    const loadData = async () => {
      try {
        await Promise.all([
          fetchAllProductsAdmin(),
          fetchCategories()
        ]);
        console.log('✅ AdminProducts - TOUS les produits et catégories chargés depuis MySQL');
        
        // Debug : Afficher les produits chargés depuis la BDD
        console.log('📊 AdminProducts - Produits chargés depuis MySQL:', allProducts.length);
        if (allProducts.length > 0) {
          console.log('📊 AdminProducts - Détail des produits:', allProducts.map(p => ({
            id: p.id,
            name: p.name,
            category_id: p.category_id,
            category_name: p.category_name,
            category_slug: p.category_slug,
            is_available: p.is_available,
            price: p.price
          })));
        } else {
          console.warn('⚠️ AdminProducts - Aucun produit trouvé dans la base de données');
        }
      } catch (err) {
        console.error('❌ AdminProducts - Erreur chargement:', err);
        showError('Erreur lors du chargement des données depuis la base de données. Vérifiez que le backend est démarré.');
      }
    };
    
    loadData();
  }, [fetchAllProductsAdmin, fetchCategories, showError]);
  
  // Convertir categories en objet si c'est un array (données MySQL)
  const categoriesObj = React.useMemo(() => {
    if (Array.isArray(categories)) {
      const obj = {};
      categories.forEach(cat => {
        const key = cat.slug || cat.name.toLowerCase();
        obj[key] = cat;
      });
      return obj;
    }
    return categories || {};
  }, [categories]);

  // Fonction de tri
  const handleSort = (column) => {
    console.log('🔧 Tri demandé:', column, 'Direction actuelle:', sortDirection);
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    console.log('🔧 Nouveau tri:', column, 'Nouvelle direction:', sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Filtrage et tri des produits
  const filteredProducts = React.useMemo(() => {
    let filtered = [...allProducts];

    // Recherche par nom
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (filterCategory) {
      filtered = filtered.filter(product => 
        product.category_name === filterCategory ||
        categoriesObj[product.category]?.name === filterCategory
      );
    }

    // Filtre par statut
    if (filterStatus) {
      if (filterStatus === 'active') {
        filtered = filtered.filter(product => product.is_available);
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(product => !product.is_available);
      } else if (filterStatus === 'popular') {
        filtered = filtered.filter(product => product.is_featured || product.popular);
      }
    }

    // Tri des produits
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue = a[sortColumn];
        let bValue = b[sortColumn];

        // Gestion spéciale pour les catégories
        if (sortColumn === 'category') {
          aValue = a.category_name || '';
          bValue = b.category_name || '';
        }

        // Gestion spéciale pour les prix (conversion en nombre)
        if (sortColumn === 'price') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }

        // Gestion spéciale pour les statuts (conversion en booléen)
        if (sortColumn === 'is_available') {
          aValue = Boolean(aValue);
          bValue = Boolean(bValue);
        }

        // Tri des chaînes
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }

        // Tri des nombres
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Tri des booléens
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortDirection === 'asc' 
            ? (aValue === bValue ? 0 : aValue ? 1 : -1)
            : (aValue === bValue ? 0 : aValue ? -1 : 1);
        }

        // Fallback
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allProducts, searchQuery, filterCategory, filterStatus, categoriesObj, sortColumn, sortDirection]);

  // Gestion de la sélection multiple
  const handleSelectItem = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(product => product.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} produit(s) ?`
    );
    
    if (!confirmed) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          await deleteProduct(id);
          successCount++;
        } catch (error) {
          console.error('Erreur suppression produit:', id, error);
          errorCount++;
        }
      }

      setSelectedIds([]);
      
      if (successCount > 0 && errorCount === 0) {
        success(`✅ ${successCount} produit(s) supprimé(s) avec succès !`);
      } else if (successCount > 0 && errorCount > 0) {
        success(`⚠️ ${successCount} produit(s) supprimé(s), ${errorCount} erreur(s)`);
      } else {
        showError(`❌ Échec de la suppression (${errorCount} erreur(s))`);
      }
    } catch (error) {
      console.error('Erreur suppression en lot:', error);
      showError('Erreur lors de la suppression en lot');
    }
  };


  // Export CSV
  const handleExportCSV = () => {
    try {
      console.log('🔧 Export CSV demandé');
      console.log('🔧 Produits à exporter:', filteredProducts.length);
      
      if (filteredProducts.length === 0) {
        showError('Aucun produit à exporter');
        return;
      }

      const headers = ['Nom', 'Catégorie', 'Prix', 'Description', 'Statut', 'Populaire', 'Ingrédients'];
      const csvData = filteredProducts.map(product => {
        // Gestion des allergens (peut être string JSON ou array)
        let allergensText = '';
        try {
          if (typeof product.allergens === 'string' && product.allergens) {
            const parsed = JSON.parse(product.allergens);
            allergensText = Array.isArray(parsed) ? parsed.join(', ') : '';
          } else if (Array.isArray(product.allergens)) {
            allergensText = product.allergens.join(', ');
          }
        } catch (e) {
          console.warn('Erreur parsing allergens:', e);
          allergensText = '';
        }

        return [
          product.name || '',
          product.category_name || categoriesObj[product.category]?.name || 'Non définie',
          product.price || '0',
          product.description || '',
          product.is_available ? 'Actif' : 'Inactif',
          (product.is_featured || product.popular) ? 'Oui' : 'Non',
          allergensText
        ];
      });

      console.log('🔧 En-têtes CSV:', headers);
      console.log('🔧 Première ligne de données:', csvData[0]);
      console.log('🔧 Nombre de lignes:', csvData.length);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      console.log('🔧 Contenu CSV généré, longueur:', csvContent.length);

      // Ajout du BOM UTF-8 pour Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `produits_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      console.log('🔧 Déclenchement du téléchargement...');
      link.click();
      
      // Nettoyage après un court délai
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ Export CSV terminé');
      success('✅ Export CSV réussi !');
    } catch (error) {
      console.error('❌ Erreur export CSV:', error);
      showError(`Erreur lors de l'export CSV: ${error.message}`);
    }
  };

  // Import CSV
  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const dataLines = lines.slice(1);

      console.log('📋 Headers CSV:', headers);
      console.log('📊 Lignes de données:', dataLines.length);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Mapping des catégories CSV vers les catégories de la BDD
      const categoryMapping = {
        'Boissons Chaudes': 'Boissons Chaudes',
        'Boissons Froides': 'Boissons Froides',
        'Délices Salés': 'Délices Salés',
        'Délices Sucrés': 'Délices Sucrés',
        'Thés': 'Boissons Chaudes',
        'Cafés': 'Boissons Chaudes',
        'Pâtisseries': 'Délices Sucrés',
        'Sandwichs': 'Délices Salés'
      };

      // Parser et importer chaque ligne
      for (let lineIndex = 0; lineIndex < dataLines.length; lineIndex++) {
        const line = dataLines[lineIndex];
        
        try {
          // Parser CSV simple (gère les champs entre guillemets)
          const fields = [];
          let currentField = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              fields.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          fields.push(currentField.trim());

          // Format flexible : minimum 3 colonnes (produit, catégorie, prix)
          if (fields.length < 3) {
            throw new Error(`Ligne ${lineIndex + 2}: Pas assez de colonnes (${fields.length} trouvées, minimum 3)`);
          }

          // Extraction des champs avec valeurs par défaut
          const [name, category, price, description = '', status = 'Actif', popular = 'Non', ingredients = ''] = fields;

          // Validation des champs obligatoires
          if (!name || !category || !price) {
            throw new Error(`Ligne ${lineIndex + 2}: Nom, catégorie et prix sont obligatoires`);
          }

          // Mapper la catégorie
          let mappedCategory = category;
          if (categoryMapping[category]) {
            mappedCategory = categoryMapping[category];
          } else if (!Object.values(categoriesObj).some(cat => cat.name === category)) {
            mappedCategory = 'Boissons Chaudes'; // Catégorie par défaut
            console.log(`⚠️ Catégorie "${category}" non reconnue, mappée vers "Boissons Chaudes"`);
          }

          const productData = {
            name: name.trim(),
            categoryId: Object.values(categoriesObj).find(cat => cat.name === mappedCategory)?.id || 1,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            description: description.trim() || `Produit ${name}`,
            price: parseFloat(price) || 0,
            imageUrl: null,
            isAvailable: status.toLowerCase() === 'actif',
            isFeatured: popular.toLowerCase() === 'oui',
            calories: 0,
            preparationTime: 5,
            allergens: ingredients.split(',').map(i => i.trim()).filter(Boolean)
          };

          await addProduct(productData);
          successCount++;
          console.log(`✅ Produit ajouté: ${name}`);

        } catch (error) {
          console.error(`❌ Erreur ligne ${lineIndex + 2}:`, error.message);
          errors.push(`Ligne ${lineIndex + 2}: ${error.message}`);
          errorCount++;
        }
      }

      // Recharger la liste
      await fetchAllProductsAdmin();

      // Afficher le résultat
      if (successCount > 0 && errorCount === 0) {
        success(`✅ Import réussi : ${successCount} produit(s) ajouté(s) !`);
      } else if (successCount > 0 && errorCount > 0) {
        success(`⚠️ ${successCount} produit(s) ajouté(s), ${errorCount} erreur(s)`);
        if (errors.length > 0) {
          console.log('Erreurs détaillées:', errors);
        }
      } else {
        showError(`❌ Échec de l'importation (${errorCount} erreur(s))`);
        if (errors.length > 0) {
          console.log('Erreurs détaillées:', errors);
        }
      }

    } catch (error) {
      console.error('❌ Erreur import CSV:', error);
      showError(`Erreur lors de l'importation: ${error.message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleSubmit = () => {
    const categoryEntry = Object.entries(categoriesObj).find(([key, _cat]) => key === formData.category);
    const categoryId = categoryEntry ? categoryEntry[1].id : 1;
    
    const productData = {
      categoryId: categoryId,
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      price: parseFloat(formData.price),
      imageUrl: formData.image_url,
      isAvailable: true,
      isFeatured: formData.popular,
      calories: 0,
      preparationTime: 5,
      allergens: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean)
    };
    
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      success('Produit mis à jour avec succès !');
    } else {
      addProduct(productData);
      success('Produit ajouté avec succès !');
    }
    
    handleCloseModal();
  };
  
  const handleDelete = (product) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      deleteProduct(product.id);
      success('Produit supprimé avec succès !');
    }
  };
  
  const handleToggleAvailability = async (product) => {
    try {
      const newStatus = !product.is_available;
      const response = await apiCall(`/admin/products/${product.id}/toggle`, {
        method: 'PUT'
      });
      
      if (response.success) {
        success(newStatus ? 'Produit activé !' : 'Produit désactivé');
        await fetchAllProductsAdmin();
      } else {
        throw new Error(response.error || response.message || 'Échec du toggle');
      }
    } catch (error) {
      console.error('❌ Erreur toggle disponibilité:', error);
      showError(`Erreur: ${error.message}`);
    }
  };
  
  const handleEdit = (product) => {
    console.log('🔧 handleEdit appelé avec:', product);
    console.log('🔧 categoriesObj:', categoriesObj);
    
    setEditingProduct(product);
    
    let categoryKey = 'thes';
    // L'API retourne category_name, pas category_id
    if (product.category_name) {
      const categoryEntry = Object.entries(categoriesObj).find(([_key, cat]) => cat.name === product.category_name);
      if (categoryEntry) {
        categoryKey = categoryEntry[0];
      }
    } else if (product.category_id) {
      const categoryEntry = Object.entries(categoriesObj).find(([_key, cat]) => cat.id === product.category_id);
      if (categoryEntry) {
        categoryKey = categoryEntry[0];
      }
    }
    
    console.log('🔧 categoryKey trouvé:', categoryKey);
    
    // Gérer les allergens (peuvent être un tableau ou une chaîne JSON)
    let ingredientsString = '';
    if (product.allergens) {
      if (Array.isArray(product.allergens)) {
        ingredientsString = product.allergens.join(', ');
      } else if (typeof product.allergens === 'string') {
        try {
          const parsed = JSON.parse(product.allergens);
          ingredientsString = Array.isArray(parsed) ? parsed.join(', ') : product.allergens;
        } catch {
          ingredientsString = product.allergens;
        }
      }
    }
    
    const newFormData = {
      name: product.name || '',
      price: product.price ? product.price.toString() : '0',
      description: product.description || '',
      image_url: product.image_url || null,
      category: categoryKey,
      popular: product.is_featured || false,
      ingredients: ingredientsString
    };
    
    console.log('🔧 FormData configuré:', newFormData);
    
    setFormData(newFormData);
    setShowModal(true);
    
    console.log('🔧 Modal ouvert, showModal:', true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      image_url: null,
      category: 'thes',
      popular: false,
      ingredients: ''
    });
  };
  
  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8">
      {/* Debug info */}
      {console.log('🔧 AdminProducts render - showModal:', showModal, 'editingProduct:', editingProduct)}
      
      {/* Header avec actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-4xl font-heading font-bold text-black">Gestion des Produits</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={<Upload className="w-4 h-4" />}
            onClick={handleImportCSV}
            disabled={isImporting}
          >
            {isImporting ? 'Import...' : 'Import CSV'}
          </Button>
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => {
            console.log('🔧 Bouton Ajouter cliqué');
            setShowModal(true);
            console.log('🔧 showModal défini à true');
          }}
        >
          Ajouter un produit
        </Button>
        </div>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredProducts.length}</div>
            <div className="text-sm text-gray-600">Produits</div>
                        </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredProducts.filter(p => p.is_available).length}
                        </div>
            <div className="text-sm text-gray-600">Actifs</div>
                      </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredProducts.filter(p => !p.is_available).length}
                    </div>
            <div className="text-sm text-gray-600">Inactifs</div>
                    </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredProducts.filter(p => p.is_featured || p.popular).length}
                      </div>
            <div className="text-sm text-gray-600">Populaires</div>
        </div>
        </Card>
              </div>
              
      {/* Filtres et recherche */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
              </div>
              
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les catégories</option>
            {Object.values(categoriesObj).map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
            <option value="popular">Populaires</option>
          </select>

          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleBulkDelete}
            >
              Supprimer ({selectedIds.length})
            </Button>
          )}
        </div>
      </Card>
      
      {/* Liste des produits */}
      <Card padding="lg">
        <AdminProductsTable
          products={filteredProducts}
          categoriesObj={categoriesObj}
          selectedIds={selectedIds}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleAvailability={handleToggleAvailability}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      </Card>
      
      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* Modal Ajouter/Modifier */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
        size="lg"
      >
        {console.log('🔧 Modal rendu, showModal:', showModal, 'editingProduct:', editingProduct)}
        <div className="space-y-4">
          <ImageUpload 
            currentImage={formData.image_url}
            onImageChange={(url) => setFormData({...formData, image_url: url})}
            onImageRemove={() => setFormData({...formData, image_url: null})}
            productId={editingProduct?.id}
          />
          
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Nom du produit"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            
            <Input
              label="Prix (€)"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
          
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-heading font-medium text-black mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black focus:bg-white transition-all duration-200 min-h-12 font-sans"
              >
                {Object.entries(categoriesObj).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Input
            label="Ingrédients (séparés par des virgules)"
            value={formData.ingredients}
            onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
            placeholder="Farine, Beurre, Sucre..."
          />
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="popular"
              checked={formData.popular}
              onChange={(e) => setFormData({...formData, popular: e.target.checked})}
              className="w-4 h-4 text-black rounded focus:ring-2 focus:ring-neutral-300"
            />
            <label htmlFor="popular" className="text-sm font-heading font-medium text-black">
              Marquer comme populaire
            </label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              fullWidth
              onClick={handleCloseModal}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={!formData.name || !formData.price || !formData.description}
            >
              {editingProduct ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProducts;