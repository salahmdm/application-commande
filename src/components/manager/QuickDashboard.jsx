/**
 * Dashboard rapide pour les managers
 * Affichage des métriques importantes en temps réel
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, Clock, DollarSign, AlertCircle } from 'lucide-react';

/**
 * Composant de métrique avec animation
 */
const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = 'primary',
  trend = 'up',
  className = '' 
}) => {
  const variants = {
    primary: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    secondary: 'bg-gray-50 border-gray-200 text-gray-800'
  };
  
  const iconVariants = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    secondary: 'text-gray-600'
  };

  return (
    <div className={`p-4 rounded-xl border-2 ${variants[variant]} ${className} transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${iconVariants[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard rapide pour les managers
 */
const QuickDashboard = ({ className = '' }) => {
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeUsers: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    avgOrderTime: 0
  });

  // Simuler des données en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        todayOrders: Math.floor(Math.random() * 50) + 20,
        todayRevenue: Math.floor(Math.random() * 2000) + 500,
        activeUsers: Math.floor(Math.random() * 10) + 5,
        pendingOrders: Math.floor(Math.random() * 8) + 2,
        lowStockItems: Math.floor(Math.random() * 5),
        avgOrderTime: Math.floor(Math.random() * 10) + 5
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-bold text-gray-900">Tableau de bord rapide</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>En temps réel</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Commandes aujourd'hui"
          value={metrics.todayOrders}
          change="+12%"
          icon={Package}
          variant="primary"
          trend="up"
        />
        
        <MetricCard
          title="Revenus aujourd'hui"
          value={`${metrics.todayRevenue}€`}
          change="+8%"
          icon={DollarSign}
          variant="success"
          trend="up"
        />
        
        <MetricCard
          title="Utilisateurs actifs"
          value={metrics.activeUsers}
          change="+3"
          icon={Users}
          variant="secondary"
          trend="up"
        />
        
        <MetricCard
          title="Commandes en attente"
          value={metrics.pendingOrders}
          change="+2"
          icon={Clock}
          variant="warning"
          trend="up"
        />
        
        <MetricCard
          title="Stock faible"
          value={metrics.lowStockItems}
          change="+1"
          icon={AlertCircle}
          variant="danger"
          trend="up"
        />
        
        <MetricCard
          title="Temps moyen"
          value={`${metrics.avgOrderTime}min`}
          change="-2min"
          icon={Clock}
          variant="primary"
          trend="down"
        />
      </div>
      
      {/* Actions rapides */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Actions rapides</h4>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors duration-200">
              Voir tout
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-left">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Nouvelle commande</span>
            </div>
          </button>
          
          <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Alertes stock</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickDashboard;
