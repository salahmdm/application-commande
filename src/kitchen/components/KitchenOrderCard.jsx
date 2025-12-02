import React from 'react';
import { CheckCircle2, Clock, Play, AlertTriangle } from 'lucide-react';
import { formatPrice } from '../../constants/pricing';
import { formatOrderNumber, getOrderTypeLabel } from '../../utils/orderHelpers';
import { ORDER_STATUS } from '../../constants/orderStatuses';

/**
 * Carte de commande pour l'écran de cuisine
 * Affiche les informations essentielles d'une commande avec possibilité de changer le statut
 * @param {Object} order - La commande à afficher
 * @param {Function} onStatusUpdate - Fonction pour mettre à jour le statut
 * @param {string} processingOrderId - ID de la commande en cours de traitement
 * @param {Function} getStatusConfig - Fonction pour obtenir la config du statut
 * @param {Date} now - Date actuelle pour le chronomètre
 * @param {boolean} isContinuation - Si true, n'affiche que les items (sans header)
 * @param {Array} itemsToShow - Items spécifiques à afficher (pour division)
 * @param {number} startItemIndex - Index de départ pour les items (pour affichage de continuation)
 * @param {boolean} isLastPart - Si true, c'est la dernière partie du ticket (affiche le bouton)
 */
function KitchenOrderCard({ 
  order, 
  onStatusUpdate, 
  processingOrderId, 
  getStatusConfig, 
  now = new Date(),
  isContinuation = false,
  itemsToShow = null,
  // eslint-disable-next-line no-unused-vars
  startItemIndex = 0, // Utilisé uniquement dans la clé du composant parent
  isLastPart = true
}) {
  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const isProcessing = processingOrderId === order.id;
  
  // Convertir les classes Tailwind en couleurs hexadécimales pour les styles inline
  const getBadgeColorHex = (badgeColorClass) => {
    if (badgeColorClass.includes('red')) return '#dc2626';
    if (badgeColorClass.includes('blue')) return '#2563eb';
    if (badgeColorClass.includes('emerald')) return '#059669';
    if (badgeColorClass.includes('green')) return '#16a34a';
    return '#6b7280'; // gray par défaut
  };

  const badgeColorHex = getBadgeColorHex(statusConfig.badgeColor);
  
  // Déterminer si la commande est payée
  const paymentStatus = order.payment_status || order.paymentStatus || (order.is_paid ? 'completed' : 'pending');
  const isPaid = paymentStatus === 'completed' || paymentStatus === 'paid' || paymentStatus === 'completed_payment' || order.is_paid === true || order.is_paid === 1;
  
  // Parser les items
  const allOrderItems = order.parsedItems || order.items || [];
  // Utiliser itemsToShow si fourni, sinon utiliser tous les items
  const orderItems = itemsToShow || allOrderItems;
  const totalItems = Array.isArray(allOrderItems) 
    ? allOrderItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : 0;

  // Calculer le temps écoulé au format HH:MM:SS
  const getElapsedTime = () => {
    if (!order.created_at) return '00:00:00';
    
    try {
      // Parser la date de création en forçant l'interprétation UTC si pas de timezone
      let created;
      if (typeof order.created_at === 'string') {
        // Si la string a déjà un timezone (Z, +, ou - après la date), l'utiliser tel quel
        if (order.created_at.endsWith('Z') || order.created_at.match(/[+-]\d{2}:\d{2}$/)) {
          created = new Date(order.created_at);
        } else {
          // Si pas de timezone, traiter comme UTC en ajoutant 'Z'
          // Format attendu: "2024-01-01 12:00:00" ou "2024-01-01T12:00:00"
          const dateStr = order.created_at.replace(' ', 'T');
          created = new Date(dateStr + (dateStr.includes('T') && !dateStr.includes('Z') ? 'Z' : ''));
        }
      } else {
        created = new Date(order.created_at);
      }
      
      const currentTime = now instanceof Date ? now : new Date(now);
      
      // Vérifier que les dates sont valides
      if (isNaN(created.getTime()) || isNaN(currentTime.getTime())) {
        return '00:00:00';
      }
      
      // Utiliser getTime() qui retourne toujours des millisecondes UTC depuis l'epoch
      const createdTime = created.getTime();
      const currentTimeMs = currentTime.getTime();
      let diffMs = currentTimeMs - createdTime;
      
      // Si la différence est négative, c'est probablement un problème de timezone
      // Dans ce cas, on ajuste en supposant que created_at est en UTC mais a été interprété en local
      if (diffMs < 0) {
        // Réessayer en forçant l'interprétation UTC
        if (typeof order.created_at === 'string' && !order.created_at.endsWith('Z')) {
          const dateStr = order.created_at.replace(' ', 'T');
          const createdUTC = new Date(dateStr + 'Z');
          if (!isNaN(createdUTC.getTime())) {
            diffMs = currentTimeMs - createdUTC.getTime();
          }
        }
        
        // Si toujours négatif, retourner 00:00:00
        if (diffMs < 0) {
          return '00:00:00';
        }
      }
      
      // Si la différence est très petite (< 3 secondes), retourner 00:00:00
      // Cela permet d'éviter les problèmes d'arrondi et de timezone
      if (diffMs < 3000) {
        return '00:00:00';
      }
      
      const diff = Math.floor(diffMs / 1000); // en secondes
      
      // Calculer heures, minutes et secondes
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      // Formater avec des zéros devant si nécessaire (00:00:00)
      const formatNumber = (num) => String(num).padStart(2, '0');
      
      return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
    } catch (error) {
      console.error('Erreur calcul temps écoulé:', error, {
        created_at: order.created_at,
        order_id: order.id
      });
      return '00:00:00';
    }
  };

  // Gérer le changement de statut
  const handleStatusChange = (newStatus) => {
    if (onStatusUpdate && !isProcessing) {
      onStatusUpdate(order.id, newStatus);
    }
  };

  // Déterminer le prochain statut dans le cycle (tolérant aux variations de casse)
  const getNextStatus = () => {
    const status = String(order.status || '').toLowerCase();
    
    if (status === ORDER_STATUS.PENDING.toLowerCase() || status === 'pending') {
      return ORDER_STATUS.PREPARING;
    }
    if (status === ORDER_STATUS.PREPARING.toLowerCase() || status === 'preparing') {
      return ORDER_STATUS.READY;
    }
    if (status === ORDER_STATUS.READY.toLowerCase() || status === 'ready') {
      return ORDER_STATUS.SERVED;
    }
    
    // Si déjà SERVED ou CANCELLED, ne peut plus changer
    return null;
  };

  // Obtenir le texte du bouton selon le statut actuel
  const getButtonText = () => {
    const status = String(order.status || '').toLowerCase();
    
    if (status === ORDER_STATUS.PENDING.toLowerCase() || status === 'pending') {
      return 'COMMENCER';
    }
    if (status === ORDER_STATUS.PREPARING.toLowerCase() || status === 'preparing') {
      return 'COMMANDE TERMINÉE';
    }
    if (status === ORDER_STATUS.READY.toLowerCase() || status === 'ready') {
      return 'Marquer comme servie';
    }
    
    return 'Changer le statut';
  };

  // Obtenir l'icône du bouton selon le statut actuel
  const getButtonIcon = () => {
    const status = String(order.status || '').toLowerCase();
    
    if (status === ORDER_STATUS.PENDING.toLowerCase() || status === 'pending') {
      return <Play style={{ width: '1rem', height: '1rem' }} />;
    }
    if (status === ORDER_STATUS.PREPARING.toLowerCase() || status === 'preparing') {
      return <CheckCircle2 style={{ width: '1rem', height: '1rem' }} />;
    }
    if (status === ORDER_STATUS.READY.toLowerCase() || status === 'ready') {
      return <CheckCircle2 style={{ width: '1rem', height: '1rem' }} />;
    }
    
    return <CheckCircle2 style={{ width: '1rem', height: '1rem' }} />;
  };

  const nextStatus = getNextStatus();
  const canUpdateStatus = nextStatus !== null && !isProcessing && onStatusUpdate;

  // Debug: logger pour vérifier les valeurs (désactivé pour éviter les problèmes de cache)
  // useEffect(() => {
  //   console.log('KitchenOrderCard Debug:', {
  //     orderId: order.id,
  //     status: order.status,
  //     nextStatus,
  //     canUpdateStatus,
  //     isProcessing,
  //     statusConfig
  //   });
  // }, [order.id, order.status, nextStatus, canUpdateStatus, isProcessing, statusConfig]);

  return (
    <div 
      className={`kitchen-order-card ${statusConfig.borderColor} ${statusConfig.bgColor}`}
      style={{
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '0.4rem',
        padding: '0.5rem 0.25rem', // Padding vertical 0.5rem, horizontal réduit à 0.25rem
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden', // INTERDICTION FORMELLE DE SCROLL - le ticket est coupé si trop grand
        width: '312px', // Largeur fixe pour les tickets (augmentée de 20% : 260px * 1.2 = 312px)
        minWidth: '312px', // Largeur minimale
        maxWidth: '312px', // Largeur maximale
        height: 'auto', // S'adapte au nombre d'articles
        maxHeight: '100%', // Ne dépasse pas la hauteur de la zone disponible
        flexShrink: 0 // Empêche le ticket de rétrécir
      }}
    >
      {/* Header - Réorganisé selon la disposition demandée */}
      {!isContinuation && (
      <div className="kitchen-order-header" style={{ marginBottom: '0.5rem', position: 'relative', padding: '0.75rem 0.25rem', flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: '0.5rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        {/* En haut à gauche : Vide */}
        <div style={{ gridColumn: '1', gridRow: '1' }}></div>

        {/* Centre en haut : Numéro de commande */}
        <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <span 
            style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              fontFamily: 'monospace',
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: '1.2',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%',
              display: 'block'
            }}
          >
            {formatOrderNumber(order.order_number, order.id)}
          </span>
        </div>

        {/* En haut à droite : Vide (l'icône € est maintenant à côté du prix) */}
        <div style={{ gridColumn: '3', gridRow: '1' }}></div>

        {/* En bas : Temps à gauche, type de commande à droite */}
        <div style={{ gridColumn: '1 / 4', gridRow: '2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          {/* Temps à gauche */}
          <span 
            style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#ffffff',
              fontFamily: 'monospace',
              lineHeight: '1.2'
            }}
          >
            {getElapsedTime()}
          </span>
          
          {/* Type de commande à droite avec pastille de couleur */}
          <span 
            style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0.3rem 0.6rem',
              borderRadius: '0.5rem',
              backgroundColor: (order.order_type || order.orderType || 'dine-in') === 'dine-in' 
                ? '#a78bfa' // Violet pour sur place
                : (order.order_type || order.orderType) === 'takeaway'
                ? '#f59e0b' // Orange normal pour à emporter
                : '#fbbf24', // Orange pour livraison
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getOrderTypeLabel(order.order_type || order.orderType || 'dine-in')}
          </span>
        </div>
      </div>
      )}

      {/* Statut et nombre d'articles - Après le header, avant les items */}
      {!isContinuation && (
      <div style={{ 
        marginTop: '0',
        marginBottom: '0.25rem', // Même espace que le gap entre les articles
        paddingTop: '0.4rem',
        paddingBottom: '0.4rem', 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: '0.25rem',
        paddingRight: '0.25rem'
      }}>
        {/* Statut à gauche */}
        <span 
          className={`kitchen-order-badge ${statusConfig.badgeColor}`}
          style={{
            padding: '0.3rem 0.75rem',
            borderRadius: '0.375rem',
            color: 'white',
            fontWeight: '700',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            lineHeight: '1.2'
          }}
        >
          {statusConfig.label}
        </span>
        
        {/* Séparation */}
        <div style={{ 
          width: '1px', 
          height: '1.5rem', 
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          margin: '0 0.5rem'
        }}></div>
        
        {/* Nombre d'articles à droite */}
        <span style={{ color: '#000000', fontSize: '0.8rem', fontWeight: '700', lineHeight: '1.2' }}>
          {totalItems} {totalItems > 1 ? 'articles' : 'article'}
        </span>
      </div>
      )}

      {/* Items - INTERDICTION FORMELLE DE SCROLL */}
      <div className="kitchen-order-items" style={{ 
        marginTop: '0', // L'espacement est géré par la marginBottom de la bande de statut
        marginBottom: '0.5rem',
        paddingTop: '0',
        paddingLeft: '0.25rem',
        paddingRight: '0.25rem',
        paddingBottom: '0.75rem',
        flex: '1 1 auto',
        overflow: 'hidden', // INTERDICTION FORMELLE DE SCROLL
        overflowY: 'hidden', // INTERDICTION FORMELLE DE SCROLL VERTICAL
        overflowX: 'hidden', // INTERDICTION FORMELLE DE SCROLL HORIZONTAL
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem' // Gap très réduit entre les articles
      }}>
        {Array.isArray(orderItems) && orderItems.length > 0 ? (
          <>
            {orderItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'row', // Horizontal pour économiser la hauteur
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem', // Padding augmenté
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.4rem',
                  border: '2px solid #e2e8f0',
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: '2.5rem' // Hauteur minimale augmentée
                }}
              >
                {/* Badge quantité */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '2.25rem',
                    height: '2.25rem',
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    borderRadius: '0.375rem',
                    fontWeight: '700',
                    fontSize: '0.95rem', // Taille augmentée
                    flexShrink: 0
                  }}
                >
                  {item.quantity || 1}x
                </div>
                {/* Nom de l'article */}
                <span style={{ flex: 1, fontWeight: '700', color: '#1e293b', fontSize: '1rem', lineHeight: '1.4' }}> {/* Taille augmentée */}
                  {item.product_name || item.name || item.productName || 'Article'}
                </span>
                {/* Notes/instructions avec icône si présent */}
                {item.notes && (
                  <AlertTriangle style={{ width: '1rem', height: '1rem', color: '#f59e0b', flexShrink: 0 }} title={item.notes} />
                )}
              </div>
            ))}
            {/* Affichage des notes séparément si présentes */}
            {orderItems.some(item => item.notes) && (
              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {orderItems.filter(item => item.notes).map((item, index) => (
                  <div
                    key={`note-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#fef3c7',
                      borderLeft: '3px solid #f59e0b',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem', // Taille augmentée
                      color: '#78350f',
                      fontWeight: '500'
                    }}
                  >
                    <AlertTriangle style={{ width: '0.9rem', height: '0.9rem', color: '#78350f', flexShrink: 0 }} />
                    <span>{item.product_name || item.name || item.productName || 'Article'}: {item.notes}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '0.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
            Aucun article
          </div>
        )}
      </div>

      {/* Somme payée avec icône € - En bas à droite, avant le bouton */}
      {!isContinuation && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end', 
          gap: '0.3rem', 
          marginBottom: '0.5rem',
          paddingRight: '0.25rem'
        }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap' }}>
            {formatPrice(order.total_amount || order.total || 0)}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.4rem',
              height: '1.4rem',
              minWidth: '1.4rem',
              borderRadius: '50%',
              border: `1.5px solid ${isPaid ? '#10b981' : '#fca5a5'}`,
              backgroundColor: isPaid ? '#10b981' : '#fee2e2',
              boxShadow: isPaid ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none',
              position: 'relative',
              flexShrink: 0
            }}
            title={isPaid ? 'Commande payée' : 'Commande non payée'}
          >
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: '700',
                color: isPaid ? '#ffffff' : '#dc2626'
              }}
            >
              €
            </span>
            {!isPaid && (
              <span
                style={{
                  position: 'absolute',
                  width: '1.4rem',
                  height: '1.5px',
                  backgroundColor: '#dc2626',
                  transform: 'rotate(45deg)',
                  top: '50%',
                  left: '0'
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Bouton d'action - Nouveau design - Seulement sur la dernière partie */}
      {isLastPart && canUpdateStatus ? (
        <button
          onClick={() => handleStatusChange(nextStatus)}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: '0.75rem 1.25rem',
            backgroundColor: badgeColorHex,
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '48px',
            marginTop: '0.75rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseDown={(e) => {
            if (!isProcessing) {
              e.target.style.transform = 'scale(0.98)';
            }
          }}
          onMouseUp={(e) => {
            if (!isProcessing) {
              e.target.style.transform = 'scale(1.02)';
            }
          }}
        >
          {isProcessing ? (
            <>
              <Clock style={{ width: '1.125rem', height: '1.125rem' }} />
              <span>Mise à jour...</span>
            </>
          ) : (
            <>
              {getButtonIcon()}
              <span>{getButtonText()}</span>
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

export default KitchenOrderCard;

