import React, { useState } from 'react';
import { PieChart as PieIcon, TrendingUp, Package } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../common/Card';
import { formatPrice } from '../../constants/pricing';

/**
 * Composant Répartition par Catégorie
 * Affiche un graphique circulaire du CA par catégorie
 */
const CategoryDistribution = ({ categories, totalRevenue, loading }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (loading) {
    return (
      <Card padding="md" className="shadow-lg h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Card>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card padding="md" className="shadow-lg h-full">
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <Package className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-semibold">Aucune donnée disponible</p>
        </div>
      </Card>
    );
  }

  // Couleurs vives pour les catégories
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // Fonction personnalisée pour le label du pie chart
  const renderLabel = (entry) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  // Callback pour l'interaction
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <Card padding="md" className="shadow-lg h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 bg-purple-100 rounded-xl">
            <PieIcon className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-heading font-bold text-gray-900">Répartition par Catégorie</h3>
            <p className="text-xs md:text-sm text-gray-600">Part du CA par catégorie</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg md:text-xl font-bold text-purple-600">
            {formatPrice(totalRevenue || 0)}
          </p>
        </div>
      </div>

      {/* Graphique circulaire */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 md:p-4 mb-4">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={90}
              fill="#8884d8"
              dataKey="revenue_ttc"
              onMouseEnter={onPieEnter}
              activeIndex={activeIndex}
              activeShape={{
                fill: COLORS[activeIndex % COLORS.length],
                stroke: '#fff',
                strokeWidth: 3,
                scale: 1.1
              }}
            >
              {categories.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke={index === activeIndex ? '#000' : '#fff'}
                  strokeWidth={index === activeIndex ? 2 : 1}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatPrice(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Liste détaillée des catégories */}
      <div className="space-y-2">
        {categories.map((category, index) => (
          <div 
            key={category.id}
            className={`
              flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer
              ${activeIndex === index 
                ? 'bg-white border-purple-300 shadow-md scale-105' 
                : 'bg-white border-gray-200 hover:border-purple-200 hover:shadow-sm'
              }
            `}
            onMouseEnter={() => setActiveIndex(index)}
          >
            {/* Indicateur couleur */}
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />

            {/* Nom catégorie */}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-sm md:text-base text-gray-900 truncate">
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </p>
              <p className="text-xs text-gray-600">{category.total_quantity} articles vendus</p>
            </div>

            {/* Pourcentage & CA */}
            <div className="text-right flex-shrink-0">
              <p className="text-lg md:text-xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                {category.percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-700 font-semibold">
                {formatPrice(category.revenue_ttc)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Barres de progression */}
      <div className="mt-4 space-y-2">
        <p className="text-sm font-heading font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          Progression
        </p>
        {categories.map((category, index) => (
          <div key={`bar-${category.id}`} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{category.name}</span>
              <span className="font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                {category.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${category.percentage}%`,
                  backgroundColor: COLORS[index % COLORS.length]
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Statistiques résumées */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t-2 border-gray-200">
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-700 font-medium mb-1">Catégories</p>
          <p className="text-base md:text-lg font-bold text-purple-900">{categories.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium mb-1">Leader</p>
          <p className="text-base md:text-sm font-bold text-green-900 truncate">{categories[0]?.name}</p>
          <p className="text-xs text-green-600">{categories[0]?.percentage.toFixed(1)}%</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 col-span-2 md:col-span-1">
          <p className="text-xs text-blue-700 font-medium mb-1">Total articles</p>
          <p className="text-base md:text-lg font-bold text-blue-900">
            {categories.reduce((sum, c) => sum + c.total_quantity, 0)}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CategoryDistribution;

