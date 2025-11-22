import React, { useEffect, useState } from 'react';
import { Clock, Package, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import ReceiptModal from '../../components/common/ReceiptModal';
import useOrders from '../../hooks/useOrders';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import { getOrderTypeLabel, formatOrderNumber } from '../../utils/orderHelpers';
import { formatPrice } from '../../constants/pricing';
import logger from '../../utils/logger';

/**
 * Vue Mes Commandes (Client)
 */
const MyOrders = () => {
  const { orders, isLoading, refresh, cancelOrder } = useOrders(); // 🔧 supprimé getOrdersByUser
  const { user } = useAuth();
  const { success, error: showError } = useNotifications();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    const hasUser = user?.id && !user?.isGuest;
    let isMounted = true;

    if (hasUser) {
      // ✅ Laisser apiCall gérer l'authentification (localStorage, cookies HTTP-only, etc.)
      // Ne pas vérifier manuellement le token car il peut être dans un cookie HTTP-only
      refresh().catch(_err => {
        if (isMounted) {
          // apiCall gérera l'erreur d'authentification si nécessaire
          logger.warn('⚠️ Erreur lors du chargement des commandes:', _err);
          // Ne pas afficher d'erreur ici car apiCall peut retourner des erreurs normales (ex: pas de commandes)
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.isGuest, refresh]);

  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(b.created_at || b.createdAt) -
      new Date(a.created_at || a.createdAt)
  );

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleGenerateReceipt = (order) => {
    setSelectedOrder(order);
    setReceiptModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-700 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pl-5 md:pl-10 pr-5 md:pr-10 pt-6 md:pt-8">
      <div>
        <h1 className="text-4xl font-serif font-bold">Mes Commandes</h1>
      </div>

      {sortedOrders.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold mb-2">Aucune commande</h3>
          <p className="text-gray-600">
            {isLoading
              ? 'Chargement en cours...'
              : 'Vous n&apos;avez pas encore passé de commande'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const orderDate = new Date(order.created_at);
            const orderTotal = parseFloat(order.total_amount || 0);

            const orderItems = Array.isArray(order.items)
              ? order.items
              : typeof order.items === 'string'
              ? JSON.parse(order.items || '[]')
              : [];

            return (
              <Card key={order.id} padding="md" className="hover:shadow-lg transition">
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">
                        {formatOrderNumber(order.order_number, order.id)}
                      </h3>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {orderDate.toLocaleDateString()} à{' '}
                          {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>{getOrderTypeLabel(order.order_type)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-500">
                      {orderTotal.toFixed(2)}€
                    </div>

                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="mt-2 flex items-center gap-1 text-sm text-sky-700"
                    >
                      {isExpanded ? (
                        <>
                          Moins <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Détails <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Aperçu des articles */}
                {!isExpanded && (
                  <div className="flex gap-2 flex-wrap">
                    {orderItems.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                        {item.product_name || item.name} x{item.quantity}
                      </div>
                    ))}

                    {orderItems.length > 3 && (
                      <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-600">
                        +{orderItems.length - 3} autres
                      </div>
                    )}
                  </div>
                )}

                {/* Détails */}
                {isExpanded && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    {/* Articles */}
                    <div>
                      <h4 className="font-semibold mb-3">Articles commandés</h4>

                      <div className="space-y-2">
                        {orderItems.map((item, idx) => {
                          const price = parseFloat(item.unit_price || item.price || 0);
                          const total = (price * item.quantity).toFixed(2);

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <div className="font-semibold">
                                  {item.product_name || item.name}
                                </div>

                                <div className="text-sm text-gray-600">
                                  {price.toFixed(2)}€ × {item.quantity}
                                </div>
                              </div>

                              <div className="font-bold">{total}€</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Résumé */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Réduction</span>
                          <span className="font-semibold">
                            -{formatPrice(order.discount_amount || 0)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-amber-500">{formatPrice(orderTotal)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => handleGenerateReceipt(order)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Générer le ticket
                      </Button>

                      <Button variant="outline" fullWidth>
                        Renouveler
                      </Button>

                      {(order.status === 'pending' || order.status === 'preparing') && (
                        <Button
                          variant="danger"
                          fullWidth
                          onClick={async () => {
                            if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
                              return;
                            }

                            try {
                              setCancellingOrderId(order.id);
                              const result = await cancelOrder(order.id);

                              if (result.success) {
                                success('Commande annulée');
                                await refresh();
                              } else {
                                throw new Error(result.error || 'Erreur');
                              }
                            } catch (err) {
                              showError("Impossible d&apos;annuler la commande");
                            } finally {
                              setCancellingOrderId(null);
                            }
                          }}
                          disabled={cancellingOrderId === order.id}
                        >
                          {cancellingOrderId === order.id ? 'Annulation...' : 'Annuler'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {sortedOrders.length > 0 && (
        <Card padding="lg" className="bg-gradient-to-br from-sky-50 to-indigo-50">
          <h3 className="text-xl font-bold mb-4">📊 Vos statistiques</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-sky-700">{sortedOrders.length}</div>
              <div className="text-sm text-gray-600">Commandes</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-700">
                {sortedOrders.filter(o => o.status === 'served').length}
              </div>
              <div className="text-sm text-gray-600">Terminées</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-amber-700">
                {sortedOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0).toFixed(0)}€
              </div>
              <div className="text-sm text-gray-600">Dépensé</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-violet-700">
                {Math.floor(sortedOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Points gagnés</div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal */}
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

export default MyOrders;
