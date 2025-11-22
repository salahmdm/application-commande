import React from 'react';
import { STATUS_COLORS, ORDER_STATUS } from '../../constants/orderStatuses';

/**
 * Badge pour afficher le statut d'une commande
 * Affiche uniquement 3 états simplifiés pour les vignettes : En attente, En cours, Terminée
 */
const OrderStatusBadge = ({ status, className = '' }) => {
  // Fonction pour obtenir le label simplifié de la vignette (3 états seulement)
  const getVignetteLabel = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'En attente';
      case ORDER_STATUS.PREPARING:
        return 'En cours';
      case ORDER_STATUS.READY:
      case ORDER_STATUS.SERVED:
        return 'Terminée';
      default:
        return 'En attente';
    }
  };

  // Fonction pour obtenir la couleur selon le statut simplifié
  const getVignetteColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return STATUS_COLORS[ORDER_STATUS.PENDING].badge;
      case ORDER_STATUS.PREPARING:
        return STATUS_COLORS[ORDER_STATUS.PREPARING].badge;
      case ORDER_STATUS.READY:
      case ORDER_STATUS.SERVED:
        return STATUS_COLORS[ORDER_STATUS.READY].badge;
      default:
        return STATUS_COLORS[ORDER_STATUS.PENDING].badge;
    }
  };

  const label = getVignetteLabel(status);
  const badgeClass = getVignetteColor(status);
  
  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badgeClass} ${className}`}
      aria-label={`Statut: ${label}`}
    >
      {label}
    </span>
  );
};

export default OrderStatusBadge;
