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
  Settings,
  Maximize2,
  Minimize2
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

/**
 * Dashboard CA - Version Mobile-First Responsive
 * Optimisé pour mobile, tablette et desktop
 */
const DashboardCA = () => {
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
  const [criticalStock, setCriticalStock] = useState([]);
  const [criticalStockStats, setCriticalStockStats] = useState({ totalCritical: 0, totalLow: 0 });
  const [transactions, setTransactions] = useState([]);
  const [editMode, setEditMode] = useState(false);
  
  // Taille du widget Transactions (en hauteur, en pixels)
  const getSavedTransactionsHeight = () => {
    try {
      const saved = localStorage.getItem('dashboard-transactions-height');
      return saved ? parseInt(saved) : 600;
    } catch (error) {
      logger.warn('DashboardCA: lecture de la hauteur transactions impossible, valeur par défaut utilisée.', error);
      return 600;
    }
  };
  const [transactionsHeight, setTransactionsHeight] = useState(getSavedTransactionsHeight());

  const saveTransactionsHeight = (height) => {
    setTransactionsHeight(height);
    try {
      localStorage.setItem('dashboard-transactions-height', height.toString());
    } catch (error) {
      logger.warn('DashboardCA: impossible de sauvegarder la hauteur des transactions.', error);
    }
  };

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

  const loadAllData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDates();
      const { compareStartDate, compareEndDate } = getComparisonDates(startDate, endDate);

      const [
        revenueResponse,
        topProductsResponse,
        peakHoursResponse,
        categoriesResponse,
        criticalStockResponse,
        ordersPeriodResponse
      ] = await Promise.all([
        dashboardService.getRevenueStatsWithComparison(startDate, endDate, compareStartDate, compareEndDate),
        dashboardService.getTopProductsPeriod(startDate, endDate, 5),
        dashboardService.getPeakHours(startDate, endDate),
        dashboardService.getCategoryDistribution(startDate, endDate),
        dashboardService.getCriticalStock(),
        dashboardService.getOrdersPeriod(startDate, endDate)
      ]);

      if (revenueResponse.success && revenueResponse.data) {
        const { current, growth, details } = revenueResponse.data;
        const isSingleDay = startDate === endDate;
        
        const formattedDetails = details.map(day => {
          const totalTTC = parseFloat(day.total_revenue) || 0;
          const totalHT = totalTTC / 1.10;
          const tva = totalTTC - totalHT;
          
          let displayLabel;
          if (isSingleDay && day.hour !== undefined) {
            displayLabel = `${day.hour}h`;
          } else {
            const date = new Date(day.date);
            displayLabel = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          }
          
          return {
            date: displayLabel,
            rawDate: day.date,
            hour: day.hour,
            orders: parseInt(day.total_orders) || 0,
            totalHT,
            tva,
            totalTTC
          };
        });

        setStats({
          totalTTC: current.totalRevenue,
          totalHT: current.totalHT,
          tva: current.totalTVA,
          totalOrders: current.totalOrders,
          avgOrder: current.avgOrder,
          revenueGrowth: growth.revenue,
          ordersGrowth: growth.orders,
          avgOrderGrowth: growth.avgOrder,
          details: formattedDetails.reverse()
        });
      }

      if (topProductsResponse.success) setTopProducts(topProductsResponse.data || []);
      if (peakHoursResponse.success) setPeakHours(peakHoursResponse.data || []);
      if (categoriesResponse.success) setCategories(categoriesResponse.data || []);
      if (criticalStockResponse.success) {
        setCriticalStock(criticalStockResponse.data || []);
        setCriticalStockStats({
          totalCritical: criticalStockResponse.total_critical || 0,
          totalLow: criticalStockResponse.total_low || 0
        });
      }

      if (ordersPeriodResponse.success) {
        setTransactions(ordersPeriodResponse.data || []);
      }
    } catch (error) {
      logger.error('❌ Erreur:', error);
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
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customDateRange, referenceDate]);

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
      <div className="max-w-[1800px] mx-auto space-y-4 md:space-y-6">
        
        {/* EN-TÊTE RESPONSIVE */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-xl md:shadow-2xl text-white">
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Titre et icône */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 lg:p-4 bg-white bg-opacity-20 rounded-xl md:rounded-2xl backdrop-blur-sm flex-shrink-0">
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate">Dashboard CA</h1>
                <p className="text-white text-opacity-90 text-xs sm:text-sm md:text-base mt-1 flex items-center gap-2 flex-wrap">
                  <span>Analyse en temps réel</span>
                  <span className="px-2 md:px-3 py-0.5 md:py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold">Live</span>
                </p>
              </div>
            </div>

            {/* Boutons - Adaptés mobile */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setEditMode(!editMode)}
                className={`flex-1 sm:flex-none ${editMode ? 'bg-blue-600 bg-opacity-90 border-blue-500' : 'bg-white bg-opacity-20 border-white border-opacity-40'} text-white hover:bg-opacity-30 backdrop-blur-sm text-xs md:text-sm px-3 md:px-4 py-2`}
                icon={<Settings className="w-4 h-4 md:w-5 md:h-5" />}
              >
                <span className="hidden sm:inline">{editMode ? 'Édition: ON' : 'Mode édition'}</span>
                <span className="sm:hidden">{editMode ? 'ON' : 'Edit'}</span>
              </Button>
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

          {/* STOCK CRITIQUE - Compact mobile */}
          <Card className="shadow-lg md:shadow-xl">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="p-2 md:p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg md:rounded-xl">
                  <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base md:text-xl font-bold text-gray-900">Stock Critique</h2>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:inline">À réapprovisionner</p>
                </div>
              </div>

              {criticalStock.length > 0 ? (
                <div>
                  {/* Stats - Grid 3 colonnes mobile */}
                  <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="p-2 md:p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-700 font-semibold mb-1">Rupture</p>
                      <p className="text-lg md:text-2xl font-bold text-red-900">
                        {criticalStock.filter(p => p.status === 'out').length}
                      </p>
                    </div>
                    <div className="p-2 md:p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-orange-700 font-semibold mb-1">Critique</p>
                      <p className="text-lg md:text-2xl font-bold text-orange-900">{criticalStockStats.totalCritical}</p>
                    </div>
                    <div className="p-2 md:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-700 font-semibold mb-1">Bas</p>
                      <p className="text-lg md:text-2xl font-bold text-yellow-900">{criticalStockStats.totalLow}</p>
                    </div>
                  </div>

                  {/* Liste - Max 5, scrollable */}
                  <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                    {criticalStock.slice(0, 5).map((product) => (
                      <div 
                        key={product.id}
                        className={`p-2 md:p-3 rounded-lg ${
                          product.status === 'out' ? 'bg-red-50 border border-red-200' :
                          product.status === 'critical' ? 'bg-orange-50 border border-orange-200' :
                          'bg-yellow-50 border border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-xs md:text-sm text-gray-900 truncate flex-1 mr-2">{product.name}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            product.status === 'out' ? 'bg-red-600 text-white' :
                            product.status === 'critical' ? 'bg-orange-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {product.current_stock}/{product.min_stock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-green-600">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl md:text-3xl">✓</span>
                  </div>
                  <p className="font-semibold text-sm md:text-base">Stocks OK</p>
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
                {stats.details.length > 0 ? (
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b-2 border-indigo-200">
                        <th className="text-left p-2 md:p-3 font-bold text-gray-900">Date</th>
                        <th className="text-right p-2 md:p-3 font-bold text-gray-900">Cmd</th>
                        <th className="text-right p-2 md:p-3 font-bold text-gray-900">CA HT</th>
                        <th className="text-right p-2 md:p-3 font-bold text-gray-900">TVA</th>
                        <th className="text-right p-2 md:p-3 font-bold text-gray-900">CA TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.details.map((row, i) => (
                        <tr key={i} className="border-b border-gray-200 hover:bg-white transition-colors">
                          <td className="p-2 md:p-3 font-medium text-gray-900">{row.date}</td>
                          <td className="p-2 md:p-3 text-right">
                            <span className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                              {row.orders}
                            </span>
                          </td>
                          <td className="p-2 md:p-3 text-right text-gray-700">{formatPrice(row.totalHT)}</td>
                          <td className="p-2 md:p-3 text-right text-gray-700">{formatPrice(row.tva)}</td>
                          <td className="p-2 md:p-3 text-right font-bold text-green-700">{formatPrice(row.totalTTC)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-300">
                        <td className="p-2 md:p-3 font-bold text-gray-900">TOTAL</td>
                        <td className="p-2 md:p-3 text-right">
                          <span className="px-2 md:px-3 py-0.5 md:py-1 bg-green-600 text-white rounded-full font-bold">
                            {stats.totalOrders}
                          </span>
                        </td>
                        <td className="p-2 md:p-3 text-right font-bold text-gray-900">{formatPrice(stats.totalHT)}</td>
                        <td className="p-2 md:p-3 text-right font-bold text-gray-900">{formatPrice(stats.tva)}</td>
                        <td className="p-2 md:p-3 text-right font-bold text-green-700 text-base md:text-lg">{formatPrice(stats.totalTTC)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 md:py-12 text-gray-500">
                    <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm md:text-base">Aucune donnée</p>
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
      <Card className={`shadow-lg md:shadow-xl transition-all ${editMode ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
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
            
            {/* Contrôles de taille en mode édition */}
            {editMode && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-xs font-semibold text-blue-700 hidden sm:inline">Hauteur:</span>
                <button
                  onClick={() => saveTransactionsHeight(Math.max(300, transactionsHeight - 50))}
                  className="p-1.5 bg-white rounded hover:bg-blue-100 transition-colors"
                  title="Réduire"
                >
                  <Minimize2 className="w-4 h-4 text-blue-600" />
                </button>
                <span className="text-xs font-bold text-blue-700 min-w-[50px] text-center">
                  {transactionsHeight}px
                </span>
                <button
                  onClick={() => saveTransactionsHeight(Math.min(1200, transactionsHeight + 50))}
                  className="p-1.5 bg-white rounded hover:bg-blue-100 transition-colors"
                  title="Augmenter"
                >
                  <Maximize2 className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => saveTransactionsHeight(600)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Réinitialiser"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0" style={{ height: editMode ? `${transactionsHeight}px` : 'auto', maxHeight: editMode ? `${transactionsHeight}px` : 'none', overflowY: editMode ? 'auto' : 'visible' }}>
            <div className="bg-white rounded-xl p-3 md:p-4 min-w-[700px] md:min-w-0 border border-gray-100">
              {transactions.length > 0 ? (
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b-2 border-emerald-200">
                      <th className="text-left p-2 md:p-3 font-bold text-gray-900">Date</th>
                      <th className="text-left p-2 md:p-3 font-bold text-gray-900">N°</th>
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

                      return (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 md:p-3 text-gray-700">
                          {new Date(t.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-2 md:p-3 font-semibold text-gray-900">{formatOrderNumber(t.order_number, t.id)}</td>
                        <td className="p-2 md:p-3 text-gray-700 truncate">
                          {t.first_name || t.last_name ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : 'Invité'}
                        </td>
                        <td className="p-2 md:p-3 text-right text-gray-700">{t.items_count}</td>
                        <td className="p-2 md:p-3 text-right font-semibold text-emerald-700">{formatPrice(parseFloat(t.total_amount || 0))}</td>
                        <td className="p-2 md:p-3 text-gray-700">{t.payment_method || 'N/A'}</td>
                        <td className="p-2 md:p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${paymentBadgeClass}`}>
                            {paymentLabel}
                          </span>
                        </td>
                        <td className="p-2 md:p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            t.status === 'served' ? 'bg-green-100 text-green-700' :
                            t.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                            t.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{t.status}</span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <Receipt className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm md:text-base">Aucune transaction sur la période</p>
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
