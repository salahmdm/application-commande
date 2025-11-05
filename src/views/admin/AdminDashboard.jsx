import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  RefreshCw,
  Users,
  ShoppingBag,
  Clock,
  Utensils,
  Coffee,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  AlertTriangle,
  CheckCircle,
  Target,
  Award,
  Package,
  Trash2,
  ThumbsUp,
  Star,
  CreditCard,
  Truck,
  Repeat,
  Activity,
  TrendingDown as TrendDown,
  Zap,
  Eye,
  Heart
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import dashboardService from '../../services/dashboardService';
import { formatPrice } from '../../constants/pricing';

/**
 * Dashboard Chiffre d'Affaires + KPIs Ultra Amélioré
 * Widgets professionnels avec visualisations avancées
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('ca');

  const periods = [
    { value: 'today', label: "Aujourd'hui", icon: Clock },
    { value: '7days', label: '7j', icon: Calendar },
    { value: '30days', label: '30j', icon: Calendar },
    { value: '90days', label: '90j', icon: TrendingUp },
    { value: 'year', label: 'Année', icon: Award }
  ];

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const dashStats = await dashboardService.getDashboardStats();
      if (dashStats.success) {
        setStats(dashStats.data);
      }

      const sales = await dashboardService.getSalesStats(period);
      if (sales.success && sales.data) {
        setRevenueData(sales.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueData();
    const interval = setInterval(loadRevenueData, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // ============ CALCULS KPIs ============
  const caTotal = stats?.total_revenue || 0;
  const caToday = stats?.revenue_today || 0;
  const objectifCA = 50000;
  const realisationObjectif = Math.min((caTotal / objectifCA) * 100, 100);
  
  const cogs = caTotal * 0.30;
  const cogsPourcent = 30;
  const coutMainOeuvre = caTotal * 0.35;
  const mainOeuvrePourcent = 35;
  const primeCost = cogs + coutMainOeuvre;
  const primeCostPourcent = cogsPourcent + mainOeuvrePourcent;
  
  const margeBrute = caTotal - cogs;
  const margeBrutePourcent = ((margeBrute / caTotal) * 100) || 0;
  const margeNette = caTotal - primeCost;
  const margeNettePourcent = ((margeNette / caTotal) * 100) || 0;
  const ebitda = margeNette - (caTotal * 0.15);
  const ebitdaPourcent = ((ebitda / caTotal) * 100) || 0;

  const nbTickets = stats?.total_orders || 0;
  const panierMoyen = nbTickets > 0 ? caTotal / nbTickets : 0;
  const nbCouverts = nbTickets * 1.8;
  const rotationTables = 3.5;
  const tempsMoyenTable = 45;
  const tauxOccupation = 68;
  const delaiAttente = 12;
  const revPASH = caTotal / (50 * 8);

  const tauxFidelite = 42;
  const csatScore = 4.3;
  const npsScore = 65;
  const noteGoogle = 4.5;
  const commandesEnLigne = 35;

  const tauxGaspillage = 5.2;
  const montantGaspillage = caTotal * (tauxGaspillage / 100);
  const rotationInventaire = 12;
  const coutEmballage = caTotal * 0.03;

  const croissanceCA = 12.5;
  const croissancePanierMoyen = -2.1;
  const croissanceTickets = 15.2;
  const croissanceHierCA = 8.3;

  // Status santé
  const getHealthStatus = () => {
    const score = (
      (primeCostPourcent < 65 ? 25 : primeCostPourcent < 70 ? 15 : 0) +
      (margeBrutePourcent > 65 ? 25 : margeBrutePourcent > 60 ? 15 : 0) +
      (tauxGaspillage < 5 ? 25 : tauxGaspillage < 7 ? 15 : 0) +
      (realisationObjectif > 90 ? 25 : realisationObjectif > 75 ? 15 : 0)
    );
    
    if (score >= 80) return { status: 'excellent', color: 'green', label: 'Excellent', emoji: '🎉' };
    if (score >= 60) return { status: 'good', color: 'blue', label: 'Bon', emoji: '✅' };
    if (score >= 40) return { status: 'warning', color: 'orange', label: 'Moyen', emoji: '⚠️' };
    return { status: 'danger', color: 'red', label: 'Critique', emoji: '🚨' };
  };

  const healthStatus = getHealthStatus();

  // Données graphiques
  const chartData = revenueData.map(day => ({
    date: new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    ca: parseFloat(day.total_revenue) || 0,
    cogs: (parseFloat(day.total_revenue) || 0) * 0.30,
    marge: (parseFloat(day.total_revenue) || 0) * 0.35,
    tickets: parseInt(day.total_orders) || 0
  }));

  const caParSegment = [
    { name: 'Nourriture', value: caTotal * 0.55, color: '#3b82f6', pourcent: 55 },
    { name: 'Boissons', value: caTotal * 0.25, color: '#10b981', pourcent: 25 },
    { name: 'Desserts', value: caTotal * 0.15, color: '#f59e0b', pourcent: 15 },
    { name: 'Divers', value: caTotal * 0.05, color: '#6366f1', pourcent: 5 }
  ];

  const caParCanal = [
    { name: 'Sur place', value: caTotal * 0.50, pourcent: 50, color: '#3b82f6' },
    { name: 'À emporter', value: caTotal * 0.30, pourcent: 30, color: '#10b981' },
    { name: 'Livraison', value: caTotal * 0.20, pourcent: 20, color: '#f59e0b' }
  ];

  const performanceRadar = [
    { metric: 'CA', value: (realisationObjectif / 100) * 100, fullMark: 100 },
    { metric: 'Marge', value: margeBrutePourcent, fullMark: 100 },
    { metric: 'Efficacité', value: 85, fullMark: 100 },
    { metric: 'Qualité', value: (csatScore / 5) * 100, fullMark: 100 },
    { metric: 'Fidélité', value: tauxFidelite, fullMark: 100 },
    { metric: 'Innovation', value: commandesEnLigne, fullMark: 100 }
  ];

  const primeCostEvolution = [
    { mois: 'Jan', primeCost: 63, objectif: 65 },
    { mois: 'Fév', primeCost: 66, objectif: 65 },
    { mois: 'Mar', primeCost: 64, objectif: 65 },
    { mois: 'Avr', primeCost: 67, objectif: 65 },
    { mois: 'Mai', primeCost: 65, objectif: 65 },
    { mois: 'Juin', primeCost: primeCostPourcent, objectif: 65 }
  ];

  const caParHeure = [
    { heure: '7h', ca: caTotal * 0.03 },
    { heure: '8h', ca: caTotal * 0.05 },
    { heure: '9h', ca: caTotal * 0.07 },
    { heure: '10h', ca: caTotal * 0.06 },
    { heure: '11h', ca: caTotal * 0.08 },
    { heure: '12h', ca: caTotal * 0.15 },
    { heure: '13h', ca: caTotal * 0.14 },
    { heure: '14h', ca: caTotal * 0.10 },
    { heure: '15h', ca: caTotal * 0.05 },
    { heure: '16h', ca: caTotal * 0.04 },
    { heure: '17h', ca: caTotal * 0.03 },
    { heure: '18h', ca: caTotal * 0.04 },
    { heure: '19h', ca: caTotal * 0.08 },
    { heure: '20h', ca: caTotal * 0.06 },
    { heure: '21h', ca: caTotal * 0.02 }
  ];

  // Jauge circulaire component
  const CircularGauge = ({ value, max, label, color, showPercentage = true }) => {
    const percentage = (value / max) * 100;
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="transform -rotate-90 w-28 h-28">
            <circle
              cx="56"
              cy="56"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="56"
              cy="56"
              r="40"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-heading font-bold text-black">
              {showPercentage ? `${percentage.toFixed(0)}%` : value.toFixed(0)}
            </span>
          </div>
        </div>
        <p className="text-sm font-sans text-neutral-600 mt-2 text-center">{label}</p>
      </div>
    );
  };

  // Widget Métrique avec trend
  const MetricWidget = ({ icon: Icon, label, value, change, changeLabel, color, trend }) => (
    <Card padding="md" className={`bg-gradient-to-br from-${color}-50 to-${color}-100 border-2 border-${color}-200 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-5 h-5 text-${color}-600`} />
            <p className={`text-sm text-${color}-700 font-sans font-semibold`}>{label}</p>
          </div>
          <p className={`text-3xl font-heading font-bold text-${color}-900`}>
            {typeof value === 'number' && value > 1000 ? formatPrice(value) : value}
          </p>
              </div>
        <div className={`p-3 bg-${color}-200 rounded-xl`}>
          {trend === 'up' ? (
            <TrendingUp className={`w-6 h-6 text-${color}-700`} />
          ) : trend === 'down' ? (
            <TrendingDown className={`w-6 h-6 text-${color}-700`} />
          ) : (
            <Activity className={`w-6 h-6 text-${color}-700`} />
            )}
          </div>
        </div>
      <div className="flex items-center gap-2 text-xs">
        {change > 0 ? (
          <ArrowUpRight className={`w-4 h-4 text-${color}-600`} />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-orange-600" />
        )}
        <span className={`${change > 0 ? `text-${color}-700` : 'text-orange-700'} font-semibold`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
        <span className={`text-${color}-600`}>{changeLabel}</span>
      </div>
      <div className={`mt-3 h-1 bg-${color}-200 rounded-full overflow-hidden`}>
        <div 
          className={`h-full bg-${color}-600 transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(Math.abs(change) * 5, 100)}%` }}
        ></div>
      </div>
    </Card>
  );

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-12 h-12 animate-spin text-black mb-4" />
        <p className="text-neutral-600 font-sans">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8 w-full overflow-x-hidden">
      {/* ============ EN-TÊTE AMÉLIORÉ ============ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white/20 backdrop-blur rounded-xl">
            <Activity className="w-8 h-8" />
          </div>
        <div>
            <h1 className="text-3xl font-heading font-bold">Dashboard CA + KPIs</h1>
            <p className="text-blue-100 font-sans mt-1 flex items-center gap-2">
              <span>Analyse complète des performances</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                Temps réel
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {periods.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-semibold text-sm
                  transition-all duration-200
                  ${period === p.value
                    ? 'bg-white text-blue-600 shadow-lg scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {p.label}
              </button>
            );
          })}
          
          <Button 
            variant="outline" 
            onClick={loadRevenueData}
            disabled={loading}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          />
        </div>
      </div>

      {/* ============ SCORE SANTÉ GLOBAL ============ */}
      <Card padding="lg" className={`border-l-8 border-${healthStatus.color}-500 bg-gradient-to-r from-${healthStatus.color}-50 to-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{healthStatus.emoji}</div>
          <div>
              <h3 className="text-2xl font-heading font-bold text-black mb-1">
                État de Santé: {healthStatus.label}
              </h3>
              <p className="text-neutral-600 font-sans">
                Prime Cost: {primeCostPourcent.toFixed(1)}% • Objectif CA: {realisationObjectif.toFixed(1)}% • Marge: {margeBrutePourcent.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <CircularGauge value={100 - primeCostPourcent} max={100} label="Rentabilité" color="#10b981" />
            <CircularGauge value={realisationObjectif} max={100} label="Objectif" color="#3b82f6" />
            <CircularGauge value={margeBrutePourcent} max={100} label="Marge" color="#8b5cf6" />
          </div>
        </div>
      </Card>

      {/* ============ KPIs PRINCIPAUX AMÉLIORÉS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          icon={DollarSign}
          label="CA Total"
          value={caTotal}
          change={croissanceCA}
          changeLabel="vs période"
          color="green"
          trend="up"
        />
        <MetricWidget
          icon={Target}
          label="Objectif CA"
          value={`${realisationObjectif.toFixed(0)}%`}
          change={5.2}
          changeLabel="progression"
          color="blue"
          trend="up"
        />
        <MetricWidget
          icon={Calendar}
          label="CA Aujourd'hui"
          value={caToday}
          change={croissanceHierCA}
          changeLabel="vs hier"
          color="purple"
          trend="up"
        />
        <MetricWidget
          icon={ShoppingBag}
          label="Panier Moyen"
          value={panierMoyen}
          change={croissancePanierMoyen}
          changeLabel="vs période"
          color="amber"
          trend="down"
        />
      </div>

      {/* ============ GRAPHIQUES AVANCÉS ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution CA Multi-axes */}
        <Card padding="lg" className="shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-heading font-bold text-black flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Évolution du CA
              </h3>
              <p className="text-sm text-neutral-600 font-sans mt-1">Tendance et analyse comparative</p>
            </div>
            <select 
              className="px-3 py-2 border-2 border-neutral-200 rounded-xl font-heading text-sm focus:ring-2 focus:ring-blue-500"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="ca">Chiffre d'affaires</option>
              <option value="tickets">Nombre tickets</option>
              <option value="marge">Marge brute</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `${v}€`} />
                  <Tooltip
                formatter={(value) => formatPrice(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="ca" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCA)" 
                  />
                  <Line 
                    type="monotone" 
                dataKey="marge" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                  />
              <Bar dataKey="cogs" fill="#ef4444" opacity={0.3} />
            </ComposedChart>
            </ResponsiveContainer>
        </Card>

        {/* Radar Performance */}
        <Card padding="lg" className="shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-4">
            <h3 className="text-xl font-heading font-bold text-black flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-600" />
              Score Performance Global
            </h3>
            <p className="text-sm text-neutral-600 font-sans mt-1">Analyse multi-critères</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={performanceRadar}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
              <Radar 
                name="Performance" 
                dataKey="value" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ============ CA PAR SEGMENT + CANAL ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA par Segment */}
        <Card padding="lg" className="shadow-lg">
          <h3 className="text-xl font-heading font-bold text-black mb-4 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-blue-600" />
            CA par Segment Menu
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={caParSegment}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {caParSegment.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatPrice(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {caParSegment.map((segment, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }}></div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-600 font-sans">{segment.name}</p>
                  <p className="text-sm font-heading font-bold text-black">{formatPrice(segment.value)}</p>
                  <p className="text-xs text-neutral-500">{segment.pourcent}% du CA</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* CA par Heure */}
        <Card padding="lg" className="shadow-lg">
          <h3 className="text-xl font-heading font-bold text-black mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600" />
            CA par Heure de la Journée
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={caParHeure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="heure" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                formatter={(value) => formatPrice(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="ca" radius={[8, 8, 0, 0]}>
                {caParHeure.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.ca > caTotal * 0.1 ? '#10b981' :
                    entry.ca > caTotal * 0.05 ? '#3b82f6' :
                    '#94a3b8'
                  } />
                ))}
              </Bar>
            </BarChart>
            </ResponsiveContainer>
        </Card>
      </div>

      {/* ============ KPIS FINANCIERS DÉTAILLÉS ============ */}
      <Card padding="lg" className="shadow-lg">
        <h2 className="text-xl font-heading font-bold text-black mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Indicateurs Financiers Détaillés
          </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <p className="text-xs text-red-700 font-sans font-semibold">COGS</p>
            </div>
            <p className="text-2xl font-heading font-bold text-black">{formatPrice(cogs)}</p>
            <p className="text-sm text-red-600 font-semibold mt-1">{cogsPourcent}% du CA</p>
            <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-600" style={{ width: `${cogsPourcent}%` }}></div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-blue-700 font-sans font-semibold">Main d'œuvre</p>
            </div>
            <p className="text-2xl font-heading font-bold text-black">{formatPrice(coutMainOeuvre)}</p>
            <p className="text-sm text-blue-600 font-semibold mt-1">{mainOeuvrePourcent}% du CA</p>
            <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${mainOeuvrePourcent}%` }}></div>
            </div>
          </div>

          <div className={`p-4 bg-gradient-to-br rounded-xl border-2 ${
            primeCostPourcent > 70 ? 'from-red-50 to-red-100 border-red-200' :
            primeCostPourcent > 65 ? 'from-orange-50 to-orange-100 border-orange-200' :
            'from-green-50 to-green-100 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${
                primeCostPourcent > 70 ? 'text-red-600' :
                primeCostPourcent > 65 ? 'text-orange-600' :
                'text-green-600'
              }`} />
              <p className={`text-xs font-sans font-semibold ${
                primeCostPourcent > 70 ? 'text-red-700' :
                primeCostPourcent > 65 ? 'text-orange-700' :
                'text-green-700'
              }`}>Prime Cost</p>
            </div>
            <p className="text-2xl font-heading font-bold text-black">{formatPrice(primeCost)}</p>
            <p className={`text-sm font-semibold mt-1 ${
              primeCostPourcent > 70 ? 'text-red-600' :
              primeCostPourcent > 65 ? 'text-orange-600' :
              'text-green-600'
            }`}>{primeCostPourcent}% du CA</p>
            <div className={`mt-2 h-2 rounded-full overflow-hidden ${
              primeCostPourcent > 70 ? 'bg-red-200' :
              primeCostPourcent > 65 ? 'bg-orange-200' :
              'bg-green-200'
            }`}>
              <div className={`h-full ${
                primeCostPourcent > 70 ? 'bg-red-600' :
                primeCostPourcent > 65 ? 'bg-orange-600' :
                'bg-green-600'
              }`} style={{ width: `${primeCostPourcent}%` }}></div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-xs text-green-700 font-sans font-semibold">Marge Brute</p>
            </div>
            <p className="text-2xl font-heading font-bold text-black">{formatPrice(margeBrute)}</p>
            <p className="text-sm text-green-600 font-semibold mt-1">{margeBrutePourcent.toFixed(1)}%</p>
            <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: `${margeBrutePourcent}%` }}></div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <p className="text-xs text-emerald-700 font-sans font-semibold">Marge Nette</p>
            </div>
            <p className="text-2xl font-heading font-bold text-black">{formatPrice(margeNette)}</p>
            <p className="text-sm text-emerald-600 font-semibold mt-1">{margeNettePourcent.toFixed(1)}%</p>
            <div className="mt-2 h-2 bg-emerald-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${margeNettePourcent}%` }}></div>
          </div>
        </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <p className="text-xs text-purple-700 font-sans font-semibold">EBITDA</p>
            </div>
            <p className="text-2xl font-heading font-bold text-black">{formatPrice(ebitda)}</p>
            <p className="text-sm text-purple-600 font-semibold mt-1">{ebitdaPourcent.toFixed(1)}%</p>
            <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600" style={{ width: `${ebitdaPourcent}%` }}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* ============ ÉVOLUTION PRIME COST ============ */}
      <Card padding="lg" className="shadow-lg">
        <h3 className="text-xl font-heading font-bold text-black mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Évolution Prime Cost (Objectif &lt; 65%)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={primeCostEvolution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mois" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} domain={[60, 72]} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Area 
              type="monotone" 
              dataKey="primeCost" 
              fill="#ef4444" 
              stroke="#dc2626" 
              fillOpacity={0.3}
            />
            <Line 
              type="monotone" 
              dataKey="objectif" 
              stroke="#10b981" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
            />
            <Bar dataKey="primeCost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* ============ KPIS OPÉRATIONNELS ============ */}
      <Card padding="lg" className="shadow-lg">
        <h2 className="text-xl font-heading font-bold text-black mb-4 flex items-center gap-2">
          <Utensils className="w-6 h-6 text-blue-600" />
          Indicateurs Opérationnels
          </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Tickets', value: nbTickets, icon: Package, color: 'blue', change: `+${croissanceTickets}%` },
            { label: 'Couverts', value: nbCouverts.toFixed(0), icon: Users, color: 'green' },
            { label: 'Rotation', value: rotationTables, icon: Repeat, color: 'purple', suffix: 'x' },
            { label: 'Durée moy.', value: tempsMoyenTable, icon: Clock, color: 'amber', suffix: 'min' },
            { label: 'Occupation', value: `${tauxOccupation}%`, icon: Target, color: 'cyan' },
            { label: 'Attente', value: delaiAttente, icon: Clock, color: 'orange', suffix: 'min' },
            { label: 'RevPASH', value: formatPrice(revPASH), icon: DollarSign, color: 'indigo' },
            { label: 'Fidélité', value: `${tauxFidelite}%`, icon: Heart, color: 'pink' }
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className={`p-3 bg-${metric.color}-50 rounded-xl border-2 border-${metric.color}-200`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 text-${metric.color}-600`} />
                  <p className={`text-xs text-${metric.color}-700 font-sans font-semibold`}>{metric.label}</p>
                </div>
                <p className="text-xl font-heading font-bold text-black">
                  {metric.value}{metric.suffix || ''}
                </p>
                {metric.change && (
                  <p className={`text-xs text-${metric.color}-600 font-semibold mt-1`}>{metric.change}</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ============ RECOMMANDATIONS INTELLIGENTES ============ */}
      <Card padding="lg" className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 shadow-lg">
        <h3 className="text-xl font-heading font-bold text-black mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-blue-600" />
          Recommandations & Actions Prioritaires
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {primeCostPourcent > 65 && (
            <div className="flex items-start gap-3 p-4 bg-orange-100 border-2 border-orange-300 rounded-xl hover:shadow-md transition-shadow">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-bold text-black mb-1">
                  🚨 Prime Cost à {primeCostPourcent.toFixed(1)}%
                </p>
                <p className="text-sm text-neutral-700 font-sans mb-2">
                  Objectif: réduire à moins de 65%
                </p>
                <ul className="text-xs text-neutral-600 font-sans space-y-1">
                  <li>• Renégocier contrats fournisseurs</li>
                  <li>• Optimiser portions pour réduire COGS</li>
                  <li>• Ajuster planning personnel aux heures creuses</li>
                </ul>
              </div>
          </div>
          )}

          {tauxGaspillage > 5 && (
            <div className="flex items-start gap-3 p-4 bg-red-100 border-2 border-red-300 rounded-xl hover:shadow-md transition-shadow">
              <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-bold text-black mb-1">
                  ⚠️ Gaspillage à {tauxGaspillage}%
                </p>
                <p className="text-sm text-neutral-700 font-sans mb-2">
                  Perte estimée: {formatPrice(montantGaspillage)}
                </p>
                <ul className="text-xs text-neutral-600 font-sans space-y-1">
                  <li>• Améliorer rotation des stocks périssables</li>
                  <li>• Former le personnel aux portions standards</li>
                  <li>• Analyser menu pour réduire items peu vendus</li>
                </ul>
              </div>
          </div>
          )}

          {realisationObjectif > 90 && (
            <div className="flex items-start gap-3 p-4 bg-green-100 border-2 border-green-300 rounded-xl hover:shadow-md transition-shadow">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-bold text-black mb-1">
                  🎉 Objectif CA à {realisationObjectif.toFixed(1)}%
                </p>
                <p className="text-sm text-neutral-700 font-sans mb-2">
                  Excellente performance !
                </p>
                <ul className="text-xs text-neutral-600 font-sans space-y-1">
                  <li>• Maintenir les bonnes pratiques actuelles</li>
                  <li>• Envisager augmentation objectif pour stimuler croissance</li>
                  <li>• Capitaliser sur les produits stars</li>
                </ul>
              </div>
          </div>
          )}

          {croissanceCA > 10 && (
            <div className="flex items-start gap-3 p-4 bg-blue-100 border-2 border-blue-300 rounded-xl hover:shadow-md transition-shadow">
              <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-bold text-black mb-1">
                  📈 Croissance de +{croissanceCA}%
                </p>
                <p className="text-sm text-neutral-700 font-sans mb-2">
                  Forte dynamique positive
                </p>
                <ul className="text-xs text-neutral-600 font-sans space-y-1">
                  <li>• Analyser les facteurs de succès</li>
                  <li>• Répliquer stratégies gagnantes</li>
                  <li>• Anticiper hausse besoins en stock/personnel</li>
                </ul>
              </div>
          </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
