/**
 * Système de notifications toast moderne
 * Notifications élégantes pour les actions utilisateur
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Composant de notification toast
 */
const Toast = ({ 
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-fermeture
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const variants = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      message: 'text-green-700',
      iconComponent: CheckCircle
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700',
      iconComponent: XCircle
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      iconComponent: AlertCircle
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700',
      iconComponent: Info
    }
  };

  const variant = variants[type];
  const IconComponent = variant.iconComponent;

  return (
    <div className={`
      ${variant.bg} border-2 rounded-xl p-4 shadow-lg backdrop-blur-sm
      transform transition-all duration-300 ease-out
      ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${isLeaving ? 'translate-x-full opacity-0' : ''}
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${variant.icon}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-heading font-semibold ${variant.title}`}>
              {title}
            </h4>
          )}
          {message && (
            <p className={`text-sm ${variant.message} ${title ? 'mt-1' : ''}`}>
              {message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors duration-200 ${variant.icon}`}
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Barre de progression */}
      <div className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${variant.icon.replace('text-', 'bg-')} transition-all duration-100 ease-linear`}
          style={{
            width: '100%',
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
};

/**
 * Conteneur de notifications
 */
const ToastContainer = ({ toasts, onRemoveToast, className = '' }) => {
  return (
    <div className={`fixed top-4 right-4 z-50 space-y-3 max-w-sm ${className}`}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
};

/**
 * Hook pour gérer les notifications
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title, message, duration) => 
    addToast({ type: 'success', title, message, duration });
  
  const error = (title, message, duration) => 
    addToast({ type: 'error', title, message, duration });
  
  const warning = (title, message, duration) => 
    addToast({ type: 'warning', title, message, duration });
  
  const info = (title, message, duration) => 
    addToast({ type: 'info', title, message, duration });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

/**
 * Composant de notification pour les actions de boutons
 */
export const ActionNotification = ({ 
  action,
  onActionComplete,
  className = '' 
}) => {
  const { success, error } = useToast();

  const handleAction = async () => {
    try {
      // Simuler l'action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      success(
        'Action réussie',
        'L\'opération a été effectuée avec succès',
        3000
      );
      
      onActionComplete?.();
    } catch (err) {
      error(
        'Erreur',
        'Une erreur est survenue lors de l\'opération',
        5000
      );
    }
  };

  return (
    <button
      onClick={handleAction}
      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${className}`}
    >
      {action}
    </button>
  );
};

// Ajouter l'animation CSS pour la barre de progression
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style);

export { Toast, ToastContainer };
export default ToastContainer;
