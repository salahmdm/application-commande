import React from 'react';
import { Clock, TrendingUp, Sun, Moon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '../common/Card';
import { formatPrice } from '../../constants/pricing';

/**
 * Composant Heures de Pointe
 * Affiche un histogramme des heures les plus actives
 */
const PeakHours = ({ hours, loading }) => {
  if (loading) {
    return (
      <Card padding="md" className="shadow-lg h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (!hours || hours.length === 0) {
    return (
      <Card padding="md" className="shadow-lg h-full">
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <Clock className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-semibold">Aucune donnée disponible</p>
        </div>
      </Card>
    );
  }

  // Filtrer les heures avec activité (8h - 22h typiquement)
  const activeHours = hours.filter(h => h.total_orders > 0);
  const peakHour = hours.reduce((max, h) => h.total_orders > max.total_orders ? h : max, hours[0]);
  const totalOrders = hours.reduce((sum, h) => sum + h.total_orders, 0);
  const totalRevenue = hours.reduce((sum, h) => sum + h.total_revenue, 0);

  // Fonction pour déterminer la période de la journée
  const getPeriodIcon = (hour) => {
    if (hour >= 6 && hour < 12) return <Sun className="w-4 h-4 text-yellow-500" />;
    if (hour >= 12 && hour < 18) return <Sun className="w-4 h-4 text-orange-500" />;
    if (hour >= 18 && hour < 22) return <Moon className="w-4 h-4 text-blue-500" />;
    return <Moon className="w-4 h-4 text-indigo-600" />;
  };

  // Couleur selon l'intensité
  const getBarColor = (hour) => {
    const intensity = hour.total_orders / peakHour.total_orders;
    if (intensity > 0.8) return '#10b981'; // Vert
    if (intensity > 0.5) return '#3b82f6'; // Bleu
    if (intensity > 0.3) return '#f59e0b'; // Orange
    return '#94a3b8'; // Gris
  };

  return (
    <Card padding="md" className="shadow-lg h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 bg-blue-100 rounded-xl">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-heading font-bold text-gray-900">Heures de Pointe</h3>
            <p className="text-xs md:text-sm text-gray-600">Activité par heure</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Pic</p>
          <p className="text-lg md:text-xl font-bold text-blue-600 flex items-center gap-1">
            {getPeriodIcon(peakHour.hour)}
            {peakHour.label}
          </p>
        </div>
      </div>

      {/* Graphique histogramme */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 md:p-4 mb-4">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={activeHours} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="label" 
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'total_orders' ? `${value} commandes` : formatPrice(value),
                name === 'total_orders' ? 'Commandes' : 'CA'
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="total_orders" radius={[8, 8, 0, 0]}>
              {activeHours.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Périodes de la journée */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
        {[
          { label: 'Matin', range: '6h-12h', hours: hours.filter(h => h.hour >= 6 && h.hour < 12), icon: Sun, color: 'yellow' },
          { label: 'Midi', range: '12h-14h', hours: hours.filter(h => h.hour >= 12 && h.hour < 14), icon: Sun, color: 'orange' },
          { label: 'Après-midi', range: '14h-18h', hours: hours.filter(h => h.hour >= 14 && h.hour < 18), icon: Sun, color: 'amber' },
          { label: 'Soir', range: '18h-22h', hours: hours.filter(h => h.hour >= 18 && h.hour < 22), icon: Moon, color: 'blue' }
        ].map((period) => {
          const periodOrders = period.hours.reduce((sum, h) => sum + h.total_orders, 0);
          const PeriodIcon = period.icon;
          
          return (
            <div key={period.label} className={`bg-${period.color}-50 rounded-lg p-3 border border-${period.color}-200`}>
              <div className="flex items-center gap-2 mb-2">
                <PeriodIcon className={`w-4 h-4 text-${period.color}-600`} />
                <p className={`text-xs font-semibold text-${period.color}-700`}>{period.label}</p>
              </div>
              <p className={`text-sm font-bold text-${period.color}-900`}>{periodOrders}</p>
              <p className={`text-xs text-${period.color}-700`}>{period.range}</p>
            </div>
          );
        })}
      </div>

      {/* Top 3 heures */}
      <div className="space-y-2">
        <p className="text-sm font-heading font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Top 3 heures les plus actives
        </p>
        {activeHours
          .sort((a, b) => b.total_orders - a.total_orders)
          .slice(0, 3)
          .map((hour, index) => (
            <div 
              key={hour.hour} 
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200"
            >
              {/* Badge */}
              <div className={`
                px-3 py-1 rounded-full text-xs font-bold
                ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                  index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' :
                  'bg-gradient-to-r from-orange-400 to-orange-600 text-white'}
              `}>
                #{index + 1}
              </div>

              {/* Heure */}
              <div className="flex items-center gap-2 flex-1">
                {getPeriodIcon(hour.hour)}
                <p className="font-heading font-semibold text-gray-900">{hour.label}</p>
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{hour.total_orders} cmd</p>
                <p className="text-xs text-green-700 font-semibold">{formatPrice(hour.total_revenue)}</p>
              </div>
            </div>
          ))}
      </div>

      {/* Statistiques globales */}
      <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t-2 border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">Total</p>
          <p className="text-base md:text-lg font-bold text-blue-900">{totalOrders}</p>
          <p className="text-xs text-blue-600">commandes</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium mb-1">CA Total</p>
          <p className="text-base md:text-lg font-bold text-green-900">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-700 font-medium mb-1">Moyenne/h</p>
          <p className="text-base md:text-lg font-bold text-purple-900">
            {activeHours.length > 0 ? Math.round(totalOrders / activeHours.length) : 0}
          </p>
          <p className="text-xs text-purple-600">cmd/h</p>
        </div>
      </div>
    </Card>
  );
};

export default PeakHours;

