import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Package, RefreshCw, Utensils, CakeSlice, 
  User, MapPin, Volume2, VolumeX, LayoutGrid, Columns, History, CheckCircle2
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PaymentWorkflowModal from '../../components/manager/PaymentWorkflowModal';
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
import logger from '../../utils/logger';

/**
 * Gestion des Commandes
 */
const HISTORY_STATUSES = [
  ORDER_STATUS.READY,
  ORDER_STATUS.SERVED,
  ORDER_STATUS.CANCELLED
];

const ManagerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [now, setNow] = useState(new Date());
  const [sortBy] = useState('smart'); // smart, time, total
  const [viewMode, setViewMode] = useState('grid'); // grid, kanban
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentWorkflowState, setPaymentWorkflowState] = useState({ isOpen: false, order: null });
  const { success, error: showError } = useNotifications();
  const previousOrdersRef = useRef([]);
  const wsConnectedRef = useRef(false);
  const { user } = useAuth();

  // Parser les items des commandes
  const parseOrderItems = useCallback((order) => {
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
   }, []);

  const parseOrderPayments = useCallback((order) => {
    if (!order) return [];

    const rawPayments = order.payments ?? order.payment_details ?? order.paymentDetails ?? null;
    const normalize = (payment, index) => {
      if (!payment) return null;
      const amount = parseFloat(payment.amount ?? payment.value ?? payment.total ?? 0) || 0;
      if (amount <= 0) return null;
      return {
        id: payment.id ?? index ?? null,
        method: (payment.method || payment.payment_method || payment.mode || 'cash').toLowerCase(),
        amount,
        reference: payment.reference || payment.note || ''
      };
    };

    if (Array.isArray(rawPayments)) {
      return rawPayments.map((payment, index) => normalize(payment, index)).filter(Boolean);
    }

    if (typeof rawPayments === 'string') {
      try {
        const parsed = JSON.parse(rawPayments);
        if (Array.isArray(parsed)) {
          return parsed.map((payment, index) => normalize(payment, index)).filter(Boolean);
        }
        if (parsed && Array.isArray(parsed.payments)) {
          return parsed.payments.map((payment, index) => normalize(payment, index)).filter(Boolean);
        }
      } catch (error) {
        logger.warn('Impossible de parser payments JSON', error);
      }
    }

    if (rawPayments && Array.isArray(rawPayments.payments)) {
      return rawPayments.payments.map((payment, index) => normalize(payment, index)).filter(Boolean);
    }

    if (order.parsedPayments && Array.isArray(order.parsedPayments)) {
      return order.parsedPayments;
    }

    return [];
  }, []);

  const loadAllOrders = useCallback(async (silent = false, useCache = true) => {
    let timeoutId;
    try {
      if (!silent) setLoading(true);
      
      // Timeout pour éviter un spinner infini si l'API ne répond pas
      const controller = new AbortController();
      const timeoutMs = 6000;
      timeoutId = setTimeout(() => {
        if (controller && typeof controller.abort === 'function') {
          controller.abort();
        }
      }, timeoutMs);
      
      // Vérifier le cache d'abord (CORRECTION: passer les paramètres vides)
      const cacheKey = '/admin/orders';
      if (useCache) {
        const cached = orderCache.get(cacheKey, {});
        if (cached && Array.isArray(cached) && cached.length > 0) {
          logger.debug('📦 [DIAGNOSTIC] Données chargées depuis le cache');
          logger.debug('📦 [DIAGNOSTIC] Cache contient:', cached.length, 'commandes');
          const ordersWithItems = cached.map(order => ({
            ...order,
            parsedItems: parseOrderItems(order),
            parsedPayments: parseOrderPayments(order)
          }));
          logger.debug('📦 [DIAGNOSTIC] Commandes après parsing du cache:', ordersWithItems.length);
          setOrders(ordersWithItems);
          if (!silent) setLoading(false);
          clearTimeout(timeoutId);
          return;
        } else {
          logger.debug('📦 [DIAGNOSTIC] Cache vide ou invalide, chargement depuis l\'API');
        }
      } else {
        logger.debug('📦 [DIAGNOSTIC] Cache désactivé (useCache=false), chargement depuis l\'API');
        // Invalider le cache pour être sûr
        orderCache.invalidate(cacheKey);
      }

      // Utiliser l'endpoint standard (le backend est déjà assoupli en dev)
      logger.debug('🔍 [DIAGNOSTIC] Appel à orderService.getAllOrders...');
      const response = await orderService.getAllOrders({ limit: 100 }, { signal: controller.signal });

      logger.debug('🔍 [DIAGNOSTIC] Réponse reçue:', {
        success: response?.success,
        hasData: !!response?.data,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
        error: response?.error,
        fullResponse: JSON.stringify(response).substring(0, 500)
      });

      // CORRECTION: Vérifier response.success ET que response.data est un tableau non vide
      if (response && response.success === true && Array.isArray(response.data)) {
        logger.debug('✅ [DIAGNOSTIC] response.success = true');
        logger.debug('📊 [DIAGNOSTIC] Nombre de commandes dans response.data:', response.data.length);
        
        if (response.data.length === 0) {
          logger.warn('⚠️ [DIAGNOSTIC] response.data est un tableau vide !');
          setOrders([]);
          if (!silent) setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        const ordersWithItems = response.data.map(order => ({
          ...order,
          parsedItems: parseOrderItems(order),
          parsedPayments: parseOrderPayments(order)
        }));
        
        logger.debug('📦 [DIAGNOSTIC] Commandes après parsing:', ordersWithItems.length);
        // ✅ SÉCURITÉ: Ne pas logger les IDs et numéros de commande (données sensibles)
        logger.debug('📋 [DIAGNOSTIC] Première commande (exemple):', {
          status: ordersWithItems[0]?.status,
          itemsCount: ordersWithItems[0]?.parsedItems?.length || 0
        });
        
        // CORRECTION: S'assurer que setOrders est bien appelé
        logger.debug('🔄 [DIAGNOSTIC] Appel de setOrders avec', ordersWithItems.length, 'commandes');
        setOrders(ordersWithItems);
        logger.debug('✅ [DIAGNOSTIC] setOrders appelé');

        // Mettre en cache seulement si on a des données
        if (ordersWithItems.length > 0) {
          orderCache.set(cacheKey, {}, response.data);
          logger.debug('💾 [DIAGNOSTIC] Données mises en cache:', response.data.length, 'commandes');
        }
      } else {
        logger.error('❌ [DIAGNOSTIC] response.success = false OU response.data invalide');
        logger.error('❌ [DIAGNOSTIC] response:', response);
        logger.error('❌ [DIAGNOSTIC] response.success:', response?.success);
        logger.error('❌ [DIAGNOSTIC] response.data type:', typeof response?.data);
        logger.error('❌ [DIAGNOSTIC] response.data isArray:', Array.isArray(response?.data));
        logger.error('❌ [DIAGNOSTIC] Erreur:', response?.error);
        if (!silent) {
          showError(response?.error || 'Erreur lors du chargement des commandes');
        }
        // Ne pas vider les commandes existantes en cas d'erreur silencieuse
        if (!silent) {
          setOrders([]);
        }
      }
    } catch (error) {
      logger.error('❌ Erreur chargement commandes:', error);
      logger.error('   Type:', error.name);
      logger.error('   Message:', error.message);
      
      if (!silent) {
        // Messages d'erreur plus spécifiques
        let errorMessage = 'Impossible de charger les commandes.';
        
        if (error.name === 'ConnectionError' || error.message.includes('Failed to fetch') || error.message.includes('fetch failed')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 5000.';
        } else if (error.name === 'AbortError') {
          errorMessage = `Le serveur n'a pas répondu sous ${6000/1000}s.`;
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
      // Nettoyer le timeout si encore actif
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [showError, parseOrderItems, parseOrderPayments]);

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
      logger.error('❌ Erreur mise à jour statut:', error);
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
      logger.error('❌ Erreur annulation commande:', error);
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

  // Timer pour l'horloge - séparé pour éviter les re-renders
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(tickInterval);
    };
  }, []); // Pas de dépendances - le timer doit tourner en continu

  // WebSocket pour mises à jour en temps réel
  useEffect(() => {
    logger.debug('🔄 [DIAGNOSTIC] useEffect initial load (sans cache)');
    loadAllOrders(false, false);
  }, [loadAllOrders]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token || !user) {
      logger.debug('⏳ [DIAGNOSTIC] WebSocket non initialisé (token ou user manquant)');
      return;
    }

    // Connecter WebSocket
    orderWebSocketService.connect(token);

    // Écouter les événements
    const handleOrderCreated = (order) => {
      logger.debug('📦 Nouvelle commande reçue via WebSocket:', order);
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
      logger.debug('🔄 Commande mise à jour via WebSocket:', order);
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
      logger.debug('📌 Statut changé via WebSocket:', data);
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
      logger.debug('🔄 Rafraîchissement demandé via WebSocket');
      orderCache.invalidate('/admin/orders');
      loadAllOrders(true, false);
    };

    const handleConnected = () => {
      logger.debug('✅ WebSocket connecté');
      wsConnectedRef.current = true;
    };

    const handleDisconnected = () => {
      logger.debug('❌ WebSocket déconnecté');
      wsConnectedRef.current = false;
    };

    // Abonner aux événements
    orderWebSocketService.on('order:created', handleOrderCreated);
    orderWebSocketService.on('order:updated', handleOrderUpdated);
    orderWebSocketService.on('order:status_changed', handleStatusChanged);
    orderWebSocketService.on('orders:refresh', handleRefresh);
    orderWebSocketService.on('connected', handleConnected);
    orderWebSocketService.on('disconnected', handleDisconnected);

    // Charger les commandes initiales (sans cache pour forcer le chargement)
    logger.debug('🔄 [DIAGNOSTIC] Chargement initial des commandes (sans cache)');
    loadAllOrders(false, false); // silent=false, useCache=false pour forcer le chargement

    // Polling de fallback seulement si WebSocket n'est pas connecté (toutes les 30 secondes)
    const pollInterval = setInterval(() => {
      if (!wsConnectedRef.current) {
        logger.debug('⚠️ WebSocket non connecté, utilisation du polling de fallback');
        loadAllOrders(true, false);
      }
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      orderWebSocketService.off('order:created', handleOrderCreated);
      orderWebSocketService.off('order:updated', handleOrderUpdated);
      orderWebSocketService.off('order:status_changed', handleStatusChanged);
      orderWebSocketService.off('orders:refresh', handleRefresh);
      orderWebSocketService.off('connected', handleConnected);
      orderWebSocketService.off('disconnected', handleDisconnected);
      orderWebSocketService.disconnect();
    };
  }, [loadAllOrders, user, soundEnabled, success, parseOrderItems]);

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

  // Filtrage (diagnostic) : ne rien exclure pour voir TOUTES les commandes
  const filterAndSearch = useCallback((orderList) => orderList, []);

  const activeOrders = useMemo(() => {
    return orders.filter(order => !HISTORY_STATUSES.includes(order.status));
  }, [orders]);

  // Filtrer et trier toutes les commandes actives uniquement
  const displayedOrders = useMemo(() => {
    logger.debug('🔍 [DIAGNOSTIC] displayedOrders - orders.length:', activeOrders.length);
    const filtered = filterAndSearch(activeOrders);
    logger.debug('🔍 [DIAGNOSTIC] displayedOrders - après filterAndSearch:', filtered.length);
    const sorted = smartSort(filtered);
    logger.debug('🔍 [DIAGNOSTIC] displayedOrders - après smartSort:', sorted.length);
    return sorted;
  }, [activeOrders, filterAndSearch, smartSort]);

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
    total: activeOrders.length,
    pending: activeOrders.filter(o => o.status === ORDER_STATUS.PENDING).length,
    preparing: activeOrders.filter(o => o.status === ORDER_STATUS.PREPARING).length,
    ready: orders.filter(o => o.status === ORDER_STATUS.READY).length,
    revenue: orders
      .filter(o => o.status !== ORDER_STATUS.CANCELLED)
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
  };

  const historyOrders = useMemo(() => {
    const readyOrders = orders.filter(o => HISTORY_STATUSES.includes(o.status));
    return readyOrders.sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });
  }, [orders]);

  const paymentWorkflowOrder = paymentWorkflowState.order;
  const isPaymentWorkflowOpen = paymentWorkflowState.isOpen;

  const handlePaymentWorkflowClose = useCallback((updatedOrder = null) => {
    setPaymentWorkflowState({ isOpen: false, order: null });

    if (updatedOrder && updatedOrder.id) {
      const normalizedPaymentStatus = (updatedOrder.payment_status || '').toString().toLowerCase();
      const isPaidFlag = ['completed', 'paid', 'completed_payment'].includes(normalizedPaymentStatus);
      setOrders(prev => prev.map(order =>
        order.id === updatedOrder.id
          ? {
              ...order,
              ...updatedOrder,
              parsedItems: parseOrderItems(updatedOrder),
              parsedPayments: parseOrderPayments(updatedOrder),
              is_paid: isPaidFlag,
              paymentStatus: updatedOrder.payment_status || order.paymentStatus,
              paymentMethod: updatedOrder.payment_method || order.paymentMethod
            }
          : order
      ));
      orderCache.invalidate('/admin/orders');
    }
  }, [parseOrderItems, parseOrderPayments]);

  const handlePaymentWorkflowSubmit = useCallback(async (payload) => {
    if (!paymentWorkflowOrder) {
      return { success: false, error: 'Commande introuvable pour le paiement.' };
    }

    try {
      setProcessingOrderId(paymentWorkflowOrder.id);

      const response = await orderService.completePaymentWorkflow(paymentWorkflowOrder.id, payload);

      if (!response.success) {
        throw new Error(response.error || "Erreur lors de l'enregistrement du paiement");
      }

      const updatedOrderRaw = response.data || {};
      const updatedOrder = {
        ...paymentWorkflowOrder,
        ...updatedOrderRaw,
        parsedItems: parseOrderItems(updatedOrderRaw),
        parsedPayments: parseOrderPayments(updatedOrderRaw)
      };

      const normalizedPaymentStatus = (updatedOrder.payment_status || updatedOrderRaw.payment_status || '').toString().toLowerCase();
      const isPaidFlag = ['completed', 'paid', 'completed_payment'].includes(normalizedPaymentStatus);

      updatedOrder.is_paid = isPaidFlag;
      updatedOrder.paymentStatus = updatedOrder.payment_status || updatedOrderRaw.payment_status || paymentWorkflowOrder.payment_status;
      updatedOrder.paymentMethod = updatedOrder.payment_method || updatedOrderRaw.payment_method || paymentWorkflowOrder.payment_method;

      setOrders(prev => prev.map(order =>
        order.id === updatedOrder.id ? updatedOrder : order
      ));

      orderCache.invalidate('/admin/orders');
      success('Paiements enregistrés et commande mise à jour');

      return { success: true, updatedOrder };
    } catch (error) {
      logger.error('❌ Erreur workflow paiement:', error);
      showError(error.message || "Impossible d'enregistrer le paiement");
      return { success: false, error: error.message };
    } finally {
      setProcessingOrderId(null);
    }
  }, [paymentWorkflowOrder, parseOrderItems, parseOrderPayments, success, showError]);

  const handleTakeInChargeRequest = useCallback(async (order, isPaid) => {
    if (!order) return;

    if (isPaid) {
      await handleStatusUpdate(order.id, ORDER_STATUS.PREPARING);
      return;
    }

    setPaymentWorkflowState({ isOpen: true, order });
  }, [handleStatusUpdate]);

  // Format timer elapsed time - s'arrête quand la commande est terminée
  const formatElapsed = (createdAt, status, completedAt = null) => {
    const start = new Date(createdAt);
    // Pour les commandes terminées, utiliser la date de fin au lieu de maintenant
    const endDate = (status === ORDER_STATUS.READY || status === ORDER_STATUS.SERVED || status === ORDER_STATUS.CANCELLED) && completedAt
      ? new Date(completedAt)
      : now;
    const diff = Math.max(0, Math.floor((endDate - start) / 1000));
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
  const OrderCard = ({ order, onTakeInCharge }) => {
    const statusConfig = getStatusConfig(order.status);
    const typeBadge = getTypeBadge(order.order_type);
    const { entries, plats, desserts } = getItemsByCategory(order.parsedItems || []);
    const elapsed = formatElapsed(order.created_at, order.status, order.completed_at || order.updated_at);
    const customer = order.table_number ? `Table ${order.table_number}` : 
                     (order.first_name ? `${order.first_name} ${order.last_name || ''}`.trim() : 'Client');
    const isProcessing = processingOrderId === order.id;
    const totalItems = (order.parsedItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
    const paymentStatus = order.payment_status || order.paymentStatus || (order.is_paid ? 'completed' : 'pending');
    const isPaid = paymentStatus === 'completed' || paymentStatus === 'paid' || paymentStatus === 'completed_payment' || order.is_paid === true || order.is_paid === 1;

    const handleTakeInCharge = () => {
      if (onTakeInCharge) {
        onTakeInCharge(order, isPaid);
      }
    };

    return (
      <Card 
        padding="none" 
        className={`mb-4 overflow-hidden ${statusConfig.borderWidth} ${statusConfig.borderColor} transition-all shadow-lg ${statusConfig.shadowColor} hover:shadow-2xl hover:scale-[1.02] flex flex-col max-w-full`}
        style={{ minHeight: 'auto', height: 'fit-content' }}
      >
        {/* Header avec code couleur amélioré - Style professionnel */}
        <div className={`p-4 ${statusConfig.headerBg} border-b-2 ${statusConfig.borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`px-4 py-1.5 rounded-lg text-sm font-bold text-white ${statusConfig.badgeColor} shadow-lg`}>
              {statusConfig.vignetteLabel}
            </span>
            <span className="block font-bold text-[1.3rem] text-black font-mono text-center flex-1">
              {formatOrderNumber(order.order_number, order.id)}
            </span>
            <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-bold text-white ${typeBadge.color} shadow-md hover:shadow-lg transition-shadow`}>
              {typeBadge.label}
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${statusConfig.textColor} tracking-wide font-mono`}>{elapsed}</span>
            </div>
            <div className={`relative flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-200 ${isPaid ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]' : 'bg-red-100 border-red-300'}`}>
              <span className={`text-2xl font-bold ${isPaid ? 'text-white' : 'text-red-600'}`}>€</span>
              {!isPaid && (
                <span className="absolute w-11 h-[2px] bg-red-500 rotate-45"></span>
              )}
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
                onClick={handleTakeInCharge}
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
            ) : (
              <div className="flex-1 text-center py-2">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white ${statusConfig.badgeColor} shadow-md`}>
                  Commande {statusConfig.label.toLowerCase()}
                </span>
              </div>
            )}

            {/* Bouton Annuler - Style professionnel avec gradient */}
            {order.status !== ORDER_STATUS.SERVED && order.status !== ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.READY && (
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
        
        {/* Bouton Actualiser avec forçage du rechargement sans cache */}
        <Button
          variant="outline"
          onClick={() => {
            logger.debug('🔄 [DIAGNOSTIC] Rechargement forcé sans cache');
            orderCache.invalidate('/admin/orders');
            loadAllOrders(false, false); // silent=false, useCache=false
          }}
          title="Recharger sans cache"
        >
          Actualiser
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowHistory((prev) => !prev)}
        >
          {showHistory ? 'Masquer historique' : 'Historique'}
        </Button>
      </div>
      </div>
      
      {/* Debug affichage brut des commandes - DÉSACTIVÉ pour l'affichage normal */}
      {/* 
      <div className="mt-2 p-3 rounded-lg border border-neutral-200 bg-white">
        <p className="text-sm text-neutral-700 font-sans">
          Commandes récupérées: <span className="font-semibold">{orders?.length || 0}</span>
        </p>
        {(orders?.length || 0) > 0 && (
          <pre className="mt-2 max-h-48 overflow-auto text-xs bg-neutral-50 p-2 rounded">
{JSON.stringify(
  orders.slice(0, 5).map(o => ({
    id: o.id,
    number: o.order_number || o.orderNumber || o.number || null,
    status: o.status || null,
    items: Array.isArray(o.items) ? o.items.length : 0,
    payments: Array.isArray(o.payments) ? o.payments.length : 0
  })), 
  null, 
  2
) }
          </pre>
        )}
      </div>
      */}

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

    {showHistory ? (
      <div className="mt-6 space-y-4">
        <div className="border-t border-neutral-200 pt-6"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-black">Historique des commandes terminées</h2>
            <p className="text-sm text-neutral-600 font-sans">Commandes marquées comme terminées (plus récentes en premier)</p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> {historyOrders.length} commande{historyOrders.length > 1 ? 's' : ''}
          </span>
        </div>

        {loading && historyOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 animate-spin text-black mb-4" />
            <p className="text-neutral-600 font-sans">Chargement...</p>
          </div>
        ) : historyOrders.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-heading font-bold text-black mb-1">Aucune commande terminée</h3>
            <p className="text-neutral-600 font-sans">Les commandes terminées apparaîtront ici.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
            {historyOrders.map(order => (
              <OrderCard key={`history-${order.id}`} order={order} onTakeInCharge={handleTakeInChargeRequest} />
            ))}
              </div>
        )}
      </div>
    ) : (
      loading && activeOrders.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
          {/* Colonne En attente */}
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border-2 border-red-200 mb-4">
              <h3 className="font-bold text-red-700 text-lg">En attente</h3>
              <p className="text-sm text-red-600">{displayedOrders.filter(o => o.status === ORDER_STATUS.PENDING).length}</p>
                      </div>
            {displayedOrders
              .filter(o => o.status === ORDER_STATUS.PENDING)
              .map(order => (
                <OrderCard key={order.id} order={order} onTakeInCharge={handleTakeInChargeRequest} />
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
                <OrderCard key={order.id} order={order} onTakeInCharge={handleTakeInChargeRequest} />
              ))}
                  </div>
                </div>
      ) : (
        /* Vue Grille classique */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-full">
          {displayedOrders.map(order => (
            <OrderCard key={order.id} order={order} onTakeInCharge={handleTakeInChargeRequest} />
          ))}
                                  </div>
      )
    )}
    <PaymentWorkflowModal
      isOpen={isPaymentWorkflowOpen}
      order={paymentWorkflowOrder}
      onClose={handlePaymentWorkflowClose}
      onSubmit={handlePaymentWorkflowSubmit}
    />
    </div>
  );
};

export default ManagerDashboard;
