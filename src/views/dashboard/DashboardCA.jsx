import React, { useState, useEffect } from 'react';
import './DashboardCA.css';
import { formatOrderNumber } from '../../utils/orderHelpers';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
  RefreshCw,
  Receipt,
  Percent,
  BarChart3,
  Download,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trophy,
  Clock,
  PieChart as PieIcon,
  AlertTriangle,
  Package
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import dashboardService from '../../services/dashboardService';
import { formatPrice } from '../../constants/pricing';
import logger from '../../utils/logger';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';

/**
 * Dashboard CA - Version Mobile-First Responsive
 * Optimisé pour mobile, tablette et desktop
 */
const DashboardCA = () => {
  const { role: roleFromHook, user: userFromHook } = useAuth();
  const roleFromStore = useAuthStore((state) => state.role);
  const userFromStore = useAuthStore((state) => state.user);
  
  // Utiliser le rôle du store en priorité, puis celui du hook, puis localStorage comme fallback
  const getRoleFromLocalStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.role || null;
      }
    } catch (e) {
      // Ignorer
    }
    return null;
  };
  
  const role = roleFromStore || roleFromHook || getRoleFromLocalStorage();
  const user = userFromStore || userFromHook;
  
  const hasDashboardAccess = role === 'admin' || role === 'manager';
  
  // Log pour déboguer
  React.useEffect(() => {
    logger.log('🔐 DashboardCA - Vérification du rôle:');
    logger.log('   - roleFromStore:', roleFromStore);
    logger.log('   - roleFromHook:', roleFromHook);
    logger.log('   - localStorage:', getRoleFromLocalStorage());
    logger.log('   - role final:', role);
    logger.log('   - user:', user?.email || 'N/A');
    logger.log('   - hasDashboardAccess:', hasDashboardAccess);
    
    if (role) {
      if (hasDashboardAccess) {
        logger.log('✅ DashboardCA - Accès autorisé pour le rôle:', role);
      } else {
        logger.warn('⚠️ DashboardCA - Accès refusé pour le rôle:', role);
      }
    } else {
      logger.warn('⚠️ DashboardCA - Aucun rôle détecté');
    }
  }, [role, roleFromStore, roleFromHook, hasDashboardAccess, user]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [customDateRange, setCustomDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  const [stats, setStats] = useState({
    totalTTC: 0,
    totalHT: 0,
    tva: 0,
    totalOrders: 0,
    avgOrder: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    avgOrderGrowth: 0,
    details: []
  });
  
  const [topProducts, setTopProducts] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockValue, setStockValue] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accessError, setAccessError] = useState(null);
  const [serverError, setServerError] = useState(null);
  

  const [chartType, setChartType] = useState('area');

  const filters = [
    { id: 'today', label: "Aujourd'hui", shortLabel: "Auj.", icon: Calendar },
    { id: 'week', label: 'Cette semaine', shortLabel: "Semaine", icon: Calendar },
    { id: 'month', label: 'Ce mois', shortLabel: "Mois", icon: Calendar },
    { id: 'custom', label: 'Personnalisée', shortLabel: "Custom", icon: Calendar }
  ];

  const getDates = () => {
    let startDate, endDate;
    const now = referenceDate;
    
    switch (filter) {
      case 'today':
        startDate = endDate = now.toISOString().split('T')[0];
        break;
      case 'week': {
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(now.getDate() - daysToMonday);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const monthStart = new Date(now);
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0); // dernier jour du mois
        startDate = monthStart.toISOString().split('T')[0];
        endDate = monthEnd.toISOString().split('T')[0];
        break;
      }
      case 'custom':
        startDate = customDateRange.from;
        endDate = customDateRange.to;
        break;
      default:
        startDate = endDate = now.toISOString().split('T')[0];
    }
    
    return { startDate, endDate };
  };

  const getComparisonDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const compareEnd = new Date(start);
    compareEnd.setDate(compareEnd.getDate() - 1);
    
    const compareStart = new Date(compareEnd);
    compareStart.setDate(compareStart.getDate() - diffDays);
    
    return {
      compareStartDate: compareStart.toISOString().split('T')[0],
      compareEndDate: compareEnd.toISOString().split('T')[0]
    };
  };

  const handleApiError = (error, contextLabel = 'requête', isCritical = false) => {
    if (!error) return;
    
    logger.error(`❌ DashboardCA - Erreur ${contextLabel}:`, error);
    logger.error(`   - Status: ${error.status || 'N/A'}`);
    logger.error(`   - Message: ${error.message || error.error || 'Erreur inconnue'}`);
    
    if (error.status === 401 || error.status === 403) {
      setAccessError((prev) => prev || "Accès refusé. Cette section est réservée aux managers et administrateurs.");
    } else if (isCritical) {
      // Seulement afficher l'erreur globale pour les erreurs critiques
      setServerError(`Erreur lors du chargement des ${contextLabel}. Merci de réessayer plus tard.`);
    } else {
      // Pour les erreurs non-critiques, juste logger sans bloquer l'affichage
      logger.warn(`⚠️ DashboardCA - Erreur non-critique ${contextLabel}, utilisation des valeurs par défaut`);
    }
  };

  const safeRequest = async (requestPromise, contextLabel, fallbackValue = null, isCritical = false) => {
    try {
      const result = await requestPromise;
      
      // Vérifier si result est null ou undefined
      if (!result) {
        logger.warn(`⚠️ DashboardCA - ${contextLabel} a retourné null/undefined`);
        handleApiError({ status: 500, error: 'Réponse vide du serveur', message: 'Aucune donnée reçue' }, contextLabel, isCritical);
        return fallbackValue;
      }
      
      // Vérifier si c'est une erreur explicite
      if (result.success === false || result.error) {
        const errorMsg = result.error || result.message || 'Erreur inconnue';
        logger.warn(`⚠️ DashboardCA - ${contextLabel} a retourné une erreur:`, errorMsg);
        handleApiError({ 
          status: result.status || 500, 
          error: errorMsg, 
          message: errorMsg 
        }, contextLabel, isCritical);
        return fallbackValue;
      }
      
      // Si pas de success mais pas d'erreur non plus, vérifier si c'est une réponse valide
      if (result.success === undefined && !result.data && !result.data === undefined) {
        // Si c'est critique et qu'on n'a pas de données, c'est une erreur
        if (isCritical) {
          logger.warn(`⚠️ DashboardCA - ${contextLabel} n'a pas retourné de données`);
          handleApiError({ 
            status: 500, 
            error: 'Format de réponse invalide', 
            message: 'Le serveur n\'a pas retourné les données attendues' 
          }, contextLabel, isCritical);
          return fallbackValue;
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`❌ DashboardCA - Exception lors de ${contextLabel}:`, error);
      // Extraire les informations d'erreur
      const errorInfo = {
        status: error.status || error.response?.status || 500,
        error: error.message || error.error || 'Erreur réseau',
        message: error.message || error.error || 'Erreur lors de la communication avec le serveur'
      };
      handleApiError(errorInfo, contextLabel, isCritical);
      return fallbackValue;
    }
  };

  const loadAllData = async () => {
    // Vérifier le rôle depuis le store directement
    const currentRole = useAuthStore.getState().role || role;
    const currentUser = useAuthStore.getState().user || user;
    
    // Vérifier aussi dans localStorage comme fallback
    let localRole = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const localUser = JSON.parse(userStr);
        localRole = localUser?.role;
      }
    } catch (e) {
      // Ignorer
    }
    
    const finalRole = currentRole || localRole;
    const currentHasAccess = finalRole === 'admin' || finalRole === 'manager';
    
    logger.log('🔐 DashboardCA.loadAllData - Vérification accès:');
    logger.log('   - currentRole (store):', currentRole);
    logger.log('   - localRole (localStorage):', localRole);
    logger.log('   - finalRole:', finalRole);
    logger.log('   - currentHasAccess:', currentHasAccess);
    logger.log('   - user email:', currentUser?.email || 'N/A');
    
    if (!currentHasAccess) {
      // Si le rôle n'est pas encore chargé, attendre un peu
      if (!finalRole && currentUser) {
        logger.log('⏳ DashboardCA - Rôle non chargé, attente...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedRole = useAuthStore.getState().role || getRoleFromLocalStorage();
        if (updatedRole === 'admin' || updatedRole === 'manager') {
          logger.log('✅ DashboardCA - Rôle chargé après attente:', updatedRole);
          return loadAllData();
        }
      }
      
      // Seulement définir l'erreur si vraiment le rôle n'est pas admin ou manager
      logger.warn('⚠️ DashboardCA - Accès refusé. Rôle actuel:', finalRole || 'non défini');
      setAccessError("Vous n'avez pas les droits requis pour consulter ces statistiques (manager ou admin).");
      setLoading(false);
      return;
    }

    // Nettoyer l'erreur d'accès si le rôle est correct
    setAccessError(null);
    setServerError(null);
    setLoading(true);
    try {
      const { startDate, endDate } = getDates();
      const { compareStartDate, compareEndDate } = getComparisonDates(startDate, endDate);

      logger.log('📊 DashboardCA - Début du chargement des données...');
      logger.log(`   - Période: ${startDate} à ${endDate}`);
      logger.log(`   - Période comparaison: ${compareStartDate} à ${compareEndDate}`);
      logger.log(`   - API Base URL: ${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`);
      
      const [
        revenueResponse,
        topProductsResponse,
        peakHoursResponse,
        categoriesResponse,
        stockValueResponse,
        ordersPeriodResponse
      ] = await Promise.all([
        safeRequest(
          dashboardService.getRevenueStatsWithComparison(startDate, endDate, compareStartDate, compareEndDate),
          'statistiques CA',
          { success: false, error: 'Erreur de chargement' },
          true // Critique - afficher l'erreur si elle échoue
        ),
        safeRequest(
          dashboardService.getTopProductsPeriod(startDate, endDate, 5),
          'top produits',
          { success: true, data: [] },
          false // Non-critique
        ),
        safeRequest(
          dashboardService.getPeakHours(startDate, endDate),
          'heures de pointe',
          { success: true, data: [] },
          false // Non-critique
        ),
        safeRequest(
          dashboardService.getCategoryDistribution(startDate, endDate),
          'répartition par catégorie',
          { success: true, data: [] },
          false // Non-critique
        ),
        safeRequest(
          dashboardService.getStockValue(),
          'valeur stock',
          { success: true, data: [], total_products: 0, total_items: 0, total_value: 0 },
          false // Non-critique
        ),
        safeRequest(
          dashboardService.getOrdersPeriod(startDate, endDate),
          'transactions',
          { success: true, data: [] },
          false // Non-critique
        )
      ]);
      
      logger.log('📊 DashboardCA - Réponses reçues:');
      logger.log(`   - Revenus: ${revenueResponse?.success ? '✅' : '❌'}`, revenueResponse);
      logger.log(`   - Top produits: ${topProductsResponse?.success ? '✅' : '❌'}`, topProductsResponse?.data?.length || 0, 'produits');
      logger.log(`   - Heures de pointe: ${peakHoursResponse?.success ? '✅' : '❌'}`, peakHoursResponse?.data?.length || 0, 'heures');
      logger.log(`   - Catégories: ${categoriesResponse?.success ? '✅' : '❌'}`, categoriesResponse?.data?.length || 0, 'catégories');
      logger.log(`   - Valeur stock: ${stockValueResponse?.success ? '✅' : '❌'}`, stockValueResponse?.total_value || 0, '€');
      logger.log(`   - Transactions: ${ordersPeriodResponse?.success ? '✅' : '❌'}`, ordersPeriodResponse?.data?.length || 0, 'transactions');
      if (ordersPeriodResponse?.data) {
        logger.log('   - Détails transactions:', ordersPeriodResponse.data.slice(0, 3));
      }

      // Vérifier si la requête critique a échoué
      if (!revenueResponse || revenueResponse.success === false || (revenueResponse.error && !revenueResponse.data)) {
        logger.error('❌ DashboardCA - La requête critique de revenus a échoué');
        logger.error('   - Réponse complète:', JSON.stringify(revenueResponse, null, 2));
        logger.error('   - Status:', revenueResponse?.status);
        logger.error('   - Error:', revenueResponse?.error);
        logger.error('   - Message:', revenueResponse?.message);
        
        let errorMessage = 'Erreur lors du chargement des statistiques de revenus';
        
        // Extraire le message d'erreur de différentes sources
        if (revenueResponse?.error) {
          errorMessage = typeof revenueResponse.error === 'string' 
            ? revenueResponse.error 
            : revenueResponse.error.message || 'Erreur inconnue';
        } else if (revenueResponse?.message) {
          errorMessage = revenueResponse.message;
        }
        
        // Ajouter des détails selon le type d'erreur
        if (revenueResponse?.status === 401 || revenueResponse?.status === 403) {
          errorMessage = 'Accès refusé. Vérifiez que votre compte a les droits admin ou manager.';
        } else if (revenueResponse?.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez contacter l\'administrateur.';
        } else if (revenueResponse?.status === 404) {
          errorMessage = 'Endpoint non trouvé. Vérifiez la configuration du serveur.';
        } else if (!revenueResponse) {
          errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion.';
        }
        
        setServerError(`${errorMessage} Vérifiez votre connexion et réessayez.`);
        setLoading(false);
        return;
      }
      
      // Vérifier que les données sont présentes
      if (!revenueResponse.data) {
        logger.error('❌ DashboardCA - Réponse sans données:', revenueResponse);
        setServerError('Le serveur a retourné une réponse sans données. Vérifiez votre connexion et réessayez.');
        setLoading(false);
        return;
      }
      
      if (revenueResponse.success && revenueResponse.data) {
        const { current, growth, details } = revenueResponse.data;
        const isSingleDay = startDate === endDate;
        
        logger.log('📊 DashboardCA - Formatage des détails:', details?.length || 0, 'entrées');
        
        // S'assurer que details est un tableau
        const detailsArray = Array.isArray(details) ? details : [];
        
        const formattedDetails = detailsArray.map(day => {
          const totalTTC = parseFloat(day.total_revenue || day.totalTTC || 0) || 0;
          const totalHT = totalTTC / 1.10;
          const tva = totalTTC - totalHT;
          
          let displayLabel;
          if (isSingleDay && day.hour !== undefined && day.hour !== null) {
            displayLabel = `${day.hour}h`;
          } else if (day.date) {
            try {
              const date = new Date(day.date);
              if (!isNaN(date.getTime())) {
                displayLabel = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
              } else {
                displayLabel = day.date;
              }
            } catch (e) {
              displayLabel = day.date || 'Date invalide';
            }
          } else {
            displayLabel = 'Date inconnue';
          }
          
          return {
            date: displayLabel,
            rawDate: day.date || day.rawDate,
            hour: day.hour,
            orders: parseInt(day.total_orders || day.orders || 0) || 0,
            totalHT: parseFloat(totalHT.toFixed(2)),
            tva: parseFloat(tva.toFixed(2)),
            totalTTC: parseFloat(totalTTC.toFixed(2))
          };
        });

        logger.log('📊 DashboardCA - Statistiques calculées:');
        logger.log('   - CA TTC:', current.totalRevenue);
        logger.log('   - CA HT:', current.totalHT);
        logger.log('   - TVA:', current.totalTVA);
        logger.log('   - Commandes:', current.totalOrders);
        logger.log('   - Panier moyen:', current.avgOrder);
        logger.log('   - Détails formatés:', formattedDetails.length);

        setStats({
          totalTTC: parseFloat((parseFloat(current.totalRevenue || 0)).toFixed(2)),
          totalHT: parseFloat((parseFloat(current.totalHT || 0)).toFixed(2)),
          tva: parseFloat((parseFloat(current.totalTVA || 0)).toFixed(2)),
          totalOrders: parseInt(current.totalOrders || 0),
          avgOrder: parseFloat((parseFloat(current.avgOrder || 0)).toFixed(2)),
          revenueGrowth: parseFloat((parseFloat(growth?.revenue || 0)).toFixed(2)),
          ordersGrowth: parseFloat((parseFloat(growth?.orders || 0)).toFixed(2)),
          avgOrderGrowth: parseFloat((parseFloat(growth?.avgOrder || 0)).toFixed(2)),
          details: formattedDetails.reverse()
        });
      } else {
        logger.warn('⚠️ DashboardCA - Réponse revenue sans données valides:', revenueResponse);
      }

      // Top produits
      if (topProductsResponse && topProductsResponse.success) {
        const products = topProductsResponse.data || [];
        logger.log(`✅ DashboardCA - ${products.length} top produits récupérés`);
        setTopProducts(products);
      } else {
        logger.warn('⚠️ DashboardCA - Top produits non disponibles');
        setTopProducts([]);
      }

      // Heures de pointe
      if (peakHoursResponse && peakHoursResponse.success) {
        const hours = peakHoursResponse.data || [];
        logger.log(`✅ DashboardCA - ${hours.length} heures de pointe récupérées`);
        setPeakHours(hours);
      } else {
        logger.warn('⚠️ DashboardCA - Heures de pointe non disponibles');
        setPeakHours([]);
      }

      // Catégories
      if (categoriesResponse && categoriesResponse.success) {
        const cats = categoriesResponse.data || [];
        logger.log(`✅ DashboardCA - ${cats.length} catégories récupérées`);
        setCategories(cats);
      } else {
        logger.warn('⚠️ DashboardCA - Catégories non disponibles');
        setCategories([]);
      }

      // Stock critique
      // Valeur du stock
      if (stockValueResponse && stockValueResponse.success) {
        logger.log(`✅ DashboardCA - Valeur stock récupérée: ${stockValueResponse.total_value || 0}€`);
        setStockValue(stockValueResponse);
      } else {
        logger.warn('⚠️ DashboardCA - Valeur stock non disponible');
        setStockValue(null);
      }

      if (ordersPeriodResponse && ordersPeriodResponse.success && ordersPeriodResponse.data) {
        logger.log(`✅ DashboardCA - ${ordersPeriodResponse.data.length} transactions récupérées`);
        // S'assurer que les données sont bien formatées
        const formattedTransactions = (ordersPeriodResponse.data || []).map(t => ({
          id: t.id,
          order_number: t.order_number,
          created_at: t.created_at,
          updated_at: t.updated_at,
          total_amount: parseFloat(t.total_amount) || 0,
          payment_method: t.payment_method || 'Non spécifié',
          payment_status: t.payment_status || t.paymentStatus || 'pending',
          paymentStatus: t.payment_status || t.paymentStatus || 'pending',
          status: t.status || 'pending',
          items_count: parseInt(t.items_count) || 0,
          first_name: t.first_name || '',
          last_name: t.last_name || '',
          email: t.email || ''
        }));
        setTransactions(formattedTransactions);
        logger.log('✅ DashboardCA - Transactions formatées et définies:', formattedTransactions.length);
      } else {
        logger.warn('⚠️ DashboardCA - Aucune transaction récupérée ou réponse invalide:', ordersPeriodResponse);
        setTransactions([]);
      }
    } catch (error) {
      logger.error('❌ DashboardCA - Erreur globale dans loadAllData:', error);
      logger.error('   - Type:', error?.constructor?.name);
      logger.error('   - Message:', error?.message);
      logger.error('   - Stack:', error?.stack);
      
      // Gérer les erreurs de connexion réseau
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') || 
          error?.message?.includes('ECONNREFUSED') ||
          error?.name === 'ConnectionError') {
        setServerError('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré et que votre connexion internet fonctionne.');
      } else if (error?.status === 401 || error?.status === 403) {
        setAccessError('Accès refusé. Vérifiez que votre compte a les droits admin ou manager.');
      } else {
        handleApiError(error, 'chargement global', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigatePeriod = (direction) => {
    const newDate = new Date(referenceDate);
    
    switch (filter) {
      case 'today':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      default:
        return;
    }
    
    setReferenceDate(newDate);
  };

  useEffect(() => {
    // Attendre un peu que le rôle soit chargé depuis le store
    const checkRoleAndLoad = async () => {
      // Vérifier le rôle depuis toutes les sources
      const currentRole = roleFromStore || roleFromHook || getRoleFromLocalStorage();
      const currentUser = userFromStore || userFromHook;
      
      logger.log('🔐 DashboardCA.useEffect - Vérification du rôle:');
      logger.log('   - roleFromStore:', roleFromStore);
      logger.log('   - roleFromHook:', roleFromHook);
      logger.log('   - localStorage:', getRoleFromLocalStorage());
      logger.log('   - currentRole:', currentRole);
      logger.log('   - currentUser:', currentUser?.email || 'N/A');
      
      // Si le rôle n'est pas encore chargé mais qu'on a un utilisateur, attendre un peu
      if (!currentRole && currentUser) {
        logger.log('⏳ DashboardCA - Rôle non chargé mais utilisateur présent, attente...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedRole = useAuthStore.getState().role || getRoleFromLocalStorage();
        if (updatedRole === 'admin' || updatedRole === 'manager') {
          logger.log('✅ DashboardCA - Rôle chargé après attente:', updatedRole);
          loadAllData();
          return;
        }
      }
      
      // Si on a un rôle, vérifier l'accès
      if (currentRole) {
        if (currentRole === 'admin' || currentRole === 'manager') {
          logger.log('✅ DashboardCA - Accès autorisé, chargement des données...');
          loadAllData();
        } else {
          logger.warn('⚠️ DashboardCA - Accès refusé pour le rôle:', currentRole);
          setAccessError("Vous n'avez pas les droits requis pour consulter ces statistiques (manager ou admin).");
          setLoading(false);
        }
      } else if (currentUser) {
        // Si on a un utilisateur mais pas de rôle, attendre encore un peu
        logger.log('⏳ DashboardCA - Utilisateur présent mais rôle manquant, attente supplémentaire...');
        setTimeout(() => {
          const finalRole = useAuthStore.getState().role || getRoleFromLocalStorage();
          if (finalRole === 'admin' || finalRole === 'manager') {
            logger.log('✅ DashboardCA - Rôle chargé après attente supplémentaire:', finalRole);
            loadAllData();
          } else {
            logger.warn('⚠️ DashboardCA - Rôle toujours manquant après attente');
            setAccessError("Vous n'avez pas les droits requis pour consulter ces statistiques (manager ou admin).");
            setLoading(false);
          }
        }, 1000);
      } else {
        // Pas d'utilisateur et pas de rôle
        logger.warn('⚠️ DashboardCA - Aucun utilisateur ni rôle détecté');
        setAccessError("Vous n'avez pas les droits requis pour consulter ces statistiques (manager ou admin).");
        setLoading(false);
      }
    };
    
    checkRoleAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, roleFromStore, roleFromHook, filter, customDateRange, referenceDate, hasDashboardAccess, user, userFromStore, userFromHook]);

  // KPI Card Mobile-First
  const KPICard = ({ icon: Icon, label, value, sublabel, gradient, trend, trendValue }) => {
    const isTrendPositive = trendValue >= 0;
    const TrendIcon = isTrendPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className={`relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg md:shadow-xl ${gradient} transform transition-all duration-300 hover:scale-102 md:hover:scale-105 hover:shadow-2xl`}>
        {/* Fond décoratif - caché sur mobile pour économiser l'espace */}
        <div className="hidden md:block absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 transform translate-x-8 -translate-y-8">
          <Icon className="w-full h-full text-white opacity-10" />
        </div>
        
        {/* Contenu */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-white bg-opacity-20 rounded-lg md:rounded-xl backdrop-blur-sm">
              <Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <p className="text-white text-opacity-90 font-semibold text-xs md:text-sm uppercase tracking-wide">{label}</p>
          </div>
          
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">{value}</p>
          
          {sublabel && (
            <p className="text-white text-opacity-75 text-xs md:text-sm mb-2 md:mb-3">{sublabel}</p>
          )}
          
          {trendValue !== undefined && (
            <div className="flex items-center gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white border-opacity-20">
              <div className={`flex items-center gap-1 px-2 md:px-3 py-1 rounded-full ${
                isTrendPositive ? 'bg-green-500 bg-opacity-30' : 'bg-red-500 bg-opacity-30'
              }`}>
                <TrendIcon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                <span className="text-white font-bold text-xs md:text-sm">
                  {isTrendPositive ? '+' : ''}{trendValue.toFixed(1)}%
                </span>
              </div>
              <span className="text-white text-opacity-75 text-xs hidden md:inline">{trend}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Nettoyer l'erreur si le rôle est maintenant correct
  React.useEffect(() => {
    const finalRoleCheck = roleFromStore || roleFromHook || getRoleFromLocalStorage();
    const finalHasAccess = finalRoleCheck === 'admin' || finalRoleCheck === 'manager';
    
    if (accessError && finalHasAccess) {
      logger.log('✅ DashboardCA - Rôle correct détecté, nettoyage de l\'erreur d\'accès');
      logger.log('   - finalRoleCheck:', finalRoleCheck);
      setAccessError(null);
    }
  }, [accessError, roleFromStore, roleFromHook]);
  
  // Vérifier le rôle une dernière fois avant d'afficher l'erreur
  const finalRoleCheck = roleFromStore || roleFromHook || getRoleFromLocalStorage();
  const finalHasAccess = finalRoleCheck === 'admin' || finalRoleCheck === 'manager';
  
  // Ne pas afficher l'erreur si le rôle est correct
  if (accessError && !finalHasAccess) {
    logger.warn('⚠️ DashboardCA - Affichage du message d\'erreur d\'accès');
    logger.warn('   - accessError:', accessError);
    logger.warn('   - finalRoleCheck:', finalRoleCheck);
    logger.warn('   - finalHasAccess:', finalHasAccess);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4">
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-xl text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Accès restreint</h1>
          <p className="text-gray-600">{accessError}</p>
          <p className="text-sm text-gray-500">
            Vérifie que ton compte dispose bien des droits manager ou admin, puis reconnecte-toi.
          </p>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs">
            <p className="font-semibold mb-2">Informations de débogage:</p>
            <p>Rôle détecté: <strong>{finalRoleCheck || 'non défini'}</strong></p>
            <p>Email: <strong>{user?.email || 'non défini'}</strong></p>
            <p>Rôle depuis store: <strong>{roleFromStore || 'non défini'}</strong></p>
            <p>Rôle depuis hook: <strong>{roleFromHook || 'non défini'}</strong></p>
            <p>Rôle depuis localStorage: <strong>{getRoleFromLocalStorage() || 'non défini'}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && stats.totalTTC === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-base md:text-lg font-semibold text-gray-700">Chargement du dashboard...</p>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-full mx-auto space-y-4 md:space-y-6">
        {serverError && (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700">
            <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Erreur de chargement</p>
              <p className="text-sm mb-3">{serverError}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setServerError(null);
                    setLoading(true);
                    loadAllData();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </button>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Recharger la page
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* EN-TÊTE RESPONSIVE */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-5 shadow-xl md:shadow-2xl text-white">
          <div className="flex flex-col gap-2 md:gap-3">
            {/* Titre et icône */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 lg:p-2.5 bg-white bg-opacity-20 rounded-xl md:rounded-2xl backdrop-blur-sm flex-shrink-0">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">Dashboard CA</h1>
              </div>
            </div>

            {/* Boutons - Adaptés mobile */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={loadAllData}
                disabled={loading}
                className="flex-1 sm:flex-none bg-white bg-opacity-20 border-white border-opacity-40 text-white hover:bg-opacity-30 backdrop-blur-sm text-xs md:text-sm px-3 md:px-4 py-2"
                icon={<RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />}
              >
                <span className="hidden sm:inline">Actualiser</span>
                <span className="sm:hidden">MAJ</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none bg-white bg-opacity-20 border-white border-opacity-40 text-white hover:bg-opacity-30 backdrop-blur-sm text-xs md:text-sm px-3 md:px-4 py-2"
                icon={<Download className="w-4 h-4 md:w-5 md:h-5" />}
              >
                <span className="hidden sm:inline">Exporter</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* FILTRES DE PÉRIODE - RESPONSIVE */}
        <Card className="shadow-lg md:shadow-xl">
          <div className="p-3 sm:p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              <h2 className="text-base md:text-xl font-bold text-gray-900">Période</h2>
            </div>
            
            {/* Boutons de filtre - Grid mobile */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3">
              {filters.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFilter(f.id);
                      setShowCustomDatePicker(f.id === 'custom');
                    }}
                    className={`flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 ${
                      filter === f.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-102 md:scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">{f.label}</span>
                    <span className="sm:hidden truncate">{f.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation - Mobile optimisée */}
            {filter !== 'custom' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg md:rounded-xl">
                <button
                  onClick={() => navigatePeriod('prev')}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  <span className="font-semibold text-gray-700 text-xs md:text-sm">
                    <span className="hidden md:inline">Précédent</span>
                    <span className="md:hidden">Préc.</span>
                  </span>
                </button>

                <span className="text-sm md:text-lg font-bold text-gray-900 text-center px-2 md:px-4 py-1">
                  {(() => {
                    const now = referenceDate;
                    if (filter === 'today') {
                      return now.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        ...(window.innerWidth >= 768 && { weekday: 'long' })
                      });
                    } else if (filter === 'week') {
                      const weekStart = new Date(now);
                      const dayOfWeek = now.getDay();
                      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                      weekStart.setDate(now.getDate() - daysToMonday);
                      return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
                    } else if (filter === 'month') {
                      return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    }
                    return '';
                  })()}
                </span>

                <button
                  onClick={() => navigatePeriod('next')}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="font-semibold text-gray-700 text-xs md:text-sm">
                    <span className="hidden md:inline">Suivant</span>
                    <span className="md:hidden">Suiv.</span>
                  </span>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </button>
              </div>
            )}

            {/* Date Picker - Stack sur mobile */}
            {showCustomDatePicker && filter === 'custom' && (
              <div className="flex flex-col gap-3 p-3 md:p-4 bg-blue-50 rounded-lg md:rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Date de début</label>
                    <input
                      type="date"
                      value={customDateRange.from}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full px-3 md:px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Date de fin</label>
                    <input
                      type="date"
                      value={customDateRange.to}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full px-3 md:px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={loadAllData}
                  icon={<Calendar className="w-4 h-4 md:w-5 md:h-5" />}
                  className="w-full"
                >
                  Appliquer
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* KPIs - Grille responsive 1/2/3/5 colonnes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
          <KPICard
            icon={DollarSign}
            label="CA TTC"
            value={formatPrice(stats.totalTTC)}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            trend="vs période préc."
            trendValue={stats.revenueGrowth}
          />
          <KPICard
            icon={Receipt}
            label="CA HT"
            value={formatPrice(stats.totalHT)}
            sublabel="Hors taxes"
            gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
          />
          <KPICard
            icon={Percent}
            label="TVA"
            value={formatPrice(stats.tva)}
            sublabel="10% du CA HT"
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
          />
          <KPICard
            icon={ShoppingCart}
            label="Commandes"
            value={stats.totalOrders}
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
            trend="vs période préc."
            trendValue={stats.ordersGrowth}
          />
          <KPICard
            icon={TrendingUp}
            label="Panier Moyen"
            value={formatPrice(stats.avgOrder)}
            gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
            trend="vs période préc."
            trendValue={stats.avgOrderGrowth}
          />
        </div>

        {/* GRAPHIQUE PRINCIPAL - Hauteur adaptative */}
        <Card className="shadow-lg md:shadow-xl">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg md:rounded-xl">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900">Évolution du CA</h2>
                  <p className="text-xs md:text-sm text-gray-600">Analyse détaillée</p>
                </div>
              </div>
              
              {/* Sélecteur type graphique - Compact sur mobile */}
              <div className="flex gap-1 md:gap-2 bg-gray-100 p-1 md:p-2 rounded-lg md:rounded-xl w-full sm:w-auto">
                {[
                  { type: 'bar', label: 'Barres', short: 'B' },
                  { type: 'line', label: 'Ligne', short: 'L' },
                  { type: 'area', label: 'Aires', short: 'A' }
                ].map(({ type, label, short }) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-md md:rounded-lg font-semibold text-xs md:text-sm transition-all ${
                      chartType === type
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{short}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Graphique - Hauteur adaptative */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl md:rounded-2xl p-3 md:p-6">
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : window.innerWidth < 1024 ? 300 : 400}>
                {chartType === 'bar' ? (
                  <BarChart data={stats.details} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: window.innerWidth < 640 ? 10 : 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: window.innerWidth < 640 ? 10 : 12 }}
                      tickFormatter={(value) => `${value}€`}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      formatter={(value) => [formatPrice(value), 'CA TTC']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                        fontSize: window.innerWidth < 640 ? '12px' : '14px'
                      }}
                    />
                    <Bar dataKey="totalTTC" fill="url(#barGradient)" radius={[8, 8, 0, 0]} maxBarSize={60} />
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={stats.details} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: window.innerWidth < 640 ? 10 : 12 }} tickFormatter={(value) => `${value}€`} />
                    <Tooltip 
                      formatter={(value) => [formatPrice(value), 'CA TTC']}
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <Line type="monotone" dataKey="totalTTC" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                ) : (
                  <AreaChart data={stats.details} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: window.innerWidth < 640 ? 10 : 12 }} tickFormatter={(value) => `${value}€`} />
                    <Tooltip 
                      formatter={(value) => [formatPrice(value), 'CA TTC']}
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <Area type="monotone" dataKey="totalTTC" stroke="#3b82f6" strokeWidth={2} fill="url(#areaGradient)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* GRILLE ANALYSES - 1 colonne mobile, 2 tablette, 2 desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* TOP PRODUITS - Mobile optimisé */}
          <Card className="shadow-lg md:shadow-xl">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg md:rounded-xl">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-xl font-bold text-gray-900">Top Produits</h2>
                    <p className="text-xs md:text-sm text-gray-600 hidden sm:inline">Les plus vendus</p>
                  </div>
                </div>
              </div>

              {topProducts.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {topProducts.slice(0, 5).map((product, index) => (
                    <div 
                      key={product.id}
                      className="flex items-center gap-2 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg md:rounded-xl hover:shadow-md transition-all"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-white text-sm md:text-base ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-600 truncate">{product.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm md:text-base text-gray-900">{product.total_sold}</p>
                        <p className="text-xs md:text-sm text-green-600 font-semibold">{formatPrice(product.revenue_ttc)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <Trophy className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm md:text-base">Aucune vente</p>
                </div>
              )}
            </div>
          </Card>

          {/* HEURES DE POINTE - Mobile scrollable */}
          <Card className="shadow-lg md:shadow-xl">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg md:rounded-xl">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base md:text-xl font-bold text-gray-900">Heures de Pointe</h2>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:inline">Activité par heure</p>
                </div>
              </div>

              {peakHours.length > 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-2 md:p-4 overflow-x-auto">
                  <ResponsiveContainer width="100%" height={200} minWidth={300}>
                    <BarChart data={peakHours.filter(h => h.total_orders > 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <Tooltip 
                        formatter={(value) => [`${value} cmd`, 'Commandes']}
                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', padding: '8px' }}
                      />
                      <Bar dataKey="total_orders" radius={[6, 6, 0, 0]}>
                        {peakHours.filter(h => h.total_orders > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <Clock className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm md:text-base">Aucune donnée</p>
                </div>
              )}
            </div>
          </Card>

          {/* RÉPARTITION CATÉGORIES - Compact mobile */}
          <Card className="shadow-lg md:shadow-xl">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg md:rounded-xl">
                  <PieIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base md:text-xl font-bold text-gray-900">Par Catégorie</h2>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:inline">Répartition</p>
                </div>
              </div>

              {categories.length > 0 ? (
                <div>
                  {/* Graphique - Taille adaptative */}
                  <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-2 md:p-4 mb-4">
                    <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 250}>
                      <PieChart>
                        <Pie
                          data={categories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.percentage.toFixed(0)}%`}
                          outerRadius={window.innerWidth < 640 ? 60 : 80}
                          fill="#8884d8"
                          dataKey="revenue_ttc"
                        >
                          {categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatPrice(value), 'CA']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Liste - Compact mobile */}
                  <div className="space-y-2">
                    {categories.map((cat, index) => (
                      <div key={cat.id} className="flex items-center justify-between p-2 md:p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm md:text-base font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                            {cat.percentage.toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-600 hidden sm:inline">{formatPrice(cat.revenue_ttc)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <PieIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm md:text-base">Aucune donnée</p>
                </div>
              )}
            </div>
          </Card>

          {/* PRODUITS EN STOCK - Valeur du stock */}
          <Card className="shadow-lg md:shadow-xl">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="p-2 md:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg md:rounded-xl">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base md:text-xl font-bold text-gray-900">Produits en stock</h2>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:inline">Valeur totale du stock</p>
                </div>
              </div>

              {stockValue && stockValue.success ? (
                <div>
                  {/* Stats principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="p-3 md:p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
                      <p className="text-xs md:text-sm text-emerald-700 font-semibold mb-2">Valeur totale</p>
                      <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-900">
                        {formatPrice(stockValue.total_value || 0)}
                      </p>
                    </div>
                    <div className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                      <p className="text-xs md:text-sm text-blue-700 font-semibold mb-2">Produits</p>
                      <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-900">
                        {stockValue.total_products || 0}
                      </p>
                    </div>
                    <div className="p-3 md:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <p className="text-xs md:text-sm text-purple-700 font-semibold mb-2">Articles</p>
                      <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-900">
                        {stockValue.total_items || 0}
                      </p>
                    </div>
                  </div>

                  {/* Liste des produits - Max 5, scrollable */}
                  {stockValue.data && stockValue.data.length > 0 ? (
                    <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                      {stockValue.data.slice(0, 5).map((product) => (
                        <div 
                          key={product.id}
                          className="p-2 md:p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="font-semibold text-xs md:text-sm text-gray-900 truncate">{product.name}</p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {product.stock} × {formatPrice(product.price)} = {formatPrice(product.value)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs md:text-sm font-bold text-emerald-700">
                                {formatPrice(product.value)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {stockValue.data.length > 5 && (
                        <p className="text-xs text-gray-500 text-center pt-2">
                          + {stockValue.data.length - 5} autre{stockValue.data.length - 5 > 1 ? 's' : ''} produit{stockValue.data.length - 5 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">Aucun produit en stock</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <Package className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-semibold text-sm md:text-base">Chargement...</p>
                </div>
              )}
            </div>
          </Card>

        </div>

        {/* TABLEAU DÉTAILLÉ - Scrollable mobile */}
        <Card className="shadow-lg md:shadow-xl">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg md:rounded-xl">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">Détails</h2>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:inline">Par période</p>
              </div>
            </div>

            {/* Tableau - Scroll horizontal sur mobile */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-3 md:p-4 min-w-[600px] md:min-w-0">
                {stats.details && stats.details.length > 0 ? (
                  <>
                    <div className="mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-sm font-semibold text-indigo-700">
                        {stats.details.length} période{stats.details.length > 1 ? 's' : ''} trouvée{stats.details.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <table className="w-full text-xs md:text-sm">
                      <thead>
                        <tr className="border-b-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                          <th className="text-left p-2 md:p-3 font-bold text-gray-900">Date/Heure</th>
                          <th className="text-right p-2 md:p-3 font-bold text-gray-900">Commandes</th>
                          <th className="text-right p-2 md:p-3 font-bold text-gray-900">CA HT</th>
                          <th className="text-right p-2 md:p-3 font-bold text-gray-900">TVA (10%)</th>
                          <th className="text-right p-2 md:p-3 font-bold text-gray-900">CA TTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.details.map((row, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-white transition-colors">
                            <td className="p-2 md:p-3 font-medium text-gray-900 whitespace-nowrap">{row.date}</td>
                            <td className="p-2 md:p-3 text-right">
                              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                                {row.orders || 0}
                              </span>
                            </td>
                            <td className="p-2 md:p-3 text-right text-gray-700 whitespace-nowrap">{formatPrice(row.totalHT || 0)}</td>
                            <td className="p-2 md:p-3 text-right text-gray-700 whitespace-nowrap">{formatPrice(row.tva || 0)}</td>
                            <td className="p-2 md:p-3 text-right font-bold text-green-700 whitespace-nowrap">{formatPrice(row.totalTTC || 0)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-300 font-bold">
                          <td className="p-2 md:p-3 font-bold text-gray-900">TOTAL</td>
                          <td className="p-2 md:p-3 text-right">
                            <span className="px-2 md:px-3 py-0.5 md:py-1 bg-green-600 text-white rounded-full font-bold">
                              {stats.totalOrders || 0}
                            </span>
                          </td>
                          <td className="p-2 md:p-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatPrice(stats.totalHT || 0)}</td>
                          <td className="p-2 md:p-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatPrice(stats.tva || 0)}</td>
                          <td className="p-2 md:p-3 text-right font-bold text-green-700 text-base md:text-lg whitespace-nowrap">{formatPrice(stats.totalTTC || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="text-center py-8 md:py-12 text-gray-500">
                    <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm md:text-base font-semibold mb-2">Aucune donnée pour cette période</p>
                    <p className="text-xs text-gray-400">
                      Période: {(() => {
                        const { startDate, endDate } = getDates();
                        return `${startDate} à ${endDate}`;
                      })()}
                    </p>
                    <button
                      onClick={loadAllData}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Recharger les données
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hint scroll mobile */}
            <p className="md:hidden text-xs text-center text-gray-500 mt-2">
              ← Glissez horizontalement pour voir toutes les colonnes →
            </p>
          </div>
        </Card>

      {/* TRANSACTIONS PAR PÉRIODE */}
      <Card className="shadow-lg md:shadow-xl transition-all">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg md:rounded-xl">
                <Receipt className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">Transactions</h2>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:inline">Détail des ventes sur la période</p>
              </div>
            </div>
            
          </div>

          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="bg-white rounded-xl p-3 md:p-4 min-w-[700px] md:min-w-0 border border-gray-100">
              {transactions.length > 0 ? (
                <>
                  <div className="mb-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-semibold text-emerald-700">
                      {transactions.length} transaction{transactions.length > 1 ? 's' : ''} trouvée{transactions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
                        <th className="text-left p-2 md:p-3 font-bold text-gray-900">Date</th>
                        <th className="text-left p-2 md:p-3 font-bold text-gray-900">N° Commande</th>
                        <th className="text-left p-2 md:p-3 font-bold text-gray-900">Client</th>
                        <th className="text-right p-2 md:p-3 font-bold text-gray-900">Articles</th>
                        <th className="text-right p-2 md:p-3 font-bold text-gray-900">Total</th>
                        <th className="text-left p-2 md:p-3 font-bold text-gray-900">Méthode</th>
                        <th className="text-left p-2 md:p-3 font-bold text-gray-900">Paiement</th>
                        <th className="text-left p-2 md:p-3 font-bold text-gray-900">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => {
                        const rawPaymentStatus = (t.payment_status || t.paymentStatus || '').toLowerCase();
                        const isTransactionPaid = ['completed', 'paid', 'completed_payment'].includes(rawPaymentStatus);
                        const paymentLabel = isTransactionPaid ? 'Payé' : 'Non payé';
                        const paymentBadgeClass = isTransactionPaid
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-red-100 text-red-600 border border-red-200';

                        // Formater la date
                        let formattedDate = 'Date invalide';
                        try {
                          const date = new Date(t.created_at);
                          if (!isNaN(date.getTime())) {
                            formattedDate = date.toLocaleString('fr-FR', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            });
                          }
                        } catch (e) {
                          logger.warn('⚠️ Erreur formatage date transaction:', t.id, t.created_at);
                        }

                        // Formater le nom du client
                        const clientName = (t.first_name || t.last_name) 
                          ? `${t.first_name || ''} ${t.last_name || ''}`.trim() 
                          : 'Invité';

                        // Formater le statut
                        const statusLabels = {
                          'served': 'Servie',
                          'preparing': 'En préparation',
                          'pending': 'En attente',
                          'ready': 'Prête',
                          'cancelled': 'Annulée'
                        };
                        const statusLabel = statusLabels[t.status] || t.status || 'Inconnu';
                        const statusClass = {
                          'served': 'bg-green-100 text-green-700',
                          'preparing': 'bg-yellow-100 text-yellow-700',
                          'pending': 'bg-blue-100 text-blue-700',
                          'ready': 'bg-purple-100 text-purple-700',
                          'cancelled': 'bg-red-100 text-red-700'
                        }[t.status] || 'bg-gray-100 text-gray-700';

                        return (
                          <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-2 md:p-3 text-gray-700 whitespace-nowrap">{formattedDate}</td>
                            <td className="p-2 md:p-3 font-semibold text-gray-900">{formatOrderNumber(t.order_number, t.id)}</td>
                            <td className="p-2 md:p-3 text-gray-700 truncate max-w-[150px]" title={clientName}>
                              {clientName}
                            </td>
                            <td className="p-2 md:p-3 text-right text-gray-700">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                {t.items_count || 0}
                              </span>
                            </td>
                            <td className="p-2 md:p-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                              {formatPrice(parseFloat(t.total_amount || 0))}
                            </td>
                            <td className="p-2 md:p-3 text-gray-700 capitalize">
                              {t.payment_method || 'Non spécifié'}
                            </td>
                            <td className="p-2 md:p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${paymentBadgeClass}`}>
                                {paymentLabel}
                              </span>
                            </td>
                            <td className="p-2 md:p-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusClass}`}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <Receipt className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm md:text-base font-semibold mb-2">Aucune transaction sur la période</p>
                  <p className="text-xs text-gray-400">
                    Période: {customDateRange.from} à {customDateRange.to}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      </div>
    </div>
  );
};

export default DashboardCA;
