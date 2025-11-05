import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Package, RefreshCw, Utensils, CakeSlice, 
  User, MapPin, Volume2, VolumeX, LayoutGrid, Columns
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import orderService from '../../services/orderService';
import useNotifications from '../../hooks/useNotifications';
import { formatPrice } from '../../constants/pricing';
import {
  ORDER_STATUS,
  getStatusLabel,
} from '../../constants/orderStatuses';
import { formatOrderNumber } from '../../utils/orderHelpers';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import soundNotificationManager from '../../utils/soundNotifications';
import orderWebSocketService from '../../services/orderWebSocketService';
import orderCache from '../../utils/orderCache';
import useAuth from '../../hooks/useAuth';

/**
 * Gestion des Commandes
 */
const ManagerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [now, setNow] = useState(new Date());
  const [sortBy] = useState('smart'); // smart, time, total
  const [viewMode, setViewMode] = useState('grid'); // grid, kanban
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { success, error: showError } = useNotifications();
  const previousOrdersRef = useRef([]);
  const wsConnectedRef = useRef(false);
  const { user } = useAuth();

  // Parser les items des commandes
  const parseOrderItems = (order) => {
    if (!order.items) return [];
    try {
      return typeof order.items === 'string' 
        ? JSON.parse(order.items || '[]') 
        : Array.isArray(order.items) 
        ? order.items 
        : [];
    } catch {
      return [];
    }
  };

  const loadAllOrders = useCallback(async (silent = false, useCache = true) => {
    try {
      if (!silent) setLoading(true);
      
      // Vérifier le cache d'abord
      const cacheKey = '/admin/orders';
      if (useCache) {
        const cached = orderCache.get(cacheKey);
        if (cached) {
          console.log('📦 Données chargées depuis le cache');
          const ordersWithItems = (cached || []).map(order => ({
            ...order,
            parsedItems: parseOrderItems(order)
          }));
          setOrders(ordersWithItems);
          if (!silent) setLoading(false);
          return;
        }
      }
      
      const response = await orderService.getAllOrders({ limit: 100 });
      
      if (response.success) {
        const ordersWithItems = (response.data || []).map(order => ({
          ...order,
          parsedItems: parseOrderItems(order)
        }));
        setOrders(ordersWithItems);
        
        // Mettre en cache
        orderCache.set(cacheKey, {}, response.data);
      } else {
        if (!silent) {
          showError(response.error || 'Erreur lors du chargement des commandes');
        }
        // Ne pas vider les commandes existantes en cas d'erreur silencieuse
        if (!silent) {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error);
      console.error('   Type:', error.name);
      console.error('   Message:', error.message);
      
      if (!silent) {
        // Messages d'erreur plus spécifiques
        let errorMessage = 'Impossible de charger les commandes.';
        
        if (error.name === 'ConnectionError' || error.message.includes('Failed to fetch') || error.message.includes('fetch failed')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 5000.';
        } else if (error.message.includes('Token') || error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Erreur serveur. Vérifiez les logs du backend.';
        } else {
          errorMessage = error.message || 'Impossible de charger les commandes. Vérifiez votre connexion.';
        }
        
        showError(errorMessage);
      }
      // Ne pas vider les commandes existantes en cas d'erreur silencieuse
      if (!silent) {
      setOrders([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showError]);

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      setProcessingOrderId(orderId);
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      
      if (response.success) {
        setOrders(prevOrders => prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // Invalider le cache
        orderCache.invalidate('/admin/orders');
        
        // Son pour changement de statut
        if (soundEnabled) {
          soundNotificationManager.playStatusChange();
        }
        
        success(`Commande mise à jour : ${getStatusLabel(newStatus)}`);
      } else {
        throw new Error(response.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      showError(error.message || 'Impossible de mettre à jour le statut');
    } finally {
      setProcessingOrderId(null);
    }
  }, [soundEnabled, success, showError]);

  const handleCancelOrder = useCallback(async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    try {
      setProcessingOrderId(orderId);
      const response = await orderService.cancelOrder(orderId, 'Annulée par le gestionnaire');
      
      if (response.success) {
        setOrders(prevOrders => prevOrders.map(order =>
          order.id === orderId ? { ...order, status: ORDER_STATUS.CANCELLED } : order
        ));
        
        // Invalider le cache
        orderCache.invalidate('/admin/orders');
        
        success('Commande annulée avec succès');
      } else {
        throw new Error(response.error || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('❌ Erreur annulation commande:', error);
      showError(error.message || 'Impossible d\'annuler la commande');
    } finally {
      setProcessingOrderId(null);
    }
  }, [success, showError]);

  // Détecter les nouvelles commandes pour les notifications sonores
  useEffect(() => {
    if (orders.length > 0 && previousOrdersRef.current.length > 0) {
      const newOrders = orders.filter(
        order => !previousOrdersRef.current.some(prev => prev.id === order.id)
      );

      if (newOrders.length > 0 && soundEnabled) {
        soundNotificationManager.playNewOrder();
        // Notification visuelle pour les nouvelles commandes (une seule fois)
        const firstNewPending = newOrders.find(order => order.status === ORDER_STATUS.PENDING);
        if (firstNewPending) {
          success(`Nouvelle commande: ${formatOrderNumber(firstNewPending.order_number, firstNewPending.id)}`);
        }
      }
    }
    previousOrdersRef.current = orders;
  }, [orders, soundEnabled, success]);

  // WebSocket pour mises à jour en temps réel
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token || !user) {
      return;
    }

    // Connecter WebSocket
    orderWebSocketService.connect(token);

    // Écouter les événements
    const handleOrderCreated = (order) => {
      console.log('📦 Nouvelle commande reçue via WebSocket:', order);
      // Invalider le cache et recharger
      orderCache.invalidate('/admin/orders');
      loadAllOrders(true, false);
      
      // Notification sonore
      if (soundEnabled) {
        soundNotificationManager.playNewOrder();
      }
      
      // Notification visuelle
      if (order.order_number) {
        success(`Nouvelle commande: ${formatOrderNumber(order.order_number, order.id)}`);
      }
    };

    const handleOrderUpdated = (order) => {
      console.log('🔄 Commande mise à jour via WebSocket:', order);
      // Mettre à jour la commande dans le state
      setOrders(prevOrders => {
        const updated = prevOrders.map(o => 
          o.id === order.id ? { ...order, parsedItems: parseOrderItems(order) } : o
        );
        // Si la commande n'existe pas, l'ajouter
        if (!updated.find(o => o.id === order.id)) {
          return [...updated, { ...order, parsedItems: parseOrderItems(order) }];
        }
        return updated;
      });
      
      // Invalider le cache
      orderCache.invalidate('/admin/orders');
    };

    const handleStatusChanged = (data) => {
      console.log('📌 Statut changé via WebSocket:', data);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.orderId ? { ...order, status: data.status } : order
        )
      );
      orderCache.invalidate('/admin/orders');
      
      if (soundEnabled) {
        soundNotificationManager.playStatusChange();
      }
    };

    const handleRefresh = () => {
      console.log('🔄 Rafraîchissement demandé via WebSocket');
      orderCache.invalidate('/admin/orders');
      loadAllOrders(true, false);
    };

    const handleConnected = () => {
      console.log('✅ WebSocket connecté');
      wsConnectedRef.current = true;
    };

    const handleDisconnected = () => {
      console.log('❌ WebSocket déconnecté');
      wsConnectedRef.current = false;
    };

    // Abonner aux événements
    orderWebSocketService.on('order:created', handleOrderCreated);
    orderWebSocketService.on('order:updated', handleOrderUpdated);
    orderWebSocketService.on('order:status_changed', handleStatusChanged);
    orderWebSocketService.on('orders:refresh', handleRefresh);
    orderWebSocketService.on('connected', handleConnected);
    orderWebSocketService.on('disconnected', handleDisconnected);

    // Charger les commandes initiales
    loadAllOrders();

    // Timer pour l'horloge (toujours nécessaire)
    const tickInterval = setInterval(() => setNow(new Date()), 1000);

    // Polling de fallback seulement si WebSocket n'est pas connecté (toutes les 30 secondes)
    const pollInterval = setInterval(() => {
      if (!wsConnectedRef.current) {
        console.log('⚠️ WebSocket non connecté, utilisation du polling de fallback');
        loadAllOrders(true, false);
      }
    }, 30000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(pollInterval);
      orderWebSocketService.off('order:created', handleOrderCreated);
      orderWebSocketService.off('order:updated', handleOrderUpdated);
      orderWebSocketService.off('order:status_changed', handleStatusChanged);
      orderWebSocketService.off('orders:refresh', handleRefresh);
      orderWebSocketService.off('connected', handleConnected);
      orderWebSocketService.off('disconnected', handleDisconnected);
      orderWebSocketService.disconnect();
    };
  }, [loadAllOrders, user, soundEnabled, success]);

  // Configuration des couleurs par statut - Inspiré des meilleurs logiciels professionnels
  // Système de couleurs haute visibilité pour cuisine (Toast, Lightspeed, Square)
  const getStatusConfig = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        // Nouveau/Urgent - Rouge/Orange vif pour attirer l'attention immédiatement
        return {
          label: 'En attente',
          vignetteLabel: 'En attente',
          borderColor: 'border-red-500',
          borderWidth: 'border-l-4',
          bgColor: 'bg-red-50',
          headerBg: 'bg-gradient-to-r from-red-100 via-red-50 to-white',
          badgeColor: 'bg-red-600',
          textColor: 'text-red-800',
          shadowColor: 'shadow-red-200',
          priority: 1 // Priorité pour tri - En attente et En cours en premier
        };
      case ORDER_STATUS.PREPARING:
        // En cours - Bleu professionnel pour action en cours
        return {
          label: 'Prendre en charge',
          vignetteLabel: 'En cours',
          borderColor: 'border-blue-600',
          borderWidth: 'border-l-4',
          bgColor: 'bg-blue-50',
          headerBg: 'bg-gradient-to-r from-blue-100 via-blue-50 to-white',
          badgeColor: 'bg-blue-600',
          textColor: 'text-blue-800',
          shadowColor: 'shadow-blue-200',
          priority: 1 // Même priorité que En attente - à trier ensemble
        };
      case ORDER_STATUS.READY:
        // Prêt - Vert vif pour signaler que c'est prêt à être servi
        return {
          label: 'Terminée',
          vignetteLabel: 'Terminée',
          borderColor: 'border-emerald-600',
          borderWidth: 'border-l-4',
          bgColor: 'bg-emerald-50',
          headerBg: 'bg-gradient-to-r from-emerald-100 via-emerald-50 to-white',
          badgeColor: 'bg-emerald-600',
          textColor: 'text-emerald-800',
          shadowColor: 'shadow-emerald-200',
          priority: 2 // Priorité inférieure - à remettre à la fin
        };
      case ORDER_STATUS.SERVED:
        // Servi - Gris neutre pour commandes terminées
        return {
          label: 'Remise',
          vignetteLabel: 'Terminée',
          borderColor: 'border-slate-400',
          borderWidth: 'border-l-4',
          bgColor: 'bg-slate-50',
          headerBg: 'bg-gradient-to-r from-slate-100 via-slate-50 to-white',
          badgeColor: 'bg-slate-500',
          textColor: 'text-slate-700',
          shadowColor: 'shadow-slate-200',
          priority: 4
        };
      default:
        return {
          label: getStatusLabel(status),
          vignetteLabel: 'En attente',
          borderColor: 'border-gray-400',
          borderWidth: 'border-l-4',
          bgColor: 'bg-gray-50',
          headerBg: 'bg-gradient-to-r from-gray-100 via-gray-50 to-white',
          badgeColor: 'bg-gray-500',
          textColor: 'text-gray-700',
          shadowColor: 'shadow-gray-200',
          priority: 5
        };
    }
  };

  // Fonction de tri intelligente
  const smartSort = useCallback((orderList) => {
    const sorted = [...orderList];
    
    if (sortBy === 'smart') {
      // Tri par statut : En attente et En cours (priority 1) en premier, Terminée (priority 2) à la fin
      // Dans En attente et En cours, trier par date croissante (plus anciennes = temps le plus long en premier)
      // L'ordre d'affichage dans la grille sera : haut-gauche = plus ancienne, puis de gauche à droite
      return sorted.sort((a, b) => {
        const aConfig = getStatusConfig(a.status);
        const bConfig = getStatusConfig(b.status);
        
        // D'abord par priorité de statut (En attente/En cours=1, Terminée=2)
        if (aConfig.priority !== bConfig.priority) {
          return aConfig.priority - bConfig.priority;
        }
        
        // Si même priorité (En attente et En cours), trier par date croissante (plus anciennes = temps le plus long en premier)
        // Pour Terminée, aussi trier par date croissante
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        
        // Tri croissant : plus anciennes (temps le plus long) en premier
        // Cela correspond à l'ordre d'affichage : haut-gauche = plus ancienne, puis de gauche à droite
        return aTime - bTime;
      });
    } else if (sortBy === 'time') {
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'total') {
      return sorted.sort((a, b) => 
        parseFloat(b.total_amount || 0) - parseFloat(a.total_amount || 0)
      );
    }
    
    return sorted;
  }, [sortBy]);

  // Filtrage (sans recherche ni filtre type)
  const filterAndSearch = useCallback((orderList) => {
    // Exclure les annulées et servies
    return orderList.filter(o => 
      o.status !== ORDER_STATUS.CANCELLED && o.status !== ORDER_STATUS.SERVED
    );
  }, []);

  // Filtrer et trier toutes les commandes
  const displayedOrders = useMemo(() => {
    const filtered = filterAndSearch(orders);
    return smartSort(filtered);
  }, [orders, filterAndSearch, smartSort]);

  // Raccourcis clavier - mémorisés pour éviter les re-renders (après displayedOrders)
  const keyboardHandlers = useMemo(() => ({
    refresh: loadAllOrders,
    escape: () => setProcessingOrderId(null),
    quickAction: (key) => {
      const firstPending = displayedOrders.find(o => o.status === ORDER_STATUS.PENDING);
      if (firstPending) {
        switch (key) {
          case '1':
            handleStatusUpdate(firstPending.id, ORDER_STATUS.PREPARING);
            break;
          case '2':
            handleStatusUpdate(firstPending.id, ORDER_STATUS.READY);
            break;
          case '3':
            handleStatusUpdate(firstPending.id, ORDER_STATUS.SERVED);
            break;
          case '4':
            handleCancelOrder(firstPending.id);
            break;
        }
      }
    },
  }), [displayedOrders, loadAllOrders, handleStatusUpdate, handleCancelOrder]);

  useKeyboardShortcuts(keyboardHandlers, true);

  // Statistiques
  const stats = {
    total: displayedOrders.length,
    pending: displayedOrders.filter(o => o.status === ORDER_STATUS.PENDING).length,
    preparing: displayedOrders.filter(o => o.status === ORDER_STATUS.PREPARING).length,
    ready: displayedOrders.filter(o => o.status === ORDER_STATUS.READY).length,
    revenue: orders
      .filter(o => o.status !== ORDER_STATUS.CANCELLED)
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
  };

  // Format timer elapsed time
  const formatElapsed = (createdAt) => {
    const start = new Date(createdAt);
    const diff = Math.max(0, Math.floor((now - start) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Badge type commande
  const getTypeBadge = (type) => {
    switch (type) {
      case 'takeaway':
        return { label: 'à emporter', color: 'bg-blue-600' };
      case 'delivery':
        return { label: 'livraison', color: 'bg-emerald-600' };
      default:
        return { label: 'sur place', color: 'bg-purple-600' };
    }
  };

  // Organiser items par catégorie
  const getItemsByCategory = (items) => {
    const entries = [];
    const plats = [];
    const desserts = [];
    
    if (!items || !Array.isArray(items)) {
      return { entries, plats, desserts };
    }
    
    items.forEach(item => {
      const name = item.product_name || item.name || '';
      const qty = item.quantity || 1;
      const cat = (item.category_type || '').toLowerCase();
      
      if (cat === 'entree') entries.push({ name, qty });
      else if (cat === 'dessert') desserts.push({ name, qty });
      else plats.push({ name, qty });
    });
    
    return { entries, plats, desserts };
  };

  // Composant Carte Commande avec Code Couleur
  const OrderCard = ({ order }) => {
    const statusConfig = getStatusConfig(order.status);
    const typeBadge = getTypeBadge(order.order_type);
    const { entries, plats, desserts } = getItemsByCategory(order.parsedItems || []);
    const elapsed = formatElapsed(order.created_at);
    const customer = order.table_number ? `Table ${order.table_number}` : 
                     (order.first_name ? `${order.first_name} ${order.last_name || ''}`.trim() : 'Client');
    const isProcessing = processingOrderId === order.id;
    const totalItems = (order.parsedItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
      <Card 
        padding="none" 
        className={`mb-4 overflow-hidden ${statusConfig.borderWidth} ${statusConfig.borderColor} transition-all shadow-lg ${statusConfig.shadowColor} hover:shadow-2xl hover:scale-[1.02] flex flex-col max-w-full`}
        style={{ minHeight: 'auto', height: 'fit-content' }}
      >
        {/* Header avec code couleur amélioré - Style professionnel */}
        <div className={`p-4 ${statusConfig.headerBg} border-b-2 ${statusConfig.borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${statusConfig.textColor} tracking-wide font-mono`}>{elapsed}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-bold text-white ${typeBadge.color} shadow-md hover:shadow-lg transition-shadow`}>
                {typeBadge.label}
              </span>
            </div>
          </div>
          
          {/* Statut visible avec code couleur - Vignette améliorée */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-lg text-sm font-bold text-white ${statusConfig.badgeColor} shadow-lg`}>
                {statusConfig.vignetteLabel}
              </span>
              <span className={`text-sm font-semibold ${statusConfig.textColor} font-mono`}>
                {formatOrderNumber(order.order_number, order.id)}
              </span>
            </div>
          </div>

          {/* Info rapide */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-sans flex items-center gap-1">
                <User className="w-3 h-3" />
                {customer}
              </span>
              {order.table_number && (
                <span className="text-blue-600 font-sans flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Table {order.table_number}
                </span>
              )}
              <span className="text-gray-600 font-sans">
                {totalItems} {totalItems > 1 ? 'articles' : 'article'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-600 text-base">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Body - Items par catégorie - Toujours visible */}
        <div className="p-4 space-y-3 bg-white flex-grow">
            {entries.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase mb-2">
                  <Utensils className="w-4 h-4" /> ENTRÉES
                </div>
                <div className="space-y-2">
                  {entries.map((it, i) => (
                    <div key={`entry-${i}`} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-sm font-bold shadow-md">{it.qty}</span>
                      <span className="flex-1 font-bold text-base text-gray-900">{it.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plats principaux */}
            {plats.length > 0 && (
              <div>
                <div className="space-y-2">
                  {plats.map((it, idx) => (
                    <div key={`plat-${idx}`} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-sm font-bold shadow-md">{it.qty}</span>
                      <span className="flex-1 font-bold text-base text-gray-900">{it.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Afficher les items sans catégorie si aucun plat n'est trouvé */}
            {plats.length === 0 && entries.length === 0 && desserts.length === 0 && (order.parsedItems || []).length > 0 && (
              <div>
                <div className="space-y-2">
                  {(order.parsedItems || []).map((it, idx) => (
                    <div key={`item-${idx}`} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-sm font-bold shadow-md">{it.quantity || 1}</span>
                      <span className="flex-1 font-bold text-base text-gray-900">{it.product_name || it.name || 'Produit'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {desserts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase mb-2">
                  <CakeSlice className="w-4 h-4" /> DESSERTS
                </div>
                <div className="space-y-2">
                  {desserts.map((it, i) => (
                    <div key={`dessert-${i}`} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-purple-50 to-purple-100/50 border-2 border-purple-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-md">{it.qty}</span>
                      <span className="flex-1 font-bold text-base text-gray-900">{it.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        {/* Footer - Action Button avec code couleur - Toujours en bas */}
        <div className={`px-4 pb-4 pt-3 ${statusConfig.bgColor} mt-auto space-y-2`}>
          <div className="flex gap-2">
            {order.status === ORDER_STATUS.PENDING ? (
              <button
                onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.PREPARING)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
              >
                {isProcessing ? 'Chargement...' : 'Prendre en charge'}
              </button>
            ) : order.status === ORDER_STATUS.PREPARING ? (
              <button
                onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.READY)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
              >
                {isProcessing ? 'Chargement...' : 'Terminée'}
              </button>
            ) : order.status === ORDER_STATUS.READY ? (
              <button
                onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.SERVED)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                {isProcessing ? 'Chargement...' : 'Remise'}
              </button>
            ) : (
              <div className="flex-1 text-center py-2">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white ${statusConfig.badgeColor} shadow-md`}>
                  Commande {statusConfig.label.toLowerCase()}
                </span>
              </div>
            )}

            {/* Bouton Annuler - Style professionnel avec gradient */}
            {order.status !== ORDER_STATUS.SERVED && order.status !== ORDER_STATUS.CANCELLED && (
              <button
                onClick={() => handleCancelOrder(order.id)}
                disabled={isProcessing}
                className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                title="Annuler la commande"
              >
                {isProcessing ? '...' : 'Annuler'}
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8 animate-fade-in w-full overflow-x-hidden">
      {/* En-tête amélioré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-black">
            Gestion des Commandes
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle vue Kanban/Grid */}
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'kanban' : 'grid')}
            icon={viewMode === 'grid' ? <Columns className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            title={viewMode === 'grid' ? 'Vue Kanban' : 'Vue Grille'}
          >
            {viewMode === 'grid' ? 'Kanban' : 'Grille'}
          </Button>

          {/* Toggle son */}
          <Button
            variant="outline"
            onClick={() => {
              const newState = !soundEnabled;
              setSoundEnabled(newState);
              soundNotificationManager.setEnabled(newState);
            }}
            icon={soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
          />

          <Button
            variant="outline"
            onClick={() => loadAllOrders()}
            disabled={loading}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Actualiser
          </Button>
        </div>
      </div>


      {/* Statistiques simplifiées */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full max-w-full">
        <Card padding="sm" className="bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 font-sans">Total actives</p>
            <p className="text-xl font-heading font-bold text-black">{stats.total}</p>
          </div>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 font-sans">En attente</p>
            <p className="text-xl font-heading font-bold text-amber-600">{stats.pending}</p>
          </div>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 font-sans">Prendre en charge</p>
            <p className="text-xl font-heading font-bold text-blue-600">{stats.preparing}</p>
          </div>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 font-sans">Terminées</p>
            <p className="text-xl font-heading font-bold text-green-600">{stats.ready}</p>
          </div>
        </Card>
      </div>

      {/* Séparation entre statistiques et commandes */}
      <div className="border-t border-neutral-200 my-6"></div>

      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="w-12 h-12 animate-spin text-black mb-4" />
          <p className="text-neutral-600 font-sans">Chargement...</p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-heading font-bold text-black mb-2">
            Aucune commande active
          </h3>
          <p className="text-neutral-600 font-sans">
            Toutes les commandes sont terminées
          </p>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* Vue Kanban par colonnes */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-full">
          {/* Colonne En attente */}
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border-2 border-red-200 mb-4">
              <h3 className="font-bold text-red-700 text-lg">En attente</h3>
              <p className="text-sm text-red-600">{displayedOrders.filter(o => o.status === ORDER_STATUS.PENDING).length}</p>
            </div>
            {displayedOrders
              .filter(o => o.status === ORDER_STATUS.PENDING)
              .map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>

          {/* Colonne En cours */}
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border-2 border-blue-200 mb-4">
              <h3 className="font-bold text-blue-700 text-lg">En cours</h3>
              <p className="text-sm text-blue-600">{displayedOrders.filter(o => o.status === ORDER_STATUS.PREPARING).length}</p>
            </div>
            {displayedOrders
              .filter(o => o.status === ORDER_STATUS.PREPARING)
              .map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>

          {/* Colonne Terminée */}
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border-2 border-emerald-200 mb-4">
              <h3 className="font-bold text-emerald-700 text-lg">Terminée</h3>
              <p className="text-sm text-emerald-600">{displayedOrders.filter(o => o.status === ORDER_STATUS.READY).length}</p>
            </div>
            {displayedOrders
              .filter(o => o.status === ORDER_STATUS.READY)
              .map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>

          {/* Colonne Remise */}
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border-2 border-slate-200 mb-4">
              <h3 className="font-bold text-slate-700 text-lg">Remise</h3>
              <p className="text-sm text-slate-600">{displayedOrders.filter(o => o.status === ORDER_STATUS.SERVED).length}</p>
            </div>
            {displayedOrders
              .filter(o => o.status === ORDER_STATUS.SERVED)
              .map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>
        </div>
      ) : (
        /* Vue Grille classique */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-full">
          {displayedOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
