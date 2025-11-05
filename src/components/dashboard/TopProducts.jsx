import React from 'react';
import { Trophy, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '../common/Card';
import { formatPrice } from '../../constants/pricing';

/**
 * Composant Top Produits Vendus
 * Affiche les produits les plus vendus avec graphique horizontal
 */
const TopProducts = ({ products, loading }) => {
  if (loading) {
    return (
      <Card padding="md" className="shadow-lg h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card padding="md" className="shadow-lg h-full">
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-semibold">Aucune vente sur cette période</p>
        </div>
      </Card>
    );
  }

  // Couleurs pour le graphique
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];

  // Badge de rang
  const RankBadge = ({ rank }) => {
    const getBadgeStyle = (rank) => {
      if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg';
      if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md';
      if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md';
      return 'bg-gradient-to-br from-blue-500 to-blue-700 text-white';
    };

    const getIcon = (rank) => {
      if (rank <= 3) return <Trophy className="w-3 h-3 md:w-4 md:h-4" />;
      return null;
    };

    return (
      <div className={`flex items-center gap-1 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold ${getBadgeStyle(rank)}`}>
        {getIcon(rank)}
        <span>#{rank}</span>
      </div>
    );
  };

  return (
    <Card padding="md" className="shadow-lg h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 bg-green-100 rounded-xl">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-heading font-bold text-gray-900">Top Produits</h3>
            <p className="text-xs md:text-sm text-gray-600">Les plus vendus de la période</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg md:text-xl font-bold text-green-600">
            {products.reduce((sum, p) => sum + p.total_sold, 0)}
          </p>
        </div>
      </div>

      {/* Graphique horizontal */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 md:p-4 mb-4">
        <ResponsiveContainer width="100%" height={Math.max(products.length * 50, 200)}>
          <BarChart data={products} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120}
              tick={{ fill: '#374151', fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'total_sold' ? `${value} vendus` : formatPrice(value),
                name === 'total_sold' ? 'Quantité' : 'CA TTC'
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="total_sold" radius={[0, 8, 8, 0]}>
              {products.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Liste détaillée */}
      <div className="space-y-2">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
          >
            {/* Rang */}
            <RankBadge rank={product.rank} />

            {/* Produit */}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-sm md:text-base text-gray-900 truncate">
                {product.name}
              </p>
              <p className="text-xs text-gray-600">{product.category}</p>
            </div>

            {/* Stats */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-1">
                <ShoppingBag className="w-4 h-4 text-green-600" />
                {product.total_sold}
              </p>
              <p className="text-xs text-green-700 font-semibold">
                {formatPrice(product.revenue_ttc)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Statistiques résumées */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t-2 border-gray-200">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium mb-1">CA Total</p>
          <p className="text-base md:text-lg font-bold text-green-900">
            {formatPrice(products.reduce((sum, p) => sum + p.revenue_ttc, 0))}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">Produit #1</p>
          <p className="text-base md:text-lg font-bold text-blue-900 truncate">
            {products[0]?.name}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 col-span-2 md:col-span-1">
          <p className="text-xs text-purple-700 font-medium mb-1">Commandes</p>
          <p className="text-base md:text-lg font-bold text-purple-900">
            {products.reduce((sum, p) => sum + (p.total_orders || 0), 0)}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TopProducts;

