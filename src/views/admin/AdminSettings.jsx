import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, CheckCircle, XCircle, Server, Database, Globe, Activity, Plus, Edit2, Trash2, Grid3x3, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useNotifications from '../../hooks/useNotifications';
import useProductStore from '../../store/productStore';
import { apiCall } from '../../services/api';
import ENV from '../../config/env';

/**
 * Vue Paramètres Admin
 * Gestion des paramètres de l'application depuis MySQL
 */
const AdminSettings = () => {
  const { success, error: showError } = useNotifications();
  const { fetchCategories } = useProductStore();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // État des connexions système
  const [systemStatus, setSystemStatus] = useState({
    backend: { connected: false, loading: true, message: '' },
    database: { connected: false, loading: true, message: '' },
    frontend: { connected: true, loading: false, message: 'Frontend actif' }
  });
  
  // États pour la gestion des catégories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📦',
    displayOrder: 1,
    isActive: true
  });
  
  // Charger les paramètres depuis la base de données
  useEffect(() => {
    loadSettings();
    checkSystemStatus();
    loadCategories();
    // Vérifier le statut toutes les 30 secondes
    const interval = setInterval(checkSystemStatus, 30000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => clearInterval(interval);
  }, []);
  
  // Fonctions pour la gestion des catégories
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await apiCall('/admin/categories');
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement catégories:', error);
      showError('Erreur lors du chargement des catégories');
    } finally {
      setCategoriesLoading(false);
    }
  };
  
  const syncCategoriesWithPOS = async () => {
    try {
      await fetchCategories();
      success('Modifications synchronisées');
    } catch (error) {
      console.warn('⚠️ Erreur synchronisation POS:', error);
    }
  };
  
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  const handleCategoryNameChange = (name) => {
    setCategoryFormData({
      ...categoryFormData,
      name,
      slug: generateSlug(name)
    });
  };
  
  const handleAddCategory = async () => {
    try {
      if (!categoryFormData.name.trim()) {
        showError('Le nom de la catégorie est requis');
        return;
      }

      const response = await apiCall('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: categoryFormData.name,
          slug: categoryFormData.slug,
          description: categoryFormData.description,
          icon: categoryFormData.icon,
          displayOrder: parseInt(categoryFormData.displayOrder)
        })
      });

      if (response.success) {
        success('Catégorie ajoutée avec succès !');
        setShowAddCategoryForm(false);
        setCategoryFormData({
          name: '',
          slug: '',
          description: '',
          icon: '📦',
          displayOrder: 1,
          isActive: true
        });
        await loadCategories();
        await syncCategoriesWithPOS();
      }
    } catch (error) {
      console.error('❌ Erreur ajout catégorie:', error);
      showError('Erreur lors de l\'ajout de la catégorie');
    }
  };
  
  const handleUpdateCategory = async (id) => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) return;

      const response = await apiCall(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          displayOrder: parseInt(category.display_order),
          isActive: category.is_active
        })
      });

      if (response.success) {
        success('Catégorie mise à jour avec succès !');
        setEditingCategoryId(null);
        await loadCategories();
        await syncCategoriesWithPOS();
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour catégorie:', error);
      showError('Erreur lors de la mise à jour de la catégorie');
    }
  };
  
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await apiCall(`/admin/categories/${id}`, {
        method: 'DELETE'
      });

      if (response.success) {
        success('Catégorie supprimée avec succès !');
        await loadCategories();
        await syncCategoriesWithPOS();
      }
    } catch (error) {
      console.error('❌ Erreur suppression catégorie:', error);
      showError(error.message || 'Erreur lors de la suppression de la catégorie');
    }
  };
  
  const handleToggleCategoryActive = async (id) => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) return;

      const response = await apiCall(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...category,
          displayOrder: parseInt(category.display_order),
          isActive: !category.is_active
        })
      });

      if (response.success) {
        success(category.is_active ? 'Catégorie désactivée' : 'Catégorie activée');
        await loadCategories();
        await syncCategoriesWithPOS();
      }
    } catch (error) {
      console.error('❌ Erreur toggle catégorie:', error);
      showError('Erreur lors du changement de statut');
    }
  };
  
  const updateCategoryField = (id, field, value) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    );
  };
  
  const reorderCategories = async (newOrder) => {
    try {
      setCategories(newOrder);

      for (let i = 0; i < newOrder.length; i++) {
        const category = newOrder[i];
        await apiCall(`/admin/categories/${category.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            displayOrder: i + 1,
            isActive: category.is_active
          })
        });
      }

      success('Ordre mis à jour !');
      await syncCategoriesWithPOS();
    } catch (error) {
      console.error('❌ Erreur réorganisation:', error);
      showError('Erreur lors de la réorganisation');
      await loadCategories();
    }
  };
  
  const moveCategoryUp = async (index) => {
    if (index === 0) return;
    
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await reorderCategories(newOrder);
  };
  
  const moveCategoryDown = async (index) => {
    if (index === categories.length - 1) return;
    
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await reorderCategories(newOrder);
  };
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/settings');
      if (response.success && response.data) {
        setSettings(response.data);
        
        // Mettre à jour localStorage pour la devise
        const currencySetting = response.data.find(s => s.setting_key === 'currency_symbol');
        if (currencySetting && currencySetting.setting_value) {
          localStorage.setItem('currency_symbol', currencySetting.setting_value);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement paramètres:', error);
      showError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };
  
  // Vérifier l'état des connexions système
  const checkSystemStatus = async () => {
    // Vérifier le backend
    setSystemStatus(prev => ({
      ...prev,
      backend: { ...prev.backend, loading: true }
    }));
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${ENV.BACKEND_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(prev => ({
          ...prev,
          backend: {
            connected: true,
            loading: false,
            message: data.message || 'Backend connecté'
          }
        }));
        
        // Si le backend est OK, vérifier la base de données
        checkDatabaseStatus();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        backend: {
          connected: false,
          loading: false,
          message: error.name === 'AbortError' ? 'Timeout (5s)' : `Erreur: ${error.message}`
        },
        database: {
          ...prev.database,
          connected: false,
          loading: false,
          message: 'Impossible de vérifier (backend hors ligne)'
        }
      }));
    }
  };
  
  // Vérifier la connexion à la base de données
  const checkDatabaseStatus = async () => {
    setSystemStatus(prev => ({
      ...prev,
      database: { ...prev.database, loading: true }
    }));
    
    try {
      const response = await apiCall('/admin/settings');
      if (response.success) {
        setSystemStatus(prev => ({
          ...prev,
          database: {
            connected: true,
            loading: false,
            message: 'Base de données connectée'
          }
        }));
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        database: {
          connected: false,
          loading: false,
          message: `Erreur: ${error.message}`
        }
      }));
    }
  };
  
  const handleChange = (key, value) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.setting_key === key 
          ? { ...setting, setting_value: String(value) }
          : setting
      )
    );
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Sauvegarde des paramètres...');
      
      // Sauvegarder chaque paramètre modifié
      for (const setting of settings) {
        await apiCall(`/admin/settings/${setting.setting_key}`, {
          method: 'PUT',
          body: JSON.stringify({ value: setting.setting_value })
        });
        
        // Si c'est la devise, mettre à jour localStorage immédiatement
        if (setting.setting_key === 'currency_symbol') {
          localStorage.setItem('currency_symbol', setting.setting_value);
        }
      }
      
      success('Paramètres sauvegardés avec succès !');
      await loadSettings(); // Recharger pour confirmer
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error);
      showError('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggleTableNumber = async (newValue) => {
    setSaving(true);
    try {
      console.log('🔄 Toggle numéro de table vers:', newValue);
      console.log('📊 État actuel avant toggle:', getSettingBool('table_number_enabled'));
      
      // Sauvegarder dans la base de données
      const response = await apiCall('/admin/settings/table_number_enabled', {
        method: 'PUT',
        body: JSON.stringify({ value: newValue })
      });
      
      console.log('📡 Réponse API:', response);
      
      // Recharger les paramètres depuis MySQL
      await loadSettings();
      
      console.log('📊 État après rechargement:', getSettingBool('table_number_enabled'));
      
      // Notification de succès
      success(newValue === 'true' ? '✅ Numéro de table activé !' : '⚪ Numéro de table désactivé');
    } catch (error) {
      console.error('❌❌❌ ERREUR TOGGLE ❌❌❌');
      console.error('Valeur tentée:', newValue);
      console.error('Type erreur:', error.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      showError('Erreur lors de la modification du paramètre');
    } finally {
      setSaving(false);
    }
  };
  
  const getSetting = (key) => {
    const setting = settings.find(s => s.setting_key === key);
    // Pour currency_symbol, retourner '€' par défaut si vide
    if (key === 'currency_symbol') {
      return setting?.setting_value || '€';
    }
    return setting?.setting_value || '';
  };
  
  const getSettingBool = (key) => {
    const value = getSetting(key);
    return value === 'true' || value === '1';
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }
  
  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8 animate-fade-in w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-black flex items-center gap-3">
            <Settings className="w-6 h-6 md:w-8 md:h-8" />
            Paramètres Application
        </h1>
          <p className="text-neutral-600 font-sans mt-1">
            Configuration globale de l&apos;application
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSettings}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Recharger
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            Sauvegarder
          </Button>
        </div>
      </div>
      
      {/* Options de Commande */}
      <Card padding="md">
        <h2 className="text-base font-heading font-bold mb-3 text-black">
          🍽️ Numéro de Table
        </h2>
        
        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border-2 border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="text-lg">🪑</div>
            <div>
              <h3 className="font-heading font-semibold text-black text-sm">
                Demander le numéro de table
              </h3>
              <p className="text-xs text-neutral-600 font-sans">
                Pour les commandes sur place
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-heading font-semibold ${
              getSettingBool('table_number_enabled')
                ? 'bg-green-100 text-green-700'
                : 'bg-neutral-200 text-neutral-600'
            }`}>
              {getSettingBool('table_number_enabled') ? 'Activé' : 'Désactivé'}
            </span>
            
            <Button
              variant={getSettingBool('table_number_enabled') ? "danger" : "success"}
              size="sm"
              onClick={() => handleToggleTableNumber(getSettingBool('table_number_enabled') ? 'false' : 'true')}
              loading={saving}
              icon={getSettingBool('table_number_enabled') ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
              className="text-xs py-1.5 px-3"
            >
              {getSettingBool('table_number_enabled') ? 'Désactiver' : 'Activer'}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Paramètres d'Affichage */}
      <Card padding="lg">
        <h2 className="text-lg font-heading font-bold mb-4 text-black">
          🎨 Paramètres d&apos;Affichage
        </h2>
        
        <div className="space-y-4">
          {/* Devise affichée en haut */}
          <div>
            <label className="block text-sm font-heading font-medium text-black mb-2">
              Devise affichée
            </label>
            <select
              value={getSetting('currency_symbol')}
              onChange={(e) => {
                handleChange('currency_symbol', e.target.value);
                // Sauvegarder immédiatement la devise
                const newValue = e.target.value;
                apiCall(`/admin/settings/currency_symbol`, {
                  method: 'PUT',
                  body: JSON.stringify({ value: newValue })
                }).then(() => {
                  localStorage.setItem('currency_symbol', newValue);
                  success('Devise mise à jour !');
                }).catch((err) => {
                  console.error('Erreur sauvegarde devise:', err);
                  showError('Erreur lors de la sauvegarde de la devise');
                });
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black focus:bg-white transition-all duration-200"
            >
              <option value="€">€ (Euro)</option>
              <option value="$">$ (Dollar)</option>
              <option value="£">£ (Livre Sterling)</option>
              <option value="¥">¥ (Yen)</option>
            </select>
          </div>
          
          {/* Messages côte à côte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-heading font-medium text-black mb-2">
                Message de bienvenue
              </label>
              <textarea
                value={getSetting('welcome_message')}
                onChange={(e) => handleChange('welcome_message', e.target.value)}
                placeholder="Bienvenue chez Blossom Café ! Découvrez nos délicieux thés et pâtisseries..."
                rows="2"
                className="w-full px-3 py-2 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black focus:bg-white transition-all duration-200 resize-none text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-heading font-medium text-black mb-2">
                Message de fermeture
              </label>
              <textarea
                value={getSetting('closed_message')}
                onChange={(e) => handleChange('closed_message', e.target.value)}
                placeholder="Nous sommes actuellement fermés. Nos horaires d'ouverture sont..."
                rows="2"
                className="w-full px-3 py-2 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black focus:bg-white transition-all duration-200 resize-none text-sm"
              />
            </div>
          </div>
        </div>
      </Card>
      
      {/* Paramètres de Notifications */}
      <Card padding="lg">
        <h2 className="text-lg font-heading font-bold mb-4 text-black">
          🔔 Paramètres de Notifications
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border-2 border-neutral-200">
            <div>
              <h3 className="font-heading font-semibold text-black">Notifications email automatiques</h3>
              <p className="text-sm text-neutral-600">Envoyer des emails aux clients</p>
            </div>
            <Button
              variant={getSettingBool('email_notifications') ? 'destructive' : 'default'}
              size="sm"
              onClick={() => handleChange('email_notifications', !getSettingBool('email_notifications'))}
            >
              {getSettingBool('email_notifications') ? 'Désactiver' : 'Activer'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border-2 border-neutral-200">
            <div>
              <h3 className="font-heading font-semibold text-black">Notifications SMS</h3>
              <p className="text-sm text-neutral-600">Envoyer des SMS aux clients</p>
            </div>
            <Button
              variant={getSettingBool('sms_notifications') ? 'destructive' : 'default'}
              size="sm"
              onClick={() => handleChange('sms_notifications', !getSettingBool('sms_notifications'))}
            >
              {getSettingBool('sms_notifications') ? 'Désactiver' : 'Activer'}
            </Button>
          </div>
          
          <div>
            <label className="block text-sm font-heading font-medium text-black mb-2">
              Email de réception des commandes
            </label>
            <input
              type="email"
              value={getSetting('orders_email')}
              onChange={(e) => handleChange('orders_email', e.target.value)}
              placeholder="commandes@blossom-cafe.fr"
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black focus:bg-white transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-heading font-medium text-black mb-2">
              Délai avant rappel automatique (minutes)
            </label>
            <input
              type="number"
              value={getSetting('reminder_delay')}
              onChange={(e) => handleChange('reminder_delay', e.target.value)}
              placeholder="30"
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black focus:bg-white transition-all duration-200"
            />
          </div>
        </div>
      </Card>
      
      {/* Gestion des Catégories */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-heading font-bold flex items-center gap-2 text-black">
            <Grid3x3 className="w-5 h-5" />
            Catégories ({categories.length})
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadCategories}
              icon={<RefreshCw className="w-4 h-4" />}
              size="sm"
            >
              Actualiser
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
              icon={<Plus className="w-4 h-4" />}
              size="sm"
            >
              Nouvelle Catégorie
            </Button>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {showAddCategoryForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-heading font-bold text-black flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle Catégorie
              </h3>
              <button
                onClick={() => setShowAddCategoryForm(false)}
                className="p-1 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom de la catégorie"
                value={categoryFormData.name}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                placeholder="Ex: Boissons Chaudes"
                required
              />
              <Input
                label="Slug (URL)"
                value={categoryFormData.slug}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                placeholder="boissons-chaudes"
                required
              />
              <Input
                label="Description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="Cafés, thés et chocolats chauds"
              />
              <Input
                label="Icône (emoji)"
                value={categoryFormData.icon}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                placeholder="☕"
                maxLength={2}
              />
              <Input
                label="Ordre d&apos;affichage"
                type="number"
                value={categoryFormData.displayOrder}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, displayOrder: e.target.value })}
                min="1"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="primary"
                onClick={handleAddCategory}
                icon={<Save className="w-4 h-4" />}
                size="sm"
              >
                Ajouter
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddCategoryForm(false)}
                size="sm"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Liste des catégories */}
        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Grid3x3 className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
              <p className="font-sans">Aucune catégorie trouvée</p>
              <p className="text-sm mt-2">Ajoutez votre première catégorie pour commencer</p>
            </div>
          ) : (
            categories.map((category, index) => (
              <div
                key={category.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  editingCategoryId === category.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                }`}
              >
                {editingCategoryId === category.id ? (
                  // Mode édition
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nom"
                        value={category.name}
                        onChange={(e) => updateCategoryField(category.id, 'name', e.target.value)}
                      />
                      <Input
                        label="Slug"
                        value={category.slug}
                        onChange={(e) => updateCategoryField(category.id, 'slug', e.target.value)}
                      />
                      <Input
                        label="Description"
                        value={category.description || ''}
                        onChange={(e) => updateCategoryField(category.id, 'description', e.target.value)}
                      />
                      <Input
                        label="Icône"
                        value={category.icon || '📦'}
                        onChange={(e) => updateCategoryField(category.id, 'icon', e.target.value)}
                        maxLength={2}
                      />
                      <Input
                        label="Ordre d&apos;affichage"
                        type="number"
                        value={category.display_order}
                        onChange={(e) => updateCategoryField(category.id, 'display_order', e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateCategory(category.id)}
                        icon={<Save className="w-4 h-4" />}
                        size="sm"
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingCategoryId(null)}
                        size="sm"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <div className="flex items-center gap-4">
                    {/* Ordre et flèches */}
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        #{index + 1}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveCategoryUp(index)}
                          disabled={index === 0}
                          className={`p-1.5 rounded-lg transition-all ${
                            index === 0
                              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                              : 'bg-white text-neutral-700 hover:bg-blue-500 hover:text-white hover:scale-110 shadow-sm'
                          }`}
                          title="Monter"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveCategoryDown(index)}
                          disabled={index === categories.length - 1}
                          className={`p-1.5 rounded-lg transition-all ${
                            index === categories.length - 1
                              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                              : 'bg-white text-neutral-700 hover:bg-blue-500 hover:text-white hover:scale-110 shadow-sm'
                          }`}
                          title="Descendre"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Informations catégorie */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{category.icon || '📦'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-black text-base">
                            {category.name}
                          </h3>
                          <span className="text-xs text-neutral-500 font-mono">
                            /{category.slug}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            category.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {category.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 mt-0.5">
                          {category.description || 'Pas de description'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCategoryActive(category.id)}
                        icon={category.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        title={category.is_active ? 'Désactiver' : 'Activer'}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategoryId(category.id)}
                        icon={<Edit2 className="w-4 h-4" />}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
      
      {/* Informations Système - Réduite de 30% et en bas */}
      <Card padding="md">
        <h2 className="text-base font-heading font-bold mb-3 text-black flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Informations Système
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {/* Backend */}
          <div className="p-3 bg-neutral-50 rounded-lg border-2 border-neutral-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-600" />
                <span className="font-heading font-semibold text-black text-sm">Backend API</span>
              </div>
              {systemStatus.backend.loading ? (
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : systemStatus.backend.connected ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className={`text-xs font-sans ${
                systemStatus.backend.connected ? 'text-green-700' : 'text-red-700'
              }`}>
                {systemStatus.backend.loading ? 'Vérification...' : systemStatus.backend.message}
              </p>
              <p className="text-[10px] text-neutral-600 font-sans truncate">
                {ENV.BACKEND_URL}
              </p>
              <p className="text-[10px] text-neutral-500 font-sans">
                Port: {ENV.BACKEND_PORT}
              </p>
            </div>
          </div>
          
          {/* Base de données */}
          <div className="p-3 bg-neutral-50 rounded-lg border-2 border-neutral-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-600" />
                <span className="font-heading font-semibold text-black text-sm">Base de données</span>
              </div>
              {systemStatus.database.loading ? (
                <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              ) : systemStatus.database.connected ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className={`text-xs font-sans ${
                systemStatus.database.connected ? 'text-green-700' : 'text-red-700'
              }`}>
                {systemStatus.database.loading ? 'Vérification...' : systemStatus.database.message}
              </p>
              <p className="text-[10px] text-neutral-600 font-sans">
                MySQL - blossom_cafe
              </p>
              <p className="text-[10px] text-neutral-500 font-sans">
                Localhost:3306
              </p>
            </div>
          </div>
          
          {/* Frontend */}
          <div className="p-3 bg-neutral-50 rounded-lg border-2 border-neutral-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-green-600" />
                <span className="font-heading font-semibold text-black text-sm">Frontend</span>
              </div>
              {systemStatus.frontend.connected && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-sans text-green-700">
                {systemStatus.frontend.message}
              </p>
              <p className="text-[10px] text-neutral-600 font-sans">
                React + Vite
              </p>
              <p className="text-[10px] text-neutral-500 font-sans">
                Port: {ENV.FRONTEND_PORT || window.location.port || '5173'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Informations détaillées */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
          <h3 className="font-heading font-semibold text-black mb-1.5 text-xs">Informations Techniques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-sans">
            <div>
              <span className="text-neutral-600">Mode:</span>
              <span className="text-black ml-1.5 font-semibold">
                {ENV.isDevelopment ? 'Dev' : 'Prod'}
              </span>
            </div>
            <div>
              <span className="text-neutral-600">API URL:</span>
              <span className="text-black ml-1.5 font-semibold truncate block">
                {ENV.API_URL}
              </span>
            </div>
            <div>
              <span className="text-neutral-600">Backend:</span>
              <span className="text-black ml-1.5 font-semibold">
                Node.js
              </span>
            </div>
            <div>
              <span className="text-neutral-600">Frontend:</span>
              <span className="text-black ml-1.5 font-semibold">
                React
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={checkSystemStatus}
            icon={<RefreshCw className="w-3 h-3" />}
            className="text-xs py-1.5 px-3"
          >
            Actualiser
          </Button>
        </div>
      </Card>
      
    </div>
  );
};

export default AdminSettings;
