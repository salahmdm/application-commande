import React from 'react';
import { AlertTriangle, Package, TrendingDown, XCircle } from 'lucide-react';
import Card from '../common/Card';

/**
 * Composant Stock Critique
 * Affiche les produits nécessitant un réapprovisionnement
 */
const CriticalStock = ({ products, totalCritical, totalLow, loading }) => {
  if (loading) {
    return (
      <Card padding="md" className="shadow-lg h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card padding="md" className="shadow-lg h-full">
        <div className="flex flex-col items-center justify-center h-64">
          <Package className="w-16 h-16 mb-4 text-green-500 opacity-30" />
          <p className="text-lg font-semibold text-green-700">✅ Tous les stocks sont OK</p>
          <p className="text-sm text-gray-600 mt-2">Aucun produit en alerte</p>
        </div>
      </Card>
    );
  }

  // Fonction pour obtenir le style selon le statut
  const getStatusStyle = (status) => {
    switch (status) {
      case 'out':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          badge: 'bg-red-600 text-white',
          barBg: 'bg-red-200',
          barFill: 'bg-red-600',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          label: 'Rupture'
        };
      case 'critical':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-900',
          badge: 'bg-orange-600 text-white',
          barBg: 'bg-orange-200',
          barFill: 'bg-orange-600',
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
          label: 'Critique'
        };
      case 'low':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-900',
          badge: 'bg-yellow-600 text-white',
          barBg: 'bg-yellow-200',
          barFill: 'bg-yellow-600',
          icon: <TrendingDown className="w-5 h-5 text-yellow-600" />,
          label: 'Bas'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-900',
          badge: 'bg-gray-600 text-white',
          barBg: 'bg-gray-200',
          barFill: 'bg-gray-600',
          icon: <Package className="w-5 h-5 text-gray-600" />,
          label: 'Normal'
        };
    }
  };

  return (
    <Card padding="md" className="shadow-lg h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 bg-orange-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-heading font-bold text-gray-900">Stock Critique</h3>
            <p className="text-xs md:text-sm text-gray-600">Produits à réapprovisionner</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Alertes</p>
          <p className="text-lg md:text-xl font-bold text-orange-600">
            {(totalCritical || 0) + (totalLow || 0)}
          </p>
        </div>
      </div>

      {/* Statistiques d'alerte */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-red-50 rounded-lg p-3 border-2 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <p className="text-xs font-semibold text-red-700">Rupture</p>
          </div>
          <p className="text-xl md:text-2xl font-bold text-red-900">
            {products.filter(p => p.status === 'out').length}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-xs font-semibold text-orange-700">Critique</p>
          </div>
          <p className="text-xl md:text-2xl font-bold text-orange-900">
            {totalCritical || 0}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 border-2 border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-yellow-600" />
            <p className="text-xs font-semibold text-yellow-700">Bas</p>
          </div>
          <p className="text-xl md:text-2xl font-bold text-yellow-900">
            {totalLow || 0}
          </p>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 md:p-4">
        <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
          {products.map((product) => {
            const style = getStatusStyle(product.status);
            const stockPercentage = product.min_stock > 0 
              ? Math.min((product.current_stock / product.min_stock) * 100, 100)
              : 0;

            return (
              <div
                key={product.id}
                className={`p-3 md:p-4 rounded-xl border-2 ${style.bg} ${style.border} transition-all hover:shadow-md`}
              >
                {/* En-tête produit */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icône statut */}
                    <div className="flex-shrink-0 mt-0.5">
                      {style.icon}
                    </div>

                    {/* Info produit */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-heading font-semibold text-sm md:text-base ${style.text} truncate`}>
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-600">{product.category}</p>
                    </div>
                  </div>

                  {/* Badge statut */}
                  <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${style.badge} flex-shrink-0`}>
                    {style.label}
                  </div>
                </div>

                {/* Barre de progression du stock */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">
                      Stock: <span className="font-bold">{product.current_stock}</span>
                    </span>
                    <span className="text-gray-600">
                      Min: <span className="font-bold">{product.min_stock}</span>
                    </span>
                  </div>
                  <div className={`w-full ${style.barBg} rounded-full h-3 overflow-hidden`}>
                    <div
                      className={`h-full ${style.barFill} transition-all duration-500 rounded-full`}
                      style={{ width: `${stockPercentage}%` }}
                    >
                      <div className="h-full w-full opacity-50 bg-gradient-to-r from-transparent to-white"></div>
                    </div>
                  </div>
                </div>

                {/* Détails */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`${style.bg} rounded p-2`}>
                    <p className="text-gray-600 mb-1">Actuel</p>
                    <p className={`font-bold ${style.text}`}>{product.current_stock}</p>
                  </div>
                  <div className={`${style.bg} rounded p-2`}>
                    <p className="text-gray-600 mb-1">Minimum</p>
                    <p className={`font-bold ${style.text}`}>{product.min_stock}</p>
                  </div>
                  <div className={`${style.bg} rounded p-2`}>
                    <p className="text-gray-600 mb-1">Manque</p>
                    <p className={`font-bold ${style.text}`}>
                      {Math.max(0, product.min_stock - product.current_stock)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action recommandée */}
      <div className="mt-4 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
        <p className="text-sm font-heading font-semibold text-blue-900 mb-2">
          📦 Action recommandée
        </p>
        <p className="text-xs text-blue-700 leading-relaxed">
          {products.filter(p => p.status === 'out').length > 0 && (
            <>⚠️ {products.filter(p => p.status === 'out').length} produit(s) en rupture de stock. </>
          )}
          {totalCritical > 0 && (
            <>Réapprovisionnez {totalCritical} produit(s) en urgence. </>
          )}
          {totalLow > 0 && (
            <>Surveillez {totalLow} produit(s) avec stock faible.</>
          )}
        </p>
      </div>

      {/* Style pour la scrollbar personnalisée */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Card>
  );
};

export default CriticalStock;

