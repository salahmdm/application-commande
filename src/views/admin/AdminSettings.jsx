import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Settings, Save, RefreshCw, CheckCircle, XCircle, Server, Database, Globe, Activity, Plus, Trash2, Grid3x3, Eye, EyeOff, ChevronUp, ChevronDown, Gift, Building2, Bell, Ticket, CreditCard, Cpu, Zap, AlertCircle, Info } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useNotifications from '../../hooks/useNotifications';
import useProductStore from '../../store/productStore';
import useProducts from '../../hooks/useProducts';
import useAuth from '../../hooks/useAuth';
import { apiCall } from '../../services/api';
import adminService from '../../services/adminService';
import ENV from '../../config/env';
import { DEFAULT_BUSINESS_INFO, DEFAULT_TICKET_DISPLAY } from '../../services/businessInfoService';
import { previewReceipt } from '../../services/receiptService';
import logger from '../../utils/logger';

const TICKET_DISPLAY_FIELDS = [
  { key: 'ticket_show_name', displayKey: 'showName', label: 'Nom du commerce' },
  { key: 'ticket_show_address', displayKey: 'showAddress', label: 'Adresse' },
  { key: 'ticket_show_phone', displayKey: 'showPhone', label: 'Téléphone' },
  { key: 'ticket_show_siret', displayKey: 'showSiret', label: 'SIRET' },
  { key: 'ticket_show_vat', displayKey: 'showVat', label: 'Numéro de TVA' },
  { key: 'ticket_show_customer_service', displayKey: 'showCustomerService', label: 'Service client' },
  { key: 'ticket_show_email', displayKey: 'showEmail', label: 'Email' },
  { key: 'ticket_show_website', displayKey: 'showWebsite', label: 'Site web' },
  { key: 'ticket_show_legal_form', displayKey: 'showLegalForm', label: 'Forme juridique' },
  { key: 'ticket_show_rcs', displayKey: 'showRcs', label: 'RCS' },
  { key: 'ticket_show_payment_mention', displayKey: 'showPaymentMention', label: 'Mention fiscale / TVA' },
  { key: 'ticket_show_legal_mentions', displayKey: 'showLegalMentions', label: 'Mentions légales' },
  { key: 'ticket_show_return_policy', displayKey: 'showReturnPolicy', label: 'Conditions de retour' },
  { key: 'ticket_show_food_info', displayKey: 'showFoodInfo', label: 'Infos denrées / sécurité' }
];

const FIELD_DISPLAY_MAPPING = {
  business_name: 'ticket_show_name',
  business_address: 'ticket_show_address',
  business_phone: 'ticket_show_phone',
  business_website: 'ticket_show_website',
  business_customer_service: 'ticket_show_customer_service',
  business_email: 'ticket_show_email',
  business_siret: 'ticket_show_siret',
  business_vat_number: 'ticket_show_vat',
  business_legal_form: 'ticket_show_legal_form',
  business_share_capital: 'ticket_show_legal_form',
  business_rcs: 'ticket_show_rcs',
  business_payment_mention: 'ticket_show_payment_mention',
  business_legal_mentions: 'ticket_show_legal_mentions',
  business_return_policy: 'ticket_show_return_policy',
  business_food_info: 'ticket_show_food_info'
};

/**
 * ✅ Composant Tabs pour organiser les paramètres - Responsive
 */
const Tabs = ({ tabs, activeTab, onTabChange, onReload, onSave, saving, isAdmin }) => {
  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6">
        <Card padding="md" className="border-2 border-neutral-200 text-center">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-600" />
            <h2 className="text-lg font-heading font-semibold text-black">
              Accès réservé aux administrateurs
            </h2>
            <p className="text-sm text-neutral-600">
              Vous n’avez pas l’autorisation nécessaire pour configurer l’application.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="border-b-2 border-neutral-200 mb-4 sm:mb-6 overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
      <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 -mb-px">
        {/* Onglets */}
        <div className="flex gap-1 sm:gap-2 -mb-px min-w-max sm:min-w-0 flex-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3
                  font-heading font-semibold text-xs sm:text-sm
                  border-b-2 transition-all duration-200 whitespace-nowrap flex-shrink-0
                  ${isActive
                    ? 'border-black text-black bg-neutral-50'
                    : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
                  }
                `}
              >
                {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                {tab.badge && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                    isActive ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Boutons d'action - Compact */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={onReload}
            className="p-1.5 sm:p-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors flex items-center justify-center"
            title="Recharger"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-black text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
            title="Sauvegarder tout"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            <span className="hidden sm:inline">Sauvegarder</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ✅ Section Card améliorée avec icône et gradient - Responsive
 */
const SectionCard = ({ icon: Icon, title, description, children, className = '' }) => {
  return (
    <Card padding="sm sm:md md:lg lg:xl" className={`border-2 border-neutral-200 shadow-lg ${className}`}>
      <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6 lg:mb-8">
        {Icon && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center flex-shrink-0 shadow-md">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-heading font-bold text-black mb-1 lg:mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-xs sm:text-sm lg:text-base text-neutral-600 font-sans">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
};

/**
 * ✅ Toggle Switch moderne - Responsive
 */
const ToggleSwitch = ({ checked, onChange, label, description, icon: Icon }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl border-2 border-neutral-200 hover:border-neutral-300 transition-all duration-200 gap-3 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
        {Icon && (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-black text-sm mb-0.5">
            {label}
          </h3>
          {description && (
            <p className="text-xs text-neutral-600 font-sans">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
        <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-heading font-semibold whitespace-nowrap ${
          checked
            ? 'bg-green-100 text-green-700'
            : 'bg-neutral-200 text-neutral-600'
        }`}>
          {checked ? 'Activé' : 'Désactivé'}
        </span>
        
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-neutral-200 flex-shrink-0
            ${checked ? 'bg-black' : 'bg-neutral-300'}
          `}
        >
          <span
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-md
              ${checked ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  );
};

/**
 * Vue Paramètres Admin - Design amélioré avec onglets
 * Gestion des paramètres de l'application depuis MySQL
 */
const AdminSettings = () => {
  const { success, error: showError } = useNotifications();
  const { fetchCategories } = useProductStore();
  const { allProducts } = useProducts();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');
  
  // État des connexions système
  const [systemStatus, setSystemStatus] = useState({
    backend: { connected: false, loading: true, message: '' },
    database: { connected: false, loading: true, message: '', tables: 0, pool: null },
    frontend: { connected: true, loading: false, message: 'Frontend actif' }
  });
  
  // Statistiques système
  const [systemStats, setSystemStats] = useState({
    database: null,
    health: null,
    loading: false
  });
  
  // États pour la gestion des catégories
  const [categories, setCategories] = useState([]);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📦',
    displayOrder: 1,
    isActive: true
  });

  // États pour la gestion de la fidélité
  const [loyaltyPointValue, setLoyaltyPointValue] = useState('1');
  const [rewards, setRewards] = useState([]);
  
  // États pour la gestion des promos de paiement
  const [paymentPromos, setPaymentPromos] = useState([]);
  
  // États pour la gestion des codes promo (pour le panier client)
  const [promoCodes, setPromoCodes] = useState([]);
  const [loadingPromoCodes, setLoadingPromoCodes] = useState(false);
  
  // ✅ Onglets organisés par catégorie - Mémorisé pour éviter les re-renders
  const tabs = useMemo(() => [
    { id: 'business', label: 'Entreprise', icon: Building2, description: 'Informations légales' },
    { id: 'ticket', label: 'Ticket', icon: Ticket, description: 'Affichage du ticket' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alertes et communications' },
    { id: 'loyalty', label: 'Fidélité', icon: Gift, description: 'Programme de récompenses' },
    { id: 'categories', label: 'Catégories', icon: Grid3x3, badge: categories.length, description: 'Gestion des catégories' },
    { id: 'system', label: 'Système', icon: Activity, description: 'État et diagnostic' }
  ], [categories.length]);
  
  // Fonctions pour la gestion des catégories
  const loadCategories = useCallback(async () => {
    if (!isAdmin) {
      setCategories([]);
      return;
    }
    try {
      const response = await apiCall('/admin/categories');
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      logger.error('❌ Erreur chargement catégories:', error);
      showError('Erreur lors du chargement des catégories');
    }
  }, [showError, isAdmin]);
  
  const loadSettings = useCallback(async () => {
    if (!isAdmin) {
      setSettings([]);
      setLoading(false);
      return;
    }
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
      logger.error('❌ Erreur chargement paramètres:', error);
      showError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, [showError, isAdmin]);
  
  // Charger les statistiques système
  const loadSystemStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setSystemStats(prev => ({ ...prev, loading: true }));
      
      // Charger uniquement les stats système (pas les stats business)
      const [healthResponse, dbStatusResponse] = await Promise.allSettled([
        fetch(`${ENV.BACKEND_URL}/api/health/db`).then(r => r.json()),
        fetch(`${ENV.BACKEND_URL}/api/db/status`).then(r => r.json())
      ]);
      
      const health = healthResponse.status === 'fulfilled' && healthResponse.value?.success 
        ? healthResponse.value 
        : null;
      
      const dbStatus = dbStatusResponse.status === 'fulfilled' && dbStatusResponse.value?.success 
        ? dbStatusResponse.value 
        : null;
      
      setSystemStats({
        database: dbStatus,
        health,
        loading: false
      });
    } catch (error) {
      logger.error('❌ Erreur chargement stats système:', error);
      setSystemStats(prev => ({ ...prev, loading: false }));
    }
  }, [isAdmin]);
  
  // Vérifier la connexion à la base de données
  const checkDatabaseStatus = useCallback(async () => {
    if (!isAdmin) return;
    setSystemStatus(prev => ({
      ...prev,
      database: { ...prev.database, loading: true }
    }));
    
    try {
      // Essayer /api/db/status pour avoir plus d'infos
      const response = await fetch(`${ENV.BACKEND_URL}/api/db/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSystemStatus(prev => ({
            ...prev,
            database: {
              connected: data.database?.ok || false,
              loading: false,
              message: data.database?.ok ? 'Base de données connectée' : 'Base de données non disponible',
              tables: data.database?.tables || 0,
              pool: data.pool || null
            }
          }));
          return;
        }
      }
      
      // Fallback sur /admin/settings
      const fallbackResponse = await apiCall('/admin/settings');
      if (fallbackResponse.success) {
        setSystemStatus(prev => ({
          ...prev,
          database: {
            connected: true,
            loading: false,
            message: 'Base de données connectée',
            tables: prev.database.tables || 0,
            pool: prev.database.pool || null
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
          message: `Erreur: ${error.message}`,
          tables: prev.database.tables || 0,
          pool: prev.database.pool || null
        }
      }));
    }
  }, [isAdmin]);
  
  // Vérifier l'état des connexions système
  const checkSystemStatus = useCallback(async () => {
    if (!isAdmin) return;
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
  }, [checkDatabaseStatus, isAdmin]);
  
  // Charger les paramètres depuis la base de données
  // Charger les paramètres depuis la base de données
  // Ne charger qu'une seule fois au montage du composant pour éviter les boucles infinies
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadSettings();
    checkSystemStatus();
    loadCategories();
    loadSystemStats();
    const interval = setInterval(() => {
      checkSystemStatus();
      loadSystemStats();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]); // Ne charger qu'une seule fois au montage, pas à chaque changement de fonction
  
  const syncCategoriesWithPOS = useCallback(async () => {
    try {
      await fetchCategories();
      success('Modifications synchronisées');
    } catch (error) {
      logger.warn('⚠️ Erreur synchronisation POS:', error);
    }
  }, [fetchCategories, success]);
  
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  const handleAddCategory = async (categoryData = null) => {
    try {
      const dataToUse = categoryData || categoryFormData;
      
      if (!dataToUse.name || !dataToUse.name.trim()) {
        showError('Le nom de la catégorie est requis');
        return;
      }

      const response = await apiCall('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: dataToUse.name,
          slug: dataToUse.slug || generateSlug(dataToUse.name),
          description: dataToUse.description || '',
          icon: dataToUse.icon || '📦',
          displayOrder: parseInt(dataToUse.display_order || dataToUse.displayOrder || categories.length + 1)
        })
      });

      if (response.success) {
        success('Catégorie ajoutée avec succès !');
        
        if (!categoryData) {
          // Mode formulaire traditionnel
          setCategoryFormData({
            name: '',
            slug: '',
            description: '',
            icon: '📦',
            displayOrder: 1,
            isActive: true
          });
        } else {
          // Mode inline - la catégorie sera chargée avec loadCategories
        }
        
        await loadCategories();
        await syncCategoriesWithPOS();
      }
    } catch (error) {
      logger.error('❌ Erreur ajout catégorie:', error);
      showError('Erreur lors de l\'ajout de la catégorie');
      
      // Si c'était une catégorie inline, la retirer en cas d'erreur
      if (categoryData && categoryData.id && categoryData.id.toString().startsWith('new-')) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryData.id));
      }
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
      logger.error('❌ Erreur suppression catégorie:', error);
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
      logger.error('❌ Erreur toggle catégorie:', error);
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

  // ✅ Sauvegarde automatique optimisée avec debounce pour les catégories
  const saveCategoriesTimeoutRef = useRef(null);
  
  const handleSaveCategory = useCallback(async (categoryId, silent = false) => {
    if (saveCategoriesTimeoutRef.current) {
      clearTimeout(saveCategoriesTimeoutRef.current);
    }

    saveCategoriesTimeoutRef.current = setTimeout(async () => {
      try {
        const category = categories.find(c => c.id === categoryId);
        if (!category || !category.name || category.name.trim() === '') {
          return;
        }

        const response = await apiCall(`/admin/categories/${categoryId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            icon: category.icon || '📦',
            displayOrder: parseInt(category.display_order) || 0,
            isActive: category.is_active !== false
          })
        });

        if (response.success) {
          if (!silent) {
            success('Catégorie sauvegardée automatiquement !');
          }
          await syncCategoriesWithPOS();
        }
      } catch (error) {
        logger.error('❌ Erreur sauvegarde catégorie:', error);
        if (!silent) {
          showError('Erreur lors de la sauvegarde');
        }
      }
    }, silent ? 800 : 500);
  }, [categories, showError, success, syncCategoriesWithPOS]);

  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (saveCategoriesTimeoutRef.current) {
        clearTimeout(saveCategoriesTimeoutRef.current);
      }
    };
  }, []);
  
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
      logger.error('❌ Erreur réorganisation:', error);
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
  
  const handleChange = (key, value) => {
    setSettings(prev => {
      const exists = prev.some(setting => setting.setting_key === key);
      if (exists) {
        return prev.map(setting => 
          setting.setting_key === key 
            ? { ...setting, setting_value: String(value) }
            : setting
        );
      }

      return [
        ...prev,
        {
          setting_key: key,
          setting_value: String(value),
          setting_type: 'string'
        }
      ];
    });
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      logger.log('💾 Sauvegarde des paramètres...');
      
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
      logger.error('❌ Erreur sauvegarde paramètres:', error);
      showError('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggleTableNumber = async (newValue) => {
    setSaving(true);
    try {
      logger.log('🔄 Toggle numéro de table vers:', newValue);
      logger.log('📊 État actuel avant toggle:', getSettingBool('table_number_enabled'));
      
      // Sauvegarder dans la base de données
      const response = await apiCall('/admin/settings/table_number_enabled', {
        method: 'PUT',
        body: JSON.stringify({ value: newValue })
      });
      
      logger.log('📡 Réponse API:', response);
      
      // Recharger les paramètres depuis MySQL
      await loadSettings();
      
      logger.log('📊 État après rechargement:', getSettingBool('table_number_enabled'));
      
      // Notification de succès
      success(newValue === 'true' ? '✅ Numéro de table activé !' : '⚪ Numéro de table désactivé');
    } catch (error) {
      logger.error('❌❌❌ ERREUR TOGGLE ❌❌❌');
      logger.error('Valeur tentée:', newValue);
      logger.error('Type erreur:', error.name);
      logger.error('Message:', error.message);
      logger.error('Stack:', error.stack);
      showError('Erreur lors de la modification du paramètre');
    } finally {
      setSaving(false);
    }
  };
  
  const getSetting = useCallback((key) => {
    const setting = settings.find(s => s.setting_key === key);
    // Pour currency_symbol, retourner '€' par défaut si vide
    if (key === 'currency_symbol') {
      return setting?.setting_value || '€';
    }
    return setting?.setting_value || '';
  }, [settings]);
  
  // Mémoriser getSettingBool pour éviter les re-renders
  const getSettingBool = useCallback((key) => {
    const value = getSetting(key);
    return value === 'true' || value === '1';
  }, [getSetting]);

  const getSettingJSON = useCallback((key, defaultValue = null) => {
    const value = getSetting(key);
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }, [getSetting]);

  // État pour suivre si les paliers ont été initialisés
  const [loyaltyInitialized, setLoyaltyInitialized] = useState(false);

  // Charger les récompenses de fidélité depuis la base de données
  useEffect(() => {
    const loadLoyaltyRewards = async () => {
      if (!loyaltyInitialized) {
        try {
          // Charger la valeur d'un point depuis les settings
          const pointValue = getSetting('loyalty_point_value') || '1';
          setLoyaltyPointValue(pointValue);
          
          // Charger les récompenses depuis l'API
          const response = await adminService.getLoyaltyRewards();
          if (response.success && response.data) {
            // Convertir les données de la BDD au format attendu par le frontend
            const rewardsList = response.data.map(reward => ({
              id: reward.id,
              name: reward.name || '',
              description: reward.description || '',
              pointsRequired: reward.points_required || 0,
              type: reward.reward_type || 'percentage',
              discountValue: reward.discount_value || 0,
              productId: reward.product_id || null,
              isActive: reward.is_active !== false,
              sortOrder: reward.sort_order || 0,
              icon: reward.icon || '🎁'
            }));
            setRewards(rewardsList);
          } else {
            setRewards([]);
          }
          
          setLoyaltyInitialized(true);
        } catch (error) {
          logger.error('❌ Erreur chargement récompenses fidélité:', error);
          // En cas d'erreur, essayer de charger depuis les settings (fallback)
          const rewardsList = getSettingJSON('loyalty_rewards', []);
          setRewards(rewardsList.length > 0 ? rewardsList : []);
          setLoyaltyInitialized(true);
        }
      }
    };
    
    loadLoyaltyRewards();
  }, [loyaltyInitialized, getSetting, getSettingJSON]);

  const handleAddReward = () => {
    setRewards([...rewards, { 
      name: '', 
      description: '', 
      pointsRequired: 0,
      type: 'percentage', // 'percentage', 'product' ou 'fixed'
      discountValue: 0, // Pourcentage ou montant fixe selon le type
      productId: null, // ID du produit offert
      isActive: true,
      sortOrder: rewards.length,
      icon: '🎁'
    }]);
  };

  const handleRemoveReward = async (index) => {
    const reward = rewards[index];
    
    // Si la récompense a un ID (existe en BDD), la supprimer
    if (reward.id) {
      try {
        const result = await adminService.deleteLoyaltyReward(reward.id);
        if (result.success) {
          setRewards(rewards.filter((_, i) => i !== index));
          success('Récompense supprimée avec succès !');
        } else {
          showError('Erreur lors de la suppression de la récompense');
        }
      } catch (error) {
        logger.error('❌ Erreur suppression récompense:', error);
        showError('Erreur lors de la suppression de la récompense');
      }
    } else {
      // Si c'est une nouvelle récompense non sauvegardée, juste la retirer de la liste
      setRewards(rewards.filter((_, i) => i !== index));
    }
  };

  const handleUpdateReward = (index, field, value) => {
    const updated = [...rewards];
    updated[index] = { ...updated[index], [field]: field === 'pointsRequired' ? parseInt(value) || 0 : value };
    setRewards(updated);
  };

  // ✅ Charger les promos de paiement depuis les settings
  const loadPaymentPromos = useCallback(async () => {
    try {
      const response = await apiCall('/admin/settings');
      if (response.success && response.data) {
        const promosSetting = response.data.find(s => s.setting_key === 'payment_promos');
        if (promosSetting && promosSetting.setting_value) {
          try {
            const promos = JSON.parse(promosSetting.setting_value);
            if (Array.isArray(promos)) {
              setPaymentPromos(promos);
              return;
            }
          } catch (e) {
            logger.error('❌ Erreur parsing promos:', e);
          }
        }
      }
      setPaymentPromos([]);
    } catch (error) {
      logger.error('❌ Erreur chargement promos:', error);
      setPaymentPromos([]);
    }
  }, []);

  // ✅ Charger les codes promo (pour le panier client)
  const loadPromoCodes = useCallback(async () => {
    if (!isAdmin) {
      setPromoCodes([]);
      return;
    }
    try {
      setLoadingPromoCodes(true);
      const response = await adminService.getPromoCodes();
      if (response.success && response.data) {
        setPromoCodes(response.data);
      } else {
        setPromoCodes([]);
      }
    } catch (error) {
      logger.error('❌ Erreur chargement codes promo:', error);
      showError('Erreur lors du chargement des codes promo');
      setPromoCodes([]);
    } finally {
      setLoadingPromoCodes(false);
    }
  }, [isAdmin, showError]);

  // Charger les promos et codes promo quand on ouvre l'onglet business
  useEffect(() => {
    if (activeTab === 'business' && isAdmin) {
      loadPaymentPromos();
      loadPromoCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin]);

  // ✅ Ajouter une nouvelle promo
  const handleAddPaymentPromo = () => {
    const newPromo = {
      id: Date.now(), // ID unique temporaire
      label: 'Nouvelle promo',
      discountType: 'percentage',
      discountValue: 10,
      isActive: true,
      validFrom: null,
      validUntil: null,
      maxUses: null,
      usesCount: 0
    };
    setPaymentPromos([...paymentPromos, newPromo]);
  };

  // ✅ Supprimer une promo
  const handleRemovePaymentPromo = async (index) => {
    const updatedPromos = paymentPromos.filter((_, i) => i !== index);
    setPaymentPromos(updatedPromos);
    await savePaymentPromos(updatedPromos);
  };

  // ✅ Mettre à jour une promo
  const handleUpdatePaymentPromo = (index, field, value) => {
    const updated = [...paymentPromos];
    if (field === 'discountValue') {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else if (field === 'maxUses') {
      updated[index] = { ...updated[index], [field]: value === '' || value === null ? null : parseInt(value) || null };
    } else if (field === 'validFrom' || field === 'validUntil') {
      updated[index] = { ...updated[index], [field]: value === '' || value === null ? null : value };
    } else if (field === 'isActive') {
      updated[index] = { ...updated[index], [field]: value };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPaymentPromos(updated);
  };

  // ✅ Sauvegarder les promos dans la base de données
  const savePaymentPromos = async (promosToSave = null) => {
    const promos = promosToSave || paymentPromos;
    try {
      setSaving(true);
      const response = await apiCall('/admin/settings/payment_promos', {
        method: 'PUT',
        body: JSON.stringify({
          value: JSON.stringify(promos),
          setting_type: 'json'
        })
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Erreur lors de la sauvegarde');
      }

      // Mettre à jour le state settings
      setSettings(prev => {
        const existing = prev.find(s => s.setting_key === 'payment_promos');
        if (existing) {
          return prev.map(s =>
            s.setting_key === 'payment_promos'
              ? { ...s, setting_value: JSON.stringify(promos) }
              : s
          );
        }
        return [...prev, {
          setting_key: 'payment_promos',
          setting_value: JSON.stringify(promos),
          setting_type: 'json'
        }];
      });

      success('Promos sauvegardées avec succès !');
    } catch (error) {
      logger.error('❌ Erreur sauvegarde promos:', error);
      showError(error.message || 'Erreur lors de la sauvegarde des promos');
      // Recharger les promos en cas d'erreur
      await loadPaymentPromos();
    } finally {
      setSaving(false);
    }
  };

  // ✅ Sauvegarde optimisée avec debounce pour éviter trop d'appels API
  const saveTimeoutRef = useRef(null);
  
  const handleSaveLoyaltySettings = useCallback(async (silent = false) => {
    // Annuler le timeout précédent pour éviter les appels multiples
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce : attendre 500ms avant de sauvegarder
    saveTimeoutRef.current = setTimeout(async () => {
    setSaving(true);
    try {
        // Sauvegarder chaque récompense dans la base de données (uniquement celles modifiées)
        const promises = rewards.map(async (reward) => {
          // Ignorer les récompenses sans nom (en cours de création)
          if (!reward.name || reward.name.trim() === '') {
            return;
          }

        const rewardData = {
          name: reward.name || '',
          description: reward.description || '',
          pointsRequired: reward.pointsRequired || 0,
          rewardType: reward.type || 'percentage',
          discountValue: reward.discountValue || 0,
          productId: reward.productId || null,
          isActive: reward.isActive !== false,
          sortOrder: reward.sortOrder || 0,
          icon: reward.icon || '🎁'
        };

        if (reward.id) {
          // Mettre à jour une récompense existante
          await adminService.updateLoyaltyReward(reward.id, rewardData);
        } else {
          // Créer une nouvelle récompense
          const result = await adminService.createLoyaltyReward(rewardData);
            if (result.success && result.rewardId) {
            // Mettre à jour l'ID localement
              const updatedRewards = rewards.map((r) => 
                r === reward ? { ...r, id: result.rewardId } : r
              );
              setRewards(updatedRewards);
            }
          }
        });

        await Promise.all(promises);

        if (!silent) {
          success('Récompenses sauvegardées automatiquement !');
        }
        
        // Recharger les récompenses depuis la BDD pour synchroniser
      setLoyaltyInitialized(false);
    } catch (error) {
      logger.error('❌ Erreur sauvegarde paramètres fidélité:', error);
        if (!silent) {
          showError('Erreur lors de la sauvegarde');
        }
    } finally {
      setSaving(false);
    }
    }, silent ? 800 : 500);
  }, [rewards, showError, success]);
  
  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Mémoriser getDisplaySetting pour éviter les re-renders
  const getDisplaySetting = useCallback((key) => {
    const setting = settings.find(s => s.setting_key === key);
    if (!setting || setting.setting_value === '') {
      return true;
    }
    return setting.setting_value === 'true' || setting.setting_value === '1';
  }, [settings]);

  const toggleDisplayField = (ticketKey) => {
    const nextValue = (!getDisplaySetting(ticketKey)).toString();
    handleChange(ticketKey, nextValue);
  };

  const renderTicketLabel = (fieldKey, labelText, htmlFor, displayKeyOverride) => {
    const ticketKey = displayKeyOverride || FIELD_DISPLAY_MAPPING[fieldKey];
    const isToggleable = Boolean(ticketKey);
    const isVisible = isToggleable ? getDisplaySetting(ticketKey) : true;
    const targetId = htmlFor || fieldKey;

    return (
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={targetId}
          className="text-sm font-heading font-medium text-black"
        >
          {labelText}
        </label>
        {isToggleable && (
          <button
            type="button"
            onClick={() => toggleDisplayField(ticketKey)}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
              isVisible
                ? 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                : 'border-neutral-200 text-neutral-400 hover:bg-neutral-100'
            }`}
            title={isVisible ? 'Masquer sur le ticket' : 'Afficher sur le ticket'}
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  };

  // Mémoriser ticketDisplayPreferences pour éviter les re-renders
  const ticketDisplayPreferences = useMemo(() => {
    return TICKET_DISPLAY_FIELDS.reduce((prefs, field) => {
      const setting = settings.find((s) => s.setting_key === field.key);
      if (setting && setting.setting_value !== '') {
        prefs[field.displayKey] = setting.setting_value === 'true' || setting.setting_value === '1';
      }
      return prefs;
    }, { ...DEFAULT_TICKET_DISPLAY });
  }, [settings]);

  // Mémoriser currentBusinessInfo pour éviter les re-renders
  const currentBusinessInfo = useMemo(() => {
    return {
      name: getSetting('business_name') || DEFAULT_BUSINESS_INFO.name,
      address: getSetting('business_address') || DEFAULT_BUSINESS_INFO.address,
      phone: getSetting('business_phone') || DEFAULT_BUSINESS_INFO.phone,
      website: getSetting('business_website') || DEFAULT_BUSINESS_INFO.website,
      customerService: getSetting('business_customer_service') || DEFAULT_BUSINESS_INFO.customerService,
      email: getSetting('business_email') || DEFAULT_BUSINESS_INFO.email,
      siret: getSetting('business_siret') || DEFAULT_BUSINESS_INFO.siret,
      vatNumber: getSetting('business_vat_number') || DEFAULT_BUSINESS_INFO.vatNumber,
      legalForm: getSetting('business_legal_form') || DEFAULT_BUSINESS_INFO.legalForm,
      shareCapital: getSetting('business_share_capital') || DEFAULT_BUSINESS_INFO.shareCapital,
      rcs: getSetting('business_rcs') || DEFAULT_BUSINESS_INFO.rcs,
      paymentMention: getSetting('business_payment_mention') || DEFAULT_BUSINESS_INFO.paymentMention,
      legalMentions: getSetting('business_legal_mentions') || DEFAULT_BUSINESS_INFO.legalMentions,
      returnPolicy: getSetting('business_return_policy') || DEFAULT_BUSINESS_INFO.returnPolicy,
      foodInfo: getSetting('business_food_info') || DEFAULT_BUSINESS_INFO.foodInfo
    };
  }, [getSetting]);

  const handlePreviewTicket = () => {
    const previewItems = [
      { id: 'preview-1', name: 'Menu Déjeuner', quantity: 2, price: 12.5, unit_price: 12.5, tax_rate: 10, taxRate: 10 },
      { id: 'preview-2', name: 'Boisson Maison', quantity: 1, price: 4.5, unit_price: 4.5, tax_rate: 5.5, taxRate: 5.5 },
      { id: 'preview-3', name: 'Dessert Gourmand', quantity: 1, price: 6.9, unit_price: 6.9, tax_rate: 20, taxRate: 20 }
    ];

    const totalPreview = previewItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const paidAmount = 50;
    const changeAmount = Number((paidAmount - totalPreview).toFixed(2));

    const sampleOrder = {
      id: 9999,
      order_number: 'PREVIEW-0001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      handled_by_name: 'Prévisualisation',
      items: previewItems,
      total_amount: totalPreview,
      discount_amount: 0,
      tax_amount: null,
      amount_paid: paidAmount,
      change_amount: changeAmount,
      payment_method: 'cash',
      payment_details: {
        payments: [
          {
            method: 'cash',
            amount: paidAmount
          }
        ],
        totals: {
          change: changeAmount
        }
      }
    };

    // Récupérer les valeurs personnalisées pour le ticket
    const customTicketValues = TICKET_DISPLAY_FIELDS.reduce((values, field) => {
      const valueKey = `ticket_value_${field.key.replace('ticket_show_', '')}`;
      const customValue = getSetting(valueKey);
      if (customValue) {
        // Mapper la clé du ticket vers la clé de l'entreprise
        const businessKey = Object.keys(FIELD_DISPLAY_MAPPING).find(
          key => FIELD_DISPLAY_MAPPING[key] === field.key
        );
        if (businessKey) {
          // Convertir business_key vers la propriété de currentBusinessInfo
          const propertyMap = {
            'business_name': 'name',
            'business_address': 'address',
            'business_phone': 'phone',
            'business_website': 'website',
            'business_customer_service': 'customerService',
            'business_email': 'email',
            'business_siret': 'siret',
            'business_vat_number': 'vatNumber',
            'business_legal_form': 'legalForm',
            'business_share_capital': 'shareCapital',
            'business_rcs': 'rcs',
            'business_payment_mention': 'paymentMention',
            'business_legal_mentions': 'legalMentions',
            'business_return_policy': 'returnPolicy',
            'business_food_info': 'foodInfo'
          };
          const propertyName = propertyMap[businessKey];
          if (propertyName) {
            values[propertyName] = customValue;
          }
        }
      }
      return values;
    }, {});

    const previewBusinessInfo = {
      ...currentBusinessInfo,
      ...customTicketValues, // Remplacer les valeurs par défaut par les valeurs personnalisées
      displayPreferences: ticketDisplayPreferences
    };

    // previewReceipt est maintenant async
    previewReceipt(sampleOrder, {
      businessInfo: previewBusinessInfo,
      clientType: 'particulier',
      clientInfo: {
        name: 'Client Démo'
      },
      ticketDisplay: ticketDisplayPreferences
    }).catch((error) => {
      logger.error('❌ Erreur lors de l\'aperçu:', error);
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }
  
  // ✅ Rendu des sections selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return (
          <div className="space-y-6">
            <SectionCard
              icon={Settings}
              title="Paramètres généraux"
              description="Personnalisez l'apparence et les options principales"
            >
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-heading font-semibold text-black mb-2">
                    Devise affichée
                  </label>
                  <select
                    value={getSetting('currency_symbol')}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      handleChange('currency_symbol', newValue);
                      apiCall(`/admin/settings/currency_symbol`, {
                        method: 'PUT',
                        body: JSON.stringify({ value: newValue })
                      })
                        .then(() => {
                          localStorage.setItem('currency_symbol', newValue);
                          success('Devise mise à jour !');
                        })
                        .catch((err) => {
                          logger.error('Erreur sauvegarde devise:', err);
                          showError('Erreur lors de la sauvegarde de la devise');
                        });
                    }}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-neutral-200 bg-white text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black transition-all duration-200 font-sans text-sm"
                  >
                    <option value="€">€ (Euro)</option>
                    <option value="$">$ (Dollar)</option>
                    <option value="£">£ (Livre Sterling)</option>
                    <option value="¥">¥ (Yen)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-heading font-semibold text-black mb-2">
                    Adresse mail contact
                  </label>
                  <Input
                    type="email"
                    value={getSetting('contact_email') || ''}
                    onChange={(e) => {
                      handleChange('contact_email', e.target.value);
                      apiCall(`/admin/settings/contact_email`, {
                        method: 'PUT',
                        body: JSON.stringify({ value: e.target.value })
                      })
                        .then(() => {
                          success('Adresse mail contact mise à jour !');
                        })
                        .catch((err) => {
                          logger.error('Erreur sauvegarde adresse mail contact:', err);
                          showError('Erreur lors de la sauvegarde de l\'adresse mail contact');
                        });
                    }}
                    placeholder="contact@blossom-cafe.fr"
                    className="w-full"
                  />
                  <p className="text-xs text-neutral-500 mt-1 font-sans">
                    Cette adresse sera utilisée pour le bouton &quot;Nous contacter par email&quot; sur la page d&apos;accueil
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={CreditCard}
              title="Options de Commande"
              description="Configurez les options disponibles pour les commandes"
            >
              <ToggleSwitch
                checked={getSettingBool('table_number_enabled')}
                onChange={(checked) => handleToggleTableNumber(checked ? 'true' : 'false')}
                label="Demander le numéro de table"
                description="Pour les commandes sur place"
                icon={Settings}
              />
            </SectionCard>

            <SectionCard
              icon={Gift}
              title="Promos de Paiement"
              description="Configurez les promotions disponibles lors du paiement"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-heading font-bold text-black">
                      Promos ({paymentPromos.length})
                    </h3>
                    <p className="text-xs text-neutral-600 font-sans mt-1">
                      Les promos apparaîtront dans le menu déroulant du bouton &quot;Promo&quot; lors du paiement
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddPaymentPromo}
                    icon={<Plus className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    Ajouter
                  </Button>
                </div>

                {paymentPromos.length === 0 ? (
                  <div className="text-center py-8 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                    <p className="font-sans font-medium text-base">Aucune promo</p>
                    <p className="text-sm mt-2 text-neutral-600 font-sans">
                      Ajoutez votre première promo pour commencer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentPromos.map((promo, index) => (
                      <div key={promo.id || index} className="p-4 bg-white rounded-xl border-2 border-neutral-200 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Label</label>
                              <input
                                type="text"
                                value={promo.label || ''}
                                onChange={(e) => handleUpdatePaymentPromo(index, 'label', e.target.value)}
                                onBlur={() => savePaymentPromos()}
                                placeholder="Ex: Réduction 10%"
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Type</label>
                              <select
                                value={promo.discountType || 'percentage'}
                                onChange={(e) => {
                                  handleUpdatePaymentPromo(index, 'discountType', e.target.value);
                                  savePaymentPromos();
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                              >
                                <option value="percentage">Pourcentage (%)</option>
                                <option value="fixed">Montant fixe (€)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                                {promo.discountType === 'percentage' ? 'Valeur (%)' : 'Montant (€)'}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={promo.discountType === 'percentage' ? '100' : undefined}
                                step={promo.discountType === 'percentage' ? '1' : '0.01'}
                                value={promo.discountValue || 0}
                                onChange={(e) => handleUpdatePaymentPromo(index, 'discountValue', e.target.value)}
                                onBlur={() => savePaymentPromos()}
                                placeholder="0"
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemovePaymentPromo(index)}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex-shrink-0 ml-3"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                              Date de début (optionnel)
                            </label>
                            <input
                              type="datetime-local"
                              value={promo.validFrom ? new Date(promo.validFrom).toISOString().slice(0, 16) : ''}
                              onChange={(e) => {
                                const value = e.target.value ? new Date(e.target.value).toISOString() : null;
                                handleUpdatePaymentPromo(index, 'validFrom', value);
                              }}
                              onBlur={() => savePaymentPromos()}
                              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            />
                            {promo.validFrom && (
                              <p className="text-xs text-neutral-500 mt-1 font-sans">
                                Début: {new Date(promo.validFrom).toLocaleString('fr-FR')}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                              Date de fin (optionnel)
                            </label>
                            <input
                              type="datetime-local"
                              value={promo.validUntil ? new Date(promo.validUntil).toISOString().slice(0, 16) : ''}
                              onChange={(e) => {
                                const value = e.target.value ? new Date(e.target.value).toISOString() : null;
                                handleUpdatePaymentPromo(index, 'validUntil', value);
                              }}
                              onBlur={() => savePaymentPromos()}
                              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            />
                            {promo.validUntil && (
                              <p className="text-xs text-neutral-500 mt-1 font-sans">
                                Fin: {new Date(promo.validUntil).toLocaleString('fr-FR')}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                              Nombre max d&apos;utilisations (optionnel)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={promo.maxUses || ''}
                              onChange={(e) => handleUpdatePaymentPromo(index, 'maxUses', e.target.value)}
                              onBlur={() => savePaymentPromos()}
                              placeholder="Illimité"
                              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            />
                            {promo.maxUses && (
                              <p className="text-xs text-neutral-500 mt-1 font-sans">
                                Utilisations: {promo.usesCount || 0} / {promo.maxUses}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {paymentPromos.length > 0 && (
                  <div className="flex justify-end pt-4 border-t border-neutral-200">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => savePaymentPromos()}
                      disabled={saving}
                      icon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    >
                      {saving ? 'Sauvegarde...' : 'Sauvegarder toutes les promos'}
                    </Button>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={Gift}
              title="Codes Promo (Panier Client)"
              description="Gérez les codes promo que les clients peuvent utiliser dans leur panier"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-heading font-bold text-black">
                      Codes Promo ({promoCodes.length})
                    </h3>
                    <p className="text-xs text-neutral-600 font-sans mt-1">
                      Les clients peuvent entrer ces codes dans leur panier pour obtenir une réduction
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      try {
                        setSaving(true);
                        const newCode = {
                          code: `PROMO${Date.now()}`,
                          description: 'Nouveau code promo',
                          discountType: 'percentage',
                          discountValue: 10,
                          minOrderAmount: 0,
                          maxUses: null,
                          validFrom: new Date().toISOString(),
                          validUntil: null,
                          isActive: true
                        };
                        const response = await adminService.createPromoCode(newCode);
                        if (response.success) {
                          success('Code promo créé !');
                          await loadPromoCodes();
                        } else {
                          showError(response.error || 'Erreur lors de la création');
                        }
                      } catch (error) {
                        logger.error('❌ Erreur création code promo:', error);
                        showError('Erreur lors de la création du code promo');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    icon={<Plus className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                    disabled={saving || loadingPromoCodes}
                  >
                    Ajouter
                  </Button>
                </div>

                {loadingPromoCodes ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-3" />
                    <p className="text-sm text-neutral-600 font-sans">Chargement...</p>
                  </div>
                ) : promoCodes.length === 0 ? (
                  <div className="text-center py-8 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                    <p className="font-sans font-medium text-base">Aucun code promo</p>
                    <p className="text-sm mt-2 text-neutral-600 font-sans">
                      Créez votre premier code promo pour commencer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {promoCodes.map((promoCode) => (
                      <div key={promoCode.id} className="p-4 bg-white rounded-xl border-2 border-neutral-200 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Code</label>
                              <input
                                type="text"
                                value={promoCode.code || ''}
                                onChange={async (e) => {
                                  try {
                                    await adminService.updatePromoCode(promoCode.id, { code: e.target.value.toUpperCase() });
                                    await loadPromoCodes();
                                  } catch (error) {
                                    logger.error('❌ Erreur mise à jour code:', error);
                                    showError('Erreur lors de la mise à jour');
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Description</label>
                              <input
                                type="text"
                                value={promoCode.description || ''}
                                onChange={async (e) => {
                                  try {
                                    await adminService.updatePromoCode(promoCode.id, { description: e.target.value });
                                    await loadPromoCodes();
                                  } catch (error) {
                                    logger.error('❌ Erreur mise à jour description:', error);
                                    showError('Erreur lors de la mise à jour');
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Type</label>
                              <select
                                value={promoCode.discount_type || 'percentage'}
                                onChange={async (e) => {
                                  try {
                                    await adminService.updatePromoCode(promoCode.id, { discountType: e.target.value });
                                    await loadPromoCodes();
                                  } catch (error) {
                                    logger.error('❌ Erreur mise à jour type:', error);
                                    showError('Erreur lors de la mise à jour');
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                              >
                                <option value="percentage">Pourcentage (%)</option>
                                <option value="fixed">Montant fixe (€)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                                {promoCode.discount_type === 'percentage' ? 'Valeur (%)' : 'Montant (€)'}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={promoCode.discount_type === 'percentage' ? '100' : undefined}
                                step={promoCode.discount_type === 'percentage' ? '1' : '0.01'}
                                value={promoCode.discount_value || 0}
                                onChange={async (e) => {
                                  try {
                                    await adminService.updatePromoCode(promoCode.id, { discountValue: parseFloat(e.target.value) || 0 });
                                    await loadPromoCodes();
                                  } catch (error) {
                                    logger.error('❌ Erreur mise à jour valeur:', error);
                                    showError('Erreur lors de la mise à jour');
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                              />
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Supprimer le code promo "${promoCode.code}" ?`)) {
                                try {
                                  setSaving(true);
                                  await adminService.deletePromoCode(promoCode.id);
                                  success('Code promo supprimé !');
                                  await loadPromoCodes();
                                } catch (error) {
                                  logger.error('❌ Erreur suppression code promo:', error);
                                  showError('Erreur lors de la suppression');
                                } finally {
                                  setSaving(false);
                                }
                              }
                            }}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex-shrink-0 ml-3"
                            title="Supprimer"
                            disabled={saving}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                              Montant minimum (€)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={promoCode.min_order_amount || 0}
                              onChange={async (e) => {
                                try {
                                  await adminService.updatePromoCode(promoCode.id, { minOrderAmount: parseFloat(e.target.value) || 0 });
                                  await loadPromoCodes();
                                } catch (error) {
                                  logger.error('❌ Erreur mise à jour montant min:', error);
                                  showError('Erreur lors de la mise à jour');
                                }
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                              Date de début
                            </label>
                            <input
                              type="datetime-local"
                              value={promoCode.valid_from ? new Date(promoCode.valid_from).toISOString().slice(0, 16) : ''}
                              onChange={async (e) => {
                                try {
                                  const value = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString();
                                  await adminService.updatePromoCode(promoCode.id, { validFrom: value });
                                  await loadPromoCodes();
                                } catch (error) {
                                  logger.error('❌ Erreur mise à jour date début:', error);
                                  showError('Erreur lors de la mise à jour');
                                }
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                              Date de fin (optionnel)
                            </label>
                            <input
                              type="datetime-local"
                              value={promoCode.valid_until ? new Date(promoCode.valid_until).toISOString().slice(0, 16) : ''}
                              onChange={async (e) => {
                                try {
                                  const value = e.target.value ? new Date(e.target.value).toISOString() : null;
                                  await adminService.updatePromoCode(promoCode.id, { validUntil: value });
                                  await loadPromoCodes();
                                } catch (error) {
                                  logger.error('❌ Erreur mise à jour date fin:', error);
                                  showError('Erreur lors de la mise à jour');
                                }
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                              Max utilisations (optionnel)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={promoCode.max_uses || ''}
                              onChange={async (e) => {
                                try {
                                  const value = e.target.value ? parseInt(e.target.value) : null;
                                  await adminService.updatePromoCode(promoCode.id, { maxUses: value });
                                  await loadPromoCodes();
                                } catch (error) {
                                  logger.error('❌ Erreur mise à jour max uses:', error);
                                  showError('Erreur lors de la mise à jour');
                                }
                              }}
                              placeholder="Illimité"
                              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            />
                            {promoCode.max_uses && (
                              <p className="text-xs text-neutral-500 mt-1 font-sans">
                                Utilisations: {promoCode.uses_count || 0} / {promoCode.max_uses}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={promoCode.is_active === 1 || promoCode.is_active === true}
                              onChange={async (e) => {
                                try {
                                  await adminService.updatePromoCode(promoCode.id, { isActive: e.target.checked });
                                  await loadPromoCodes();
                                } catch (error) {
                                  logger.error('❌ Erreur mise à jour statut:', error);
                                  showError('Erreur lors de la mise à jour');
                                }
                              }}
                              className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-2 focus:ring-black"
                            />
                            <span className="text-xs font-semibold text-neutral-700 font-sans">Code actif</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
            </div>
        );

      case 'ticket':
        return (
          <div className="space-y-6">
            <SectionCard
              icon={Ticket}
              title="Paramètres d'Affichage du Ticket"
              description="Configurez quels éléments apparaissent sur les tickets de caisse et leurs valeurs personnalisées"
            >
              <div className="flex items-center justify-end mb-4 sm:mb-5">
                <Button
                  variant="outline"
                  onClick={handlePreviewTicket}
                  icon={<Eye className="w-4 h-4" />}
                  size="sm"
                >
                  Aperçu du ticket
                </Button>
              </div>
              
              <div className="space-y-4 sm:space-y-5">
                {TICKET_DISPLAY_FIELDS.map((field) => {
                  const valueKey = `ticket_value_${field.key.replace('ticket_show_', '')}`;
                  const customValue = getSetting(valueKey) || '';
                  const isVisible = getDisplaySetting(field.key);
                  
                  // Récupérer la clé de l'entreprise correspondante
                  const businessKey = Object.keys(FIELD_DISPLAY_MAPPING).find(
                    key => FIELD_DISPLAY_MAPPING[key] === field.key
                  );
                  const defaultValue = businessKey ? getSetting(businessKey) || '' : '';
                  
                  return (
                    <div
                      key={field.key}
                      className="p-4 sm:p-5 bg-gradient-to-r from-neutral-50 to-white rounded-xl border-2 border-neutral-200 hover:border-neutral-300 transition-all duration-200"
                    >
                      <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Toggle Switch pour afficher/masquer */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="text-sm sm:text-base font-heading font-semibold text-black block mb-1">
                              {field.label}
                            </label>
                            <p className="text-xs sm:text-sm text-neutral-600 font-sans">
                              {`Afficher ${field.label.toLowerCase()} sur le ticket`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleChange(field.key, isVisible ? 'false' : 'true')}
                            className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 ${
                              isVisible ? 'bg-neutral-800' : 'bg-neutral-300'
                            }`}
                            role="switch"
                            aria-checked={isVisible}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isVisible ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        
                        {/* Champ de valeur personnalisée */}
                        {isVisible && (
                          <div className="mt-2">
                            <label
                              htmlFor={valueKey}
                              className="block text-xs sm:text-sm font-heading font-medium text-black mb-2"
                            >
                              Valeur personnalisée (optionnel)
                            </label>
                            <input
                              id={valueKey}
                              type="text"
                              value={customValue}
                              onChange={(e) => handleChange(valueKey, e.target.value)}
                              placeholder={defaultValue ? `Valeur par défaut: ${defaultValue}` : `Entrez une valeur pour ${field.label.toLowerCase()}`}
                              className="w-full px-4 py-2.5 sm:py-3 rounded-xl border-2 border-neutral-200 bg-white text-black text-sm focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black transition-all duration-200 font-sans"
                            />
                            <p className="mt-1.5 text-xs text-neutral-500 font-sans">
                              {defaultValue 
                                ? `Laissez vide pour utiliser la valeur par défaut: "${defaultValue}"`
                                : 'Laissez vide pour ne pas afficher de valeur sur le ticket'
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
            </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <SectionCard
              icon={Bell}
              title="Paramètres de Notifications"
              description="Configurez les alertes et communications automatiques"
            >
              <div className="space-y-3 sm:space-y-4">
                <ToggleSwitch
                  checked={getSettingBool('email_notifications')}
                  onChange={(checked) => handleChange('email_notifications', checked ? 'true' : 'false')}
                  label="Notifications email automatiques"
                  description="Envoyer des emails aux clients pour les mises à jour de commande"
                  icon={Bell}
                />
                
                <ToggleSwitch
                  checked={getSettingBool('sms_notifications')}
                  onChange={(checked) => handleChange('sms_notifications', checked ? 'true' : 'false')}
                  label="Notifications SMS"
                  description="Envoyer des SMS aux clients (nécessite un service SMS)"
                  icon={Bell}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 pt-3 sm:pt-4 lg:pt-6 border-t border-neutral-200">
          <div>
                    <label className="block text-xs sm:text-sm font-heading font-semibold text-black mb-2">
              Email de réception des commandes
            </label>
            <input
              type="email"
              value={getSetting('orders_email')}
              onChange={(e) => handleChange('orders_email', e.target.value)}
              placeholder="commandes@blossom-cafe.fr"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-neutral-200 bg-white text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black transition-all duration-200 font-sans text-sm"
            />
          </div>
          
          <div>
                    <label className="block text-xs sm:text-sm font-heading font-semibold text-black mb-2">
              Délai avant rappel automatique (minutes)
            </label>
            <input
              type="number"
              value={getSetting('reminder_delay')}
              onChange={(e) => handleChange('reminder_delay', e.target.value)}
              placeholder="30"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-neutral-200 bg-white text-black focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-black transition-all duration-200 font-sans text-sm"
            />
          </div>
        </div>
        </div>
            </SectionCard>
          </div>
        );

      case 'loyalty':
        return (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* ✅ Configuration principale - Simplifiée */}
            <SectionCard
              icon={Gift}
              title="Programme de Fidélité"
              description="Configurez le système de points et récompenses"
            >
              <div className="space-y-6 lg:space-y-8">
                {/* Valeur d'un point - Design compact */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 lg:gap-6 p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <div className="flex-1">
                    <label className="block text-sm lg:text-base font-heading font-semibold text-black mb-2">
                      💰 Valeur d&apos;un point (€)
            </label>
                    <div className="flex items-center gap-3">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={loyaltyPointValue}
              onChange={(e) => setLoyaltyPointValue(e.target.value)}
              placeholder="1.00"
                        className="flex-1 max-w-xs"
                      />
                      <span className="text-sm lg:text-base text-neutral-600 font-sans whitespace-nowrap">
                        = 1€ dépensé
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await apiCall('/admin/settings/loyalty_point_value', {
                          method: 'PUT',
                          body: JSON.stringify({ value: loyaltyPointValue })
                        });
                        handleChange('loyalty_point_value', loyaltyPointValue);
                        success('Valeur du point sauvegardée !');
                      } catch (error) {
                        showError('Erreur lors de la sauvegarde');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    loading={saving}
                    icon={<Save className="w-4 h-4" />}
                    size="sm"
                    className="w-full sm:w-auto whitespace-nowrap"
                  >
                    Sauvegarder
                  </Button>
          </div>

                {/* ✅ Récompenses - Tableau compact et performant */}
          <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 lg:mb-6">
                    <div>
                      <h3 className="text-base lg:text-lg font-heading font-bold text-black">
                        Récompenses ({rewards.length})
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-600 font-sans mt-1">
                        Gérez les récompenses offertes aux clients
                      </p>
                    </div>
              <Button
                      variant="primary"
                size="sm"
                onClick={handleAddReward}
                      icon={<Plus className="w-4 h-4" />}
                      className="w-full sm:w-auto"
              >
                      Ajouter
              </Button>
            </div>

                  {rewards.length === 0 ? (
                    <div className="text-center py-8 lg:py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
                      <Gift className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 text-neutral-400" />
                      <p className="font-sans font-medium text-base lg:text-lg">Aucune récompense</p>
                      <p className="text-sm lg:text-base mt-2 text-neutral-600 font-sans">
                        Ajoutez votre première récompense pour commencer
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 lg:space-y-4">
                      {/* Version Desktop - Tableau compact */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                          <thead className="bg-purple-50 border-b-2 border-purple-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm">#</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm">Nom</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm">Points</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm">Type</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm">Valeur</th>
                              <th className="px-4 py-3 text-center font-heading font-semibold text-black text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-100">
              {rewards.map((reward, index) => (
                              <tr key={reward.id || index} className="hover:bg-purple-50/50 transition-colors">
                                <td className="px-4 py-4">
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <input
                      type="text"
                      value={reward.name || ''}
                      onChange={(e) => handleUpdateReward(index, 'name', e.target.value)}
                      placeholder="Nom de la récompense"
                                    className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                    onBlur={() => handleSaveLoyaltySettings(true)}
                    />
                                </td>
                                <td className="px-4 py-4">
                                  <input
                      type="number"
                      min="0"
                      value={reward.pointsRequired || 0}
                      onChange={(e) => handleUpdateReward(index, 'pointsRequired', e.target.value)}
                                    placeholder="Points"
                                    className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center max-w-24"
                                    onBlur={() => handleSaveLoyaltySettings(true)}
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <select
                                    value={reward.type || 'percentage'}
                                    onChange={(e) => {
                                      handleUpdateReward(index, 'type', e.target.value);
                                      handleSaveLoyaltySettings();
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  >
                                    <option value="percentage">Réduction %</option>
                                    <option value="product">Produit gratuit</option>
                                  </select>
                                </td>
                                <td className="px-4 py-4">
                                  {(reward.type || 'percentage') === 'percentage' ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={reward.discountValue || 0}
                                        onChange={(e) => handleUpdateReward(index, 'discountValue', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center max-w-20"
                                        onBlur={() => handleSaveLoyaltySettings(true)}
                                      />
                                      <span className="text-sm text-neutral-600 font-sans">%</span>
                  </div>
                                  ) : (
                                    <select
                                      value={reward.productId || ''}
                                      onChange={(e) => {
                                        handleUpdateReward(index, 'productId', e.target.value);
                                        handleSaveLoyaltySettings();
                                      }}
                                      className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                    >
                                      <option value="">Sélectionner...</option>
                                      {allProducts.map((product) => (
                                        <option key={product.id} value={product.id}>
                                          {product.name} - {product.price}€
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center justify-center gap-2">
                      <button
                                      onClick={() => handleRemoveReward(index)}
                                      className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                      </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Version Mobile/Tablette - Cartes compactes */}
                      <div className="lg:hidden space-y-3">
                        {rewards.map((reward, index) => (
                          <div key={reward.id || index} className="p-4 bg-white rounded-xl border-2 border-purple-200 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={reward.name || ''}
                                    onChange={(e) => handleUpdateReward(index, 'name', e.target.value)}
                                    placeholder="Nom de la récompense"
                                    className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                    onBlur={() => handleSaveLoyaltySettings(true)}
                                  />
                                </div>
                              </div>
                      <button
                                onClick={() => handleRemoveReward(index)}
                                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex-shrink-0"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                      </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Points requis</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={reward.pointsRequired || 0}
                                  onChange={(e) => handleUpdateReward(index, 'pointsRequired', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  onBlur={() => handleSaveLoyaltySettings()}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Type</label>
                                <select
                                  value={reward.type || 'percentage'}
                                  onChange={(e) => {
                                    handleUpdateReward(index, 'type', e.target.value);
                                    handleSaveLoyaltySettings();
                                  }}
                                  className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                >
                                  <option value="percentage">Réduction %</option>
                                  <option value="product">Produit gratuit</option>
                                </select>
                    </div>
                  </div>

                            <div className="mt-3">
                  {(reward.type || 'percentage') === 'percentage' ? (
                                <div>
                                  <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Pourcentage</label>
                                  <div className="flex items-center gap-2">
                                    <input
                          type="number"
                          min="0"
                          max="100"
                          value={reward.discountValue || 0}
                          onChange={(e) => handleUpdateReward(index, 'discountValue', e.target.value)}
                                      className="flex-1 px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                      onBlur={() => handleSaveLoyaltySettings(true)}
                        />
                                    <span className="text-sm text-neutral-600 font-sans">%</span>
                      </div>
                    </div>
                  ) : (
                                <div>
                                  <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Produit offert</label>
                      <select
                        value={reward.productId || ''}
                                    onChange={(e) => {
                                      handleUpdateReward(index, 'productId', e.target.value);
                                      handleSaveLoyaltySettings();
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-black text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  >
                                    <option value="">Sélectionner...</option>
                        {allProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.price}€
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                            </div>
                </div>
              ))}
                      </div>
                    </div>
                  )}

                  {/* Note d'information */}
                  {rewards.length > 0 && (
                    <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs sm:text-sm text-blue-800 font-sans">
                        💡 <strong>Astuce:</strong> Les modifications sont sauvegardées automatiquement lorsque vous quittez un champ.
                      </p>
                    </div>
              )}
            </div>
          </div>
            </SectionCard>
        </div>
        );

      case 'categories':
        return (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <SectionCard
              icon={Grid3x3}
              title={`Catégories (${categories.length})`}
              description="Gérez les catégories de produits de votre catalogue"
            >
              <div className="space-y-6 lg:space-y-8">
                {/* ✅ Récompenses - Tableau compact et performant */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 lg:mb-6">
                    <div>
                      <h3 className="text-base lg:text-lg font-heading font-bold text-black">
                        Liste des catégories ({categories.length})
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-600 font-sans mt-1">
                        Gérez l&apos;ordre et le contenu de vos catégories
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const newCategory = {
                          id: `new-${Date.now()}`,
                          name: '',
                          slug: '',
                          description: '',
                          icon: '📦',
                          display_order: categories.length + 1,
                          is_active: true
                        };
                        setCategories([...categories, newCategory]);
                      }}
                      icon={<Plus className="w-4 h-4" />}
                      className="w-full sm:w-auto"
                    >
                      Ajouter
                    </Button>
                  </div>

                  {categories.length === 0 ? (
                    <div className="text-center py-8 lg:py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
                      <Grid3x3 className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 text-neutral-400" />
                      <p className="font-sans font-medium text-base lg:text-lg">Aucune catégorie</p>
                      <p className="text-sm lg:text-base mt-2 text-neutral-600 font-sans">
                        Ajoutez votre première catégorie pour commencer
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 lg:space-y-4">
                      {/* Version Desktop - Tableau compact */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                          <thead className="bg-blue-50 border-b-2 border-blue-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm w-16">#</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm">Nom</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm">Slug</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm">Description</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm w-24">Ordre</th>
                              <th className="px-4 py-3 text-left font-heading font-semibold text-black text-sm w-32">Statut</th>
                              <th className="px-4 py-3 text-center font-heading font-semibold text-black text-sm w-32">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-100">
                            {categories.map((category, index) => (
                              <tr key={category.id || index} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-4 py-4">
                                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <input
                                    type="text"
                                    value={category.name || ''}
                                    onChange={(e) => {
                                      updateCategoryField(category.id, 'name', e.target.value);
                                      if (category.id && category.id.toString().startsWith('new-')) {
                                        // Auto-générer le slug pour les nouvelles catégories
                                        updateCategoryField(category.id, 'slug', generateSlug(e.target.value));
                                      }
                                    }}
                                    placeholder="Nom de la catégorie"
                                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    onBlur={() => {
                                      if (category.name && category.name.trim()) {
                                        if (category.id && category.id.toString().startsWith('new-')) {
                                          // Créer la nouvelle catégorie
                                          handleAddCategory(category);
                                        } else {
                                          handleSaveCategory(category.id, true);
                                        }
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <input
                                    type="text"
                                    value={category.slug || ''}
                                    onChange={(e) => {
                                      updateCategoryField(category.id, 'slug', e.target.value);
                                      handleSaveCategory(category.id, true);
                                    }}
                                    placeholder="slug-url"
                                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-black text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    onBlur={() => handleSaveCategory(category.id, true)}
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <input
                                    type="text"
                                    value={category.description || ''}
                                    onChange={(e) => {
                                      updateCategoryField(category.id, 'description', e.target.value);
                                      handleSaveCategory(category.id, true);
                                    }}
                                    placeholder="Description..."
                                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    onBlur={() => handleSaveCategory(category.id, true)}
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => moveCategoryUp(index)}
                                      disabled={index === 0}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        index === 0
                                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                          : 'bg-white text-neutral-700 hover:bg-blue-500 hover:text-white border border-blue-200'
                                      }`}
                                      title="Monter"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <input
                                      type="number"
                                      value={category.display_order || 0}
                                      onChange={(e) => {
                                        updateCategoryField(category.id, 'display_order', e.target.value);
                                        handleSaveCategory(category.id, true);
                                      }}
                                      className="w-16 px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-black text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                      onBlur={() => handleSaveCategory(category.id, true)}
                                    />
                                    <button
                                      onClick={() => moveCategoryDown(index)}
                                      disabled={index === categories.length - 1}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        index === categories.length - 1
                                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                          : 'bg-white text-neutral-700 hover:bg-blue-500 hover:text-white border border-blue-200'
                                      }`}
                                      title="Descendre"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <button
                                    onClick={() => handleToggleCategoryActive(category.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                      category.is_active
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                  >
                                    {category.is_active ? 'Actif' : 'Inactif'}
                                  </button>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleDeleteCategory(category.id)}
                                      className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Version Mobile/Tablette - Cartes compactes */}
                      <div className="lg:hidden space-y-3">
                        {categories.map((category, index) => (
                          <div key={category.id || index} className="p-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={category.name || ''}
                                    onChange={(e) => {
                                      updateCategoryField(category.id, 'name', e.target.value);
                                      if (category.id && category.id.toString().startsWith('new-')) {
                                        updateCategoryField(category.id, 'slug', generateSlug(e.target.value));
                                      }
                                    }}
                                    placeholder="Nom de la catégorie"
                                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-black text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    onBlur={() => {
                                      if (category.name && category.name.trim()) {
                                        if (category.id && category.id.toString().startsWith('new-')) {
                                          handleAddCategory(category);
                                        } else {
                                          handleSaveCategory(category.id, true);
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex-shrink-0"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Slug</label>
                                <input
                                  type="text"
                                  value={category.slug || ''}
                                  onChange={(e) => {
                                    updateCategoryField(category.id, 'slug', e.target.value);
                                    handleSaveCategory(category.id, true);
                                  }}
                                  className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-black text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                  onBlur={() => handleSaveCategory(category.id, true)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Ordre</label>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => moveCategoryUp(index)}
                                    disabled={index === 0}
                                    className={`p-1.5 rounded-lg transition-all ${
                                      index === 0
                                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                        : 'bg-white text-neutral-700 hover:bg-blue-500 hover:text-white border border-blue-200'
                                    }`}
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    value={category.display_order || 0}
                                    onChange={(e) => {
                                      updateCategoryField(category.id, 'display_order', e.target.value);
                                      handleSaveCategory(category.id, true);
                                    }}
                                    className="flex-1 px-2 py-2 rounded-lg border border-blue-200 bg-white text-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    onBlur={() => handleSaveCategory(category.id, true)}
                                  />
                                  <button
                                    onClick={() => moveCategoryDown(index)}
                                    disabled={index === categories.length - 1}
                                    className={`p-1.5 rounded-lg transition-all ${
                                      index === categories.length - 1
                                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                        : 'bg-white text-neutral-700 hover:bg-blue-500 hover:text-white border border-blue-200'
                                    }`}
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">Description</label>
                              <input
                                type="text"
                                value={category.description || ''}
                                onChange={(e) => {
                                  updateCategoryField(category.id, 'description', e.target.value);
                                  handleSaveCategory(category.id, true);
                                }}
                                placeholder="Description..."
                                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                onBlur={() => handleSaveCategory(category.id, true)}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => handleToggleCategoryActive(category.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                  category.is_active
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                {category.is_active ? 'Actif' : 'Inactif'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Note d'information */}
                  {categories.length > 0 && (
                    <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs sm:text-sm text-blue-800 font-sans">
                        💡 <strong>Astuce:</strong> Les modifications sont sauvegardées automatiquement lorsque vous quittez un champ.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        );

      case 'system': {
        const dbPool = systemStatus.database.pool || systemStats.database?.pool;
        const dbHealth = systemStats.health;
        
        return (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* État des services - Compact */}
            <SectionCard
              icon={Activity}
              title="État des Services"
              description="Surveillance en temps réel de l'infrastructure"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
                {/* Backend */}
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="font-heading font-semibold text-black text-sm">Backend API</span>
                    </div>
                    {systemStatus.backend.loading ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : systemStatus.backend.connected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs font-medium ${systemStatus.backend.connected ? 'text-green-700' : 'text-red-700'}`}>
                      {systemStatus.backend.loading ? 'Vérification...' : systemStatus.backend.message}
                    </p>
                    <p className="text-[10px] text-neutral-600 font-sans truncate">{ENV.BACKEND_URL}</p>
                    <p className="text-[10px] text-neutral-500 font-sans">Node.js • Port {ENV.BACKEND_PORT}</p>
                  </div>
                </div>

                {/* Base de données */}
                <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span className="font-heading font-semibold text-black text-sm">Base de données</span>
                    </div>
                    {systemStatus.database.loading ? (
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : systemStatus.database.connected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs font-medium ${systemStatus.database.connected ? 'text-green-700' : 'text-red-700'}`}>
                      {systemStatus.database.loading ? 'Vérification...' : systemStatus.database.message}
                    </p>
                    <p className="text-[10px] text-neutral-600 font-sans">MySQL • {systemStatus.database.tables || systemStats.database?.database?.tables || 0} tables</p>
                    {dbPool && (
                      <p className="text-[10px] text-neutral-500 font-sans">
                        Pool: {dbPool.active || 0}/{dbPool.limit || 0} • {dbPool.utilization || '0%'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Frontend */}
                <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="font-heading font-semibold text-black text-sm">Frontend</span>
                    </div>
                    {systemStatus.frontend.connected && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-green-700">{systemStatus.frontend.message}</p>
                    <p className="text-[10px] text-neutral-600 font-sans">React 18 • Vite</p>
                    <p className="text-[10px] text-neutral-500 font-sans">Port {ENV.FRONTEND_PORT || window.location.port || '5173'}</p>
                  </div>
                </div>
              </div>

              {/* Pool MySQL - Détails */}
              {dbPool && (
                <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-heading font-semibold text-black text-sm">Pool MySQL</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] text-neutral-600 font-sans mb-1">Actives</p>
                      <p className="text-lg font-bold text-indigo-700">{dbPool.active || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-600 font-sans mb-1">Inactives</p>
                      <p className="text-lg font-bold text-indigo-700">{dbPool.idle || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-600 font-sans mb-1">Limite</p>
                      <p className="text-lg font-bold text-indigo-700">{dbPool.limit || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-600 font-sans mb-1">Utilisation</p>
                      <p className={`text-lg font-bold ${parseFloat(dbPool.utilization || '0') > 80 ? 'text-red-600' : 'text-indigo-700'}`}>
                        {dbPool.utilization || '0%'}
                      </p>
                    </div>
                  </div>
                  {dbPool.queued > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-xs text-yellow-800 font-sans">
                          {dbPool.queued} requête(s) en attente
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Informations techniques détaillées */}
              <div className="p-3 sm:p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl border-2 border-neutral-200 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-neutral-700" />
                  <h3 className="font-heading font-semibold text-black text-sm">Informations Techniques</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm font-sans">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-neutral-200">
                    <span className="text-neutral-600">Environnement:</span>
                    <span className={`font-semibold px-2 py-1 rounded-full text-[10px] ${
                      ENV.isDevelopment ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {ENV.isDevelopment ? 'Développement' : 'Production'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-neutral-200">
                    <span className="text-neutral-600">Backend:</span>
                    <span className="font-semibold text-black">Node.js</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-neutral-200">
                    <span className="text-neutral-600">Frontend:</span>
                    <span className="font-semibold text-black">React 18 + Vite</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-neutral-200">
                    <span className="text-neutral-600">Base de données:</span>
                    <span className="font-semibold text-black">MySQL</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-neutral-200">
                    <span className="text-neutral-600">API URL:</span>
                    <span className="font-semibold text-black truncate max-w-[150px]" title={ENV.API_URL}>
                      {ENV.API_URL}
                    </span>
                  </div>
                  {dbHealth && (
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-neutral-200">
                      <span className="text-neutral-600">Tables MySQL:</span>
                      <span className="font-semibold text-black">{systemStatus.database.tables || dbHealth.counts?.users ? 'Connectée' : 'N/A'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions système */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    checkSystemStatus();
                    loadSystemStats();
                  }}
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="text-xs sm:text-sm"
                >
                  Actualiser les statistiques
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  icon={<Zap className="w-4 h-4" />}
                  className="text-xs sm:text-sm"
                >
                  Purger le cache
                </Button>
              </div>
            </SectionCard>
          </div>
        );
      }

      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pl-3 sm:pl-5 md:pl-10 lg:pl-12 xl:pl-16 pr-3 sm:pr-5 md:pr-10 lg:pr-12 xl:pr-16 pt-4 sm:pt-6 md:pt-8 lg:pt-10 animate-fade-in w-full overflow-x-hidden max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto pb-6 sm:pb-8 lg:pb-10">
      {/* ✅ En-tête amélioré avec gradient - Responsive */}
      <div className="bg-gradient-to-r from-neutral-50 to-white rounded-xl sm:rounded-2xl border-2 border-neutral-200 shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-black flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 lg:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center shadow-md flex-shrink-0">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <span className="truncate">Paramètres</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-600 font-sans">
              Configuration complète de l&apos;application
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Système d'onglets - Responsive avec actions intégrées */}
      <Card padding="sm sm:md md:lg lg:xl" className="border-2 border-neutral-200 shadow-lg">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onReload={loadSettings}
          onSave={handleSave}
          saving={saving}
          isAdmin={isAdmin}
        />
        
        {/* ✅ Contenu selon l'onglet actif */}
        <div className="animate-fade-in lg:space-y-8">
          {renderTabContent()}
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;
