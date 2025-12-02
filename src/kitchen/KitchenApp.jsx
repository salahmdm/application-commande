import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, CheckCircle2, Clock, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import orderService from '../services/orderService';
import { formatPrice } from '../constants/pricing';
import {
  ORDER_STATUS,
  getStatusLabel,
} from '../constants/orderStatuses';
import { formatOrderNumber } from '../utils/orderHelpers';
import orderWebSocketService from '../services/orderWebSocketService';
import orderCache from '../utils/orderCache';
import logger from '../utils/logger';
import KitchenOrderCard from './components/KitchenOrderCard';
import './styles/kitchen.css';

/**
 * Application Écran de Cuisine
 * Affiche les commandes en temps réel pour la cuisine
 */
function KitchenApp() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [now, setNow] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false); // Afficher/masquer les commandes terminées
  const wsConnectedRef = useRef(false);
  const containerRef = useRef(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  // Parser les items des commandes
  const parseOrderItems = useCallback((order) => {
    if (!order) return [];
    
    if (Array.isArray(order.parsedItems) && order.parsedItems.length > 0) {
      return order.parsedItems;
    }
    
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    
    if (order.items && typeof order.items === 'string' && order.items.trim()) {
      try {
        const parsed = JSON.parse(order.items);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        logger.warn('⚠️ Erreur parsing JSON:', err.message);
      }
    }
    
    if (Array.isArray(order.order_items) && order.order_items.length > 0) {
      return order.order_items;
    }
    
    return [];
  }, []);

  // Charger toutes les commandes
  const loadAllOrders = useCallback(async (silent = false, useCache = true) => {
    let timeoutId;
    try {
      if (!silent) setLoading(true);
      
      const controller = new AbortController();
      const timeoutMs = 6000;
      timeoutId = setTimeout(() => {
        if (controller && typeof controller.abort === 'function') {
          controller.abort();
        }
      }, timeoutMs);
      
      // Pour l'écran de cuisine, on ne veut PAS utiliser le cache pour garantir les données à jour
      // Toujours forcer le rechargement depuis le serveur
      const cacheKey = '/admin/orders';
      orderCache.invalidate(cacheKey); // Toujours invalider le cache pour l'écran de cuisine

      logger.debug('🔍 Appel à orderService.getAllOrders...');
      const response = await orderService.getAllOrders({ limit: 100 }, { signal: controller.signal });

      if (response && response.success === true && Array.isArray(response.data)) {
        logger.debug('✅ Commandes récupérées:', response.data.length);
        
        const ordersWithItems = response.data.map(order => ({
          ...order,
          parsedItems: parseOrderItems(order)
        }));
        
        setOrders(ordersWithItems);

        // Ne pas mettre en cache pour l'écran de cuisine - on veut toujours les données les plus récentes
        // orderCache.set(cacheKey, {}, response.data); // Désactivé pour l'écran de cuisine
      } else {
        logger.error('❌ Erreur lors du chargement des commandes');
        if (!silent) {
          setOrders([]);
        }
      }
    } catch (error) {
      logger.error('❌ Erreur chargement commandes:', error);
      if (!silent) {
        setOrders([]);
      }
    } finally {
      if (!silent) setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [parseOrderItems]);

  // Mettre à jour le statut d'une commande
  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      setProcessingOrderId(orderId);
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      
      if (response.success) {
        setOrders(prevOrders => prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        orderCache.invalidate('/admin/orders');
      } else {
        throw new Error(response.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      logger.error('❌ Erreur mise à jour statut:', error);
    } finally {
      setProcessingOrderId(null);
    }
  }, []);

  // Timer pour l'horloge
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(tickInterval);
    };
  }, []);

  // Chargement initial
  useEffect(() => {
    logger.debug('🔄 Chargement initial des commandes');
    loadAllOrders(false, false);
  }, [loadAllOrders]);

  // WebSocket pour mises à jour en temps réel
  useEffect(() => {
    // Authentification automatique pour l'écran de cuisine
    const authenticateKitchen = async () => {
      try {
        // Utiliser un token d'authentification si disponible, sinon essayer sans token
        const token = localStorage.getItem('token');
        // Toujours essayer de se connecter, même sans token (pour l'écran de cuisine public)
        orderWebSocketService.connect(token || null);
        logger.debug('🔄 Tentative de connexion WebSocket pour l\'écran de cuisine');
      } catch (error) {
        logger.error('❌ Erreur authentification cuisine:', error);
      }
    };

    authenticateKitchen();

    // Écouter les événements - Rafraîchissement automatique sans intervention
    const handleOrderCreated = (order) => {
      logger.debug('📦 Nouvelle commande reçue via WebSocket - Actualisation automatique:', order);
      // Invalider le cache et recharger immédiatement toutes les commandes
      orderCache.invalidate('/admin/orders');
      loadAllOrders(true, false); // Rechargement automatique silencieux
    };

    const handleOrderUpdated = (order) => {
      logger.debug('🔄 Commande mise à jour via WebSocket - Actualisation automatique:', order);
      // Mettre à jour la commande dans le state et recharger pour être sûr
      setOrders(prevOrders => {
        const updated = prevOrders.map(o => 
          o.id === order.id ? { ...order, parsedItems: parseOrderItems(order) } : o
        );
        if (!updated.find(o => o.id === order.id)) {
          return [...updated, { ...order, parsedItems: parseOrderItems(order) }];
        }
        return updated;
      });
      orderCache.invalidate('/admin/orders');
      // Recharger aussi pour s'assurer que tout est à jour
      loadAllOrders(true, false); // Rechargement automatique silencieux
    };

    const handleStatusChanged = (data) => {
      logger.debug('📌 Statut changé via WebSocket - Actualisation automatique:', data);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.orderId ? { ...order, status: data.status } : order
        )
      );
      orderCache.invalidate('/admin/orders');
      // Recharger pour s'assurer que les changements de statut sont bien reflétés
      loadAllOrders(true, false); // Rechargement automatique silencieux
    };

    const handleRefresh = () => {
      logger.debug('🔄 Rafraîchissement demandé via WebSocket - Actualisation automatique');
      orderCache.invalidate('/admin/orders');
      loadAllOrders(true, false); // Rechargement automatique silencieux
    };

    const handleConnected = () => {
      logger.debug('✅ WebSocket connecté - Actualisation automatique activée');
      wsConnectedRef.current = true;
      // Recharger les commandes une fois connecté pour être sûr d'avoir les dernières
      loadAllOrders(true, false); // Rechargement automatique silencieux
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

    // POLLING AUTOMATIQUE GARANTI - Fonctionne TOUJOURS, même si WebSocket est connecté
    // C'est le système principal de rafraîchissement automatique
    const pollInterval = setInterval(() => {
      logger.debug('🔄 Actualisation automatique des commandes (3s)');
      loadAllOrders(true, false); // Actualisation automatique silencieuse
    }, 3000); // Toutes les 3 secondes pour un rafraîchissement très réactif
    
    // Polling de fallback si WebSocket n'est pas connecté (plus fréquent)
    const pollIntervalFallback = setInterval(() => {
      if (!wsConnectedRef.current) {
        logger.debug('⚠️ WebSocket non connecté, actualisation automatique via polling (2s)');
        loadAllOrders(true, false); // Actualisation automatique silencieuse
      }
    }, 2000); // Toutes les 2 secondes si WebSocket n'est pas connecté

    return () => {
      clearInterval(pollInterval);
      clearInterval(pollIntervalFallback);
      orderWebSocketService.off('order:created', handleOrderCreated);
      orderWebSocketService.off('order:updated', handleOrderUpdated);
      orderWebSocketService.off('order:status_changed', handleStatusChanged);
      orderWebSocketService.off('orders:refresh', handleRefresh);
      orderWebSocketService.off('connected', handleConnected);
      orderWebSocketService.off('disconnected', handleDisconnected);
      orderWebSocketService.disconnect();
    };
  }, [loadAllOrders, parseOrderItems]);

  // Configuration des couleurs par statut
  const getStatusConfig = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return {
          label: 'En attente',
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50',
          badgeColor: 'bg-red-600',
          textColor: 'text-red-800',
          priority: 1
        };
      case ORDER_STATUS.PREPARING:
        return {
          label: 'En cours',
          borderColor: 'border-blue-600',
          bgColor: 'bg-blue-50',
          badgeColor: 'bg-blue-600',
          textColor: 'text-blue-800',
          priority: 1
        };
      case ORDER_STATUS.READY:
        return {
          label: 'Terminée',
          borderColor: 'border-emerald-600',
          bgColor: 'bg-emerald-50',
          badgeColor: 'bg-emerald-600',
          textColor: 'text-emerald-800',
          priority: 2
        };
      default:
        return {
          label: getStatusLabel(status),
          borderColor: 'border-gray-400',
          bgColor: 'bg-gray-50',
          badgeColor: 'bg-gray-500',
          textColor: 'text-gray-700',
          priority: 5
        };
    }
  };

  // Calculer le temps écoulé en millisecondes pour une commande
  const getElapsedTimeMs = useCallback((order) => {
    if (!order.created_at) return 0;
    const created = new Date(order.created_at);
    return now.getTime() - created.getTime();
  }, [now]);

  // Filtrer les commandes selon le mode d'affichage
  const filteredOrders = useMemo(() => {
    if (showCompleted) {
      // Afficher uniquement les commandes terminées (statut READY)
      return orders.filter(order => 
        order.status === ORDER_STATUS.READY
      );
    } else {
      // Par défaut : seulement les commandes actives (en attente ou en cours)
      return orders.filter(order => 
        order.status === ORDER_STATUS.PENDING || 
        order.status === ORDER_STATUS.PREPARING
      );
    }
  }, [orders, showCompleted]);

  // Trier les commandes par temps écoulé décroissant (plus ancienne à gauche)
  const displayedOrders = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => {
      const aElapsed = getElapsedTimeMs(a);
      const bElapsed = getElapsedTimeMs(b);
      // Tri décroissant : la commande avec le plus de temps écoulé en premier (à gauche)
      return bElapsed - aElapsed;
    });
    
    return sorted;
  }, [filteredOrders, getElapsedTimeMs]);

  // Fonction pour diviser un ticket en plusieurs parties si nécessaire
  const splitOrderIntoParts = useCallback((order, maxItemsPerPart) => {
    const orderItems = order.parsedItems || order.items || [];
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return [{ order, itemsToShow: [], isContinuation: false, isLastPart: true }];
    }

    // Si le ticket a moins d'items que le maximum, pas besoin de diviser
    if (orderItems.length <= maxItemsPerPart) {
      return [{ order, itemsToShow: orderItems, isContinuation: false, isLastPart: true }];
    }

    // Diviser les items en plusieurs parties
    const parts = [];
    const totalParts = Math.ceil(orderItems.length / maxItemsPerPart);
    for (let i = 0; i < orderItems.length; i += maxItemsPerPart) {
      const itemsPart = orderItems.slice(i, i + maxItemsPerPart);
      const partIndex = Math.floor(i / maxItemsPerPart);
      parts.push({
        order,
        itemsToShow: itemsPart,
        isContinuation: i > 0,
        startItemIndex: i,
        isLastPart: partIndex === totalParts - 1 // Dernière partie
      });
    }

    return parts;
  }, []);

  // Nouveau système : une seule rangée horizontale de tickets (avec division si trop longs)
  const orderParts = useMemo(() => {
    if (displayedOrders.length === 0) {
      return [];
    }

    const MAX_ITEMS_PER_PART = 10; // Limite simple et robuste pour couper les tickets trop longs
    const parts = [];

    for (let i = 0; i < displayedOrders.length; i++) {
      const order = displayedOrders[i];
      const orderPartsForTicket = splitOrderIntoParts(order, MAX_ITEMS_PER_PART);
      parts.push(...orderPartsForTicket);
    }

    return parts;
  }, [displayedOrders, splitOrderIntoParts]);

  // Détecter la position du scroll pour afficher les indicateurs visuels
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollIndicators = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // Tolérance de 5px pour gérer les arrondis et les problèmes de précision
      const tolerance = 5;
      const maxScrollLeft = scrollWidth - clientWidth;
      
      // Afficher la flèche gauche si on peut scroller vers la gauche (on n'est pas au début)
      const canScrollLeft = scrollLeft > tolerance;
      
      // Afficher la flèche droite si on peut scroller vers la droite (on n'est pas à la fin)
      const canScrollRight = scrollLeft < maxScrollLeft - tolerance;
      
      setShowLeftIndicator(canScrollLeft);
      setShowRightIndicator(canScrollRight);
    };

    // Vérifier au chargement et après chaque changement de contenu
    updateScrollIndicators();
    container.addEventListener('scroll', updateScrollIndicators);
    
    // Observer les changements de taille du contenu
    const resizeObserver = new ResizeObserver(() => {
      updateScrollIndicators();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateScrollIndicators);
      resizeObserver.disconnect();
    };
  }, [orderParts]); // Re-vérifier quand les commandes changent

  // Statistiques
  const activeOrders = useMemo(() => {
    return orders.filter(order => 
      order.status !== ORDER_STATUS.CANCELLED && 
      order.status !== ORDER_STATUS.SERVED
    );
  }, [orders]);

  const stats = {
    total: activeOrders.length,
    pending: activeOrders.filter(o => o.status === ORDER_STATUS.PENDING).length,
    preparing: activeOrders.filter(o => o.status === ORDER_STATUS.PREPARING).length,
    ready: activeOrders.filter(o => o.status === ORDER_STATUS.READY).length,
    completed: orders.filter(o => o.status === ORDER_STATUS.READY || o.status === ORDER_STATUS.SERVED).length,
  };

  return (
    <div className="kitchen-app">
      {/* Header */}
      <header className="kitchen-header">
        <div className="kitchen-header-content">
          <div className="kitchen-header-left">
            <h1 className="kitchen-title">
              <Utensils className="kitchen-title-icon" />
              Écran de Cuisine
            </h1>
            <div className="kitchen-time">
              {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
          
          <div className="kitchen-header-right">
            <div className="kitchen-stats">
              <div className="kitchen-stat">
                <span className="kitchen-stat-label">Total:</span>
                <span className="kitchen-stat-value">{stats.total}</span>
              </div>
              <div className="kitchen-stat kitchen-stat-pending">
                <span className="kitchen-stat-label">En attente:</span>
                <span className="kitchen-stat-value">{stats.pending}</span>
              </div>
              <div className="kitchen-stat kitchen-stat-preparing">
                <span className="kitchen-stat-label">En cours:</span>
                <span className="kitchen-stat-value">{stats.preparing}</span>
              </div>
              <div className="kitchen-stat kitchen-stat-ready">
                <span className="kitchen-stat-label">Terminées:</span>
                <span className="kitchen-stat-value">{stats.ready}</span>
              </div>
            </div>
            
            <div className="kitchen-header-actions">
              {/* Bouton pour afficher/masquer les commandes archivées */}
            <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`kitchen-action-btn ${showCompleted ? 'kitchen-action-btn-active' : ''}`}
                title={showCompleted ? 'Masquer les archives' : 'Afficher les archives'}
              >
                <span>Archives</span>
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="kitchen-main">
        {loading && orders.length === 0 ? (
          <div className="kitchen-loading">
            <RefreshCw className="kitchen-loading-icon spinning" />
            <p>Chargement des commandes...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="kitchen-empty">
            <Clock className="kitchen-empty-icon" />
            <p>{showCompleted ? 'Aucune commande disponible' : 'Aucune commande en cours'}</p>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="kitchen-orders-container"
            style={{ position: 'relative' }}
          >
            {/* Flèche gauche - Indicateur de scroll */}
            {showLeftIndicator && (
              <button
                className="kitchen-scroll-indicator kitchen-scroll-indicator-left visible"
                onClick={() => {
                  if (containerRef.current) {
                    containerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                  }
                }}
                aria-label="Scroller vers la gauche"
              >
                <ChevronLeft size={28} strokeWidth={3} />
              </button>
            )}

            {/* Flèche droite - Indicateur de scroll */}
            {showRightIndicator && (
              <button
                className="kitchen-scroll-indicator kitchen-scroll-indicator-right visible"
                onClick={() => {
                  if (containerRef.current) {
                    containerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                  }
                }}
                aria-label="Scroller vers la droite"
              >
                <ChevronRight size={28} strokeWidth={3} />
              </button>
            )}

            {/* Nouvelle disposition : une commande par colonne, défilable horizontalement de droite à gauche */}
            {orderParts.map((orderPart) => (
              <KitchenOrderCard
                key={`${orderPart.order.id}-part-${orderPart.startItemIndex || 0}`}
                order={orderPart.order}
                itemsToShow={orderPart.itemsToShow}
                isContinuation={orderPart.isContinuation}
                startItemIndex={orderPart.startItemIndex || 0}
                isLastPart={orderPart.isLastPart}
                onStatusUpdate={handleStatusUpdate}
                processingOrderId={processingOrderId}
                getStatusConfig={getStatusConfig}
                now={now}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default KitchenApp;

