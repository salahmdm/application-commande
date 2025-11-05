import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon, Receipt } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import ReceiptModal from '../../components/common/ReceiptModal';
import useOrders from '../../hooks/useOrders';
import useNotifications from '../../hooks/useNotifications';
import useSettings from '../../hooks/useSettings';
import orderService from '../../services/orderService';
import { formatPrice } from '../../constants/pricing';
import { ORDER_STATUS, getStatusLabel } from '../../constants/orderStatuses';
import { getOrderTypeLabel, getPaymentMethodLabel, formatOrderNumber } from '../../utils/orderHelpers';

/**
 * Vue Gestion des Commandes Admin - Version Mobile-First
 * CONNECTÉE À MYSQL en temps réel
 */
const AdminOrders = () => {
  const { updateStatus, cancelOrder } = useOrders();
  const { success, error: showError } = useNotifications();
  const { tableNumberEnabled } = useSettings();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Charger les commandes depuis MySQL
  const fetchAllOrders = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 AdminOrders - Chargement commandes MySQL...');
      const response = await orderService.getAllOrders();
      if (response.success && response.data) {
        // Parser les items JSON de chaque commande
        const ordersWithItems = response.data.map(order => {
          let items = [];
          if (order.items) {
            try {
              items = typeof order.items === 'string' 
                ? JSON.parse(order.items || '[]') 
                : Array.isArray(order.items) 
                ? order.items 
                : [];
            } catch (e) {
              console.error(`Erreur parsing items pour commande ${order.id}:`, e);
              items = [];
            }
          }
          return { ...order, parsedItems: items };
        });
        
        setOrders(ordersWithItems);
        console.log(`✅ AdminOrders - ${ordersWithItems.length} commandes chargées`);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('❌ AdminOrders - Erreur:', err);
      showError('Erreur lors du chargement des commandes');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllOrders();
  }, []);
  
  const statusConfig = {
    pending: { label: 'Prise', color: 'amber', icon: Clock },
    preparing: { label: 'Prendre en charge', color: 'blue', icon: Package },
    ready: { label: 'Terminée', color: 'green', icon: CheckCircle },
    served: { label: 'Remise', color: 'violet', icon: CheckCircle },
    cancelled: { label: 'Annulée', color: 'red', icon: XCircle }
  };
  
  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);
  
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setProcessingOrderId(orderId);
      const result = await updateStatus(orderId, newStatus);
      if (result.success) {
        success(`Statut mis à jour : ${getStatusLabel(newStatus)}`);
        await fetchAllOrders();
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    try {
      setProcessingOrderId(orderId);
      const result = await cancelOrder(orderId);
      if (result.success) {
        success('Commande annulée avec succès');
        await fetchAllOrders();
      } else {
        throw new Error(result.error || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      showError(error.message || 'Impossible d\'annuler la commande');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleGenerateReceipt = (order) => {
    setSelectedOrder(order);
    setReceiptModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
    preparing: orders.filter(o => o.status === ORDER_STATUS.PREPARING).length,
    ready: orders.filter(o => o.status === ORDER_STATUS.READY).length,
    served: orders.filter(o => o.status === ORDER_STATUS.SERVED).length,
    cancelled: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length,
    revenue: orders
      .filter(o => o.status !== ORDER_STATUS.CANCELLED)
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <RefreshCw className="w-12 h-12 animate-spin text-black mb-4" />
        <p className="text-neutral-600 font-sans">Chargement des commandes...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8 animate-fade-in w-full overflow-x-hidden">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-black">
            Gestion Commandes (Admin)
          </h1>
          <p className="text-neutral-600 font-sans mt-1">
            Vue complète de toutes les commandes
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => fetchAllOrders && fetchAllOrders()}
          disabled={isLoading}
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Actualiser
        </Button>
      </div>

      {/* Statistiques compactes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 w-full max-w-full">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-neutral-600 font-sans mb-1">Total</p>
            <p className="text-xl font-heading font-bold text-black">{stats.total}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-neutral-600 font-sans mb-1">Prises</p>
            <p className="text-xl font-heading font-bold text-amber-600">{stats.pending}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-neutral-600 font-sans mb-1">En cours</p>
            <p className="text-xl font-heading font-bold text-blue-600">{stats.preparing}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-neutral-600 font-sans mb-1">Terminées</p>
            <p className="text-xl font-heading font-bold text-green-600">{stats.ready}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-neutral-600 font-sans mb-1">Terminées</p>
            <p className="text-xl font-heading font-bold text-violet-600">{stats.served}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-neutral-600 font-sans mb-1">CA Total</p>
            <p className="text-lg md:text-xl font-heading font-bold text-green-600">
              {formatPrice(stats.revenue)}
            </p>
          </div>
        </Card>
      </div>
      
      {/* Filtres */}
      <div className="flex overflow-x-auto gap-2 pb-2 snap-x snap-mandatory scrollbar-hide w-full max-w-full -mx-1 px-1">
        <button
          onClick={() => setFilter('all')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl 
            text-sm font-heading font-semibold whitespace-nowrap
            snap-start flex-shrink-0 transition-all duration-200
            ${filter === 'all'
              ? 'bg-black text-white shadow-medium'
              : 'bg-white border-2 border-neutral-200 text-black hover:bg-neutral-50 hover:scale-102'
            }
            active:scale-95
          `}
        >
          Toutes
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-bold
            ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'}
          `}>
            {stats.total}
          </span>
        </button>

        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          const count = stats[status] || 0;
          
          return (
          <button
            key={status}
            onClick={() => setFilter(status)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl 
                text-sm font-heading font-semibold whitespace-nowrap
                snap-start flex-shrink-0 transition-all duration-200
                ${filter === status
                  ? 'bg-black text-white shadow-medium'
                  : 'bg-white border-2 border-neutral-200 text-black hover:bg-neutral-50 hover:scale-102'
                }
                active:scale-95
              `}
            >
              <Icon className="w-4 h-4" />
            {config.label}
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${filter === status ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'}
              `}>
                {count}
              </span>
          </button>
          );
        })}
      </div>
      
      {/* Liste des commandes */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-3 w-full max-w-full">
          {filteredOrders.map((order) => {
            const isProcessing = processingOrderId === order.id;
            const isExpanded = expandedOrders.has(order.id);
            const orderItems = order.parsedItems || [];
            
            return (
              <Card key={order.id} padding="none" className="overflow-hidden w-full max-w-full">
                {/* En-tête commande */}
                <div 
                  className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors w-full"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    {/* Info principale */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-heading font-bold text-black">
                          {formatOrderNumber(order.order_number, order.id)}
                        </h3>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-600 font-sans">Client:</span>
                          <span className="font-heading font-semibold text-black truncate">
                            {order.first_name && order.last_name 
                              ? `${order.first_name} ${order.last_name}` 
                              : order.first_name 
                              ? order.first_name 
                              : order.email 
                              ? order.email 
                              : `User #${order.user_id}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-600 font-sans">Type:</span>
                          <span className="font-heading font-semibold text-black">
                            {getOrderTypeLabel(order.order_type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-600 font-sans">Total:</span>
                          <span className="font-heading font-bold text-black">
                            {formatPrice(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date + Expand */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-neutral-600 font-sans text-right">
                        {formatDate(order.created_at)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-neutral-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails étendus */}
                {isExpanded && (
                  <div className="border-t-2 border-neutral-200 p-4 bg-neutral-50 space-y-4 animate-slide-up w-full overflow-x-hidden">
                    {/* Articles */}
                    {orderItems.length > 0 && (
                      <div>
                        <h4 className="font-heading font-semibold text-black mb-3 text-sm">
                          Articles ({orderItems.length})
                        </h4>
                        <div className="space-y-2">
                          {orderItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-neutral-200">
                              {/* Image produit */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-neutral-300 flex-shrink-0">
                                {item.image_url ? (
                                  <img 
                                    src={`http://localhost:5000${item.image_url}`}
                                    alt={item.product_name || item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-neutral-400" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-heading font-semibold text-sm text-black truncate">
                                  {item.product_name || item.name}
                                </div>
                                <div className="text-xs text-neutral-600 font-sans">
                                  {formatPrice(item.unit_price || item.price)} × {item.quantity}
                                </div>
                              </div>
                              
                              <div className="text-sm font-heading font-bold text-black flex-shrink-0">
                                {formatPrice(item.subtotal || (item.unit_price || item.price) * item.quantity)}
                      </div>
                      </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Infos supplémentaires */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white p-3 rounded-xl border border-neutral-200">
                        <span className="text-neutral-600 font-sans block mb-1">Paiement:</span>
                        <span className="font-heading font-semibold text-black">
                          {getPaymentMethodLabel(order.payment_method)}
                        </span>
                      </div>
                      {tableNumberEnabled && order.table_number && (
                        <div className="bg-white p-3 rounded-xl border border-neutral-200">
                          <span className="text-neutral-600 font-sans block mb-1">Table:</span>
                          <span className="font-heading font-semibold text-black">
                            {order.table_number}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions - Changer statut */}
                    <div className="space-y-3">
                      <label className="block text-sm font-heading font-semibold text-black">
                        Changer le statut:
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl 
                                 font-heading font-semibold text-black
                                 focus:outline-none focus:ring-2 focus:ring-black focus:border-black
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-all duration-200"
                      >
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <option key={status} value={status}>
                            {config.label}
                          </option>
                        ))}
                      </select>

                      {/* Boutons d'action */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateReceipt(order);
                          }}
                          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-heading font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Receipt className="w-5 h-5" />
                          Générer le ticket
                        </button>
                        
                        {/* Bouton Annuler - Disponible pour toutes les commandes non terminées */}
                        {order.status !== ORDER_STATUS.SERVED && order.status !== ORDER_STATUS.CANCELLED && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order.id);
                            }}
                            disabled={isProcessing}
                            className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-heading font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Annuler la commande"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card padding="lg" className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <Package className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-xl font-heading font-bold text-black mb-2">
            Aucune commande
          </h3>
          <p className="text-neutral-600 font-sans">
            {filter === 'all'
              ? 'Aucune commande enregistrée'
              : `Aucune commande avec le statut "${statusConfig[filter]?.label}"`
            }
          </p>
        </Card>
      )}

      {/* CSS pour cacher la scrollbar - Utiliser className scrollbar-hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Modal de génération de ticket */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
};

export default AdminOrders;
