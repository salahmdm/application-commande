import React from 'react';
import { X, AlertTriangle, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';

/**
 * Modal pour afficher les produits en alerte de stock
 */
const StockAlertsModal = ({ isOpen, onClose, items }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getStatusInfo = (item) => {
    if (item.quantity === 0) {
      return {
        icon: '❌',
        label: 'Rupture de stock',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      };
    }
    return {
      icon: '⚠️',
      label: 'Stock bas',
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800'
    };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 md:pt-24 lg:pt-28">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[calc(100vh-5rem-2rem)] md:max-h-[calc(100vh-6rem-2rem)] lg:max-h-[calc(100vh-7rem-2rem)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold">
                    Alertes de Stock
                  </h2>
                  <p className="text-orange-100 text-sm mt-1">
                    {items.length} produit{items.length > 1 ? 's' : ''} nécessite{items.length > 1 ? 'nt' : ''} votre attention
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Package className="w-10 h-10 text-green-600" />
                  </div>
                  <p className="text-xl font-heading font-bold text-green-800 mb-2">
                    Aucune alerte !
                  </p>
                  <p className="text-neutral-600">
                    Tous les produits ont un stock suffisant
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const statusInfo = getStatusInfo(item);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-xl border-2 ${statusInfo.borderColor} ${statusInfo.bgColor} hover:shadow-md transition-all`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Icône de statut */}
                            <div className="text-3xl flex-shrink-0">
                              {statusInfo.icon}
                            </div>

                            {/* Informations produit */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-bold text-black text-lg truncate">
                                {item.name}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-neutral-700 border border-neutral-200">
                                  {item.category}
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-xs font-heading font-semibold ${statusInfo.textColor}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stock et prix */}
                          <div className="flex items-center gap-6 flex-shrink-0">
                            <div className="text-center">
                              <p className="text-xs text-neutral-600 mb-1">Stock actuel</p>
                              <p className={`text-2xl font-heading font-bold ${item.quantity === 0 ? 'text-red-700' : 'text-orange-700'}`}>
                                {item.quantity}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-neutral-600 mb-1">Stock min</p>
                              <p className="text-2xl font-heading font-bold text-neutral-700">
                                {item.minQuantity || 0}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-neutral-600 mb-1">Prix unitaire</p>
                              <p className="text-lg font-sans text-neutral-700">
                                {formatPrice(item.price)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Barre de progression du stock */}
                        <div className="mt-3">
                          <div className="h-2 bg-white rounded-full overflow-hidden border border-neutral-200">
                            <div
                              className={`h-full transition-all ${
                                item.quantity === 0 
                                  ? 'bg-red-600' 
                                  : 'bg-gradient-to-r from-orange-400 to-orange-600'
                              }`}
                              style={{
                                width: `${Math.min((item.quantity / ((item.minQuantity || 5) * 2)) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-200 p-6 bg-neutral-50">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-neutral-600">
                  💡 <span className="font-semibold">Conseil :</span> Réapprovisionnez ces produits rapidement pour éviter les ruptures
                </div>
                <Button
                  onClick={onClose}
                  className="bg-neutral-900 hover:bg-black text-white px-6"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockAlertsModal;

